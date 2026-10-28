// 跟 Windows 打交道的小功能：偵測 Diablo II、系統語言、開網頁、建立桌面捷徑、選資料夾
use std::path::{Path, PathBuf};

/// 程式名稱：每種介面語言都一樣，不翻譯（網站的 og:site_name、README 也是這個名稱）
pub const APP_NAME: &str = "D2 Survivors Localization";
/// 網站（暫定網址；換網域只改這裡）
pub const SITE_URL: &str = "https://cycleapple.github.io/d2survivors-localization/";
/// 社群 Discord 的邀請連結（永久；空的就不顯示）
pub const DISCORD_URL: &str = "https://discord.gg/QMBbTHSsaK";
/// 贊助連結（只放在完成頁和設定的連結區，不跳出、不提醒；贊助與否不影響任何功能）
pub const DONATE_URL: &str = "https://paypal.me/DonateCYtw";
/// D2 Survivors 官方網站（下載遊戲）。跟網站 site/src/config.mjs 的 LINKS 一樣
pub const GAME_URL: &str = "https://d2survivors.lol/";
/// D2 Survivors 的瀏覽器版
pub const GAME_PLAY_URL: &str = "https://d2survivors.lol/play/";
/// D2 Survivors 遊戲官方的 Discord（英文；跟翻譯社群的 DISCORD_URL 是不同的伺服器）
pub const GAME_DISCORD_URL: &str = "https://discord.gg/mYMGgZPuQb";
/// Blizzard 官方的 Diablo II: Resurrected 頁面（只放官方連結，不放推廣碼）
pub const D2R_URL: &str = "https://diablo2.blizzard.com/";

#[derive(Clone, Copy, PartialEq)]
pub enum D2Kind {
    Resurrected,
    Classic,
}

impl D2Kind {
    pub fn id(self) -> &'static str {
        match self {
            D2Kind::Resurrected => "d2r",
            D2Kind::Classic => "classic",
        }
    }
}

/// 資料夾裡是哪一種 Diablo II
pub fn d2_kind(dir: &Path) -> Option<D2Kind> {
    if dir.join("D2R.exe").is_file() {
        Some(D2Kind::Resurrected)
    } else if dir.join("d2data.mpq").is_file() && (dir.join("Game.exe").is_file() || dir.join("Diablo II.exe").is_file()) {
        Some(D2Kind::Classic)
    } else {
        None
    }
}

/// 找玩家的 Diablo II：D2 Survivors 自己記的路徑、D2R 的解除安裝登錄、經典版的登錄、預設安裝位置
pub fn find_d2() -> Option<(PathBuf, D2Kind)> {
    // 測試「找不到 Diablo II」的畫面用
    if std::env::var_os("D2S_FAKE_NO_D2").is_some_and(|v| v == "1") {
        return None;
    }
    let mut candidates: Vec<PathBuf> = Vec::new();
    // D2 Survivors 設定好之後會記在 %APPDATA%\D2 Survivors\desktop.json 的 installDir
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let p = PathBuf::from(appdata).join("D2 Survivors").join("desktop.json");
        if let Some(dir) = std::fs::read(p).ok().and_then(|b| serde_json::from_slice::<serde_json::Value>(&b).ok()).and_then(|v| v["installDir"].as_str().map(PathBuf::from)) {
            candidates.push(dir);
        }
    }
    for (root, key, value) in [
        (Root::LocalMachine, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Diablo II Resurrected", "InstallLocation"),
        (Root::LocalMachine, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Diablo II Resurrected", "InstallLocation"),
        (Root::CurrentUser, r"SOFTWARE\Blizzard Entertainment\Diablo II", "InstallPath"),
        (Root::LocalMachine, r"SOFTWARE\WOW6432Node\Blizzard Entertainment\Diablo II", "InstallPath"),
    ] {
        if let Some(v) = registry_string(root, key, value) {
            candidates.push(PathBuf::from(v));
        }
    }
    let pf86 = std::env::var_os("ProgramFiles(x86)").map(PathBuf::from).unwrap_or_else(|| r"C:\Program Files (x86)".into());
    candidates.push(pf86.join("Diablo II Resurrected"));
    candidates.push(pf86.join("Diablo II"));
    candidates.into_iter().find_map(|d| d2_kind(&d).map(|k| (d, k)))
}

#[derive(Clone, Copy)]
enum Root {
    LocalMachine,
    CurrentUser,
}

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(Some(0)).collect()
}

