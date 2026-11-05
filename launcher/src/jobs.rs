// 啟動器做的事：檢查更新、裝上語言並啟動遊戲、還原原版、更新啟動器本身。GUI 和命令列共用
use crate::game::{AfterUpdate, Game, NoTranslation};
use crate::manifest::{self, ChangelogEntry, LauncherInfo, Manifest, Update};
use crate::patcher::RuleMismatch;
use crate::paths::{Config, State};
use crate::selfupdate;
use anyhow::{Context, Result};
use std::path::PathBuf;

#[derive(Clone, Copy, PartialEq)]
pub enum Job {
    Update,
    Launch,
    /// 只裝上語言、不啟動
    Install,
    Restore,
    SelfUpdate,
    /// 遊戲內更新之後（d2s-launcher --after-update）：等安裝程式裝完，再照 Launch 重新套用翻譯、開遊戲
    AfterUpdate,
}

/// 翻譯套不上、改用英文原版開遊戲的原因
#[derive(Clone, Copy, PartialEq)]
pub enum Fallback {
    /// 規則對不上：遊戲剛改版
    GameUpdated,
    /// 選的翻譯本機還沒有
    NoTranslation,
}

impl Fallback {
    /// 記在 state.json 的代碼
    pub fn id(self) -> &'static str {
        match self {
            Fallback::GameUpdated => "game_updated",
            Fallback::NoTranslation => "no_translation",
        }
    }

    pub fn from_id(id: &str) -> Option<Self> {
        match id {
            "game_updated" => Some(Fallback::GameUpdated),
            "no_translation" => Some(Fallback::NoTranslation),
            _ => None,
        }
    }

    /// 上次啟動記下的原因（啟動器重新開啟時主畫面照樣顯示）
    pub fn last() -> Option<Self> {
        State::load().fallback.as_deref().and_then(Self::from_id)
    }

    /// i18n 的 key
    pub fn key(self) -> &'static str {
        match self {
            Fallback::GameUpdated => "fallback_game_updated",
            Fallback::NoTranslation => "fallback_no_translation",
        }
    }
}

#[derive(Default)]
pub struct Outcome {
    /// 最新可用的 manifest（更新失敗就是上次的）
    pub manifest: Option<Manifest>,
    /// 最新一次讀到的啟動器版本資訊
    pub launcher: Option<LauncherInfo>,
    /// 啟動器已經換成新版，要重新開啟
    pub restart: Option<PathBuf>,
    /// 翻譯套不上，改用英文原版
    pub fallback: Option<Fallback>,
    /// 遊戲的版本（package.json）
    pub game_version: Option<String>,
    /// 最新一筆更新紀錄（看過沒有用 changelog_unseen 判斷）
    pub changelog: Option<ChangelogEntry>,
    /// 啟動時檢查了更新：Some(true) 是失敗（沒檢查是 None）
    pub update_failed: Option<bool>,
    /// 這次實際拿到 manifest 的來源
    pub source: Option<String>,
}

