// Electron asar 封存檔：讀出檔案、替換內容、重新打包。
// 格式：[u32 4][u32 header 長度] + header pickle（[u32 payload 長度][u32 字串長度][JSON][補到 4 的倍數]）+ 檔案內容
use anyhow::{bail, Context, Result};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

const BLOCK_SIZE: usize = 4 * 1024 * 1024;

pub struct Asar {
    header: Value,
    bytes: Vec<u8>,
    data_offset: usize,
    replaced: HashMap<String, Vec<u8>>,
}

fn u32_at(b: &[u8], at: usize) -> Result<usize> {
    let s = b.get(at..at + 4).context("asar 檔頭不完整")?;
    Ok(u32::from_le_bytes(s.try_into().unwrap()) as usize)
}

impl Asar {
    pub fn parse(bytes: Vec<u8>) -> Result<Self> {
        let header_size = u32_at(&bytes, 4)?;
        let json_len = u32_at(&bytes, 12)?;
        let json = bytes.get(16..16 + json_len).context("asar 檔頭不完整")?;
        let header: Value = serde_json::from_slice(json).context("asar 檔頭不是有效的 JSON")?;
        Ok(Self { header, bytes, data_offset: 8 + header_size, replaced: HashMap::new() })
    }

    fn entry(&self, path: &str) -> Option<&Value> {
        let mut node = &self.header;
        for seg in path.split('/') {
            node = node.get("files")?.get(seg)?;
        }
        Some(node)
    }

    /// 資料夾底下的檔名（不含子資料夾）
    pub fn list(&self, dir: &str) -> Result<Vec<String>> {
        let files = self.entry(dir).and_then(|e| e.get("files")).and_then(Value::as_object);
        let files = files.with_context(|| format!("asar 裡沒有資料夾 {dir}"))?;
        Ok(files.iter().filter(|(_, v)| v.get("files").is_none()).map(|(k, _)| k.clone()).collect())
    }

    pub fn read(&self, path: &str) -> Result<Vec<u8>> {
        if let Some(b) = self.replaced.get(path) {
            return Ok(b.clone());
        }
        let e = self.entry(path).with_context(|| format!("asar 裡沒有 {path}"))?;
        if e.get("unpacked").and_then(Value::as_bool) == Some(true) {
            bail!("{path} 沒有打包在 asar 裡");
        }
        let size = e["size"].as_u64().context("asar 檔案沒有 size")? as usize;
        let offset: usize = e["offset"].as_str().context("asar 檔案沒有 offset")?.parse()?;
        let start = self.data_offset + offset;
        Ok(self.bytes.get(start..start + size).context("asar 檔案內容超出範圍")?.to_vec())
    }

    pub fn read_string(&self, path: &str) -> Result<String> {
        String::from_utf8(self.read(path)?).with_context(|| format!("{path} 不是 UTF-8"))
    }

    pub fn write(&mut self, path: &str, data: Vec<u8>) -> Result<()> {
        if self.entry(path).is_none() {
            bail!("asar 裡沒有 {path}");
        }
        self.replaced.insert(path.to_string(), data);
        Ok(())
    }

    /// 重新打包：檔案依檔頭順序重新排列 offset，換過的檔案重算 integrity
    pub fn pack(&self) -> Result<Vec<u8>> {
        let mut header = self.header.clone();
        let mut data = Vec::with_capacity(self.bytes.len());
        self.pack_dir(&mut header, "", &mut data)?;

        let json = serde_json::to_string(&header)?;
        let pad = (4 - json.len() % 4) % 4;
        let header_pickle_len = 8 + json.len() + pad;
        let mut out = Vec::with_capacity(8 + header_pickle_len + data.len());
        out.extend_from_slice(&4u32.to_le_bytes());
        out.extend_from_slice(&(header_pickle_len as u32).to_le_bytes());
        out.extend_from_slice(&((header_pickle_len - 4) as u32).to_le_bytes());
        out.extend_from_slice(&(json.len() as u32).to_le_bytes());
        out.extend_from_slice(json.as_bytes());
        out.extend(std::iter::repeat(0).take(pad));
        out.extend_from_slice(&data);
        Ok(out)
    }

    fn pack_dir(&self, node: &mut Value, prefix: &str, data: &mut Vec<u8>) -> Result<()> {
        let Some(files) = node.get_mut("files").and_then(Value::as_object_mut) else { return Ok(()) };
        for (name, entry) in files.iter_mut() {
            let path = if prefix.is_empty() { name.clone() } else { format!("{prefix}/{name}") };
            if entry.get("files").is_some() {
                self.pack_dir(entry, &path, data)?;
                continue;
            }
            if entry.get("link").is_some() || entry.get("unpacked").and_then(Value::as_bool) == Some(true) {
                continue;
            }
            let content = self.read(&path)?;
            let obj = entry.as_object_mut().unwrap();
            obj.insert("offset".into(), Value::String(data.len().to_string()));
            obj.insert("size".into(), json!(content.len()));
            if self.replaced.contains_key(&path) {
                obj.insert("integrity".into(), integrity(&content));
            }
            data.extend_from_slice(&content);
        }
        Ok(())
    }
}

fn integrity(content: &[u8]) -> Value {
    let blocks: Vec<Value> = content.chunks(BLOCK_SIZE).map(|b| Value::String(hex::encode(Sha256::digest(b)))).collect();
    let mut m = Map::new();
    m.insert("algorithm".into(), json!("SHA256"));
    m.insert("hash".into(), json!(hex::encode(Sha256::digest(content))));
    m.insert("blockSize".into(), json!(BLOCK_SIZE));
    m.insert("blocks".into(), Value::Array(blocks));
    Value::Object(m)
}

#[cfg(test)]
mod tests {
    use super::*;

    // 沒有改任何檔案時，重新打包要跟原檔一模一樣
    #[test]
    fn repack_unchanged_is_identical() {
        let Ok(bytes) = std::fs::read("../backup/2026.1026.4/app.asar") else { return };
        assert_eq!(Asar::parse(bytes.clone()).unwrap().pack().unwrap(), bytes);
    }
}
