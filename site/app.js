// D2 Survivors Localization 網站：介面文字（繁中／簡中／英文）、語言進度、下載按鈕
// 要改的設定都在 SITE；語言清單在 LANGUAGES。

const SITE = {
  // 啟動器的下載網址（例如 GitHub Releases 的 d2s-launcher.exe）。留空時按鈕顯示「尚未發布」
  downloadUrl: '',
  launcherVersion: '0.1.0',
  gameVersion: '2026.1026.4',
  // 遊戲字典的總條數（versions/2026.1026.4/ko.json），用來算覆蓋率
  totalKeys: 12615,
  // 跟網站放在一起的啟動器更新來源（node tools/make-manifest.mjs site）。讀不到就用 LANGUAGES 裡的數字
  manifestUrl: 'manifest.json',
  // 回報問題的網址（GitHub Issues、Discord…），留空就不顯示
  feedbackUrl: '',
};

// 官方連結（D2 Survivors 官網上的 Battle.net 商店連結也是這個）
const LINKS = {
  d2sHome: 'https://d2survivors.lol/',
  d2sDownload: 'https://d2survivors.lol/download/',
  d2sPlay: 'https://d2survivors.lol/play/',
  d2sDiscord: 'https://discord.gg/mYMGgZPuQb',
  bnetShop: 'https://us.shop.battle.net/en-us/family/diablo-ii',
  bnetApp: 'https://download.battle.net/',
  steam: 'https://store.steampowered.com/app/2536520/',
};

// status：available（可用）、in-progress（製作中）、planned（計畫中）
// manifest 裡有的語言會自動變成 available，條數和更新時間也以 manifest 為準
// name：用網站目前的介面語言顯示的語言名稱
const LANGUAGES = [
  { id: 'zh-TW', native: '繁體中文', name: { 'zh-TW': '中文（繁體）', 'zh-CN': '中文（繁体）', en: 'Chinese (Traditional)' }, status: 'available', entries: 11391, updated: '2026-10-27' },
  { id: 'zh-CN', native: '简体中文', name: { 'zh-TW': '中文（簡體）', 'zh-CN': '中文（简体）', en: 'Chinese (Simplified)' }, status: 'planned' },
  { id: 'ja', native: '日本語', name: { 'zh-TW': '日文', 'zh-CN': '日语', en: 'Japanese' }, status: 'planned' },
  { id: 'de', native: 'Deutsch', name: { 'zh-TW': '德文', 'zh-CN': '德语', en: 'German' }, status: 'planned' },
  { id: 'fr', native: 'Français', name: { 'zh-TW': '法文', 'zh-CN': '法语', en: 'French' }, status: 'planned' },
  { id: 'es-ES', native: 'Español (España)', name: { 'zh-TW': '西班牙文（西班牙）', 'zh-CN': '西班牙语（西班牙）', en: 'Spanish (Spain)' }, status: 'planned' },
  { id: 'es-419', native: 'Español (Latinoamérica)', name: { 'zh-TW': '西班牙文（拉丁美洲）', 'zh-CN': '西班牙语（拉丁美洲）', en: 'Spanish (Latin America)' }, status: 'planned' },
  { id: 'it', native: 'Italiano', name: { 'zh-TW': '義大利文', 'zh-CN': '意大利语', en: 'Italian' }, status: 'planned' },
  { id: 'pl', native: 'Polski', name: { 'zh-TW': '波蘭文', 'zh-CN': '波兰语', en: 'Polish' }, status: 'planned' },
  { id: 'pt-BR', native: 'Português (Brasil)', name: { 'zh-TW': '葡萄牙文（巴西）', 'zh-CN': '葡萄牙语（巴西）', en: 'Portuguese (Brazil)' }, status: 'planned' },
  { id: 'ru', native: 'Русский', name: { 'zh-TW': '俄文', 'zh-CN': '俄语', en: 'Russian' }, status: 'planned' },
];

// 網站介面語言（第一層分頁）
const SITE_LANGS = [
  { id: 'zh-TW', label: '繁體中文', html: 'zh-Hant-TW' },
  { id: 'zh-CN', label: '简体中文', html: 'zh-Hans-CN' },
  { id: 'en', label: 'English', html: 'en' },
];

// 第二層分頁：桌面版（啟動器）／瀏覽器版（書籤）。HTML 標 data-only 的只在那個版本顯示
const PLATFORMS = ['desktop', 'web'];
// 每個版本的安裝區塊
const INSTALL_SECTION = { desktop: 'install', web: 'web' };

