// 啟動器自我更新：manifest 的 launcher 區塊（docs/manifest-v2.md）。
// 執行中的 exe 不能覆寫，但可以改名：先把自己改名成 .old，放上新檔，下次開啟時刪掉 .old
use crate::manifest::{fetch, sha256_hex, LauncherInfo, Manifest};
use anyhow::{bail, Context, Result};
use std::fs;
use std::path::PathBuf;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

fn parse(v: &str) -> Option<(u64, u64, u64)> {
    let mut it = v.trim().trim_start_matches('v').split('.').map(|p| p.parse::<u64>().ok());
    let v = (it.next()??, it.next().unwrap_or(Some(0))?, it.next().unwrap_or(Some(0))?);
    Some(v)
}

/// 比目前的啟動器新
pub fn newer(v: &str) -> bool {
    matches!((parse(v), parse(VERSION)), (Some(a), Some(b)) if a > b)
}

/// 有新版的話回傳新版的資訊
pub fn available(m: &Manifest) -> Option<&LauncherInfo> {
    m.launcher.as_ref().filter(|l| newer(&l.latest))
}

/// 目前的版本低於 launcher.minimum：要先更新才能套用這份 manifest
pub fn required(m: &Manifest) -> Option<&LauncherInfo> {
    m.launcher.as_ref().filter(|l| newer(&l.minimum))
}

fn old_path(exe: &std::path::Path) -> PathBuf {
    let mut p = exe.as_os_str().to_owned();
    p.push(".old");
    PathBuf::from(p)
}

/// 刪掉上次更新留下的舊版。剛更新完時舊的程序可能還沒結束，多試幾次；刪不掉就下次再刪
pub fn cleanup() {
    let Ok(exe) = std::env::current_exe() else { return };
    let old = old_path(&exe);
    if fs::remove_file(&old).is_ok() || !old.exists() {
        return;
    }
    std::thread::spawn(move || {
        for _ in 0..20 {
            if fs::remove_file(&old).is_ok() || !old.exists() {
                return;
            }
            std::thread::sleep(std::time::Duration::from_millis(500));
        }
    });
}

/// 下載新版、核對 sha256，換掉目前的 exe。回傳新 exe 的路徑（呼叫的人負責重新啟動）
pub fn apply(info: &LauncherInfo, manifest_url: &str, log: &dyn Fn(String)) -> Result<PathBuf> {
    let exe = std::env::current_exe().context("找不到啟動器自己的位置")?;
    log(format!("下載啟動器 {}…", info.latest));
    let sums = fetch(&crate::manifest::resolve(manifest_url, &info.sha256_url))?;
    // 格式跟 sha256sum 一樣：「<雜湊>  d2s-launcher.exe」，只取雜湊
    let expected = String::from_utf8_lossy(&sums).split_whitespace().next().unwrap_or("").to_lowercase();
    if expected.len() != 64 {
        bail!("啟動器的 sha256 檔格式不對：{}", info.sha256_url);
    }
    let bytes = fetch(&crate::manifest::resolve(manifest_url, &info.download))?;
    if sha256_hex(&bytes) != expected {
        bail!("下載的啟動器 sha256 不符，可能下載不完整，請稍後再試");
    }
    if !bytes.starts_with(b"MZ") {
        bail!("下載的啟動器不是 Windows 程式");
    }

    let old = old_path(&exe);
    let _ = fs::remove_file(&old);
    fs::rename(&exe, &old).with_context(|| format!("無法改名 {}", exe.display()))?;
    if let Err(e) = fs::write(&exe, &bytes) {
        let _ = fs::remove_file(&exe);
        let _ = fs::rename(&old, &exe);
        return Err(anyhow::Error::new(e).context(format!("無法寫入 {}", exe.display())));
    }
    log(format!("啟動器已更新到 {}", info.latest));
    Ok(exe)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions() {
        assert_eq!(parse("0.3.0"), Some((0, 3, 0)));
        assert_eq!(parse("v1.2"), Some((1, 2, 0)));
        assert_eq!(parse("x"), None);
        assert!(newer("99.0.0"));
        assert!(!newer(VERSION));
        assert!(!newer("0.0.1"));
        assert!(!newer(""));
    }
}
