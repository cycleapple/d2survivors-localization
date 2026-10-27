// 啟動器的資料夾、設定檔和狀態
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 編譯時可以用 D2S_MANIFEST_URL 環境變數指定預設的更新來源
pub const DEFAULT_MANIFEST_URL: &str = match option_env!("D2S_MANIFEST_URL") {
    Some(u) => u,
    None => "https://cycleapple.github.io/d2survivors-localization/data/manifest.json",
};

/// 舊版（manifest v1）的預設更新來源，設定檔裡存的是這個就改用新的預設值
const V1_MANIFEST_URL: &str = "https://api.github.com/repos/cycleapple/d2survivors-zh-tw-dist/contents/manifest.json";

/// %LOCALAPPDATA%\D2SurvivorsLauncher（測試時可以用 D2S_LAUNCHER_DIR 環境變數換地方）
pub fn data_dir() -> PathBuf {
    if let Some(d) = std::env::var_os("D2S_LAUNCHER_DIR") {
        return PathBuf::from(d);
    }
    let base = std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."));
    base.join("D2SurvivorsLauncher")
}

pub fn default_game_dir() -> PathBuf {
    let base = std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_default();
    base.join("Programs").join("D2 Survivors")
}

/// 先寫到暫存檔再改名，寫到一半中斷也不會留下壞檔
pub fn write_atomic(path: &Path, data: &[u8]) -> Result<()> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension("tmp-d2s");
    fs::write(&tmp, data).with_context(|| format!("寫不進 {}", tmp.display()))?;
    fs::rename(&tmp, path).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        anyhow::Error::new(e).context(format!("無法取代 {}", path.display()))
    })
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    /// en、ko，或 manifest 裡的語言 id
    pub language: String,
    pub auto_update: bool,
    /// 留空就用預設的更新來源
    pub manifest_url: String,
    /// 留空就用預設安裝位置
    pub game_dir: String,
    pub close_after_launch: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(),
            auto_update: true,
            manifest_url: String::new(),
            game_dir: String::new(),
            close_after_launch: true,
        }
    }
}

impl Config {
    fn path() -> PathBuf {
        data_dir().join("config.json")
    }

    pub fn load() -> Self {
        let mut c: Self = fs::read(Self::path()).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default();
        let u = c.manifest_url.trim();
        if u == V1_MANIFEST_URL || u == DEFAULT_MANIFEST_URL {
            c.manifest_url.clear();
        }
        c
    }

    pub fn save(&self) -> Result<()> {
        write_atomic(&Self::path(), serde_json::to_string_pretty(self)?.as_bytes())
    }

    /// 挑更新紀錄說明用的語言：翻譯語言；選英文、韓文原版時用英文
    pub fn ui_language(&self) -> &str {
        match self.language.as_str() {
            "en" | "ko" => "en",
            l => l,
        }
    }

    pub fn manifest_url(&self) -> String {
        let u = self.manifest_url.trim();
        if u.is_empty() { DEFAULT_MANIFEST_URL.to_string() } else { u.to_string() }
    }

    pub fn game_dir(&self) -> PathBuf {
        if self.game_dir.trim().is_empty() { default_game_dir() } else { PathBuf::from(self.game_dir.trim()) }
    }
}

/// 上次裝進遊戲的 app.asar
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct State {
    pub installed: Option<Installed>,
    /// 看過的最新一筆更新紀錄（manifest 的 changelog.latest）
    pub changelog_seen: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Installed {
    /// 由哪個原版、哪個語言、哪份字典和規則做出來的
    pub key: String,
    pub sha256: String,
}

impl State {
    fn path() -> PathBuf {
        data_dir().join("state.json")
    }

    pub fn load() -> Self {
        fs::read(Self::path()).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
    }

    pub fn save(&self) -> Result<()> {
        write_atomic(&Self::path(), serde_json::to_string_pretty(self)?.as_bytes())
    }
}