pub fn run(job: Job, config: &Config, manifest: Option<Manifest>, log: &dyn Fn(String)) -> Result<Outcome> {
    let mut out = Outcome { launcher: manifest.as_ref().and_then(|m| m.launcher.clone()), manifest, ..Default::default() };
    match job {
        Job::Update => update(config, &mut out, log)?,
        Job::AfterUpdate => {
            let game = Game::new(config.game_dir())?;
            // 最多等 5 分鐘（測試時用 D2S_AFTER_UPDATE_TIMEOUT 改秒數）
            let timeout = std::env::var("D2S_AFTER_UPDATE_TIMEOUT").ok().and_then(|s| s.parse().ok()).unwrap_or(300);
            match game.wait_for_update(std::time::Duration::from_secs(timeout), log) {
                AfterUpdate::GameRunning => {
                    log("遊戲已經開著（更新可能沒有裝），不再開一次".into());
                    return Ok(out);
                }
                AfterUpdate::TimedOut => log("⚠ 等了 5 分鐘還沒裝好，照現在的遊戲開".into()),
                AfterUpdate::Updated => {}
            }
            // 照一般的啟動：檢查更新、套用翻譯（規則對不上時改用原版開、提示「遊戲剛更新，翻譯修正中」）。
            // 其他錯誤也至少把遊戲開起來，不要讓玩家什麼都沒有
            match run(Job::Launch, config, out.manifest.clone(), log) {
                Ok(o) => return Ok(o),
                Err(e) => {
                    log(format!("✖ {e:#}"));
                    if !game.running() {
                        game.launch(None)?;
                        log("改用遊戲現在的 app.asar 開啟".into());
                    }
                    return Err(e);
                }
            }
        }
        Job::Launch | Job::Install => {
            if config.auto_update {
                let r = update(config, &mut out, log);
                out.update_failed = Some(r.is_err());
                if let Err(e) = r {
                    if out.manifest.is_some() {
                        log(format!("⚠ 更新失敗，用本機的翻譯：{e:#}"));
                    } else {
                        log(format!("⚠ 下載不到翻譯清單，本機也沒有，只能用原版：{e:#}"));
                    }
                }
            }
            let game = Game::new(config.game_dir())?;
            let slot = match game.install(&config.language, out.manifest.as_ref(), log) {
                Ok(slot) => slot,
                // 遊戲改版、規則對不上，或翻譯還沒下載：不要讓玩家開不了遊戲，換回真正的原版開（不套任何規則）。
                // 選的語言照舊保留，下次開啟時照常檢查更新、重新套用
                Err(e) => {
                    let why = if e.downcast_ref::<RuleMismatch>().is_some() {
                        Fallback::GameUpdated
                    } else if e.downcast_ref::<NoTranslation>().is_some() {
                        Fallback::NoTranslation
                    } else {
                        return Err(e);
                    };
                    log(format!("（{e:#}）"));
                    log(format!("⚠ {}", crate::i18n::tr("zh-TW", why.key())));
                    out.fallback = Some(why);
                    game.restore(log)?;
                    log(format!("⚠ {}", crate::i18n::tr("zh-TW", "original_lang_hint")));
                    None
                }
            };
            out.game_version = game.version();
            let state = State::load();
            if state.fallback.as_deref() != out.fallback.map(Fallback::id) {
                let _ = State { fallback: out.fallback.map(|f| f.id().to_string()), ..state }.save();
            }
            if job == Job::Launch {
                game.launch(slot)?;
                log("遊戲已啟動".into());
            }
        }
        Job::Restore => Game::new(config.game_dir())?.restore(log)?,
        Job::SelfUpdate => {
            update(config, &mut out, log)?;
            match out.launcher.clone().filter(|l| selfupdate::newer(&l.latest)) {
                Some(l) => {
                    let base = out.source.clone().unwrap_or_else(|| config.manifest_url());
                    let exe = selfupdate::apply(&l, &base, log)
                        .with_context(|| format!("無法自動更新啟動器，請到網站手動下載：{}", crate::system::download_url(config.ui_language())))?;
                    out.restart = Some(exe);
                }
                None => log(format!("啟動器已經是最新版（{}）", selfupdate::VERSION)),
            }
        }
    }
    Ok(out)
}

/// 下載 manifest 和字典。可以用的新 manifest 放進 out.manifest（啟動器太舊時不換），也帶回啟動器版本和沒看過的更新紀錄
fn update(config: &Config, out: &mut Outcome, log: &dyn Fn(String)) -> Result<()> {
    let (manifest, url) = match manifest::update(&config.manifest_sources(), &config.language, log)? {
        Update::Done { manifest, changed, source } => {
            if changed.is_empty() {
                log("翻譯已經是最新的".into());
            } else {
                log(format!("已更新：{}", changed.join("、")));
            }
            if let Some(l) = selfupdate::available(&manifest) {
                log(format!("有新版啟動器 {}（目前 {}）", l.latest, selfupdate::VERSION));
            }
            out.manifest = Some(manifest.clone());
            (manifest, source)
        }
        Update::LauncherTooOld { manifest, source } => {
            let min = manifest.launcher.as_ref().map_or("", |l| l.minimum.as_str());
            let now = if out.manifest.is_some() { "這次先用本機的翻譯" } else { "本機沒有翻譯，只能用原版" };
            log(format!("⚠ 新的翻譯需要啟動器 {min} 以上（目前 {}），請先更新啟動器；{now}", selfupdate::VERSION));
            (manifest, source)
        }
    };
    log(format!("翻譯清單來源：{url}"));
    if State::load().manifest_source != url {
        let _ = State { manifest_source: url.clone(), ..State::load() }.save();
    }
    out.source = Some(url.clone());
    out.launcher = manifest.launcher.clone();
    if manifest.changelog.is_some() {
        match manifest::latest_changelog(&url, &manifest) {
            Ok(c) => out.changelog = c,
            Err(e) => log(format!("⚠ 讀不到更新紀錄：{e:#}")),
        }
    }
    Ok(())
}

pub fn changelog_unseen(c: &ChangelogEntry) -> bool {
    c.version != State::load().changelog_seen
}

/// 記下看過的更新紀錄，之後不再顯示
pub fn mark_changelog_seen(version: &str) -> Result<()> {
    State { changelog_seen: version.to_string(), ..State::load() }.save()
}
