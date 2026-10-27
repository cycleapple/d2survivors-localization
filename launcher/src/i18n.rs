// 啟動器的介面文字：繁中、簡中、英文、日、德、法、俄、波蘭文（韓文和其他語言用英文）。
// 日、德、法、俄、波蘭文由翻譯聊天室翻（dict/launcher-i18n.json），用 launcher/merge-i18n.mjs 併進來；
// 新增或修改 key 時要通知翻譯聊天室補翻（來源清單 dict/launcher-i18n-src.json）
// tr(語言, key)；文字裡的 {} 用 trf 依序代換

/// (key, [繁中, 簡中, 英文, 日, 德, 法, 俄, 波蘭])
const TABLE: &[(&str, [&str; 8])] = &[
    ("step_lang", ["語言", "语言", "Language", "言語", "Sprache", "Langue", "Язык", "Język"]),
    ("step_game", ["遊戲", "游戏", "Game", "ゲーム", "Spiel", "Jeu", "Игра", "Gra"]),
    ("step_d2", ["Diablo II", "Diablo II", "Diablo II", "ディアブロ II", "Diablo II", "Diablo II", "Diablo II", "Diablo II"]),
    ("step_done", ["完成", "完成", "Done", "完了", "Fertig", "Terminé", "Готово", "Gotowe"]),
    ("new_badge", ["新", "新", "New", "新着", "Neu", "Nouveau", "Новинка", "Nowość"]),
    ("site_short", ["網站", "网站", "Website", "ウェブサイト", "Website", "Site web", "Сайт", "Strona"]),
    ("licenses", ["授權", "许可", "Licenses", "Licenses", "Licenses", "Licenses", "Licenses", "Licenses"]),
    ("next", ["下一步", "下一步", "Next", "次へ", "Weiter", "Suivant", "Далее", "Dalej"]),
    ("back", ["上一步", "上一步", "Back", "戻る", "Zurück", "Précédent", "Назад", "Wstecz"]),
    ("skip", ["略過", "跳过", "Skip", "スキップ", "Überspringen", "Passer", "Пропустить", "Pomiń"]),
    ("return", ["返回", "返回", "Back", "戻る", "Zurück", "Retour", "Назад", "Wróć"]),
    ("lang_loading", ["正在讀取翻譯清單…", "正在读取翻译列表…", "Loading the list of translations…", "翻訳の一覧を読み込んでいます…", "Liste der Übersetzungen wird geladen…", "Chargement de la liste des traductions…", "Загрузка списка переводов…", "Wczytywanie listy tłumaczeń…"]),
    ("lang_offline", ["讀不到翻譯清單，請確認網路。現在可以先選英文或韓文原版。", "读不到翻译列表，请确认网络。现在可以先选英文或韩文原版。", "Couldn't load the list of translations. Check your connection; for now you can pick the original English or Korean.", "翻訳の一覧を読み込めませんでした。インターネット接続を確認してください。今は英語または韓国語のオリジナルを選べます。", "Die Liste der Übersetzungen konnte nicht geladen werden. Prüfen Sie Ihre Internetverbindung. Vorerst können Sie das englische oder koreanische Original wählen.", "Impossible de charger la liste des traductions. Vérifiez votre connexion ; en attendant, vous pouvez choisir l’original anglais ou coréen.", "Не удалось загрузить список переводов. Проверьте подключение к интернету. Пока можно выбрать оригинал на английском или корейском.", "Nie udało się wczytać listy tłumaczeń. Sprawdź połączenie z internetem. Na razie można wybrać oryginał po angielsku lub po koreańsku."]),
    ("game_title", ["D2 Survivors", "D2 Survivors", "D2 Survivors", "D2 Survivors", "D2 Survivors", "D2 Survivors", "D2 Survivors", "D2 Survivors"]),
    ("game_found", ["已找到 D2 Survivors", "已找到 D2 Survivors", "D2 Survivors found", "D2 Survivors が見つかりました", "D2 Survivors gefunden", "D2 Survivors trouvé", "Найдена игра D2 Survivors", "Znaleziono D2 Survivors"]),
    ("game_version", ["版本 {}", "版本 {}", "version {}", "バージョン {}", "Version {}", "version {}", "версия {}", "wersja {}"]),
    ("game_missing", ["還沒有找到 D2 Survivors", "尚未找到 D2 Survivors", "D2 Survivors wasn't found", "D2 Survivors が見つかりません", "D2 Survivors nicht gefunden", "D2 Survivors introuvable", "Игра D2 Survivors не найдена", "Nie znaleziono D2 Survivors"]),
    ("game_missing_desc", ["請先到 D2 Survivors 的官方網站下載安裝，裝好後回來按「重新偵測」。如果裝在別的地方，可以手動選擇資料夾。", "请先到 D2 Survivors 的官方网站下载安装，装好后回来点「重新检测」。如果装在别的地方，可以手动选择文件夹。", "Download and install D2 Survivors from its official website, then come back and click “Detect again”. If it's installed somewhere else, choose its folder.", "D2 Survivors の公式サイトからダウンロードしてインストールし、終わったらここに戻って「再検出」を押してください。別の場所にインストールしている場合は、フォルダーを選んでください。", "Laden Sie D2 Survivors von der offiziellen Website herunter, installieren Sie es und klicken Sie dann hier auf „Erneut suchen“. Wenn es an einem anderen Ort installiert ist, wählen Sie seinen Ordner aus.", "Téléchargez et installez D2 Survivors depuis son site officiel, puis revenez ici et cliquez sur « Détecter à nouveau ». S’il est installé ailleurs, choisissez son dossier.", "Скачайте и установите D2 Survivors с официального сайта, затем вернитесь сюда и нажмите «Повторить поиск». Если игра установлена в другом месте, выберите ее папку.", "Pobierz i zainstaluj D2 Survivors z oficjalnej strony, a potem wróć tutaj i kliknij „Wykryj ponownie”. Jeśli gra jest zainstalowana w innym miejscu, wskaż jej folder."]),
    ("open_game_site", ["前往 D2 Survivors 官方網站", "前往 D2 Survivors 官方网站", "Open the D2 Survivors website", "D2 Survivors 公式サイトを開く", "Website von D2 Survivors öffnen", "Ouvrir le site de D2 Survivors", "Открыть сайт D2 Survivors", "Otwórz stronę D2 Survivors"]),
    ("redetect", ["重新偵測", "重新检测", "Detect again", "再検出", "Erneut suchen", "Détecter à nouveau", "Повторить поиск", "Wykryj ponownie"]),
    ("choose_folder", ["選擇資料夾…", "选择文件夹…", "Choose folder…", "フォルダーを選択…", "Ordner wählen…", "Choisir un dossier…", "Выбрать папку…", "Wybierz folder…"]),
    ("d2_title", ["Diablo II 的遊戲檔案", "Diablo II 的游戏文件", "Diablo II game files", "『ディアブロ II』のゲームファイル", "Spieldateien von Diablo II", "Fichiers de jeu de Diablo II", "Файлы игры Diablo II", "Pliki gry Diablo II"]),
    ("d2_desc", ["D2 Survivors 要用你自己的《暗黑破壞神 II：獄火重生》（或經典版 Diablo II）的遊戲檔案才能玩。", "D2 Survivors 需要使用你自己的《暗黑破坏神 II：狱火重生》（或经典版 Diablo II）的游戏文件才能玩。", "D2 Survivors runs on the game files from your own copy of Diablo II: Resurrected (or classic Diablo II).", "D2 Survivors をプレイするには、ご自分の『ディアブロ II リザレクテッド』（またはクラシック版『ディアブロ II』）のゲームファイルが必要です。", "D2 Survivors läuft mit den Spieldateien Ihres eigenen Exemplars von Diablo II: Resurrected (oder des klassischen Diablo II).", "D2 Survivors fonctionne avec les fichiers de jeu de votre propre exemplaire de Diablo II: Resurrected (ou de Diablo II classique).", "D2 Survivors работает на файлах вашей собственной копии Diablo II: Resurrected (или классической Diablo II).", "D2 Survivors działa na plikach gry z twojej własnej kopii Diablo II: Resurrected (lub klasycznego Diablo II)."]),
    ("d2_found_d2r", ["已找到 Diablo II: Resurrected", "已找到 Diablo II: Resurrected", "Diablo II: Resurrected found", "『ディアブロ II リザレクテッド』が見つかりました", "Diablo II: Resurrected gefunden", "Diablo II: Resurrected trouvé", "Найдена игра Diablo II: Resurrected", "Znaleziono Diablo II: Resurrected"]),
    ("d2_found_classic", ["已找到 Diablo II（經典版）", "已找到 Diablo II（经典版）", "Classic Diablo II found", "クラシック版『ディアブロ II』が見つかりました", "Klassisches Diablo II gefunden", "Diablo II classique trouvé", "Найдена классическая Diablo II", "Znaleziono klasyczne Diablo II"]),
    ("d2_missing", ["沒有找到 Diablo II", "没有找到 Diablo II", "Diablo II wasn't found", "『ディアブロ II』が見つかりません", "Diablo II nicht gefunden", "Diablo II introuvable", "Игра Diablo II не найдена", "Nie znaleziono Diablo II"]),
    ("d2_missing_desc", ["還沒有的話，需要購買 Diablo II: Resurrected。已經有的話，可以手動選擇資料夾，或直接略過（也可以之後在 D2 Survivors 裡設定）。", "还没有的话，需要购买 Diablo II: Resurrected。已经有的话，可以手动选择文件夹，或直接跳过（也可以之后在 D2 Survivors 里设置）。", "If you don't own it yet, you'll need to buy Diablo II: Resurrected. If you do, choose its folder or skip this step (you can also set it up later inside D2 Survivors).", "まだお持ちでない場合は、『ディアブロ II リザレクテッド』の購入が必要です。お持ちの場合は、フォルダーを選ぶか、この手順をスキップしてください（D2 Survivors 内で後から設定することもできます）。", "Wenn Sie es noch nicht besitzen, müssen Sie Diablo II: Resurrected kaufen. Andernfalls wählen Sie seinen Ordner aus oder überspringen Sie diesen Schritt (Sie können es auch später in D2 Survivors einrichten).", "Si vous ne le possédez pas encore, vous devrez acheter Diablo II: Resurrected. Sinon, choisissez son dossier ou passez cette étape (vous pourrez aussi le configurer plus tard dans D2 Survivors).", "Если у вас еще нет игры, нужно купить Diablo II: Resurrected. Если есть, выберите ее папку или пропустите этот шаг (это можно настроить и позже в D2 Survivors).", "Jeśli jeszcze go nie masz, trzeba kupić Diablo II: Resurrected. Jeśli masz, wskaż jego folder lub pomiń ten krok (można to też ustawić później w D2 Survivors)."]),
    ("open_blizzard", ["前往 Blizzard 的 Diablo II: Resurrected 頁面", "前往 Blizzard 的 Diablo II: Resurrected 页面", "Diablo II: Resurrected on Blizzard's website", "Blizzard 公式サイトの『ディアブロ II リザレクテッド』", "Diablo II: Resurrected auf der Website von Blizzard", "Diablo II: Resurrected sur le site de Blizzard", "Diablo II: Resurrected на сайте Blizzard", "Diablo II: Resurrected na stronie Blizzard"]),
    ("done_title", ["準備好了", "准备好了", "All set", "準備完了", "Alles bereit", "Tout est prêt", "Все готово", "Wszystko gotowe"]),
    ("done_desc", ["按「啟動遊戲」會下載最新的翻譯並開啟遊戲。", "点「启动游戏」会下载最新的翻译并启动游戏。", "Click Play to download the latest translation and start the game.", "「プレイ」を押すと、最新の翻訳をダウンロードしてゲームを起動します。", "Klicken Sie auf „Spielen“, um die neueste Übersetzung herunterzuladen und das Spiel zu starten.", "Cliquez sur « Jouer » pour télécharger la dernière traduction et lancer le jeu.", "Нажмите «Играть», чтобы скачать последний перевод и запустить игру.", "Kliknij „Graj”, aby pobrać najnowsze tłumaczenie i uruchomić grę."]),
    ("donate", ["☕ 請我喝杯咖啡", "☕ 请我喝杯咖啡", "☕ Buy me a coffee", "☕ コーヒーをおごる", "☕ Einen Kaffee spendieren", "☕ Offrez-moi un café", "☕ Угостите меня кофе", "☕ Postaw mi kawę"]),
    ("create_shortcut", ["在桌面建立捷徑", "在桌面创建快捷方式", "Create a desktop shortcut", "デスクトップにショートカットを作成", "Desktopverknüpfung erstellen", "Créer un raccourci sur le bureau", "Создать ярлык на рабочем столе", "Utwórz skrót na pulpicie"]),
    ("shortcut_done", ["已在桌面建立捷徑", "已在桌面创建快捷方式", "Desktop shortcut created", "デスクトップにショートカットを作成しました", "Desktopverknüpfung erstellt", "Raccourci créé sur le bureau", "Ярлык на рабочем столе создан", "Utworzono skrót na pulpicie"]),
    ("finish", ["完成", "完成", "Finish", "完了", "Fertig", "Terminer", "Завершить", "Zakończ"]),
    ("play", ["啟動遊戲", "启动游戏", "Play", "プレイ", "Spielen", "Jouer", "Играть", "Graj"]),
    ("game_language", ["遊戲語言", "游戏语言", "Game language", "ゲームの言語", "Spielsprache", "Langue du jeu", "Язык игры", "Język gry"]),
    ("beta", ["測試中", "测试中", "beta", "ベータ", "Beta", "bêta", "бета", "beta"]),
    ("draft", ["草稿", "草稿", "draft", "下書き", "Entwurf", "brouillon", "черновик", "szkic"]),
    ("status_translation", ["翻譯", "翻译", "Translation", "翻訳", "Übersetzung", "Traduction", "Перевод", "Tłumaczenie"]),
    ("status_game", ["遊戲", "游戏", "Game", "ゲーム", "Spiel", "Jeu", "Игра", "Gra"]),
    ("status_launcher", ["啟動器", "启动器", "Launcher", "ランチャー", "Launcher", "Lanceur", "Лаунчер", "Launcher"]),
    ("update_failed", ["無法檢查更新，先用本機的翻譯", "无法检查更新，先用本地的翻译", "Couldn't check for updates; using the local copy", "更新を確認できませんでした。ローカルの翻訳を使います", "Updates konnten nicht geprüft werden; die lokale Kopie wird verwendet", "Impossible de vérifier les mises à jour ; utilisation de la copie locale", "Не удалось проверить обновления; используется локальная копия", "Nie udało się sprawdzić aktualizacji; używana jest kopia lokalna"]),
    ("launcher_new", ["有新版 {}", "有新版 {}", "{} available", "新しいバージョン {} があります", "{} verfügbar", "{} disponible", "Доступна версия {}", "Dostępna wersja {}"]),
    ("launcher_required", ["新的翻譯需要啟動器 {}，請先更新", "新的翻译需要启动器 {}，请先更新", "The latest translation needs launcher {}. Please update.", "最新の翻訳にはランチャー {} が必要です。更新してください。", "Die neueste Übersetzung benötigt Launcher {}. Bitte aktualisieren Sie ihn.", "La dernière traduction nécessite le lanceur {}. Veuillez le mettre à jour.", "Для последнего перевода нужен лаунчер {}. Обновите его.", "Najnowsze tłumaczenie wymaga launchera {}. Zaktualizuj go."]),
    ("update_launcher", ["更新啟動器", "更新启动器", "Update launcher", "ランチャーを更新", "Launcher aktualisieren", "Mettre à jour le lanceur", "Обновить лаунчер", "Zaktualizuj launcher"]),
    ("check_updates", ["檢查更新", "检查更新", "Check for updates", "更新を確認", "Nach Updates suchen", "Rechercher des mises à jour", "Проверить обновления", "Sprawdź aktualizacje"]),
    ("settings", ["設定", "设置", "Settings", "設定", "Einstellungen", "Paramètres", "Настройки", "Ustawienia"]),
    ("game_missing_banner", ["找不到 D2 Survivors，請到「設定」指定遊戲資料夾", "找不到 D2 Survivors，请到「设置」指定游戏文件夹", "D2 Survivors wasn't found. Set its folder in Settings.", "D2 Survivors が見つかりません。「設定」でフォルダーを指定してください。", "D2 Survivors nicht gefunden. Legen Sie den Ordner in den Einstellungen fest.", "D2 Survivors introuvable. Indiquez son dossier dans les Paramètres.", "Игра D2 Survivors не найдена. Укажите ее папку в настройках.", "Nie znaleziono D2 Survivors. Wskaż folder gry w Ustawieniach."]),
    ("changelog", ["更新紀錄", "更新记录", "What's new", "更新履歴", "Neuigkeiten", "Nouveautés", "Что нового", "Co nowego"]),
    ("got_it", ["知道了", "知道了", "Got it", "OK", "Verstanden", "Compris", "Понятно", "Rozumiem"]),
    ("fallback_game_updated", ["遊戲剛更新，翻譯修正中，先用原版開啟。翻譯修好後，下次從啟動器開就會自動套用。", "游戏刚更新，翻译修正中，先用原版启动。翻译修好后，下次从启动器启动就会自动应用。", "The game was just updated and the translation is being fixed, so it started as the original. The translation will be applied automatically once it's fixed.", "ゲームが更新されたばかりで翻訳を修正中のため、オリジナルで起動しました。修正が終わると、翻訳は自動的に適用されます。", "Das Spiel wurde gerade aktualisiert und die Übersetzung wird angepasst, daher wurde das Original gestartet. Sobald sie angepasst ist, wird die Übersetzung automatisch angewendet.", "Le jeu vient d’être mis à jour et la traduction est en cours de correction : il a donc été lancé en version originale. La traduction sera appliquée automatiquement une fois corrigée.", "Игра только что обновилась, а перевод еще исправляется, поэтому запущен оригинал. Перевод применится автоматически, как только его исправят.", "Gra została właśnie zaktualizowana, a tłumaczenie jest poprawiane, więc uruchomiono oryginał. Tłumaczenie zostanie zastosowane automatycznie, gdy tylko będzie gotowe."]),
    ("fallback_no_translation", ["翻譯還沒下載（請確認網路），先用原版開啟。", "翻译还没下载（请确认网络），先用原版启动。", "The translation hasn't been downloaded yet (check your connection), so the game started as the original.", "翻訳がまだダウンロードされていないため（インターネット接続を確認してください）、オリジナルで起動しました。", "Die Übersetzung wurde noch nicht heruntergeladen (prüfen Sie Ihre Internetverbindung), daher wurde das Original gestartet.", "La traduction n’a pas encore été téléchargée (vérifiez votre connexion) : le jeu a donc été lancé en version originale.", "Перевод еще не загружен (проверьте подключение к интернету), поэтому запущен оригинал.", "Tłumaczenie nie zostało jeszcze pobrane (sprawdź połączenie z internetem), więc uruchomiono oryginał."]),
    ("original_note", ["原版：不修改遊戲，排行榜紀錄不會被標成 patched。", "原版：不修改游戏，排行榜记录不会被标成 patched。", "Original: the game is left untouched, so leaderboard runs aren't marked as patched.", "オリジナル：ゲームには手を加えないため、ランキングの記録に patched の印は付きません。", "Original: Das Spiel bleibt unverändert, daher werden Durchgänge in der Bestenliste nicht als „patched“ markiert.", "Original : le jeu n’est pas modifié, donc les parties du classement ne sont pas marquées « patched ».", "Оригинал: игра не изменяется, поэтому забеги в таблице лидеров не помечаются как patched.", "Oryginał: gra pozostaje niezmieniona, więc podejścia w rankingu nie są oznaczane jako „patched”."]),
    ("original_lang_hint", ["原版照遊戲自己存的語言開啟。語言不對的話，到遊戲的 OPTIONS → GAME → LANGUAGE 切換（韓文畫面是 설정 → GAME → 언어）。", "原版按游戏自己保存的语言启动。语言不对的话，到游戏的 OPTIONS → GAME → LANGUAGE 切换（韩文界面是 설정 → GAME → 언어）。", "The original starts in the language the game has saved. If it's wrong, change it in the game under OPTIONS → GAME → LANGUAGE (on the Korean screen: 설정 → GAME → 언어).", "オリジナルは、ゲームに保存されている言語で起動します。言語が違う場合は、ゲーム内の OPTIONS → GAME → LANGUAGE で変更してください（韓国語画面では 설정 → GAME → 언어）。", "Das Original startet in der Sprache, die im Spiel gespeichert ist. Ist sie falsch, ändern Sie sie im Spiel unter OPTIONS → GAME → LANGUAGE (auf dem koreanischen Bildschirm: 설정 → GAME → 언어).", "L’original démarre dans la langue enregistrée par le jeu. Si ce n’est pas la bonne, changez-la dans le jeu via OPTIONS → GAME → LANGUAGE (sur l’écran coréen : 설정 → GAME → 언어).", "Оригинал запускается на языке, сохраненном в игре. Если язык не тот, смените его в игре: OPTIONS → GAME → LANGUAGE (на корейском экране: 설정 → GAME → 언어).", "Oryginał uruchamia się w języku zapisanym w grze. Jeśli jest niewłaściwy, zmień go w grze w OPTIONS → GAME → LANGUAGE (na ekranie koreańskim: 설정 → GAME → 언어)."]),
    ("patched_note", ["翻譯版會修改遊戲檔案，排行榜紀錄會被標成 patched。", "翻译版会修改游戏文件，排行榜记录会被标成 patched。", "Translations modify the game's files, so leaderboard runs are marked as patched.", "翻訳版はゲームファイルを変更するため、ランキングの記録に patched の印が付きます。", "Übersetzungen verändern die Spieldateien, daher werden Durchgänge in der Bestenliste als „patched“ markiert.", "Les traductions modifient les fichiers du jeu, donc les parties du classement sont marquées « patched ».", "Переводы изменяют файлы игры, поэтому забеги в таблице лидеров помечаются как patched.", "Tłumaczenia modyfikują pliki gry, więc podejścia w rankingu są oznaczane jako „patched”."]),
    ("working", ["處理中…", "处理中…", "Working…", "処理中…", "Wird ausgeführt…", "En cours…", "Выполняется…", "Przetwarzanie…"]),
    ("error", ["發生錯誤：{}", "发生错误：{}", "Something went wrong: {}", "エラーが発生しました：{}", "Es ist ein Fehler aufgetreten: {}", "Une erreur s’est produite : {}", "Произошла ошибка: {}", "Wystąpił błąd: {}"]),
    ("auto_update", ["啟動時自動更新翻譯", "启动时自动更新翻译", "Update translations on start", "起動時に翻訳を自動更新", "Übersetzungen beim Start aktualisieren", "Mettre à jour les traductions au démarrage", "Обновлять переводы при запуске", "Aktualizuj tłumaczenia przy uruchomieniu"]),
    ("close_after", ["遊戲啟動後關閉啟動器", "游戏启动后关闭启动器", "Close the launcher after the game starts", "ゲーム起動後にランチャーを閉じる", "Launcher nach dem Spielstart schließen", "Fermer le lanceur après le lancement du jeu", "Закрывать лаунчер после запуска игры", "Zamykaj launcher po uruchomieniu gry"]),
    ("game_folder", ["D2 Survivors 資料夾", "D2 Survivors 文件夹", "D2 Survivors folder", "D2 Survivors のフォルダー", "D2-Survivors-Ordner", "Dossier de D2 Survivors", "Папка D2 Survivors", "Folder D2 Survivors"]),
    ("d2_folder", ["Diablo II 資料夾", "Diablo II 文件夹", "Diablo II folder", "『ディアブロ II』のフォルダー", "Diablo-II-Ordner", "Dossier de Diablo II", "Папка Diablo II", "Folder Diablo II"]),
    ("detect", ["偵測", "检测", "Detect", "検出", "Suchen", "Détecter", "Найти", "Wykryj"]),
    ("not_found", ["（沒有找到）", "（没有找到）", "(not found)", "（見つかりません）", "(nicht gefunden)", "(introuvable)", "(не найдено)", "(nie znaleziono)"]),
    ("update_source", ["更新來源", "更新来源", "Update source", "更新元", "Update-Quelle", "Source des mises à jour", "Источник обновлений", "Źródło aktualizacji"]),
    ("restore", ["還原原版遊戲", "还原原版游戏", "Restore the original game", "オリジナルのゲームに戻す", "Originalspiel wiederherstellen", "Restaurer le jeu original", "Восстановить оригинальную игру", "Przywróć oryginalną grę"]),
    ("restore_hint", ["把遊戲檔案換回沒有翻譯的原版", "把游戏文件换回没有翻译的原版", "Put the game's files back to the untranslated original", "ゲームファイルを翻訳なしのオリジナルに戻します", "Setzt die Spieldateien auf das unübersetzte Original zurück", "Remet les fichiers du jeu dans leur version originale non traduite", "Возвращает файлы игры к оригиналу без перевода", "Przywraca pliki gry do oryginalnej wersji bez tłumaczenia"]),
    ("rerun_wizard", ["重新執行設定精靈", "重新运行设置向导", "Run the setup wizard again", "セットアップウィザードを再実行", "Einrichtungsassistenten erneut ausführen", "Relancer l’assistant de configuration", "Запустить мастер настройки заново", "Uruchom ponownie kreator konfiguracji"]),
    ("cli", ["命令列", "命令行", "Command line", "コマンドライン", "Befehlszeile", "Ligne de commande", "Командная строка", "Wiersz poleceń"]),
    ("log", ["詳細紀錄", "详细记录", "Log", "ログ", "Protokoll", "Journal", "Журнал", "Dziennik"]),
    ("links", ["連結", "链接", "Links", "リンク", "Links", "Liens", "Ссылки", "Linki"]),
];

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

