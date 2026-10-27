// 啟動器的介面文字：繁中、簡中、英文。其他語言（日、德、法、俄、韓）先用英文
// tr(語言, key)；文字裡的 {} 用 trf 依序代換

/// (key, 繁中, 簡中, 英文)
const TABLE: &[(&str, &str, &str, &str)] = &[
    ("app_title", "D2 Survivors 啟動器", "D2 Survivors 启动器", "D2 Survivors Launcher"),
    ("brand", "D2 Survivors 中文化", "D2 Survivors 汉化", "D2 Survivors Localization"),
    ("step_lang", "語言", "语言", "Language"),
    ("step_game", "遊戲", "游戏", "Game"),
    ("step_d2", "Diablo II", "Diablo II", "Diablo II"),
    ("step_done", "完成", "完成", "Done"),
    ("new_badge", "新", "新", "New"),
    ("site_short", "網站", "网站", "Website"),
    ("licenses", "授權", "许可", "Licenses"),
    ("next", "下一步", "下一步", "Next"),
    ("back", "上一步", "上一步", "Back"),
    ("skip", "略過", "跳过", "Skip"),
    ("return", "返回", "返回", "Back"),
    ("lang_desc", "啟動器和遊戲都會用這個語言，之後可以隨時在主畫面切換。", "启动器和游戏都会使用这个语言，之后可以随时在主界面切换。", "Used for both the launcher and the game. You can change it any time on the main screen."),
    ("lang_loading", "正在讀取翻譯清單…", "正在读取翻译列表…", "Loading the list of translations…"),
    ("lang_offline", "讀不到翻譯清單，請確認網路。現在可以先選英文或韓文原版。", "读不到翻译列表，请确认网络。现在可以先选英文或韩文原版。", "Couldn't load the list of translations. Check your connection; for now you can pick the original English or Korean."),
    ("game_title", "D2 Survivors", "D2 Survivors", "D2 Survivors"),
    ("game_found", "已找到 D2 Survivors", "已找到 D2 Survivors", "D2 Survivors found"),
    ("game_version", "版本 {}", "版本 {}", "version {}"),
    ("game_missing", "還沒有找到 D2 Survivors", "尚未找到 D2 Survivors", "D2 Survivors wasn't found"),
    ("game_missing_desc", "請先到 D2 Survivors 的官方網站下載安裝，裝好後回來按「重新偵測」。如果裝在別的地方，可以手動選擇資料夾。", "请先到 D2 Survivors 的官方网站下载安装，装好后回来点「重新检测」。如果装在别的地方，可以手动选择文件夹。", "Download and install D2 Survivors from its official website, then come back and click “Detect again”. If it's installed somewhere else, choose its folder."),
    ("open_game_site", "前往 D2 Survivors 官方網站", "前往 D2 Survivors 官方网站", "Open the D2 Survivors website"),
    ("redetect", "重新偵測", "重新检测", "Detect again"),
    ("choose_folder", "選擇資料夾…", "选择文件夹…", "Choose folder…"),
    ("d2_title", "Diablo II 的遊戲檔案", "Diablo II 的游戏文件", "Diablo II game files"),
    ("d2_desc", "D2 Survivors 要用你自己的《暗黑破壞神 II：獄火重生》（或經典版 Diablo II）的遊戲檔案才能玩。", "D2 Survivors 需要使用你自己的《暗黑破坏神 II：狱火重生》（或经典版 Diablo II）的游戏文件才能玩。", "D2 Survivors runs on the game files from your own copy of Diablo II: Resurrected (or classic Diablo II)."),
    ("d2_found_d2r", "已找到 Diablo II: Resurrected", "已找到 Diablo II: Resurrected", "Diablo II: Resurrected found"),
    ("d2_found_classic", "已找到 Diablo II（經典版）", "已找到 Diablo II（经典版）", "Classic Diablo II found"),
    ("d2_missing", "沒有找到 Diablo II", "没有找到 Diablo II", "Diablo II wasn't found"),
    ("d2_missing_desc", "還沒有的話，需要購買 Diablo II: Resurrected。已經有的話，可以手動選擇資料夾，或直接略過（也可以之後在 D2 Survivors 裡設定）。", "还没有的话，需要购买 Diablo II: Resurrected。已经有的话，可以手动选择文件夹，或直接跳过（也可以之后在 D2 Survivors 里设置）。", "If you don't own it yet, you'll need to buy Diablo II: Resurrected. If you do, choose its folder or skip this step (you can also set it up later inside D2 Survivors)."),
    ("open_blizzard", "前往 Blizzard 的 Diablo II: Resurrected 頁面", "前往 Blizzard 的 Diablo II: Resurrected 页面", "Diablo II: Resurrected on Blizzard's website"),
    ("done_title", "準備好了", "准备好了", "All set"),
    ("done_desc", "按「啟動遊戲」會下載最新的翻譯並開啟遊戲。", "点「启动游戏」会下载最新的翻译并启动游戏。", "Click Play to download the latest translation and start the game."),
    ("donate", "☕ 請我喝杯咖啡", "☕ 请我喝杯咖啡", "☕ Buy me a coffee"),
    ("create_shortcut", "在桌面建立捷徑", "在桌面创建快捷方式", "Create a desktop shortcut"),
    ("shortcut_done", "已在桌面建立捷徑", "已在桌面创建快捷方式", "Desktop shortcut created"),
    ("finish", "完成", "完成", "Finish"),
    ("play", "啟動遊戲", "启动游戏", "Play"),
    ("game_language", "遊戲語言", "游戏语言", "Game language"),
    ("beta", "測試中", "测试中", "beta"),
    ("draft", "草稿", "草稿", "draft"),
    ("status_translation", "翻譯", "翻译", "Translation"),
    ("status_game", "遊戲", "游戏", "Game"),
    ("status_launcher", "啟動器", "启动器", "Launcher"),
    ("update_failed", "無法檢查更新，先用本機的翻譯", "无法检查更新，先用本地的翻译", "Couldn't check for updates; using the local copy"),
    ("launcher_new", "有新版 {}", "有新版 {}", "{} available"),
    ("launcher_required", "新的翻譯需要啟動器 {}，請先更新", "新的翻译需要启动器 {}，请先更新", "The latest translation needs launcher {}. Please update."),
    ("update_launcher", "更新啟動器", "更新启动器", "Update launcher"),
    ("check_updates", "檢查更新", "检查更新", "Check for updates"),
    ("settings", "設定", "设置", "Settings"),
    ("game_missing_banner", "找不到 D2 Survivors，請到「設定」指定遊戲資料夾", "找不到 D2 Survivors，请到「设置」指定游戏文件夹", "D2 Survivors wasn't found. Set its folder in Settings."),
    ("changelog", "更新紀錄", "更新记录", "What's new"),
    ("got_it", "知道了", "知道了", "Got it"),
    ("fallback_game_updated", "遊戲剛更新，翻譯修正中，先用原版開啟。翻譯修好後，下次從啟動器開就會自動套用。", "游戏刚更新，翻译修正中，先用原版启动。翻译修好后，下次从启动器启动就会自动应用。", "The game was just updated and the translation is being fixed, so it started as the original. The translation will be applied automatically once it's fixed."),
    ("fallback_no_translation", "翻譯還沒下載（請確認網路），先用原版開啟。", "翻译还没下载（请确认网络），先用原版启动。", "The translation hasn't been downloaded yet (check your connection), so the game started as the original."),
    ("original_note", "原版：不修改遊戲，排行榜紀錄不會被標成 patched。", "原版：不修改游戏，排行榜记录不会被标成 patched。", "Original: the game is left untouched, so leaderboard runs aren't marked as patched."),
    ("original_lang_hint", "原版照遊戲自己存的語言開啟。語言不對的話，到遊戲的 OPTIONS → GAME → LANGUAGE 切換（韓文畫面是 설정 → GAME → 언어）。", "原版按游戏自己保存的语言启动。语言不对的话，到游戏的 OPTIONS → GAME → LANGUAGE 切换（韩文界面是 설정 → GAME → 언어）。", "The original starts in the language the game has saved. If it's wrong, change it in the game under OPTIONS → GAME → LANGUAGE (on the Korean screen: 설정 → GAME → 언어)."),
    ("patched_note", "翻譯版會修改遊戲檔案，排行榜紀錄會被標成 patched。", "翻译版会修改游戏文件，排行榜记录会被标成 patched。", "Translations modify the game's files, so leaderboard runs are marked as patched."),
    ("working", "處理中…", "处理中…", "Working…"),
    ("error", "發生錯誤：{}", "发生错误：{}", "Something went wrong: {}"),
    ("auto_update", "啟動時自動更新翻譯", "启动时自动更新翻译", "Update translations on start"),
    ("close_after", "遊戲啟動後關閉啟動器", "游戏启动后关闭启动器", "Close the launcher after the game starts"),
    ("game_folder", "D2 Survivors 資料夾", "D2 Survivors 文件夹", "D2 Survivors folder"),
    ("d2_folder", "Diablo II 資料夾", "Diablo II 文件夹", "Diablo II folder"),
    ("detect", "偵測", "检测", "Detect"),
    ("not_found", "（沒有找到）", "（没有找到）", "(not found)"),
    ("update_source", "更新來源", "更新来源", "Update source"),
    ("restore", "還原原版遊戲", "还原原版游戏", "Restore the original game"),
    ("restore_hint", "把遊戲檔案換回沒有翻譯的原版", "把游戏文件换回没有翻译的原版", "Put the game's files back to the untranslated original"),
    ("rerun_wizard", "重新執行設定精靈", "重新运行设置向导", "Run the setup wizard again"),
    ("cli", "命令列", "命令行", "Command line"),
    ("log", "詳細紀錄", "详细记录", "Log"),
    ("links", "連結", "链接", "Links"),
];

