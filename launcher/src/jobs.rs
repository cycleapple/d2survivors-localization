// 啟動器做的事：檢查更新、裝上語言並啟動遊戲、還原原版、更新啟動器本身。GUI 和命令列共用
use crate::game::Game;
use crate::manifest::{self, LauncherInfo, Manifest, Update};
use crate::paths::Config;
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

#[derive(Default)]
pub struct Outcome {
    /// 最新可用的 manifest（更新失敗就是上次的）
    pub manifest: Option<Manifest>,
    /// 最新一次讀到的啟動器版本資訊
    pub launcher: Option<LauncherInfo>,
    /// 啟動器已經換成新版，要重新開啟
    pub restart: Option<PathBuf>,
}

pub fn run(job: Job, config: &Config, manifest: Option<Manifest>, log: &dyn Fn(String)) -> Result<Outcome> {
    let mut out = Outcome { launcher: manifest.as_ref().and_then(|m| m.launcher.clone()), manifest, restart: None };
    match job {
        Job::Update => {
            let (m, info) = update(config, log)?;
            out.launcher = info;
            out.manifest = m.or(out.manifest);
        }
        Job::Launch | Job::Install => {
            if config.auto_update {
                match update(config, log) {
                    Ok((m, info)) => {
                        out.launcher = info;
                        out.manifest = m.or(out.manifest);
                    }
                    Err(e) => log(format!("⚠ 更新失敗，用本機的翻譯：{e:#}")),
                }
            }
            let game = Game::new(config.game_dir())?;
            let slot = game.install(&config.language, out.manifest.as_ref(), log)?;
            if job == Job::Launch {
                game.launch(slot)?;
                log("遊戲已啟動".into());
            }
        }
        Job::Restore => Game::new(config.game_dir())?.restore(log)?,
        Job::SelfUpdate => {
            let (m, info) = update(config, log)?;
            out.manifest = m.or(out.manifest);
            out.launcher = info.clone();
            match info.filter(|l| selfupdate::newer(&l.latest)) {
                Some(l) => out.restart = Some(selfupdate::apply(&l, &config.manifest_url(), log)?),
                None => log(format!("啟動器已經是最新版（{}）", selfupdate::VERSION)),
            }
        }
    }
    Ok(out)
}

/// 回傳可以用的新 manifest（啟動器太舊時是 None）和啟動器的版本資訊
fn update(config: &Config, log: &dyn Fn(String)) -> Result<(Option<Manifest>, Option<LauncherInfo>)> {
    match manifest::update(&config.manifest_url(), &config.language, log)? {
        Update::Done { manifest, changed } => {
            if changed.is_empty() {
                log("翻譯已經是最新的".into());
            } else {
                log(format!("已更新：{}", changed.join("、")));
            }
            if let Some(l) = selfupdate::available(&manifest) {
                log(format!("有新版啟動器 {}（目前 {}）", l.latest, selfupdate::VERSION));
            }
            let info = manifest.launcher.clone();
            Ok((Some(manifest), info))
        }
        Update::LauncherTooOld { manifest } => {
            let l = manifest.launcher.clone();
            let min = l.as_ref().map_or("", |l| l.minimum.as_str());
            log(format!("⚠ 新的翻譯需要啟動器 {min} 以上（目前 {}），請先更新啟動器；這次先用本機的翻譯", selfupdate::VERSION));
            Ok((None, l))
        }
    }
}
