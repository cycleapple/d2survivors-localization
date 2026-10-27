// 啟動器做的事：檢查更新、裝上語言並啟動遊戲、還原原版、更新啟動器本身。GUI 和命令列共用
use crate::game::{Game, NoTranslation};
use crate::manifest::{self, ChangelogEntry, LauncherInfo, Manifest, Update};
use crate::patcher::RuleMismatch;
use crate::paths::{Config, State};
use crate::selfupdate;
use anyhow::Result;
use std::path::PathBuf;

#[derive(Clone, Copy, PartialEq)]
pub enum Job {
    Update,
    Launch,
    /// 只裝上語言、不啟動
    Install,
    Restore,
    SelfUpdate,
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
}

pub fn run(job: Job, config: &Config, manifest: Option<Manifest>, log: &dyn Fn(String)) -> Result<Outcome> {
    let mut out = Outcome { launcher: manifest.as_ref().and_then(|m| m.launcher.clone()), manifest, ..Default::default() };
    match job {
        Job::Update => update(config, &mut out, log)?,
        Job::Launch | Job::Install => {
            if config.auto_update {
                if let Err(e) = update(config, &mut out, log) {
                    log(format!("⚠ 更新失敗，用本機的翻譯：{e:#}"));
                }
            }
            let game = Game::new(config.game_dir())?;
            let slot = match game.install(&config.language, out.manifest.as_ref(), log) {
                Ok(slot) => slot,
                // 遊戲改版、規則對不上，或翻譯還沒下載：不要讓玩家開不了遊戲，還原原版、用英文開。
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
                    english(&game, out.manifest.as_ref(), log)?
                }
            };
            out.game_version = game.version();
            if job == Job::Launch {
                game.launch(slot)?;
                log("遊戲已啟動".into());
            }
        }
        Job::Restore => Game::new(config.game_dir())?.restore(log)?,
        Job::SelfUpdate => {
            update(config, &mut out, log)?;
            match out.launcher.clone().filter(|l| selfupdate::newer(&l.latest)) {
                Some(l) => out.restart = Some(selfupdate::apply(&l, &config.manifest_url(), log)?),
                None => log(format!("啟動器已經是最新版（{}）", selfupdate::VERSION)),
            }
        }
    }
    Ok(out)
}

/// 改用英文開遊戲。純原版不會理會啟動器指定的語言，用過翻譯的玩家遊戲裡存的是 ko，會開成韓文，
/// 所以先只套「啟動器指定語言」那條規則（base）；連它也對不上才換回純原版
fn english(game: &Game, manifest: Option<&Manifest>, log: &dyn Fn(String)) -> Result<&'static str> {
    match game.install("en", manifest, log) {
        Ok(slot) => Ok(slot),
        Err(e) if e.downcast_ref::<RuleMismatch>().is_some() || manifest.is_some_and(|m| m.desktop.is_none()) => {
            log(format!("（{e:#}）"));
            game.restore(log)?;
            log("⚠ 如果遊戲顯示成韓文，請在遊戲的設定裡把語言切換成 English".into());
            Ok("en")
        }
        Err(e) => Err(e),
    }
}

/// 下載 manifest 和字典。可以用的新 manifest 放進 out.manifest（啟動器太舊時不換），也帶回啟動器版本和沒看過的更新紀錄
fn update(config: &Config, out: &mut Outcome, log: &dyn Fn(String)) -> Result<()> {
    let url = config.manifest_url();
    let manifest = match manifest::update(&url, &config.language, log)? {
        Update::Done { manifest, changed } => {
            if changed.is_empty() {
                log("翻譯已經是最新的".into());
            } else {
                log(format!("已更新：{}", changed.join("、")));
            }
            if let Some(l) = selfupdate::available(&manifest) {
                log(format!("有新版啟動器 {}（目前 {}）", l.latest, selfupdate::VERSION));
            }
            out.manifest = Some(manifest.clone());
            manifest
        }
        Update::LauncherTooOld { manifest } => {
            let min = manifest.launcher.as_ref().map_or("", |l| l.minimum.as_str());
            log(format!("⚠ 新的翻譯需要啟動器 {min} 以上（目前 {}），請先更新啟動器；這次先用本機的翻譯", selfupdate::VERSION));
            manifest
        }
    };
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