/// 選語言那一步的標題：玩家還沒選語言，用好幾種語言並列
pub const LANGUAGE_TITLE: &str = "選擇語言 · 选择语言 · Language · 言語 · Sprache · Langue · Язык · Język";

/// 語言的狀態用那個語言自己寫：status 是 manifest 的 status（None＝available 不加標示，beta 測試中，其他都當草稿）
pub fn native_status(id: &str, status: Option<&str>) -> Option<&'static str> {
    // (語言, 測試中, 草稿)
    const NATIVE: &[(&str, &str, &str)] = &[
        ("zh-TW", "測試中", "草稿"),
        ("zh-CN", "测试中", "草稿"),
        ("ja", "ベータ版", "下書き"),
        ("ko", "베타", "초안"),
        ("de", "Beta", "Entwurf"),
        ("fr", "bêta", "brouillon"),
        ("ru", "бета", "черновик"),
        ("pl", "beta", "wersja robocza"),
    ];
    status.map(|s| {
        let row = NATIVE.iter().find(|r| r.0 == id);
        match (s, row) {
            ("beta", Some(r)) => r.1,
            ("beta", None) => "beta",
            (_, Some(r)) => r.2,
            (_, None) => "draft",
        }
    })
}

/// 語言名稱加上括號裡的說明（已經是那個語言寫的），例如「简体中文（测试中）」「Русский (бета)」
pub fn with_note(id: &str, name: &str, note: Option<&str>) -> String {
    match note {
        // 中日文用全形括號
        Some(n) if id.starts_with("zh") || id == "ja" => format!("{name}（{n}）"),
        Some(n) => format!("{name} ({n})"),
        None => name.to_string(),
    }
}