#[cfg(windows)]
fn registry_string(root: Root, key: &str, value: &str) -> Option<String> {
    use windows_sys::Win32::System::Registry::{RegGetValueW, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, RRF_RT_REG_SZ};
    let hkey = match root {
        Root::LocalMachine => HKEY_LOCAL_MACHINE,
        Root::CurrentUser => HKEY_CURRENT_USER,
    };
    let (key, value) = (wide(key), wide(value));
    let mut buf = vec![0u16; 1024];
    let mut size = (buf.len() * 2) as u32;
    let r = unsafe { RegGetValueW(hkey, key.as_ptr(), value.as_ptr(), RRF_RT_REG_SZ, std::ptr::null_mut(), buf.as_mut_ptr().cast(), &mut size) };
    if r != 0 {
        return None;
    }
    let len = (size as usize / 2).saturating_sub(1);
    let s = String::from_utf16_lossy(&buf[..len.min(buf.len())]);
    let s = s.trim_end_matches('\0').trim();
    (!s.is_empty()).then(|| s.to_string())
}

#[cfg(not(windows))]
fn registry_string(_: Root, _: &str, _: &str) -> Option<String> {
    None
}

/// Windows 的介面語言對應到啟動器的語言 id（zh-TW、zh-CN、ja、de、fr、ru、ko、en）
pub fn os_language() -> String {
    let locale = os_locale().to_lowercase();
    let lang = locale.split('-').next().unwrap_or("");
    match lang {
        "zh" if locale.contains("hans") || locale.ends_with("-cn") || locale.ends_with("-sg") => "zh-CN",
        "zh" => "zh-TW",
        "ja" | "de" | "fr" | "ru" | "ko" => lang,
        _ => "en",
    }
    .to_string()
}

#[cfg(windows)]
fn os_locale() -> String {
    use windows_sys::Win32::Globalization::GetUserDefaultLocaleName;
    let mut buf = [0u16; 85];
    let n = unsafe { GetUserDefaultLocaleName(buf.as_mut_ptr(), buf.len() as i32) };
    if n <= 1 {
        return String::new();
    }
    String::from_utf16_lossy(&buf[..n as usize - 1])
}

#[cfg(not(windows))]
fn os_locale() -> String {
    std::env::var("LANG").unwrap_or_default().replace('_', "-")
}