/// TABLE 每一行的欄位順序
const COLUMNS: [&str; 8] = ["zh-TW", "zh-CN", "en", "ja", "de", "fr", "ru", "pl"];

/// 介面語言對應到哪一欄；韓文和其他沒有的語言用英文
fn column(lang: &str) -> usize {
    COLUMNS.iter().position(|c| *c == lang).unwrap_or(2)
}

pub fn tr(lang: &str, key: &str) -> &'static str {
    match TABLE.iter().find(|r| r.0 == key) {
        Some(r) => r.1[column(lang)],
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
            let n = r.1[0].matches("{}").count();
            for (c, v) in COLUMNS.iter().zip(r.1) {
                assert!(v.matches("{}").count() == n, "{} 的 {c} 跟繁中的 {{}} 數量不一樣", r.0);
                assert!(!v.is_empty(), "{} 的 {c} 是空的", r.0);
            }
        }
        assert_eq!(tr("ja", "play"), "プレイ");
        assert_eq!(tr("ko", "play"), "Play");
        assert_eq!(trf("zh-TW", "launcher_new", &["0.3.0"]), "有新版 0.3.0");
        let label = |id, name, status| with_note(id, name, native_status(id, status));
        assert_eq!(label("zh-CN", "简体中文", Some("beta")), "简体中文（测试中）");
        assert_eq!(label("ru", "Русский", Some("beta")), "Русский (бета)");
        assert_eq!(label("pl", "Polski", Some("whatever")), "Polski (wersja robocza)");
        assert_eq!(label("zh-TW", "繁體中文", None), "繁體中文");
    }
}
