// 啟動器的介面文字：繁中、簡中、英文、日、德、法、俄、波蘭文（韓文和其他語言用英文）。
// 日、德、法、俄、波蘭文由翻譯聊天室翻（dict/launcher-i18n.json），用 launcher/merge-i18n.mjs 併進來；
// 新增或修改 key 時要通知翻譯聊天室補翻（來源清單 dict/launcher-i18n-src.json）
// tr(語言, key)；文字裡的 {} 用 trf 依序代換

/// (key, [繁中, 簡中, 英文, 日, 德, 法, 俄, 波蘭])
const TABLE: &[(&str, [&str; 8])] = &[
    ("step_game", ["遊戲", "游戏", "Game", "ゲーム", "Spiel", "Jeu", "Игра", "Gra"]),
    ("step_d2", ["Diablo II", "Diablo II", "Diablo II", "ディアブロ II", "Diablo II", "Diablo II", "Diablo II", "Diablo II"]),
    ("step_done", ["完成", "完成", "Done", "完了", "Fertig", "Terminé", "Готово", "Gotowe"]),
    ("new_badge", ["新", "新", "New", "新着", "Neu", "Nouveau", "Новинка", "Nowość"]),
    ("site_short", ["網站", "网站", "Website", "ウェブサイト", "Website", "Site web", "Сайт", "Strona"]),
    ("licenses", ["授權", "许可", "Licenses", "ライセンス", "Lizenzen", "Licences", "Лицензии", "Licencje"]),
    ("next", ["下一步", "下一步", "Next", "次へ", "Weiter", "Suivant", "Далее", "Dalej"]),
    ("back", ["上一步", "上一步", "Back", "戻る", "Zurück", "Précédent", "Назад", "Wstecz"]),
    ("skip", ["略過", "跳过", "Skip", "スキップ", "Überspringen", "Passer", "Пропустить", "Pomiń"]),
    ("return", ["返回", "返回", "Back", "戻る", "Zurück", "Retour", "Назад", "Wróć"]),
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
    ("game_not_installed", ["尚未安裝 D2 Survivors", "尚未安装 D2 Survivors", "D2 Survivors isn't installed", "D2 Survivors がインストールされていません", "D2 Survivors ist nicht installiert", "D2 Survivors n'est pas installé", "D2 Survivors не установлена", "D2 Survivors nie jest zainstalowane"]),
    ("game_not_installed_desc", ["D2 Survivors 是免費遊戲。請先到官方網站下載安裝，裝好後按「重新偵測」；裝在別的地方的話，可以手動選擇資料夾。", "D2 Survivors 是免费游戏。请先到官方网站下载安装，装好后点「重新检测」；装在别的地方的话，可以手动选择文件夹。", "D2 Survivors is free. Download and install it from its official website, then click “Detect again”. If it's installed somewhere else, choose its folder.", "D2 Survivors は無料のゲームです。公式サイトからダウンロードしてインストールし、終わったら「再検出」を押してください。別の場所にインストールしている場合は、フォルダーを選んでください。", "D2 Survivors ist kostenlos. Lade es von der offiziellen Website herunter, installiere es und klicke dann auf „Erneut suchen“. Ist es an einem anderen Ort installiert, wähle seinen Ordner aus.", "D2 Survivors est gratuit. Téléchargez-le et installez-le depuis son site officiel, puis cliquez sur « Détecter à nouveau ». S'il est installé ailleurs, choisissez son dossier.", "D2 Survivors — бесплатная игра. Скачайте и установите ее с официального сайта, затем нажмите «Повторить поиск». Если игра установлена в другом месте, выберите ее папку.", "D2 Survivors jest darmowe. Pobierz je i zainstaluj z oficjalnej strony, a potem kliknij „Wykryj ponownie”. Jeśli gra jest zainstalowana w innym miejscu, wskaż jej folder."]),
    ("download_game", ["下載 D2 Survivors", "下载 D2 Survivors", "Download D2 Survivors", "D2 Survivors をダウンロード", "D2 Survivors herunterladen", "Télécharger D2 Survivors", "Скачать D2 Survivors", "Pobierz D2 Survivors"]),
    ("d2_missing_hint", ["沒有找到 Diablo II 的遊戲檔案。D2 Survivors 要用你自己的 Diablo II 或 Diablo II: Resurrected；裝在別的地方的話，可以照常啟動，在遊戲裡設定。", "没有找到 Diablo II 的游戏文件。D2 Survivors 需要使用你自己的 Diablo II 或 Diablo II: Resurrected；装在别的地方的话，可以照常启动，在游戏里设置。", "Diablo II's game files weren't found. D2 Survivors runs on your own Diablo II or Diablo II: Resurrected; if yours is somewhere else, you can still play and set it up in the game.", "『ディアブロ II』のゲームファイルが見つかりません。D2 Survivors はご自分の『ディアブロ II』または『ディアブロ II リザレクテッド』で動きます。別の場所にある場合も、そのままプレイしてゲーム内で設定できます。", "Die Spieldateien von Diablo II wurden nicht gefunden. D2 Survivors läuft mit deinem eigenen Diablo II oder Diablo II: Resurrected; liegt es an einem anderen Ort, kannst du trotzdem spielen und es im Spiel einrichten.", "Les fichiers de jeu de Diablo II sont introuvables. D2 Survivors fonctionne avec votre propre Diablo II ou Diablo II: Resurrected ; s'il se trouve ailleurs, vous pouvez quand même jouer et le configurer dans le jeu.", "Файлы игры Diablo II не найдены. D2 Survivors работает на вашей собственной копии Diablo II или Diablo II: Resurrected; если она установлена в другом месте, можно все равно играть и указать ее в игре.", "Nie znaleziono plików gry Diablo II. D2 Survivors działa na twoim własnym Diablo II lub Diablo II: Resurrected; jeśli jest w innym miejscu, możesz mimo to grać i ustawić to w grze."]),
    ("d2r_page", ["Diablo II: Resurrected 官方頁面", "Diablo II: Resurrected 官方页面", "Diablo II: Resurrected official page", "『ディアブロ II リザレクテッド』公式ページ", "Offizielle Seite von Diablo II: Resurrected", "Page officielle de Diablo II: Resurrected", "Официальная страница Diablo II: Resurrected", "Oficjalna strona Diablo II: Resurrected"]),
    ("about", ["關於", "关于", "About", "情報", "Über", "À propos", "О программе", "O programie"]),
    ("about_title", ["關於 D2 Survivors", "关于 D2 Survivors", "About D2 Survivors", "D2 Survivors について", "Über D2 Survivors", "À propos de D2 Survivors", "О D2 Survivors", "O D2 Survivors"]),
    ("about_desc", ["D2 Survivors 是 framara 製作的免費粉絲遊戲：以《暗黑破壞神 II》為題材的 survivors-like 動作遊戲，有桌面版和瀏覽器版。", "D2 Survivors 是 framara 制作的免费粉丝游戏：以《暗黑破坏神 II》为题材的 survivors-like 动作游戏，有桌面版和浏览器版。", "D2 Survivors is a free fan-made game by framara: a survivors-like action game set in the world of Diablo II, on desktop and in the browser.", "D2 Survivors は framara が制作した無料のファンゲームです。『ディアブロ II』の世界を舞台にしたサバイバーズ系アクションゲームで、デスクトップ版とブラウザー版があります。", "D2 Survivors ist ein kostenloses Fanspiel von framara: ein Survivors-ähnliches Actionspiel in der Welt von Diablo II, für den Desktop und im Browser.", "D2 Survivors est un jeu de fan gratuit créé par framara : un jeu d'action de type survivors dans l'univers de Diablo II, sur ordinateur et dans le navigateur.", "D2 Survivors — бесплатная фанатская игра от framara: экшен в духе survivors в мире Diablo II, для компьютера и в браузере.", "D2 Survivors to darmowa gra fanowska autorstwa framary: gra akcji w stylu survivors osadzona w świecie Diablo II, na komputer i w przeglądarce."]),
    ("about_needs", ["遊戲需要你自己的 Diablo II 或 Diablo II: Resurrected 的遊戲檔案。", "游戏需要使用你自己的 Diablo II 或 Diablo II: Resurrected 的游戏文件。", "The game needs the game files from your own Diablo II or Diablo II: Resurrected.", "ゲームにはご自分の『ディアブロ II』または『ディアブロ II リザレクテッド』のゲームファイルが必要です。", "Das Spiel benötigt die Spieldateien deines eigenen Diablo II oder Diablo II: Resurrected.", "Le jeu a besoin des fichiers de votre propre Diablo II ou Diablo II: Resurrected.", "Для игры нужны файлы вашей собственной копии Diablo II или Diablo II: Resurrected.", "Gra potrzebuje plików z twojego własnego Diablo II lub Diablo II: Resurrected."]),
    ("about_unofficial", ["這個啟動器是非官方的翻譯工具，跟 D2 Survivors 的作者和 Blizzard Entertainment 都沒有關係。", "这个启动器是非官方的翻译工具，与 D2 Survivors 的作者和 Blizzard Entertainment 均无关。", "This launcher is an unofficial translation tool, not affiliated with the author of D2 Survivors or with Blizzard Entertainment.", "このランチャーは非公式の翻訳ツールで、D2 Survivors の作者とも Blizzard Entertainment とも関係ありません。", "Dieser Launcher ist ein inoffizielles Übersetzungswerkzeug und steht in keiner Verbindung zum Autor von D2 Survivors oder zu Blizzard Entertainment.", "Ce lanceur est un outil de traduction non officiel, sans lien avec l'auteur de D2 Survivors ni avec Blizzard Entertainment.", "Этот лаунчер — неофициальный инструмент перевода, не связанный ни с автором D2 Survivors, ни с Blizzard Entertainment.", "Ten launcher to nieoficjalne narzędzie do tłumaczenia, niezwiązane z autorem D2 Survivors ani z Blizzard Entertainment."]),
    ("about_installed", ["已安裝的版本：{}", "已安装的版本：{}", "Installed version: {}", "インストール済みのバージョン：{}", "Installierte Version: {}", "Version installée : {}", "Установленная версия: {}", "Zainstalowana wersja: {}"]),
    ("about_game_links", ["遊戲", "游戏", "The game", "ゲーム", "Das Spiel", "Le jeu", "Игра", "Gra"]),
    ("about_launcher_links", ["翻譯", "翻译", "The translation", "翻訳", "Die Übersetzung", "La traduction", "Перевод", "Tłumaczenie"]),
    ("link_game_site", ["D2 Survivors 官方網站", "D2 Survivors 官方网站", "D2 Survivors official website", "D2 Survivors 公式サイト", "Offizielle Website von D2 Survivors", "Site officiel de D2 Survivors", "Официальный сайт D2 Survivors", "Oficjalna strona D2 Survivors"]),
    ("link_game_play", ["在瀏覽器玩（網頁版）", "在浏览器里玩（网页版）", "Play in the browser", "ブラウザーでプレイ（ブラウザー版）", "Im Browser spielen", "Jouer dans le navigateur", "Играть в браузере", "Graj w przeglądarce"]),
    ("link_game_discord", ["遊戲官方 Discord（英文）", "游戏官方 Discord（英文）", "Official game Discord (English)", "ゲーム公式 Discord（英語）", "Offizieller Discord des Spiels (Englisch)", "Discord officiel du jeu (en anglais)", "Официальный Discord игры (на английском)", "Oficjalny Discord gry (po angielsku)"]),
    ("link_translation_site", ["翻譯網站", "翻译网站", "Translation website", "翻訳サイト", "Website der Übersetzung", "Site de la traduction", "Сайт перевода", "Strona tłumaczenia"]),
    ("link_translation_discord", ["翻譯社群 Discord", "翻译社区 Discord", "Translation community Discord", "翻訳コミュニティの Discord", "Discord der Übersetzungs-Community", "Discord de la communauté de traduction", "Discord сообщества переводчиков", "Discord społeczności tłumaczy"]),
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
