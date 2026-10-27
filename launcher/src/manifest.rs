// 更新來源：manifest.json（tools/make-manifest.mjs 產生）和各語言字典。
// manifest_url 可以是 http(s) 網址，也可以是本機路徑；字典網址相對於 manifest。
use crate::paths;
use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::Path;

#[derive(Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub schema: u32,
    pub updated: String,
    pub patch: PatchSpec,
    pub languages: Vec<Language>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct PatchSpec {
    pub assets_dir: String,
    pub dict_target: DictTarget,
    pub rules: Vec<Rule>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct DictTarget {
    pub file: String,
    pub template: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Rule {
    pub label: String,
    pub groups: Vec<String>,
    #[serde(default)]
    pub file: Option<String>,
    pub from: String,
    pub to: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Language {
    pub id: String,
    pub name: String,
    pub menu_name: String,
    pub html_lang: String,
    pub groups: Vec<String>,
    pub version: String,
    pub entries: u64,
    pub dict: DictFile,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct DictFile {
    pub url: String,
    pub sha256: String,
    pub size: u64,
}

pub const SCHEMA: u32 = 1;

fn is_url(s: &str) -> bool {
    s.starts_with("http://") || s.starts_with("https://")
}

/// token 只送給 GitHub（私人 repo 的 raw 檔案要帶 token 才讀得到）
fn is_github(url: &str) -> bool {
    let host = url.split("://").nth(1).unwrap_or("").split(['/', ':']).next().unwrap_or("");
    matches!(host, "raw.githubusercontent.com" | "api.github.com" | "github.com")
}

fn fetch(location: &str, token: &str) -> Result<Vec<u8>> {
    if is_url(location) {
        let mut req = ureq::get(location).timeout(std::time::Duration::from_secs(30));
        let with_token = !token.is_empty() && is_github(location);
        if with_token {
            req = req.set("Authorization", &format!("token {token}"));
        }
        // GitHub contents API 直接回傳檔案內容（raw 網址對私人 repo 的分支會快取舊的 commit）
        if location.starts_with("https://api.github.com/") {
            req = req.set("Accept", "application/vnd.github.raw");
        }
        let resp = match req.call() {
            Err(ureq::Error::Status(404, _)) if is_github(location) && !with_token => {
                bail!("找不到 {location}（私人 repo 要在設定裡填 GitHub token）")
            }
            // 沒有 token 的 GitHub API 每個 IP 每小時只能 60 次
            Err(ureq::Error::Status(403 | 429, _)) if is_github(location) && !with_token => {
                bail!("GitHub 暫時限制了下載次數，請稍後再試（或在設定裡填 GitHub token）")
            }
            Err(ureq::Error::Status(code @ (401 | 403 | 404), _)) if with_token => {
                bail!("GitHub 回應 {code}：{location}（token 可能過期，或沒有這個 repo 的讀取權限）")
            }
            r => r.with_context(|| format!("下載失敗：{location}"))?,
        };
        let mut buf = Vec::new();
        resp.into_reader().take(64 * 1024 * 1024).read_to_end(&mut buf)?;
        Ok(buf)
    } else {
        fs::read(location).with_context(|| format!("讀不到 {location}"))
    }
}

fn resolve(base: &str, rel: &str) -> String {
    if is_url(rel) {
        return rel.to_string();
    }
    if is_url(base) {
        let dir = &base[..base.rfind('/').map_or(base.len(), |i| i + 1)];
        format!("{dir}{rel}")
    } else {
        // 本機路徑用不到網址上的 ?v=
        let rel = rel.split('?').next().unwrap_or(rel);
        Path::new(base).parent().unwrap_or(Path::new("")).join(rel).to_string_lossy().into_owned()
    }
}

pub fn sha256_hex(b: &[u8]) -> String {
    hex::encode(Sha256::digest(b))
}

/// 上次成功下載的 manifest（離線時用）
pub fn cached() -> Option<Manifest> {
    let text = fs::read(paths::data_dir().join("manifest.json")).ok()?;
    serde_json::from_slice(&text).ok()
}

pub fn dict_path(lang: &Language) -> std::path::PathBuf {
    paths::data_dir().join("dicts").join(format!("{}.json", lang.id))
}

/// 本機已有、而且跟 manifest 的 sha256 一致的字典
pub fn local_dict(lang: &Language) -> Option<Vec<u8>> {
    let b = fs::read(dict_path(lang)).ok()?;
    (sha256_hex(&b) == lang.dict.sha256).then_some(b)
}

/// 下載 manifest，再把有變動的字典下載下來。回傳新的 manifest 和更新了哪些語言
pub fn update(manifest_url: &str, token: &str, log: &dyn Fn(String)) -> Result<(Manifest, Vec<String>)> {
    if manifest_url.trim().is_empty() {
        bail!("還沒設定更新來源（manifest_url）");
    }
    log(format!("檢查更新：{manifest_url}"));
    // 網址加上時間，避開 CDN 快取（GitHub raw 會快取 5 分鐘），剛發布的翻譯馬上拿得到
    let fresh = if is_url(manifest_url) && !manifest_url.contains('?') && !manifest_url.starts_with("https://api.github.com/") {
        let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs());
        format!("{manifest_url}?t={t}")
    } else {
        manifest_url.to_string()
    };
    let raw = fetch(&fresh, token)?;
    let manifest: Manifest = serde_json::from_slice(&raw).context("manifest.json 格式不對")?;
    if manifest.schema != SCHEMA {
        bail!("manifest 版本 {} 不支援，請更新啟動器", manifest.schema);
    }
    fs::create_dir_all(paths::data_dir().join("dicts"))?;
    let mut changed = Vec::new();
    for lang in &manifest.languages {
        if local_dict(lang).is_some() {
            continue;
        }
        log(format!("下載 {} 字典（{} 版，{} 條）…", lang.name, lang.version, lang.entries));
        let b = fetch(&resolve(manifest_url, &lang.dict.url), token)?;
        if sha256_hex(&b) != lang.dict.sha256 {
            bail!("{} 字典的 sha256 不符，下載的檔案可能損壞", lang.name);
        }
        serde_json::from_slice::<serde_json::Value>(&b).with_context(|| format!("{} 字典不是有效的 JSON", lang.name))?;
        paths::write_atomic(&dict_path(lang), &b)?;
        changed.push(lang.name.clone());
    }
    paths::write_atomic(&paths::data_dir().join("manifest.json"), &raw)?;
    Ok((manifest, changed))
}
