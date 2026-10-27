// 啟動器的三件事：檢查更新、裝上語言並啟動遊戲、還原原版。GUI 和命令列共用
use crate::game::Game;
use crate::manifest::{self, Manifest};
use crate::paths::Config;
use anyhow::Result;

#[derive(Clone, Copy, PartialEq)]
pub enum Job {
    Update,
    Launch,
    /// 只裝上語言、不啟動
    Install,
    Restore,
}

/// 回傳最新可用的 manifest（更新失敗就用上次的）
pub fn run(job: Job, config: &Config, manifest: Option<Manifest>, log: &dyn Fn(String)) -> Result<Option<Manifest>> {
    match job {
        Job::Update => {
            let m = update(config, log)?;
            Ok(Some(m))
        }
        Job::Launch | Job::Install => {
            let mut manifest = manifest;
            if config.auto_update {
                match update(config, log) {
                    Ok(m) => manifest = Some(m),
                    Err(e) => log(format!("⚠ 更新失敗，用本機的翻譯：{e:#}")),
                }
            }
            let game = Game::new(config.game_dir())?;
            let slot = game.install(&config.language, manifest.as_ref(), log)?;
            if job == Job::Launch {
                game.launch(slot)?;
                log("遊戲已啟動".into());
            }
            Ok(manifest)
        }
        Job::Restore => {
            Game::new(config.game_dir())?.restore(log)?;
            Ok(manifest)
        }
    }
}

fn update(config: &Config, log: &dyn Fn(String)) -> Result<Manifest> {
    let (m, changed) = manifest::update(&config.manifest_url, &config.token(), log)?;
    if changed.is_empty() {
        log("翻譯已經是最新的".into());
    } else {
        log(format!("已更新：{}", changed.join("、")));
    }
    Ok(m)
}