fn column(lang: &str) -> usize {
    match lang {
        "zh-TW" => 1,
        "zh-CN" => 2,
        _ => 3,
    }
}

pub fn tr(lang: &str, key: &str) -> &'static str {
    match TABLE.iter().find(|r| r.0 == key) {
        Some(r) => [r.1, r.2, r.3][column(lang) - 1],
        None => "?",
    }
}

pub fn trf(lang: &str, key: &str, args: &[&str]) -> String {
    let mut s = tr(lang, key).to_string();
    for a in args {
        s = s.replacen("{}", a, 1);
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_unique_and_placeholders_match() {
        for (i, r) in TABLE.iter().enumerate() {
            assert!(TABLE[..i].iter().all(|o| o.0 != r.0), "重複的 key：{}", r.0);
            let n = r.1.matches("{}").count();
            assert!(r.2.matches("{}").count() == n && r.3.matches("{}").count() == n, "{} 各語言的 {{}} 數量不一樣", r.0);
        }
        assert_eq!(tr("ja", "play"), "Play");
        assert_eq!(trf("zh-TW", "launcher_new", &["0.3.0"]), "有新版 0.3.0");
        let label = |id, name, status| with_note(id, name, native_status(id, status));
        assert_eq!(label("zh-CN", "简体中文", Some("beta")), "简体中文（测试中）");
        assert_eq!(label("ru", "Русский", Some("beta")), "Русский (бета)");
        assert_eq!(label("pl", "Polski", Some("whatever")), "Polski (wersja robocza)");
        assert_eq!(label("zh-TW", "繁體中文", None), "繁體中文");
    }
}
