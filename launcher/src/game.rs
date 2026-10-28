// 找遊戲、保存原版 app.asar、裝上指定語言、啟動
use crate::asar::Asar;
use crate::manifest::{self, sha256_hex, Manifest};
use crate::patcher::{self, Target};
use crate::paths::{self, Installed, State};
use anyhow::{bail, Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const EXE: &str = "D2 Survivors.exe";

/// 啟動器內建的兩個語言：遊戲原本就有的英文和韓文
pub const BUILTIN: [(&str, &str); 2] = [("en", "English"), ("ko", "한국어（原版）")];

pub struct Game {
    pub dir: PathBuf,
}

/// 選的翻譯本機還沒有（第一次開啟又沒有網路、更新來源拿掉了這個語言）：jobs 會改用英文原版開遊戲
#[derive(Debug)]
pub struct NoTranslation(pub String);

impl std::fmt::Display for NoTranslation {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for NoTranslation {}

fn no_translation(msg: String) -> anyhow::Error {
    NoTranslation(msg).into()
}

pub struct Original {
    pub sha256: String,
    pub version: String,
    pub bytes: Vec<u8>,
}

impl Game {
    pub fn new(dir: PathBuf) -> Result<Self> {
        if !dir.join(EXE).is_file() {
            bail!("在 {} 找不到 {EXE}，請在設定裡指定遊戲資料夾", dir.display());
        }
        Ok(Self { dir })
    }

    fn asar(&self) -> PathBuf {
        self.dir.join("resources").join("app.asar")
    }

    /// 遊戲安裝時附的 app.asar.sha256，就是原版的雜湊（遊戲更新時會一起換掉）
    fn expected_sha256(&self) -> Result<String> {
        let p = self.dir.join("resources").join("app.asar.sha256");
        Ok(fs::read_to_string(&p).with_context(|| format!("讀不到 {}", p.display()))?.trim().to_lowercase())
    }

    fn original_path(sha: &str) -> PathBuf {
        paths::data_dir().join("originals").join(format!("{sha}.asar"))
    }

    /// 取得原版 app.asar。遊戲裡的是原版（剛裝好或剛更新）就先備份一份
    pub fn original(&self) -> Result<Original> {
        let expected = self.expected_sha256()?;
        let current = fs::read(self.asar()).with_context(|| format!("讀不到 {}", self.asar().display()))?;
        let bytes = if sha256_hex(&current) == expected {
            let backup = Self::original_path(&expected);
            if !backup.is_file() {
                paths::write_atomic(&backup, &current)?;
            }
            current
        } else {
            let backup = fs::read(Self::original_path(&expected)).ok().filter(|b| sha256_hex(b) == expected);
            backup.context("遊戲的 app.asar 已經被改過，又找不到原版備份。請重新安裝遊戲（或用 tools/install.mjs --restore 還原）後再開啟動器")?
        };
        let version = Asar::parse(bytes.clone())
            .and_then(|a| a.read("package.json"))
            .ok()
            .and_then(|b| serde_json::from_slice::<serde_json::Value>(&b).ok())
            .and_then(|v| v["version"].as_str().map(String::from))
            .unwrap_or_else(|| "?".into());
        Ok(Original { sha256: expected, version, bytes })
    }

    /// 遊戲版本（app.asar 裡 package.json 的 version；裝了翻譯的也一樣）
    pub fn version(&self) -> Option<String> {
        let a = Asar::parse(fs::read(self.asar()).ok()?).ok()?;
        let v: serde_json::Value = serde_json::from_slice(&a.read("package.json").ok()?).ok()?;
        v["version"].as_str().map(String::from)
    }

    /// 把選的語言裝進遊戲。翻譯語言回傳 Some(遊戲要用的語言槽位 ko)；
    /// English／한국어原版是 None：換回備份的原版，不套任何規則（app.asar 跟 app.asar.sha256 對得上，排行榜不會標成 patched）
    pub fn install(&self, language: &str, manifest: Option<&Manifest>, log: &dyn Fn(String)) -> Result<Option<&'static str>> {
        if game_is_original(language) {
            self.restore(log)?;
            return Ok(None);
        }
        let original = self.original()?;
        log(format!("遊戲版本 {}", original.version));
        let manifest = manifest.ok_or_else(|| no_translation("還沒下載過翻譯，請先連上網路檢查更新".into()))?;
        let spec = manifest.desktop.as_ref().context("更新來源裡沒有桌面版的修改規則")?;
        let rules_sha = sha256_hex(&serde_json::to_vec(spec)?);
        let lang = manifest.languages.iter().find(|l| l.id == language)
            .ok_or_else(|| no_translation(format!("更新來源裡沒有語言 {language}")))?;
        let desktop = lang.desktop.as_ref().ok_or_else(|| no_translation(format!("{} 還不能在桌面版使用", lang.name)))?;
        let dict = manifest::local_dict(lang).ok_or_else(|| no_translation(format!("{} 字典還沒下載，請先檢查更新", lang.name)))?;
        let key = format!("{}:{language}:{}:{rules_sha}", original.sha256, lang.dict.sha256);

        let state = State::load();
        if let Some(inst) = &state.installed {
            if inst.key == key && fs::read(self.asar()).map(|b| sha256_hex(&b) == inst.sha256).unwrap_or(false) {
                log("遊戲裡已經是這個語言".into());
                return Ok(Some("ko"));
            }
        }

        log("修改 app.asar…".into());
        let patched = patcher::build(original.bytes, spec, &Target::language(desktop, &dict))?;
        if !patched.skipped.is_empty() {
            log(format!("⚠ 遊戲可能改版了，略過 {} 條加分的修改：{}", patched.skipped.len(), patched.skipped.join("、")));
        }
        self.put(&patched.bytes, key, patched.skipped, log)?;
        Ok(Some("ko"))
    }

    fn put(&self, bytes: &[u8], key: String, skipped: Vec<String>, log: &dyn Fn(String)) -> Result<()> {
        let sha = sha256_hex(bytes);
        let current = fs::read(self.asar()).ok().map(|b| sha256_hex(&b));
        if current.as_deref() != Some(sha.as_str()) {
            paths::write_atomic(&self.asar(), bytes).context("無法寫入 app.asar，請先關掉遊戲")?;
            log(format!("已裝進遊戲：{}", self.asar().display()));
        }
        State { installed: Some(Installed { key, sha256: sha, skipped }), ..State::load() }.save()
    }

    /// 還原成原版 app.asar
    pub fn restore(&self, log: &dyn Fn(String)) -> Result<()> {
        let original = self.original()?;
        self.put(&original.bytes, format!("{}:original", original.sha256), Vec::new(), log)?;
        log(format!("已還原原版（{}）", original.version));
        Ok(())
    }

    /// 啟動遊戲。翻譯版的語言用 D2S_QUERY 傳給遊戲（遊戲本身支援這個環境變數，會加在網址後面）；
    /// 原版沒有「啟動器指定語言」的規則，不傳，照遊戲自己存的語言
    pub fn launch(&self, slot: Option<&str>) -> Result<()> {
        let mut cmd = Command::new(self.dir.join(EXE));
        cmd.current_dir(&self.dir);
        if let Some(slot) = slot {
            let mut query = format!("d2slang={slot}");
            if let Ok(q) = std::env::var("D2S_QUERY") {
                let q = q.trim_start_matches('?');
                if !q.is_empty() {
                    query = format!("{q}&{query}");
                }
            }
            cmd.env("D2S_QUERY", query);
        }
        cmd.spawn().context("無法啟動遊戲")?;
        Ok(())
    }
}

/// English、한국어原版：遊戲本來就有的語言，用真正的原版
pub fn game_is_original(language: &str) -> bool {
    BUILTIN.iter().any(|(id, _)| *id == language)
}

pub fn language_name<'a>(id: &str, manifest: Option<&'a Manifest>) -> String {
    if let Some((_, n)) = BUILTIN.iter().find(|(i, _)| *i == id) {
        return n.to_string();
    }
    manifest.and_then(|m| m.languages.iter().find(|l| l.id == id)).map_or(id.to_string(), |l| l.label())
}

pub fn exists(dir: &Path) -> bool {
    dir.join(EXE).is_file()
}