// I18N 裡「key@web」這種寫法是那個版本專用的文字，沒有就用共用的 key
const I18N = {
  'zh-TW': {
    'nav.download': '下載',
    'nav.sources': '來源',
    'nav.languages': '語言',
    'nav.install': '安裝',
    'nav.faq': '常見問題',
    'platform.label': '版本',
    'platform.desktop': '桌面版',
    'platform.desktop.sub': 'Windows',
    'platform.web': '瀏覽器版',
    'platform.web.sub': '電腦・手機',
    'switch.toWeb': '用 Mac、Linux、手機，或想直接在瀏覽器玩？',
    'switch.toWeb.btn': '看瀏覽器版',
    'switch.toDesktop': '在 Windows 玩桌面版？',
    'switch.toDesktop.btn': '看桌面版',
    'hero.eyebrow': '非官方玩家翻譯',
    'meta.description': 'D2 Survivors 非官方多語系翻譯：繁體中文已可使用，啟動器一鍵安裝、自動更新、隨時還原。',
    'hero.title': 'D2 Survivors 多語系翻譯',
    'hero.lead': '用你熟悉的語言玩 D2 Survivors。用語以《暗黑破壞神 II：獄火重生》官方譯名為準，啟動器一鍵安裝、自動更新，隨時可以還原原版。',
    'hero.lead@web': '用你熟悉的語言玩 D2 Survivors。在瀏覽器玩網頁版時，按一下書籤就換成繁體中文，用語以《暗黑破壞神 II：獄火重生》官方譯名為準。不用安裝任何東西，電腦和手機都能用。',
    'hero.download': '下載啟動器',
    'hero.unreleased': '啟動器尚未發布',
    'hero.howto': '安裝說明',
    'hero.bookmark': '安裝書籤',
    'hero.play': '打開遊戲頁面',
    'meta.game': '支援遊戲版本',
    'meta.launcher': '啟動器',
    'meta.updated': '翻譯更新',
    'meta.platform': 'Windows',
    'meta.browsers': '瀏覽器',
    'meta.devices': '裝置',
    'meta.devices.value': '電腦・手機',
    'screens.levelup': '升級卡片：技能名稱、說明、進化條件全部中文',
    'screens.hud': '遊戲畫面：區域名稱、生命、法力、金幣',
    'sources.title': '來源與遊戲本體',
    'sources.lead': '這個專案只提供翻譯，不含任何遊戲檔案。開始之前，請先從下面的官方管道取得 D2 Survivors 和《暗黑破壞神 II》。',
    'sources.cards': [
      {
        title: 'D2 Survivors',
        sub: '原作：framara',
        body: '免費的非官方粉絲遊戲，以《暗黑破壞神 II》為舞台的倖存者類遊戲。本翻譯專案與原作者無關，遊戲本身的問題請到官方管道回報。',
        links: [['官方網站', 'd2sHome'], ['下載桌面版（Windows／Mac／Linux）', 'd2sDownload', 'desktop'], ['在瀏覽器玩（網頁版）', 'd2sPlay', 'web'], ['官方 Discord', 'd2sDiscord']],
      },
      {
        title: '《暗黑破壞神 II》',
        sub: 'Blizzard Entertainment',
        body: 'D2 Survivors 會讀取你電腦上的《暗黑破壞神 II》美術與音效，所以需要自己擁有《暗黑破壞神 II：獄火重生》，或《暗黑破壞神 II》＋《毀滅之王》（1.14 版）。',
        links: [['Battle.net 商店（購買）', 'bnetShop'], ['下載 Battle.net 應用程式', 'bnetApp'], ['Steam：暗黑破壞神 II：獄火重生', 'steam']],
      },
    ],
    'sources.note': '譯名參考：技能、物品、怪物、區域等名稱沿用《暗黑破壞神 II：獄火重生》官方繁體中文譯名；其餘文字由本專案翻譯。',
    'languages.title': '支援語言',
    'languages.lead': '目前繁體中文已可使用，其他語言陸續製作中。覆蓋率是已翻譯條數佔遊戲全部文字的比例。',
    'status.available': '可用',
    'status.in-progress': '製作中',
    'status.planned': '計畫中',
    'lang.coverage': '{0} / {1} 條・{2}%',
    'install.title': '安裝',
    'install.lead': '不需要動手改任何遊戲檔案，全部交給啟動器。遊戲要先關掉。',
    'install.steps': [
      ['先裝好 D2 Survivors', '從 <a href="https://d2survivors.lol/download/" target="_blank" rel="noopener">D2 Survivors 官網</a>下載桌面版，照遊戲的設定畫面指定《暗黑破壞神 II》的位置，確認能正常進入遊戲。'],
      ['下載啟動器', '下載 <code>d2s-launcher.exe</code>，放在任何資料夾都可以，不需要安裝。'],
      ['開啟啟動器', '啟動器會在預設位置 <code>%LOCALAPPDATA%\\Programs\\D2 Survivors</code> 找遊戲；找不到時按「設定」指定遊戲資料夾。'],
      ['選語言、啟動遊戲', '在「遊戲語言」選擇語言，按「啟動遊戲」。第一次會下載翻譯，並自動備份原版 <code>app.asar</code>。'],
      ['之後都從啟動器開遊戲', '勾選「啟動時自動更新翻譯」，每次啟動都會抓最新的翻譯。遊戲更新後也會自動重新套上。'],
    ],
    'restore.title': '還原原版',
    'restore.body': '<ul><li>在啟動器按「還原原版」，遊戲的 <code>app.asar</code> 就會換回原本的檔案。</li><li>想暫時玩英文或韓文，在「遊戲語言」選 English 或「한국어（原版）」再啟動即可。</li><li>要完全移除：先還原原版，再刪掉啟動器和 <code>%LOCALAPPDATA%\\D2SurvivorsLauncher</code> 資料夾。</li></ul>',
    'cli.title': '桌面捷徑',
    'cli.lead': '把下面這行設成捷徑的目標，按兩下就直接用指定語言開遊戲，不會出現啟動器視窗。',
    'cli.items': [
      ['--launch', '套用語言並啟動遊戲'],
      ['--lang <id>', '指定語言，例如 zh-TW、en、ko'],
      ['--no-update', '這次不檢查翻譯更新'],
      ['--update', '只更新翻譯'],
      ['--restore', '還原原版'],
      ['--status', '顯示目前的語言、遊戲版本與翻譯狀態'],
    ],
    'web.title': '安裝書籤',
    'web.lead': '在 <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">d2survivors.lol</a> 用瀏覽器玩？加一個書籤就能換成繁體中文，跟啟動器用同一份翻譯，不用安裝任何東西，電腦和手機都能用。',
    'web.pc.title': '電腦（Chrome、Edge、Firefox）',
    'web.pc.hint': '← 拖到書籤列',
    'web.pc.drag': '請把按鈕拖到書籤列，直接點不會安裝。',
    'web.pc.steps': [
      '按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>（Mac：<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>）叫出書籤列。',
      '用滑鼠按住上面的「D2 繁體中文」，拖到書籤列上放開。',
      '打開 <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">遊戲頁面</a>（按「USE MY OWN FILES」或「HOSTED FILES」進到遊戲），點一下書籤列上的「D2 繁體中文」。',
    ],
    'web.mobile.title': '手機（Android Chrome、iPhone Safari）',
    'web.copy': '複製書籤程式碼',
    'web.copied': '已複製',
    'web.copyfail': '沒辦法自動複製，請手動選取下面的程式碼。',
    'web.mobile.steps': [
      '按上面的按鈕複製書籤程式碼。',
      '把這個網頁加入書籤，再編輯那個書籤：名稱改成「D2 繁體中文」，網址整個換成剛剛複製的程式碼。',
      'Android：打開遊戲頁面後，在網址列輸入「D2 繁體中文」，點下面出現的書籤（從書籤清單點不會執行）。',
      'iPhone：打開遊戲頁面後，從 Safari 的書籤清單點「D2 繁體中文」。',
    ],
    'web.usage.title': '使用方式',
    'web.usage.items': [
      '點了書籤，遊戲會用中文重新開一次（約一、兩秒）。遊戲進行中也可以按，會先存檔。',
      '再按一次書籤可以中英切換；遊戲裡「選項 → 遊戲設定」的語言也多了「繁體中文」。',
      '重新整理頁面會回到原版，要再按一次書籤。',
      '存檔照常存在瀏覽器裡，不受影響。書籤每次都從這個網站載入最新的翻譯，需要連上網路。',
    ],
    'faq.title': '常見問題',
    // 第三欄標 desktop／web 的只在那個版本顯示
    'faq.items': [
      ['這是官方的翻譯嗎？', '<p>不是。這是玩家自製的非官方翻譯，與 D2 Survivors 開發者及 Blizzard Entertainment 都沒有關係。</p>'],
      ['可以在 Mac、Linux 或手機上玩嗎？', '<p>可以。啟動器目前只有 Windows 版；Mac、Linux 和手機請在瀏覽器玩<a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">網頁版</a>，再用「瀏覽器版」分頁裡的書籤換成中文。</p>'],
      ['會動到我的存檔嗎？', '<p>不會。啟動器只替換遊戲資料夾裡的 <code>resources\\app.asar</code>，存檔放在別的地方，不會被讀取或修改。替換前會先備份原版。</p>', 'desktop'],
      ['會動到我的存檔嗎？', '<p>不會。存檔照常存在瀏覽器裡。書籤只在目前開著的頁面裡換掉遊戲的文字，不會留下任何修改，重新整理就回到原版。</p>', 'web'],
      ['遊戲更新之後怎麼辦？', '<p>遊戲更新會換掉 <code>app.asar</code>，翻譯會暫時消失。照常從啟動器開遊戲就會重新套上。</p><p>如果新版本改動太大、修改規則對不上，啟動器會顯示錯誤而不會硬改檔案；這時先按「還原原版」照常遊玩，等翻譯更新即可。</p>', 'desktop'],
      ['遊戲網頁版更新之後怎麼辦？', '<p>書籤每次都會先檢查修改規則對不對得上遊戲的新版本。對不上時會顯示「中文化需要更新」，不會啟動，原版遊戲也不受影響；先照常玩英文版，等這裡更新即可。</p>', 'web'],
      ['為什麼遊戲的語言選單裡韓文變成了「繁體中文」？', '<p>翻譯借用遊戲內建的韓文語言位置，所以套用中文後，選單裡的韓文會顯示成「繁體中文」。想玩韓文版，在啟動器選「한국어（原版）」再啟動。</p>', 'desktop'],
      ['手機上按書籤沒有反應？', '<p>Android Chrome 從書籤清單點不會執行，要在網址列輸入書籤名稱「D2 繁體中文」，再點下面出現的書籤。iPhone 請在遊戲頁面打開 Safari 的書籤清單點選。</p><p>也請確認書籤的網址整個換成了書籤程式碼，開頭是 <code>javascript:</code>。</p>', 'web'],
      ['為什麼還有一些英文？', '<p>大部分介面、技能、物品、怪物都已翻譯完成，但更新說明和部分較長的技能說明還在翻譯中，會先顯示英文。啟動器會自動更新，翻好就會出現。</p>', 'desktop'],
      ['為什麼還有一些英文？', '<p>大部分介面、技能、物品、怪物都已翻譯完成，但更新說明和部分較長的技能說明還在翻譯中，會先顯示英文。書籤每次都載入最新的翻譯，翻好就會出現。</p>', 'web'],
      ['角色名稱可以打中文嗎？', '<p>目前不行。遊戲本身只允許英文字母和韓文作為角色名稱。</p>'],
      ['想幫忙翻譯或回報錯字？', '<p>歡迎！德文、法文、西班牙文、義大利文、波蘭文、葡萄牙文、俄文、日文、簡體中文都在計畫中。{feedback}</p>'],
    ],
    'faq.feedback': '請到<a href="{0}" target="_blank" rel="noopener">這裡</a>聯絡我們。',
    'faq.nofeedback': '聯絡方式整理好之後會公布在這裡。',
    'footer.disclaimer': '非官方玩家自製翻譯，與 <a href="https://d2survivors.lol/" target="_blank" rel="noopener">D2 Survivors</a>（framara）、Blizzard Entertainment 無關。Diablo® 是 Blizzard Entertainment, Inc. 的商標。',
  },
  'zh-CN': {
    'nav.download': '下载',
    'nav.sources': '来源',
    'nav.languages': '语言',
    'nav.install': '安装',
    'nav.faq': '常见问题',
    'platform.label': '版本',
    'platform.desktop': '桌面版',
    'platform.desktop.sub': 'Windows',
    'platform.web': '浏览器版',
    'platform.web.sub': '电脑・手机',
    'switch.toWeb': '使用 Mac、Linux、手机，或想直接在浏览器里玩？',
    'switch.toWeb.btn': '查看浏览器版',
    'switch.toDesktop': '在 Windows 上玩桌面版？',
    'switch.toDesktop.btn': '查看桌面版',
    'hero.eyebrow': '非官方玩家翻译',
    'meta.description': 'D2 Survivors 非官方多语言本地化：繁体中文已推出，简体中文计划中。启动器一键安装、自动更新、随时还原。',
    'hero.title': 'D2 Survivors 多语言本地化',
    'hero.lead': '用你熟悉的语言玩 D2 Survivors。用语以《暗黑破坏神 II：狱火重生》官方译名为准，启动器一键安装、自动更新，随时可以还原原版。',
    'hero.lead@web': '用你熟悉的语言玩 D2 Survivors。在浏览器里玩网页版时，点一下书签就能切换成繁体中文，用语以《暗黑破坏神 II：狱火重生》官方译名为准。无需安装，电脑和手机都能用。',
    'hero.download': '下载启动器',
    'hero.unreleased': '启动器尚未发布',
    'hero.howto': '安装说明',
    'hero.bookmark': '安装书签',
    'hero.play': '打开游戏页面',
    'meta.game': '支持的游戏版本',
    'meta.launcher': '启动器',
    'meta.updated': '翻译更新',
    'meta.platform': 'Windows',
    'meta.browsers': '浏览器',
    'meta.devices': '设备',
    'meta.devices.value': '电脑・手机',
    'screens.levelup': '升级卡片（繁体中文版）：技能名称、说明、进化条件均已翻译',
    'screens.hud': '游戏画面（繁体中文版）：区域名称、生命、法力、金币',
    'sources.title': '来源与游戏本体',
    'sources.lead': '本项目只提供翻译，不包含任何游戏文件。开始之前，请先通过下面的官方渠道获取 D2 Survivors 和《暗黑破坏神 II》。',
    'sources.cards': [
      {
        title: 'D2 Survivors',
        sub: '原作：framara',
        body: '免费的非官方同人游戏，以《暗黑破坏神 II》为背景的幸存者类游戏。本翻译项目与原作者无关，游戏本身的问题请通过官方渠道反馈。',
        links: [['官方网站', 'd2sHome'], ['下载桌面版（Windows / Mac / Linux）', 'd2sDownload', 'desktop'], ['在浏览器里玩（网页版）', 'd2sPlay', 'web'], ['官方 Discord', 'd2sDiscord']],
      },
      {
        title: '《暗黑破坏神 II》',
        sub: '暴雪娱乐（Blizzard Entertainment）',
        body: 'D2 Survivors 会读取你电脑上《暗黑破坏神 II》的美术和音效资源，因此需要你自己拥有《暗黑破坏神 II：狱火重生》，或《暗黑破坏神 II》+《毁灭之王》（1.14 版本）。',
        links: [['战网商城（购买）', 'bnetShop'], ['下载战网客户端', 'bnetApp'], ['Steam：暗黑破坏神 II：狱火重生', 'steam']],
      },
    ],
    'sources.note': '译名参考：繁体中文版的技能、物品、怪物、区域等名称沿用《暗黑破坏神 II：狱火重生》官方繁体中文译名，简体中文版计划沿用官方简体中文译名；其余文本由本项目翻译。',
    'languages.title': '支持的语言',
    'languages.lead': '目前已推出繁体中文，简体中文和其他语言正在陆续制作中，简体中文用户可以先使用繁体中文版。覆盖率是已翻译条目占游戏全部文本的比例。',
    'status.available': '可用',
    'status.in-progress': '制作中',
    'status.planned': '计划中',
    'lang.coverage': '{0} / {1} 条・{2}%',
    'install.title': '安装',
    'install.lead': '不需要手动修改任何游戏文件，全部交给启动器处理。请先关闭游戏。启动器目前只有繁体中文界面，下面的按钮名称按启动器上的原文标注。',
    'install.steps': [
      ['先装好 D2 Survivors', '从 <a href="https://d2survivors.lol/download/" target="_blank" rel="noopener">D2 Survivors 官网</a>下载桌面版，按游戏的设置界面指定《暗黑破坏神 II》的安装位置，确认能正常进入游戏。'],
      ['下载启动器', '下载 <code>d2s-launcher.exe</code>，放在任意文件夹即可，无需安装。'],
      ['打开启动器', '启动器会在默认位置 <code>%LOCALAPPDATA%\\Programs\\D2 Survivors</code> 查找游戏；找不到时点击「設定」（设置）指定游戏文件夹。'],
      ['选择语言并启动游戏', '在「遊戲語言」（游戏语言）中选择语言，点击「啟動遊戲」（启动游戏）。首次运行会下载翻译，并自动备份原版 <code>app.asar</code>。'],
      ['以后都从启动器打开游戏', '勾选「啟動時自動更新翻譯」（启动时自动更新翻译）后，每次启动都会获取最新翻译，游戏更新后也会自动重新应用。'],
    ],
    'restore.title': '还原原版',
    'restore.body': '<ul><li>在启动器中点击「還原原版」（还原原版），游戏的 <code>app.asar</code> 就会换回原始文件。</li><li>想暂时玩英文或韩文版，在「遊戲語言」中选择 English 或「한국어（原版）」再启动即可。</li><li>完全卸载：先还原原版，再删除启动器和 <code>%LOCALAPPDATA%\\D2SurvivorsLauncher</code> 文件夹。</li></ul>',
    'cli.title': '桌面快捷方式',
    'cli.lead': '把下面这行设为快捷方式的目标，双击即可直接用指定语言启动游戏，不会弹出启动器窗口。',
    'cli.items': [
      ['--launch', '应用语言并启动游戏'],
      ['--lang <id>', '指定语言，例如 zh-TW、en、ko'],
      ['--no-update', '本次不检查翻译更新'],
      ['--update', '只更新翻译'],
      ['--restore', '还原原版'],
      ['--status', '显示当前语言、游戏版本和翻译状态'],
    ],
    'web.title': '安装书签',
    'web.lead': '在 <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">d2survivors.lol</a> 用浏览器玩？加一个书签就能切换成繁体中文，与启动器使用同一份翻译，无需安装，电脑和手机都能用。',
    'web.pc.title': '电脑（Chrome、Edge、Firefox）',
    'web.pc.hint': '← 拖到书签栏',
    'web.pc.drag': '请把按钮拖到书签栏，直接点击不会安装。',
    'web.pc.steps': [
      '按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>（Mac：<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>）显示书签栏。',
      '用鼠标按住上面的「D2 繁體中文」，拖到书签栏上松开。',
      '打开<a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">游戏页面</a>（点击「USE MY OWN FILES」或「HOSTED FILES」进入游戏），点击书签栏上的「D2 繁體中文」。',
    ],
    'web.mobile.title': '手机（Android Chrome、iPhone Safari）',
    'web.copy': '复制书签代码',
    'web.copied': '已复制',
    'web.copyfail': '无法自动复制，请手动选中下面的代码。',
    'web.mobile.steps': [
      '点击上面的按钮复制书签代码。',
      '把这个网页加入书签，然后编辑该书签：名称改为「D2 繁體中文」，网址整个替换成刚才复制的代码。',
      'Android：打开游戏页面后，在地址栏输入「D2 繁體中文」，点击下方出现的书签（从书签列表点击不会执行）。',
      'iPhone：打开游戏页面后，从 Safari 的书签列表点击「D2 繁體中文」。',
    ],
    'web.usage.title': '使用方法',
    'web.usage.items': [
      '点击书签后，游戏会以中文重新打开（约一两秒）。游戏进行中也可以点，会先存档。',
      '再点一次书签可以中英切换；游戏里「選項 → 遊戲設定」的语言也多了「繁體中文」。',
      '刷新页面会回到原版，需要再点一次书签。',
      '存档照常保存在浏览器里，不受影响。书签每次都从本站加载最新翻译，需要联网。',
    ],
    'faq.title': '常见问题',
    'faq.items': [
      ['这是官方翻译吗？', '<p>不是。这是玩家自制的非官方翻译，与 D2 Survivors 开发者及暴雪娱乐均无关。</p>'],
      ['有简体中文版吗？', '<p>简体中文已在计划中。在此之前可以先使用繁体中文版，用语以《暗黑破坏神 II：狱火重生》官方繁体中文译名为准。</p>'],
      ['可以在 Mac、Linux 或手机上玩吗？', '<p>可以。启动器目前只有 Windows 版；Mac、Linux 和手机请在浏览器里玩<a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">网页版</a>，再用「浏览器版」页面里的书签切换成中文。</p>'],
      ['会影响我的存档吗？', '<p>不会。启动器只替换游戏文件夹中的 <code>resources\\app.asar</code>，存档保存在其他位置，不会被读取或修改。替换前会先备份原版。</p>', 'desktop'],
      ['会影响我的存档吗？', '<p>不会。存档照常保存在浏览器里。书签只在当前打开的页面里替换游戏文字，不会留下任何修改，刷新页面就回到原版。</p>', 'web'],
      ['游戏更新后怎么办？', '<p>游戏更新会替换 <code>app.asar</code>，翻译会暂时消失。照常从启动器打开游戏就会重新应用。</p><p>如果新版本改动太大、修改规则无法匹配，启动器会报错而不会强行修改文件；这时先点击「還原原版」正常游玩，等翻译更新即可。</p>', 'desktop'],
      ['游戏网页版更新后怎么办？', '<p>书签每次都会先检查修改规则是否匹配游戏的新版本。无法匹配时会提示「中文化需要更新」并且不会启动，原版游戏也不受影响；请先照常玩英文版，等这里更新即可。</p>', 'web'],
      ['为什么游戏语言菜单里的韩语变成了「繁體中文」？', '<p>翻译借用了游戏内置的韩语语言位置，所以应用中文后，菜单里的韩语会显示为「繁體中文」。想玩韩语版，在启动器中选择「한국어（原版）」再启动。</p>', 'desktop'],
      ['手机上点书签没有反应？', '<p>Android Chrome 从书签列表点击不会执行，要在地址栏输入书签名称「D2 繁體中文」，再点击下方出现的书签。iPhone 请在游戏页面打开 Safari 的书签列表点击。</p><p>也请确认书签的网址已整个替换成书签代码，开头是 <code>javascript:</code>。</p>', 'web'],
      ['为什么还有一些英文？', '<p>大部分界面、技能、物品、怪物都已翻译完成，但更新说明和部分较长的技能说明还在翻译中，会先显示英文。启动器会自动更新，翻译完成后就会出现。</p>', 'desktop'],
      ['为什么还有一些英文？', '<p>大部分界面、技能、物品、怪物都已翻译完成，但更新说明和部分较长的技能说明还在翻译中，会先显示英文。书签每次都加载最新翻译，翻译完成后就会出现。</p>', 'web'],
      ['角色名可以用中文吗？', '<p>暂时不行。游戏本身只允许英文字母和韩文作为角色名。</p>'],
      ['想帮忙翻译或反馈错别字？', '<p>欢迎！德语、法语、西班牙语、意大利语、波兰语、葡萄牙语、俄语、日语、简体中文都在计划中。{feedback}</p>'],
    ],
    'faq.feedback': '请到<a href="{0}" target="_blank" rel="noopener">这里</a>联系我们。',
    'faq.nofeedback': '联系方式整理好后会公布在这里。',
    'footer.disclaimer': '非官方玩家自制翻译，与 <a href="https://d2survivors.lol/" target="_blank" rel="noopener">D2 Survivors</a>（framara）、暴雪娱乐（Blizzard Entertainment）无关。Diablo® 是 Blizzard Entertainment, Inc. 的商标。',
  },
  en: {
    'nav.download': 'Download',
    'nav.sources': 'Sources',
    'nav.languages': 'Languages',
    'nav.install': 'Install',
    'nav.faq': 'FAQ',
    'platform.label': 'Version',
    'platform.desktop': 'Desktop',
    'platform.desktop.sub': 'Windows',
    'platform.web': 'Browser',
    'platform.web.sub': 'computer & phone',
    'switch.toWeb': 'On Mac, Linux, or a phone, or playing in the browser?',
    'switch.toWeb.btn': 'See the browser version',
    'switch.toDesktop': 'Playing the desktop app on Windows?',
    'switch.toDesktop.btn': 'See the desktop version',
    'hero.eyebrow': 'Unofficial fan translation',
    'meta.description': 'Unofficial translations for D2 Survivors. Traditional Chinese is available now; the launcher installs, updates, and restores in one click.',
    'hero.title': 'D2 Survivors Localization',
    'hero.lead': 'Play D2 Survivors in your own language. Terminology follows the official Diablo II: Resurrected translations, and the launcher installs, updates, and restores everything in one click.',
    'hero.download': 'Download launcher',
    'hero.unreleased': 'Launcher not released yet',
    'hero.lead@web': 'Play D2 Survivors in your own language. When you play in the browser, one click on a bookmark switches the game to Traditional Chinese, with terminology from the official Diablo II: Resurrected translations. Nothing to install, on computers and phones alike.',
    'hero.howto': 'How to install',
    'hero.bookmark': 'Get the bookmark',
    'hero.play': 'Open the game page',
    'meta.game': 'Game version',
    'meta.launcher': 'Launcher',
    'meta.updated': 'Translations updated',
    'meta.platform': 'Windows',
    'meta.browsers': 'Browsers',
    'meta.devices': 'Devices',
    'meta.devices.value': 'computer & phone',
    'screens.levelup': 'Level-up cards: skill names, descriptions, and evolutions, fully translated',
    'screens.hud': 'In game: area names, life, mana, and gold',
    'sources.title': 'Sources and the base game',
    'sources.lead': 'This project only provides translations and contains no game files. Before you start, get D2 Survivors and Diablo II from the official sources below.',
    'sources.cards': [
      {
        title: 'D2 Survivors',
        sub: 'Created by framara',
        body: 'A free, unofficial fan-made survivors-like set in the world of Diablo II. This translation project is not affiliated with its author; please report game issues through the official channels.',
        links: [['Official website', 'd2sHome'], ['Desktop download (Windows / Mac / Linux)', 'd2sDownload', 'desktop'], ['Play in the browser', 'd2sPlay', 'web'], ['Official Discord', 'd2sDiscord']],
      },
      {
        title: 'Diablo II',
        sub: 'Blizzard Entertainment',
        body: 'D2 Survivors reads art and sound from the Diablo II on your computer, so you need your own copy of Diablo II: Resurrected, or Diablo II + Lord of Destruction (patch 1.14).',
        links: [['Battle.net Shop (buy)', 'bnetShop'], ['Download the Battle.net app', 'bnetApp'], ['Steam: Diablo II: Resurrected', 'steam']],
      },
    ],
    'sources.note': 'Terminology: names of skills, items, monsters, and areas follow the official Diablo II: Resurrected translations; everything else is translated by this project.',
    'languages.title': 'Languages',
    'languages.lead': 'Traditional Chinese is available now; more languages are on the way. Coverage is the share of all in-game text that has been translated.',
    'status.available': 'Available',
    'status.in-progress': 'In progress',
    'status.planned': 'Planned',
    'lang.coverage': '{0} / {1} strings · {2}%',
    'install.title': 'Install',
    'install.lead': 'You never edit game files by hand; the launcher does it all. Close the game first.',
    'install.steps': [
      ['Install D2 Survivors first', 'Download the desktop app from the <a href="https://d2survivors.lol/download/" target="_blank" rel="noopener">official D2 Survivors site</a>, point its setup screen at your Diablo II install, and make sure the game runs.'],
      ['Download the launcher', 'Download <code>d2s-launcher.exe</code> and put it in any folder. No installation needed.'],
      ['Open the launcher', 'It looks for the game in <code>%LOCALAPPDATA%\\Programs\\D2 Survivors</code>. If the game is elsewhere, click 設定 (Settings) and set the game folder.'],
      ['Pick a language and play', 'Choose a language under 遊戲語言 (Game language) and click 啟動遊戲 (Launch game). The first run downloads the translation and backs up the original <code>app.asar</code>.'],
      ['Always start from the launcher', 'With 啟動時自動更新翻譯 (auto-update) checked, every launch fetches the latest translation, and it re-applies itself after game updates.'],
    ],
    'restore.title': 'Restore the original',
    'restore.body': '<ul><li>Click 還原原版 (Restore original) in the launcher to put the original <code>app.asar</code> back.</li><li>To play in English or Korean for a while, pick English or 한국어（原版） and launch.</li><li>To remove everything: restore the original, then delete the launcher and the <code>%LOCALAPPDATA%\\D2SurvivorsLauncher</code> folder.</li></ul>',
    'cli.title': 'Desktop shortcut',
    'cli.lead': 'Use this as a shortcut target to start the game in a given language without opening the launcher window.',
    'cli.items': [
      ['--launch', 'Apply the language and start the game'],
      ['--lang <id>', 'Language to use, e.g. zh-TW, en, ko'],
      ['--no-update', 'Skip the translation update this time'],
      ['--update', 'Only update translations'],
      ['--restore', 'Restore the original'],
      ['--status', 'Show the current language, game version, and translation status'],
    ],
    'web.title': 'Get the bookmark',
    'web.lead': 'Playing in the browser at <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">d2survivors.lol</a>? One bookmark switches the game to Traditional Chinese, using the same translation as the launcher. Nothing to install, on computers and phones alike.',
    'web.pc.title': 'Computer (Chrome, Edge, Firefox)',
    'web.pc.hint': '← drag to the bookmarks bar',
    'web.pc.drag': 'Drag the button to your bookmarks bar; clicking it here does nothing.',
    'web.pc.steps': [
      'Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> (Mac: <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>) to show the bookmarks bar.',
      'Drag the “D2 繁體中文” button above onto the bookmarks bar.',
      'Open the <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">game page</a> (pick USE MY OWN FILES or HOSTED FILES to get into the game), then click “D2 繁體中文” in the bookmarks bar.',
    ],
    'web.mobile.title': 'Phone (Android Chrome, iPhone Safari)',
    'web.copy': 'Copy bookmark code',
    'web.copied': 'Copied',
    'web.copyfail': 'Couldn’t copy automatically; select the code below by hand.',
    'web.mobile.steps': [
      'Tap the button above to copy the bookmark code.',
      'Bookmark this page, then edit that bookmark: name it “D2 繁體中文” and replace its whole address with the copied code.',
      'Android: on the game page, type “D2 繁體中文” in the address bar and tap the bookmark that appears below it (tapping it in the bookmarks list doesn’t run it).',
      'iPhone: on the game page, tap “D2 繁體中文” in Safari’s bookmarks.',
    ],
    'web.usage.title': 'How it works',
    'web.usage.items': [
      'The bookmark restarts the game in Chinese, which takes a second or two. It saves first, so it’s fine mid-run.',
      'Use the bookmark again to switch between Chinese and English. The game’s OPTIONS → GAME OPTIONS language setting also gains 繁體中文.',
      'Reloading the page brings back the original game; use the bookmark again.',
      'Saves stay in your browser as usual. The bookmark loads the latest translation from this site each time, so it needs a connection.',
    ],
    'faq.title': 'FAQ',
    'faq.items': [
      ['Is this an official translation?', '<p>No. It is an unofficial fan translation, not affiliated with the D2 Survivors developers or Blizzard Entertainment.</p>'],
      ['Can I play on Mac, Linux, or a phone?', '<p>Yes. The launcher is Windows-only for now; on Mac, Linux, and phones, play the <a href="https://d2survivors.lol/play/" target="_blank" rel="noopener">web version</a> and use the bookmark from the Browser tab.</p>'],
      ['Will it touch my saves?', '<p>No. The launcher only replaces <code>resources\\app.asar</code> in the game folder, after backing up the original. Saves live elsewhere and are never read or changed.</p>', 'desktop'],
      ['Will it touch my saves?', '<p>No. Saves stay in your browser as usual. The bookmark only swaps the game text in the page you have open and leaves nothing behind; reloading brings back the original.</p>', 'web'],
      ['What happens when the game updates?', '<p>A game update replaces <code>app.asar</code>, so the translation disappears until you start the game from the launcher again, which re-applies it.</p><p>If a new version changed too much for the patch rules to match, the launcher reports an error instead of forcing the change. Restore the original and play as usual until the translation catches up.</p>', 'desktop'],
      ['What happens when the web game updates?', '<p>The bookmark checks that its patch rules still match the new version every time. If they don’t, it says the translation needs an update and doesn’t start, leaving the original game untouched. Play in English until it’s updated here.</p>', 'web'],
      ['Why does the in-game language menu show 繁體中文 instead of Korean?', '<p>The translation borrows the game\'s built-in Korean language slot. To play in Korean, pick 한국어（原版） in the launcher.</p>', 'desktop'],
      ['Nothing happens when I tap the bookmark on my phone?', '<p>Android Chrome doesn’t run bookmarks tapped in the bookmarks list: type the bookmark name “D2 繁體中文” in the address bar and tap the bookmark that appears below. On iPhone, open Safari’s bookmarks while on the game page and tap it there.</p><p>Also check that the bookmark’s whole address was replaced with the bookmark code, starting with <code>javascript:</code>.</p>', 'web'],
      ['Why is some text still in English?', '<p>Almost all UI, skills, items, and monsters are translated. Patch notes and some longer skill descriptions are still in progress and show in English for now; they arrive automatically through launcher updates.</p>', 'desktop'],
      ['Why is some text still in English?', '<p>Almost all UI, skills, items, and monsters are translated. Patch notes and some longer skill descriptions are still in progress and show in English for now; the bookmark always loads the latest translation, so they appear as soon as they’re done.</p>', 'web'],
      ['Can I use Chinese in character names?', '<p>Not yet. The game itself only allows English letters and Korean in character names.</p>'],
      ['How can I help translate or report a typo?', '<p>Gladly! German, French, Spanish, Italian, Polish, Portuguese, Russian, Japanese, and Simplified Chinese are all planned. {feedback}</p>'],
    ],
    'faq.feedback': 'Get in touch <a href="{0}" target="_blank" rel="noopener">here</a>.',
    'faq.nofeedback': 'Contact details will be posted here soon.',
    'footer.disclaimer': 'Unofficial fan translation, not affiliated with <a href="https://d2survivors.lol/" target="_blank" rel="noopener">D2 Survivors</a> (framara) or Blizzard Entertainment. Diablo® is a trademark of Blizzard Entertainment, Inc.',
  },
};

