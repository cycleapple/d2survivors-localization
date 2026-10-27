// D2 Survivors 啟動器：切換遊戲語言、自動更新翻譯
//   d2s-launcher                     開啟視窗（第一次開啟時是設定精靈）
//   d2s-launcher --play              開啟視窗並直接啟動遊戲（桌面捷徑）
//   d2s-launcher --launch [--lang zh-TW|zh-CN|ja|en|ko] [--no-update]   直接啟動（可以做成捷徑）
//   d2s-launcher --install | --update | --restore | --self-update | --status   （--install 只裝上語言、不啟動）
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod asar;
mod game;
mod gui;
mod i18n;
mod jobs;
mod manifest;
mod patcher;
mod paths;
mod selfupdate;
mod system;

use jobs::Job;
use paths::Config;

fn main() {
    selfupdate::cleanup();
    let args: Vec<String> = std::env::args().skip(1).collect();
    // --play：桌面捷徑用，開視窗並直接啟動遊戲（出錯時視窗留著看得到原因）
    let play = args == ["--play"];
    if args.is_empty() || play {
        if let Err(e) = gui::run(play) {
            eprintln!("{e}");
        }
        return;
    }
    attach_console();
    std::process::exit(match cli(&args) {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("錯誤：{e:#}");
            1
        }
    });
}

fn cli(args: &[String]) -> anyhow::Result<()> {
    let mut config = Config::load();
    let mut job = None;
    let mut it = args.iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--launch" => job = Some(Job::Launch),
            "--install" => job = Some(Job::Install),
            "--update" => job = Some(Job::Update),
            "--restore" => job = Some(Job::Restore),
            "--self-update" => job = Some(Job::SelfUpdate),
            "--status" => job = None,
            "--no-update" => config.auto_update = false,
            "--lang" => config.language = it.next().cloned().ok_or_else(|| anyhow::anyhow!("--lang 後面要接語言"))?,
            "--manifest" => config.manifest_url = it.next().cloned().ok_or_else(|| anyhow::anyhow!("--manifest 後面要接網址"))?,
            "--save" => {}
            other => anyhow::bail!("不認得的參數 {other}"),
        }
    }
    if args.iter().any(|a| a == "--save") {
        config.save()?;
    }
    let log = |s: String| println!("{s}");
    match job {
        Some(job) => {
            let out = jobs::run(job, &config, manifest::cached(), &log)?;
            if let Some(c) = out.changelog.as_ref().filter(|c| jobs::changelog_unseen(c)) {
                println!("更新紀錄（{}）：{}", c.date, c.summary_for(config.ui_language()).unwrap_or(""));
            }
            if out.restart.is_some() {
                println!("下次執行就是新版");
            }
        }
        None => {
            let m = manifest::cached();
            println!("啟動器：{}", selfupdate::VERSION);
            println!("資料夾：{}", paths::data_dir().display());
            println!("遊戲：{}", config.game_dir().display());
            println!("語言：{}", game::language_name(&config.language, m.as_ref()));
            println!("更新來源：{}", config.manifest_url());
            if let Some(m) = &m {
                println!("翻譯：{}（{}）", m.version, m.updated);
                for (l, _) in m.desktop_languages() {
                    let ready = if manifest::local_dict(l).is_some() { "已下載" } else { "未下載" };
                    println!("  {} {}：{} 條，{ready}", l.id, l.label(), l.entries);
                }
                if let Some(l) = selfupdate::available(m) {
                    println!("有新版啟動器 {}（--self-update）", l.latest);
                }
            }
            if let Ok(g) = game::Game::new(config.game_dir()) {
                match g.original() {
                    Ok(o) => println!("原版 app.asar：{}（{}）", o.version, &o.sha256[..12]),
                    Err(e) => println!("原版 app.asar：{e:#}"),
                }
            }
        }
    }
    Ok(())
}

/// 視窗程式沒有主控台；從命令列執行時接到父程序的主控台上
fn attach_console() {
    #[cfg(windows)]
    unsafe {
        windows_sys::Win32::System::Console::AttachConsole(windows_sys::Win32::System::Console::ATTACH_PARENT_PROCESS);
    }
}
