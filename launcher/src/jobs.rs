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

/// 翻譯套不上、改用英文原版開遊戲時給玩家看的話
pub const FALLBACK_GAME_UPDATED: &str = "遊戲剛更新，翻譯修正中，先用英文原版開啟。翻譯修好後，下次從啟動器開就會自動套用";
pub const FALLBACK_NO_TRANSLATION: &str = "翻譯還沒下載（請確認網路），先用英文原版開啟";

#[derive(Default)]
pub struct Outcome {
    /// 最新可用的 manifest（更新失敗就是上次的）
    pub manifest: Option<Manifest>,
    /// 最新一次讀到的啟動器版本資訊
    pub launcher: Option<LauncherInfo>,
    /// 啟動器已經換成新版，要重新開啟
    pub restart: Option<PathBuf>,
    /// 翻譯套不上，改用英文原版（FALLBACK_*）
    pub fallback: Option<&'static str>,
    /// 還沒看過的最新一筆更新紀錄
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
                        FALLBACK_GAME_UPDATED
                    } else if e.downcast_ref::<NoTranslation>().is_some() {
                        FALLBACK_NO_TRANSLATION
                    } else {
                        return Err(e);
                    };
                    log(format!("（{e:#}）"));
                    log(format!("⚠ {why}"));
                    out.fallback = Some(why);
                    english(&game, out.manifest.as_ref(), log)?
                }
            };
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
    if manifest.changelog.as_ref().is_some_and(|c| c.latest != State::load().changelog_seen) {
        match manifest::latest_changelog(&url, &manifest) {
            Ok(c) => out.changelog = c,
            Err(e) => log(format!("⚠ 讀不到更新紀錄：{e:#}")),
        }
    }
    Ok(())
}

/// 記下看過的更新紀錄，之後不再顯示
pub fn mark_changelog_seen(version: &str) -> Result<()> {
    State { changelog_seen: version.to_string(), ..State::load() }.save()
}