const fmt = (s, ...args) => s.replace(/\{(\d+)\}/g, (_, i) => args[i]);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = sel => document.querySelector(sel);

let lang = pickLanguage();
let platform = pickPlatform();

function pickLanguage() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && I18N[q]) return q;
  try {
    const saved = localStorage.getItem('d2s-site-lang');
    if (saved && I18N[saved]) return saved;
  } catch {}
  // 瀏覽器偏好語言裡第一個中文：台灣、香港、澳門或標明 Hant 的用繁中，其他中文用簡中
  const zh = (navigator.languages || [navigator.language]).find(l => /^zh/i.test(l));
  if (!zh) return 'en';
  return /^zh-(TW|HK|MO)\b|Hant/i.test(zh) ? 'zh-TW' : 'zh-CN';
}

// 網址 ?platform=、上次選的、網址的 #install／#web，都沒有就看系統：啟動器只有 Windows 版，其他（Mac、Linux、手機）用瀏覽器版
function pickPlatform() {
  const q = new URLSearchParams(location.search).get('platform');
  if (PLATFORMS.includes(q)) return q;
  const fromHash = platformOfHash();
  if (fromHash) return fromHash;
  try {
    const saved = localStorage.getItem('d2s-site-platform');
    if (PLATFORMS.includes(saved)) return saved;
  } catch {}
  return /Windows/i.test(navigator.userAgent) ? 'desktop' : 'web';
}