/// 遊戲自己記的語言（localStorage 的 d2s:lang），只讀、不改。
/// 舊版啟動器會寫進 ko，之後開原版就變成韓文；主畫面看到 ko 時告訴玩家怎麼在遊戲裡切回 English。
/// localStorage 是 Chromium 的 leveldb，跟存檔放在一起，改寫弄壞就會丟資料，所以不改：
/// 整個資料夾複製到暫存資料夾、用 leveldb 讀複本（玩家的檔案只複製，不開啟），讀完刪掉。
/// key 是「_<origin>\0\x01<名稱>」，值的第一個位元組 1 是 Latin-1、0 是 UTF-16LE。讀不到傳回 None
pub fn stored_game_lang() -> Option<String> {
    let user_data = std::env::var_os("D2S_USER_DATA").map(PathBuf::from).or_else(|| std::env::var_os("APPDATA").map(|a| PathBuf::from(a).join("D2 Survivors")))?;
    let src = user_data.join("Local Storage").join("leveldb");
    let tmp = std::env::temp_dir().join(format!("d2s-launcher-ls-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(&tmp).ok()?;
    let read = || -> Option<String> {
        for e in std::fs::read_dir(&src).ok()?.filter_map(|e| e.ok()) {
            if e.file_name() != "LOCK" && e.file_type().ok()?.is_file() {
                std::fs::copy(e.path(), tmp.join(e.file_name())).ok()?;
            }
        }
        let opt = rusty_leveldb::Options { create_if_missing: false, ..Default::default() };
        let mut db = rusty_leveldb::DB::open(&tmp, opt).ok()?;
        let value = db.get(b"_app://game\x00\x01d2s:lang")?;
        match value.split_first()? {
            (1, s) => Some(s.iter().map(|&b| b as char).collect()),
            (0, s) => Some(String::from_utf16_lossy(&s.chunks_exact(2).map(|c| u16::from_le_bytes([c[0], c[1]])).collect::<Vec<_>>())),
            _ => None,
        }
    };
    let lang = read();
    let _ = std::fs::remove_dir_all(&tmp);
    lang
}

/// 用預設瀏覽器開網頁
pub fn open_url(url: &str) {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Shell::ShellExecuteW;
        let (op, url) = (wide("open"), wide(url));
        ShellExecuteW(std::ptr::null_mut(), op.as_ptr(), url.as_ptr(), std::ptr::null(), std::ptr::null(), 1);
    }
}

/// 舊版建的捷徑名稱（依介面語言），建新捷徑時刪掉，桌面上不要同時有兩個
const OLD_SHORTCUTS: [&str; 3] = ["D2 Survivors 啟動器", "D2 Survivors 启动器", "D2 Survivors Launcher"];

/// 在桌面建立啟動器的捷徑「D2 Survivors Localization」（--play：開啟後直接啟動遊戲）
pub fn create_shortcut() -> anyhow::Result<PathBuf> {
    let exe = std::env::current_exe()?;
    let dir = exe.parent().unwrap_or(Path::new("."));
    let q = |s: &str| s.replace('\'', "''");
    // 用 Windows 內建的 WScript.Shell 建 .lnk，不用另外帶 COM 的程式庫。
    // 舊名稱的捷徑只在指向 d2s-launcher 時才刪，不碰別的東西
    let old = OLD_SHORTCUTS.iter().map(|n| format!("'{}'", q(n))).collect::<Vec<_>>().join(",");
    let script = format!(
        "$d=[Environment]::GetFolderPath('Desktop');$w=New-Object -ComObject WScript.Shell;\
         foreach($n in @({old})){{$o=Join-Path $d ($n+'.lnk');if((Test-Path -LiteralPath $o) -and ($w.CreateShortcut($o).TargetPath -like '*d2s-launcher*')){{Remove-Item -LiteralPath $o}}}};\
         $p=Join-Path $d '{name}.lnk';$s=$w.CreateShortcut($p);\
         $s.TargetPath='{exe}';$s.Arguments='--play';$s.WorkingDirectory='{dir}';$s.IconLocation='{exe},0';$s.Description='{name}';$s.Save();$p",
        name = q(APP_NAME),
        exe = q(&exe.to_string_lossy()),
        dir = q(&dir.to_string_lossy()),
    );
    let mut cmd = std::process::Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", &script]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    let out = cmd.output()?;
    if !out.status.success() {
        anyhow::bail!("{}", String::from_utf8_lossy(&out.stderr).trim());
    }
    Ok(PathBuf::from(String::from_utf8_lossy(&out.stdout).trim()))
}

/// 選資料夾的對話框
pub fn pick_folder(start: &Path) -> Option<PathBuf> {
    let mut d = rfd::FileDialog::new();
    if start.is_dir() {
        d = d.set_directory(start);
    }
    d.pick_folder()
}

/// 顯示用的路徑：把使用者資料夾換成 %LOCALAPPDATA% 之類，截圖時不會露出帳號名稱
pub fn display_path(p: &Path) -> String {
    let s = p.display().to_string();
    for var in ["LOCALAPPDATA", "APPDATA", "USERPROFILE"] {
        if let Some(v) = std::env::var_os(var) {
            let v = v.to_string_lossy().trim_end_matches('\\').to_string();
            if !v.is_empty() && s.to_lowercase().starts_with(&v.to_lowercase()) {
                return format!("%{var}%{}", &s[v.len()..]);
            }
        }
    }
    s
}
