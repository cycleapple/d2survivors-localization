// 更新來源：manifest.json v2（docs/manifest-v2.md，tools/publish.mjs 產生）和各語言字典。
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
    #[serde(default)]
    pub updated: String,
    /// 這次發布的版本，顯示用
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub launcher: Option<LauncherInfo>,
    pub languages: Vec<Language>,
    /// 桌面版的修改規則（tools/patch-rules.mjs）
    #[serde(default)]
    pub desktop: Option<PatchSpec>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct LauncherInfo {
    pub latest: String,
    /// 低於這個版本的啟動器不能套用這份 manifest 的規則
    #[serde(default)]
    pub minimum: String,
    pub download: String,
    pub sha256_url: String,
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
    /// available | beta
    #[serde(default)]
    pub status: String,
    pub entries: u64,
    pub dict: DictFile,
    /// 沒有這一欄＝桌面版不能選
    #[serde(default)]
    pub desktop: Option<DesktopLanguage>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct DesktopLanguage {
    pub menu_name: String,
    pub html_lang: String,
    pub groups: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct DictFile {
    pub url: String,
    pub sha256: String,
    pub size: u64,
}

pub const SCHEMA: u32 = 2;

impl Manifest {
    /// 桌面版能選的語言
    pub fn desktop_languages(&self) -> impl Iterator<Item = (&Language, &DesktopLanguage)> {
        self.languages.iter().filter_map(|l| l.desktop.as_ref().map(|d| (l, d)))
    }
}

impl Language {
    /// 不是正式版時的標示：beta 測試中、draft 草稿（翻完還沒進遊戲驗證）
    pub fn status_note(&self) -> Option<&'static str> {
        match self.status.as_str() {
            "beta" => Some("測試中"),
            "draft" => Some("草稿"),
            _ => None,
        }
    }

    pub fn label(&self) -> String {
        match self.status_note() {
            Some(n) => format!("{}（{n}）", self.name),
            None => self.name.clone(),
        }
    }
}

fn is_url(s: &str) -> bool {
    s.starts_with("http://") || s.starts_with("https://")
}

/// 下載網址或讀本機檔案
pub fn fetch(location: &str) -> Result<Vec<u8>> {
    if is_url(location) {
        // GitHub Pages 的 CDN 會快取，要求拿最新的（manifest 網址另外加上 ?t=）
        let resp = ureq::get(location)
            .timeout(std::time::Duration::from_secs(60))
            .set("Cache-Control", "no-cache")
            .call()
            .context("下載失敗")?; // ureq 的錯誤訊息裡已經有網址
        let mut buf = Vec::new();
        resp.into_reader().take(64 * 1024 * 1024).read_to_end(&mut buf)?;
        Ok(buf)
    } else {
        fs::read(location).with_context(|| format!("讀不到 {location}"))
    }
}

pub fn resolve(base: &str, rel: &str) -> String {
    if is_url(rel) {
        return rel.to_string();
    }
    if is_url(base) {
        let base = base.split('?').next().unwrap_or(base);
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

/// 上次成功下載的 manifest（離線時用）。舊格式（v1）當成沒有
pub fn cached() -> Option<Manifest> {
    let text = fs::read(paths::data_dir().join("manifest.json")).ok()?;
    serde_json::from_slice::<Manifest>(&text).ok().filter(|m| m.schema == SCHEMA)
}

pub fn dict_path(lang: &Language) -> std::path::PathBuf {
    paths::data_dir().join("dicts").join(format!("{}.json", lang.id))
}

/// 本機已有、而且跟 manifest 的 sha256 一致的字典
pub fn local_dict(lang: &Language) -> Option<Vec<u8>> {
    let b = fs::read(dict_path(lang)).ok()?;
    (sha256_hex(&b) == lang.dict.sha256).then_some(b)
}

pub enum Update {
    /// 新的 manifest 已經存好；changed 是更新了字典的語言
    Done { manifest: Manifest, changed: Vec<String> },
    /// 啟動器版本低於 launcher.minimum：新的 manifest 沒有存下來，要先更新啟動器
    LauncherTooOld { manifest: Manifest },
}

/// 下載 manifest，再把有變動的字典下載下來：要用的語言（want）和本機已經有的語言
pub fn update(manifest_url: &str, want: &str, log: &dyn Fn(String)) -> Result<Update> {
    if manifest_url.trim().is_empty() {
        bail!("還沒設定更新來源（manifest_url）");
    }
    log(format!("檢查更新：{manifest_url}"));
    // 網址加上時間，避開 CDN 快取，剛發布的翻譯馬上拿得到
    let fresh = if is_url(manifest_url) && !manifest_url.contains('?') {
        let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs());
        format!("{manifest_url}?t={t}")
    } else {
        manifest_url.to_string()
    };
    let raw = fetch(&fresh)?;
    let schema = serde_json::from_slice::<serde_json::Value>(&raw).context("manifest.json 格式不對")?["schema"].as_u64();
    if schema != Some(SCHEMA as u64) {
        bail!("manifest 版本 {} 不支援，請更新啟動器", schema.map_or("?".into(), |s| s.to_string()));
    }
    let manifest: Manifest = serde_json::from_slice(&raw).context("manifest.json 格式不對")?;
    if crate::selfupdate::required(&manifest).is_some() {
        return Ok(Update::LauncherTooOld { manifest });
    }
    fs::create_dir_all(paths::data_dir().join("dicts"))?;
    let mut changed = Vec::new();
    for (lang, _) in manifest.desktop_languages() {
        if local_dict(lang).is_some() || (lang.id != want && !dict_path(lang).is_file()) {
            continue;
        }
        log(format!("下載 {} 字典（{} 版，{} 條）…", lang.name, manifest.version, lang.entries));
        let b = fetch(&resolve(manifest_url, &lang.dict.url))?;
        if sha256_hex(&b) != lang.dict.sha256 {
            bail!("{} 字典的 sha256 不符，下載的檔案可能損壞", lang.name);
        }
        serde_json::from_slice::<serde_json::Value>(&b).with_context(|| format!("{} 字典不是有效的 JSON", lang.name))?;
        paths::write_atomic(&dict_path(lang), &b)?;
        changed.push(lang.name.clone());
    }
    paths::write_atomic(&paths::data_dir().join("manifest.json"), &raw)?;
    Ok(Update::Done { manifest, changed })
}