function platformOfHash() {
  return PLATFORMS.find(p => location.hash === '#' + INSTALL_SECTION[p]);
}

function render() {
  const t = I18N[lang];
  const tr = key => t[`${key}@${platform}`] ?? t[key];
  const num = n => n.toLocaleString(lang);
  document.documentElement.lang = SITE_LANGS.find(s => s.id === lang).html;
  document.body.dataset.platform = platform;
  document.title = t['hero.title'];
  $('meta[name="description"]').content = t['meta.description'];

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = tr(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = tr(el.dataset.i18nAlt); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', tr(el.dataset.i18nLabel)); });
  $('#lang-switch').innerHTML = SITE_LANGS.map(s =>
    `<button type="button" data-lang="${s.id}" lang="${s.html}" aria-pressed="${s.id === lang}">${s.label}</button>`
  ).join('');
  $('#platform-switch').innerHTML = PLATFORMS.map(p =>
    `<button type="button" data-platform="${p}" aria-pressed="${p === platform}">${esc(t['platform.' + p])}<small>${esc(t[`platform.${p}.sub`])}</small></button>`
  ).join('');
  $('#nav-install').href = '#' + INSTALL_SECTION[platform];

  const btn = $('#download-btn');
  if (SITE.downloadUrl) {
    btn.href = SITE.downloadUrl;
    btn.removeAttribute('aria-disabled');
    btn.innerHTML = `${esc(t['hero.download'])} <small>v${esc(SITE.launcherVersion)}</small>`;
  } else {
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
    btn.textContent = t['hero.unreleased'];
  }

  const latest = LANGUAGES.map(l => l.updated).filter(Boolean).sort().at(-1);
  $('#hero-meta').innerHTML = (platform === 'desktop' ? [
    [t['meta.game'], SITE.gameVersion],
    [t['meta.launcher'], `v${SITE.launcherVersion} · ${t['meta.platform']}`],
    latest && [t['meta.updated'], latest],
  ] : [
    [t['meta.browsers'], 'Chrome · Edge · Firefox · Safari'],
    [t['meta.devices'], t['meta.devices.value']],
    latest && [t['meta.updated'], latest],
  ]).filter(Boolean).map(([k, v]) => `<li>${esc(k)} <strong>${esc(v)}</strong></li>`).join('');

  $('#lang-grid').innerHTML = LANGUAGES.map(l => {
    const pct = l.entries ? Math.min(100, (l.entries / SITE.totalKeys) * 100) : 0;
    const coverage = l.entries
      ? `<div class="bar"><span style="width:${pct.toFixed(1)}%"></span></div>
         <span class="lang-sub">${esc(fmt(t['lang.coverage'], num(l.entries), num(SITE.totalKeys), pct.toFixed(1)))}</span>`
      : '';
    return `<li class="lang ${l.status}">
      <div class="lang-head"><span class="lang-name" lang="${l.id}">${esc(l.native)}</span><span class="lang-code">${l.id}</span></div>
      <span class="lang-sub">${esc(l.name[lang])}</span>
      <span class="status ${l.status}">${esc(t['status.' + l.status])}</span>
      ${coverage}
    </li>`;
  }).join('');

  $('#source-cards').innerHTML = t['sources.cards'].map(c => `<article class="card">
      <h3>${esc(c.title)}</h3>
      <p class="card-sub">${esc(c.sub)}</p>
      <p>${esc(c.body)}</p>
      <ul class="links">${c.links.filter(([, , only]) => !only || only === platform).map(([label, key]) =>
        `<li><a href="${LINKS[key]}" target="_blank" rel="noopener">${esc(label)}<span class="host">${new URL(LINKS[key]).hostname}</span></a></li>`
      ).join('')}</ul>
    </article>`).join('');

  $('#steps').innerHTML = t['install.steps'].map(([title, body]) => `<li><strong>${esc(title)}</strong><p>${body}</p></li>`).join('');
  $('#cli-list').innerHTML = t['cli.items'].map(([flag, desc]) => `<dt><code>${esc(flag)}</code></dt><dd>${esc(desc)}</dd>`).join('');

  const code = bookmarkletCode();
  $('#bookmarklet').href = code;
  $('#bookmarklet-code').textContent = code;
  $('#bookmarklet-hint').classList.remove('flash');
  $('#bookmarklet-hint').textContent = t['web.pc.hint'];
  $('#copy-status').textContent = '';
  $('#web-pc-steps').innerHTML = t['web.pc.steps'].map(s => `<li>${s}</li>`).join('');
  $('#web-mobile-steps').innerHTML = t['web.mobile.steps'].map(s => `<li>${s}</li>`).join('');
  $('#web-usage').innerHTML = t['web.usage.items'].map(s => `<li>${esc(s)}</li>`).join('');

  const feedback = SITE.feedbackUrl ? fmt(t['faq.feedback'], esc(SITE.feedbackUrl)) : t['faq.nofeedback'];
  const open = new Set([...document.querySelectorAll('#faq-list details[open]')].map(d => d.dataset.i));
  $('#faq-list').innerHTML = t['faq.items'].map(([q, a, only], i) => (!only || only === platform)
    ? `<details data-i="${i}"${open.has(String(i)) ? ' open' : ''}><summary>${esc(q)}</summary><div class="answer">${a.replace('{feedback}', feedback)}</div></details>`
    : ''
  ).join('');

  $('#footer-small').textContent = platform === 'desktop'
    ? `Game ${SITE.gameVersion} · Launcher v${SITE.launcherVersion}`
    : `Web · Translations ${latest || ''}`.trim();
}

// 網站跟啟動器的更新來源放在一起時，語言條數和更新時間直接讀 manifest
async function loadManifest() {
  try {
    const res = await fetch(SITE.manifestUrl, { cache: 'no-cache' });
    if (!res.ok) return;
    const manifest = await res.json();
    for (const m of manifest.languages || []) {
      const entry = { status: 'available', entries: m.entries, updated: (manifest.updated || '').slice(0, 10) || undefined };
      const known = LANGUAGES.find(l => l.id === m.id);
      if (known) Object.assign(known, entry);
      else LANGUAGES.push({ id: m.id, native: m.name, name: { 'zh-TW': m.name, 'zh-CN': m.name, en: m.name }, ...entry });
    }
    render();
  } catch {}
}

// 網頁版書籤：從這個網站載入 web/d2zh.js（網站搬到哪裡，書籤就指到哪裡）
function bookmarkletCode() {
  const url = new URL('web/d2zh.js', location.href).href;
  return `javascript:import('${url}').then(m=>m.default()).catch(e=>alert('D2 繁體中文載入失敗：'+e))`;
}

// 書籤按鈕要拖到書籤列；在這裡直接點只顯示提示
$('#bookmarklet').addEventListener('click', e => {
  e.preventDefault();
  const hint = $('#bookmarklet-hint');
  hint.textContent = I18N[lang]['web.pc.drag'];
  hint.classList.add('flash');
});

$('#copy-bookmarklet').addEventListener('click', async () => {
  const status = $('#copy-status');
  try {
    await navigator.clipboard.writeText(bookmarkletCode());
    status.textContent = I18N[lang]['web.copied'];
  } catch {
    status.textContent = I18N[lang]['web.copyfail'];
    getSelection().selectAllChildren($('#bookmarklet-code'));
  }
});

// 網址裡有 ?lang=／?platform= 時跟著改，不然重新整理又會回到網址指定的那個
function syncQuery(name, value) {
  const url = new URL(location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.set(name, value);
  history.replaceState(null, '', url);
}

$('#lang-switch').addEventListener('click', e => {
  const next = e.target.closest('button')?.dataset.lang;
  if (!next || next === lang) return;
  lang = next;
  try { localStorage.setItem('d2s-site-lang', lang); } catch {}
  syncQuery('lang', lang);
  render();
});

function setPlatform(next) {
  if (!PLATFORMS.includes(next) || next === platform) return false;
  platform = next;
  try { localStorage.setItem('d2s-site-platform', platform); } catch {}
  syncQuery('platform', platform);
  render();
  return true;
}

// 子分頁，以及安裝區塊裡「看另一個版本」的按鈕（這個會捲到那個版本的安裝區塊）
document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-platform]');
  if (!btn) return;
  const fromHint = !btn.closest('#platform-switch');
  if (setPlatform(btn.dataset.platform) && fromHint) $('#' + INSTALL_SECTION[platform]).scrollIntoView();
});

// 連到 #install／#web 時切到那個版本，不然會連到被藏起來的區塊
addEventListener('hashchange', () => {
  const p = platformOfHash();
  if (p && setPlatform(p)) $('#' + INSTALL_SECTION[p]).scrollIntoView();
});

render();
loadManifest();
