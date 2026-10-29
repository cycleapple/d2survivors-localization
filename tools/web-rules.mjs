// 網頁版（書籤）的修改規則和語言設定。tools/make-manifest.mjs 把這裡匯出的東西寫進 manifest v2，書籤讀 manifest。
//
// 匯出格式：
//   WEB_RULES      → manifest.web.rules。每條 { label, groups, file?, find, replace, optional? }
//     find：regex 原始碼，在 file（檔名的 regex；沒有就找全部模組）裡必須剛好符合一次
//     replace：$1、$2… 放回 find 抓到的變數名稱；{{…}} 由書籤代換（見下面「代換變數」）
//     groups：語言的 groups 有其中一個就套用（base＝每次都套用，包括英文、韓文）
//     optional：沒套上也能玩（只是那部分不完美）；其他的沒套上就不啟動，請玩家等更新
//   WEB_LANGUAGES  → manifest.languages[].web（不含 id）。每筆 { id, menu_name, html_lang, groups, fonts }
//     fonts：系統字型的完整名稱（給 CSS local() 用），照優先順序；粗體放前面，遊戲的字都是粗的
//   WEB_PLAY_URL   → manifest.web.play_url
//   WEB_CHECKED    → manifest.game.web_checked（node tools/build-web.mjs 全部套得上時自動改寫這一行）
//
// 代換變數（core.js 的 ruleVars 產生）：
//   {{menu}}       所有網頁版語言的選單項目：,"zh-TW":`繁體中文`,"zh-CN":`简体中文`…
//   {{ids}}        所有網頁版語言的 id，JSON 陣列
//   {{id}}、{{html_lang}}、{{menu_name}}  目前這個語言的設定
//   {{dict}}       目前這個語言的字典模組（書籤做的 blob 網址）
//   {{fonts}}      目前這個語言的字型：local("…"), local("…")…
//
// 書籤每次只照「目前的語言」套用規則（跟桌面版一樣）；在遊戲裡換語言時，書籤用新語言的規則重新開一次修改版。
// 跟桌面版（patch-rules.mjs）不同的地方：
// - 網頁版不佔用韓文的位置，而是多幾個語言（localStorage d2s:lang = zh-TW／zh-CN／ja），
//   原版遊戲重新整理後不認得，會自動回到英文
// - 網頁版改版比桌面版頻繁、壓縮後的變數名稱常常不一樣，所以用 regex：變數名稱用 ([\w$]+) 抓下來再放回去
// - 字型用系統字型（網頁版拿不到 D2R 的字型檔）

const CJK = '\\u3000-\\u9fff\\uff00-\\uffef';
// 不放在行首的字：句末標點、右括號，加上日文的長音、中點和小寫假名（禁則）。跟 patch-rules.mjs 一樣，
// 另外加半形冒號（日文的協同加成「ライトニングセントリー: +4%」不要在冒號前斷行）
const CLOSING = '\\u3001\\u3002\\uff0c\\uff1a\\uff1b\\uff01\\uff1f\\uff09\\u300d\\u300f\\u3011\\u30fc\\u30fb\\u3041\\u3043\\u3045\\u3047\\u3049\\u3063\\u3083\\u3085\\u3087\\u308e\\u30a1\\u30a3\\u30a5\\u30a7\\u30a9\\u30c3\\u30e3\\u30e5\\u30e7\\u30ee\\u30f5\\u30f6:';
// 不放在行尾的字：左括號
const OPENING = '\\u300c\\u300e\\u3010\\uff08';
const ID = '([\\w$]+)';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 把一段原始碼變成 regex：<1>、<2>… 的位置是變數名稱，同一個號碼第二次出現要跟第一次一樣。
// 號碼就是 regex 的群組編號（replace 的 $1、$2…），所以要照第一次出現的順序編
function pattern(src) {
  const seen = new Set();
  return esc(src).replace(/<(\d+)>/g, (_, n) => {
    if (seen.has(n)) return `\\${n}`;
    if (+n !== seen.size + 1) throw new Error(`pattern：<${n}> 要照第一次出現的順序編號：${src}`);
    seen.add(n);
    return ID;
  });
}

export const WEB_PLAY_URL = 'https://d2survivors.lol/play/';
export const WEB_CHECKED = '2026-10-29T10:14:16.279Z';

export const WEB_LANGUAGES = [
  {
    id: 'zh-TW', menu_name: '繁體中文', html_lang: 'zh-Hant', groups: ['base', 'dict', 'cjk', 'magic-zh', 'fullwidth'],
    fonts: ['Microsoft JhengHei UI Bold', 'Microsoft JhengHei Bold', 'PingFang TC Semibold', 'Noto Sans TC Bold', 'Noto Sans CJK TC Bold', 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 'Noto Sans CJK TC'],
  },
  {
    id: 'zh-CN', menu_name: '简体中文', html_lang: 'zh-Hans', groups: ['base', 'dict', 'cjk', 'magic-zh'],
    fonts: ['Microsoft YaHei UI Bold', 'Microsoft YaHei Bold', 'PingFang SC Semibold', 'Noto Sans SC Bold', 'Noto Sans CJK SC Bold', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Noto Sans CJK SC'],
  },
  {
    id: 'ja', menu_name: '日本語', html_lang: 'ja', groups: ['base', 'dict', 'cjk', 'magic-ja'],
    // Windows 10／11 一定有遊ゴシック；メイリオ在非日文版的 Windows 常常沒裝，全部找不到時中日文會退回系統語言的字型（繁中的正黑體）
    fonts: ['Yu Gothic UI Bold', 'Yu Gothic Bold', 'Meiryo UI Bold', 'Meiryo Bold', 'Hiragino Sans W6', 'Hiragino Kaku Gothic ProN W6', 'Noto Sans JP Bold', 'Noto Sans CJK JP Bold', 'Yu Gothic UI', 'Yu Gothic', 'Meiryo', 'Hiragino Sans', 'Noto Sans JP', 'Noto Sans CJK JP', 'MS Gothic'],
  },
  {
    id: 'de', menu_name: 'Deutsch', html_lang: 'de', groups: ['base', 'dict', 'caps', 'magic-de', 'unique-de'], fonts: [],
  },
  {
    id: 'fr', menu_name: 'Français', html_lang: 'fr', groups: ['base', 'dict', 'caps', 'magic-fr', 'unique-fr'], fonts: [],
  },
  {
    id: 'ru', menu_name: 'Русский', html_lang: 'ru', groups: ['base', 'dict', 'caps', 'cyrillic', 'font-ru', 'magic-ru', 'unique-ru'],
    fonts: ['Segoe UI Bold', 'Arial Bold', 'Roboto Bold', 'Noto Sans Bold', 'Segoe UI', 'Arial', 'Roboto', 'Noto Sans'],
  },
  {
    id: 'pl', menu_name: 'Polski', html_lang: 'pl', groups: ['base', 'dict', 'caps', 'latin-ext', 'font-pl', 'size-pl', 'magic-pl', 'unique-pl'],
    fonts: ['Segoe UI Bold', 'Arial Bold', 'Roboto Bold', 'Noto Sans Bold', 'Segoe UI', 'Arial', 'Roboto', 'Noto Sans'],
  },
];

const MAGIC = pattern('return[<1>(<2>),<1>(<3>),this.translateAs(`item`,<4>)].filter(Boolean).join(` `)');

// 有詞性的語言（德、法、俄、波蘭）的名稱組合，跟桌面版（patch-rules.mjs）的同名規則輸出一樣，參考實作是
// work/translation/compose-proto.mjs。字典裡 affix:<詞綴>、unique:<前段> 是每種詞性的形式「[ms]прочный[fs]прочная…」，
// gender:<名詞> 是名詞的詞性（ms／fs／ns／pl，法文複數 mp／fp，波蘭文的中性和複數都是 nl）。
// 規則裡新加的變數都用 d2 開頭，免得跟遊戲壓縮後的名稱撞到。
// 挑出詞性 G 的形式：沒有標記就原樣，找不到那個詞性就用第一個
const PICK = G => `d2k=d2v=>{if(!d2v.startsWith(\`[\`))return d2v;let d2o=d2v.split(\`[\`).slice(1),d2w=d2o.find(d2x=>d2x.startsWith(${G}+\`]\`))??d2o[0];return d2w.slice(d2w.indexOf(\`]\`)+1).trim()}`;
// 第一個字母大寫、小寫
const CASE = 'd2U=d2v=>d2v?d2v[0].toUpperCase()+d2v.slice(1):d2v,d2W=d2v=>d2v?d2v[0].toLowerCase()+d2v.slice(1):d2v';
// 魔法物品：translateMagic(全名, $4 物品)，$3 前綴、$2 後綴、$1 查 affix:。物品的詞性直接查字典
// （模組的正規化函式在這裡被參數蓋掉了，照它的寫法自己正規化 key）
const magic = expr => `let d2g=this.exact.get(\`gender:\${$4.trim()}\`.replace(/\\s+/g,\` \`).trim().toUpperCase())??\`ms\`,${PICK('d2g')},${CASE},d2b=this.translateAs(\`item\`,$4),d2p=d2k($1($3)),d2q=d2k($1($2));return ${expr}`;
// 獨特怪物：$4 是英文的 [前段, 後段, 稱號]，$1／$2／$3 是各段的譯文，$6 是查詢函式。
// $6(`gender`,…) 查不到時會退回一般翻譯，所以要確認拿到的是詞性代碼
const UNIQUE = pattern('let[<1>,<2>,<3>]=<4>.map(<5>=><6>(`unique`,<5>));return`${<3>} ${<1>} ${<2>}`');
const unique = expr => `let[$1,$2,$3]=$4.map($5=>$6(\`unique\`,$5)),d2G=$6(\`gender\`,$4[1]);d2G=/^(ms|fs|ns|pl|mp|fp|nl)$/.test(d2G)?d2G:\`ms\`;let ${PICK('d2G')},${CASE};return${expr}`;

export const WEB_RULES = [
  // 語言選單多幾個語言（選單直接用這個物件的 key 排列）
  { label: '語言選單', groups: ['base'], file: '^lang-.*\\.js$', find: pattern('{en:`ENGLISH`,ko:`한국어`}'), replace: '{en:`ENGLISH`,ko:`한국어`{{menu}}}' },
  // 讀 localStorage 的語言設定時接受這幾個語言
  { label: '接受語言設定', groups: ['base'], file: '^lang-.*\\.js$', find: pattern('<1>=<2>===`en`||<2>===`ko`?<2>:'), replace: '$1=$2===`en`||$2===`ko`||{{ids}}.includes($2)?$2:' },
  // 在遊戲裡換語言會重新載入頁面；在書籤的框架裡改成請書籤用新語言重新開一次修改版，不然會載入原版
  {
    label: '換語言時重新開修改版', groups: ['base'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('<1>(()=>location.reload())'),
    replace: '$1(()=>parent!==window&&parent.__d2zh?parent.__d2zh.reboot():location.reload())',
  },
  // 讓書籤可以讀、改目前的語言（再按一次書籤＝目前的語言和英文切換）
  {
    label: '語言切換介面', groups: ['base'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('function <1>(<2>){if(<2>!==<3>()){'),
    replace: 'window.__d2zhLang={get:()=>$3(),set:e=>$1(e)};function $1($2){if($2!==$3()){',
  },
  // 排行榜：網頁版的程式沒有完整性檢查（桌面版是啟動器外殼比對 app.asar.sha256），修改版送出的成績跟原版分不出來。
  // 所以修改版（包括切回英文時）一律不上傳：成績不排進佇列、不送出佇列（佇列裡原版留下的成績原封不動，回原版時照常送出）、
  // 死亡和專家級的報到都當成連不上排行榜（專家級英雄會變成不排名，跟離線玩一樣）。看排行榜（GET）照常。
  // 這幾條是必要規則：套不上就不啟動，不會在不知情的情況下上傳
  {
    label: '排行榜：不送出成績', groups: ['base'], file: '^saveTransfer-.*\\.js$',
    find: pattern('async function <1>(<2>,<3>,<4>,<5>=!1){let <6>=<7>();try{'),
    replace: 'async function $1($2,$3,$4,$5=!1){if($2!==`GET`)return{status:null,body:null};let $6=$7();try{',
  },
  {
    label: '排行榜：不排進佇列', groups: ['base'], file: '^saveTransfer-.*\\.js$',
    find: pattern('function <1>(<2>,<3>=Date.now()){return <4>([...<5>().filter(<3>=><3>.id!==<2>.runId)'),
    replace: 'function $1($2,$3=Date.now()){return!1;return $4([...$5().filter($3=>$3.id!==$2.runId)',
  },
  {
    label: '排行榜：不送出佇列', groups: ['base'], file: '^saveTransfer-.*\\.js$',
    find: pattern('function <1>(<2>=Date.now()){return <3>||(<3>=(async()=>{'),
    replace: 'function $1($2=Date.now()){return Promise.resolve();return $3||($3=(async()=>{',
  },
  // 問題回報（REPORT）也不送：修改版的問題不該算到原作者頭上。佇列裡原版留下的回報原封不動
  {
    label: '回報：不送出', groups: ['base'], file: '^saveTransfer-.*\\.js$',
    find: pattern('async function <1>(<2>){let <3>=await <4>(JSON.stringify(<2>));return <3>!==null&&<3>>=200&&<3><300?`sent`:'),
    replace: 'async function $1($2){return`refused`;let $3=await $4(JSON.stringify($2));return $3!==null&&$3>=200&&$3<300?`sent`:',
  },
  {
    label: '回報：不送出佇列', groups: ['base'], file: '^saveTransfer-.*\\.js$',
    find: pattern('async function <1>(<2>=Date.now()){if(!<3>){<3>=!0;try{let <4>=<5>().filter('),
    replace: 'async function $1($2=Date.now()){return;if(!$3){$3=!0;try{let $4=$5().filter(',
  },
  // 這個語言時載入它的字典（書籤做的字典模組），<html lang> 設成這個語言；韓文照舊
  {
    label: '載入字典', groups: ['dict'], file: '^lang-.*\\.js$',
    find: pattern('if(<1>()!==`ko`)return;document.documentElement.lang=`ko`;let[<2>]=await Promise.all([<3>(()=>import('),
    replace: 'if($1()!==`ko`&&$1()!==`{{id}}`)return;document.documentElement.lang=$1()===`{{id}}`?`{{html_lang}}`:`ko`;let[$2]=await Promise.all([$3(()=>$1()===`{{id}}`?import(`{{dict}}`).then(e=>e.default):import(',
  },
  // 字型：遊戲畫「外文字」用的字型家族（D2 Hangul 等）在中日文的字元範圍改用系統字型，沒有的話照瀏覽器預設
  {
    label: '中日文字型', groups: ['cjk'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('if(typeof FontFace>`u`)return;'),
    replace: 'if(typeof FontFace>`u`)return;await Promise.all([`D2R Kodia`,`D2R Iris`,`D2 Hangul`,`D2 Hangul 14`].map(async f=>{try{document.fonts.add(await new FontFace(f,`{{fonts}}`,{unicodeRange:`U+3000-30FF, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF`}).load())}catch{}}));',
  },
  // 魔法物品名稱：遊戲照韓文排成「後綴 前綴 物品」。中文順序一樣（D2R 的 MagicFormat「%2%0%1」）但不加空格：能量之緋紅便帽
  { label: '魔法物品名稱組合', groups: ['magic-zh'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: 'return[$1($2),$1($3),this.translateAs(`item`,$4)].filter(Boolean).join(``)' },
  // 日文是「前綴 後綴 物品」（D2R 日文的 MagicFormat「%0%2%1」），也不加空格：頑丈な魔力のキャップ
  { label: '魔法物品名稱組合（日文）', groups: ['magic-ja'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: 'return[$1($3),$1($2),this.translateAs(`item`,$4)].filter(Boolean).join(``)' },
  // 德文「前綴 物品 後綴」（D2R MagicFormat %0 %1 %2），前綴結尾是「 -」時跟物品用連字號接（Engels-Ring），句首大寫：Robuste Kappe des Geistes。
  // 有前綴、物品名稱又是兩個字以上時，物品名稱第一個字母改小寫（Robuste schwere Handschuhe）；字典裡的物品名稱是大寫開頭（白色物品單獨顯示時用）
  { label: '魔法物品名稱組合（德文）', groups: ['magic-de'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: magic('d2U([d2p&&(d2p.endsWith(` -`)?`${d2p.slice(0,-2)}-${d2b}`:`${d2p} ${d2b.includes(` `)?d2W(d2b):d2b}`),!d2p&&d2b,d2q].filter(Boolean).join(` `))') },
  // 法文「物品 前綴 後綴」（%1 %0 %2）：Coiffe solide de l’esprit
  { label: '魔法物品名稱組合（法文）', groups: ['magic-fr'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: magic('[d2b,d2p,d2q].filter(Boolean).join(` `)') },
  // 俄文「前綴 物品 後綴」（%0 %1 %2），有前綴時物品小寫開頭，句首大寫：Прочный наголовник разума
  { label: '魔法物品名稱組合（俄文）', groups: ['magic-ru'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: magic('d2U([d2p,d2p?d2W(d2b):d2b,d2q].filter(Boolean).join(` `))') },
  // 波蘭文「前綴 物品 後綴」（%0 %1 %2），D2R 的名稱本來就每個字大寫開頭，不改大小寫：Masywne Rękawice Lisa
  { label: '魔法物品名稱組合（波蘭文）', groups: ['magic-pl'], optional: true, file: '^translate-.*\\.js$', find: MAGIC, replace: magic('[d2p,d2b,d2q].filter(Boolean).join(` `)') },
  // 獨特怪物名字（遊戲照韓文排成「稱號 前段 後段」）
  // 德文「前段-後段 稱號」（D2R Monster2Format a0n1）：Düsternis-Hauer der Hungrige
  { label: '獨特怪物名字（德文）', groups: ['unique-de'], optional: true, find: UNIQUE, replace: 'let[$1,$2,$3]=$4.map($5=>$6(`unique`,$5));return`${$1.endsWith(` -`)?`${$1.slice(0,-2)}-${$2}`:`${$1} ${$2}`} ${$3}`' },
  // 法文「後段 前段 稱號」，前段照後段的詞性挑：Croc mélancolique l’Affamé
  { label: '獨特怪物名字（法文）', groups: ['unique-fr'], optional: true, find: UNIQUE, replace: unique('`${$2} ${d2k($1)} ${d2W($3)}`') },
  // 俄文「稱號, 前段 後段」（D2R 的「%2, %0 %1」），前段照後段的詞性挑：Голод, Мрачный клык
  { label: '獨特怪物名字（俄文）', groups: ['unique-ru'], optional: true, find: UNIQUE, replace: unique('`${d2U($3)}, ${d2U(d2k($1))} ${d2W($2)}`') },
  // 波蘭文「稱號, 前段 後段」（D2R「%2, %0 %1」），前段照後段的詞性挑，不改大小寫：Żarłok, Mroczny Kieł
  { label: '獨特怪物名字（波蘭文）', groups: ['unique-pl'], optional: true, find: UNIQUE, replace: unique('`${$3}, ${d2k($1)} ${$2}`') },
  // 英雄稱號的陰性形式：Destroyer、Conqueror 等不分職業，德、法、俄、波蘭文的女性職業（amazon、assassin、sorceress）會顯示陽性。
  // 女性職業先查 title:<稱號>:f，查不到（翻譯函式原樣傳回）就照一般的 title:<稱號>。跟桌面版的同名規則一樣
  {
    label: '女性職業的稱號', groups: ['dict'], optional: true, file: '^Game-.*\\.js$',
    find: pattern('function <1>(<2>,<3>){let <4>=<5>(<2>,<3>);if(!<4>)return null;let <6>=<7>(<2>,<3>);return <6>>0&&!<8>(<2>,<3>)?`${<9>(<4>)} · ${<10>(<6>)}`:<9>(<4>)}'),
    replace: 'function $1($2,$3){let $4=$5($2,$3);if(!$4)return null;let d2F=[`amazon`,`assassin`,`sorceress`].includes($3)?$9(`${$4}:f`):null,d2T=d2F&&d2F!==`${$4}:f`?d2F:$9($4),$6=$7($2,$3);return $6>0&&!$8($2,$3)?`${d2T} · ${$10($6)}`:d2T}',
  },
  // 角色畫面的「Survivor」（還沒有稱號時）是直接寫在角色畫面裡的，不經過上面的稱號函式。
  // 語言模組加一個全域函式：女性職業查 title:Survivor:f，查不到（原樣傳回）就給 null；角色畫面先問它，沒有就照舊用 Survivor
  {
    label: '女性職業的 Survivor（查詢函式）', groups: ['dict'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('function <1>(<2>){return <3>?<3>.translateAs(`title`,<2>):<2>}'),
    replace: 'globalThis.__d2zhSurvivor=d2c=>{if(!$3||![`amazon`,`assassin`,`sorceress`].includes(d2c))return null;let d2v=$3.translateAs(`title`,`Survivor:f`);return d2v===`Survivor:f`?null:d2v};function $1($2){return $3?$3.translateAs(`title`,$2):$2}',
  },
  {
    label: '女性職業的 Survivor（角色畫面）', groups: ['dict'], optional: true, file: '^saveTransfer-.*\\.js$',
    find: pattern('<1>.inspect?this.nameBox(<1>.inspect.name):this.fit(`Survivor`,<2>.name,`white`)'),
    replace: '$1.inspect?this.nameBox($1.inspect.name):this.fit(globalThis.__d2zhSurvivor?.($1.cls)??`Survivor`,$2.name,`white`)',
  },
  // 英文原文沒有小寫字母（盾牌 SHIELDS、ROGUE ENCAMPMENT 等）時譯文也全部大寫。字典查詢不分大小寫，
  // SHIELDS／Shields 共用一個譯文，拾取篩選器、控制器設定、死亡畫面的按鈕會變成大小寫混雜。照語言的規則轉大寫（德文 ß→SS）
  {
    label: '全大寫的原文', groups: ['caps'], optional: true, file: '^translate-.*\\.js$',
    find: pattern('translate(<1>){if(!<1>||!<2>.test(<1>))return <1>;let <3>=this.cache.get(<1>);if(<3>!==void 0)return <3>;let <4>=this.find(<1>,0),<5>=<4>??<1>;'),
    replace: 'translate($1){if(!$1||!$2.test($1))return $1;let $3=this.cache.get($1);if($3!==void 0)return $3;let $4=this.find($1,0);$4!==null&&!/\\p{Ll}/u.test($1)&&($4=$4.toLocaleUpperCase(`{{html_lang}}`));let $5=$4??$1;',
  },
  // 技能變體名稱：有些變體跟別的技能同名（荊棘之靈的 Vengeance vs 聖騎士的 Vengeance），遊戲只有一個 key，變體卡片會顯示成別的技能。
  // 語言模組加一個全域函式，把變體表每個變體的 name 換成 getter：翻譯時先查 modifier:名稱，查不到就照一般譯名，英文時照原文。
  // 變體表（{fireBolt:[{id,name,describe}…]…}）定義時包一層這個函式。跟桌面版「技能變體專用譯名」一樣；兩條都是 optional，
  // 只套上第二條時函式不存在就原樣傳回
  {
    label: '技能變體專用譯名（翻譯函式）', groups: ['dict'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('function <1>(<2>,<3>){return <4>?<4>.translateAs(<2>,<3>):<3>}'),
    replace: 'globalThis.__d2zhMods=d2t=>{for(let d2l of Object.values(d2t))for(let d2o of d2l){let d2n=d2o.name;Object.defineProperty(d2o,`name`,{get:()=>$4?$4.translateAs(`modifier`,d2n):d2n,enumerable:!0,configurable:!0})}return d2t};function $1($2,$3){return $4?$4.translateAs($2,$3):$3}',
  },
  {
    label: '技能變體專用譯名（變體表）', groups: ['dict'], optional: true,
    find: ',([\\w$]+)=\\{fireBolt:\\[\\{id:([\\s\\S]*?)\\]\\},([\\w$]+)=\\{raiseSkeleton:',
    replace: ',$1=(globalThis.__d2zhMods||(d2t=>d2t))({fireBolt:[{id:$2]}),$3={raiseSkeleton:',
  },
  // 「標籤: 值」分開翻再接回去時，標籤是中文就用全形「：」、不加空格（只有繁中：D2R 的簡中、日文本來就用半形冒號）
  {
    label: '標籤與值的冒號', groups: ['fullwidth'], optional: true, file: '^translate-.*\\.js$',
    find: pattern('return`${<1>.replace(/:?\\s*$/,`:`)} ${<2>}`'),
    replace: 'return/[\\u4e00-\\u9fff]/.test($1)?`${$1.replace(/[:：]?\\s*$/,`：`)}${$2}`:`${$1.replace(/:?\\s*$/,`:`)} ${$2}`',
  },
  // 點陣字型只把韓文當「外文字」改用 canvas 字型畫，其他查不到的字元畫成「?」：加上漢字、中文標點、全形字元、假名
  {
    label: '外文字判斷', groups: ['cjk'],
    find: pattern('return <1>>=44032&&<1><=55203||<1>>=12592&&<1><=12687||<1>>=4352&&<1><=4607}'),
    replace: 'return $1>=44032&&$1<=55203||$1>=12592&&$1<=12687||$1>=4352&&$1<=4607||$1>=19968&&$1<=40959||$1>=13312&&$1<=19903||$1>=12288&&$1<=12351||$1>=65280&&$1<=65519||$1>=12352&&$1<=12543}',
  },
  // 俄文：西里爾字母（U+0400–04FF）點陣字型也沒有，一樣當外文字
  {
    label: '外文字判斷（西里爾字母）', groups: ['cyrillic'],
    find: pattern('return <1>>=44032&&<1><=55203||<1>>=12592&&<1><=12687||<1>>=4352&&<1><=4607}'),
    replace: 'return $1>=44032&&$1<=55203||$1>=12592&&$1<=12687||$1>=4352&&$1<=4607||$1>=1024&&$1<=1279}',
  },
  // 俄文字型：外文字的字型家族在西里爾字母的範圍改用系統字型
  {
    label: '俄文字型', groups: ['font-ru'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('if(typeof FontFace>`u`)return;'),
    replace: 'if(typeof FontFace>`u`)return;await Promise.all([`D2R Kodia`,`D2R Iris`,`D2 Hangul`,`D2 Hangul 14`].map(async f=>{try{document.fonts.add(await new FontFace(f,`{{fonts}}`,{unicodeRange:`U+0400-04FF`}).load())}catch{}}));',
  },
  // 波蘭文：ą ć ę ł ń ś ź ż（Latin Extended-A，U+0100–017F）點陣字型沒有（只有 Latin-1），一樣當外文字
  {
    label: '外文字判斷（拉丁擴充 A）', groups: ['latin-ext'],
    find: pattern('return <1>>=44032&&<1><=55203||<1>>=12592&&<1><=12687||<1>>=4352&&<1><=4607}'),
    replace: 'return $1>=44032&&$1<=55203||$1>=12592&&$1<=12687||$1>=4352&&$1<=4607||$1>=256&&$1<=383}',
  },
  // 波蘭文字型：外文字的字型家族在 Latin Extended-A 的範圍改用系統字型
  {
    label: '波蘭文字型', groups: ['font-pl'], optional: true, file: '^lang-.*\\.js$',
    find: pattern('if(typeof FontFace>`u`)return;'),
    replace: 'if(typeof FontFace>`u`)return;await Promise.all([`D2R Kodia`,`D2R Iris`,`D2 Hangul`,`D2 Hangul 14`].map(async f=>{try{document.fonts.add(await new FontFace(f,`{{fonts}}`,{unicodeRange:`U+0100-017F`}).load())}catch{}}));',
  },
  // 外文字大小：遊戲照韓文放大（有 D2R 韓文字型時標題 ×1.25～1.4、內文 ×1.3 加粗；沒有時 12／15／24 px）。
  // 波蘭文只有幾個字母走外文字、夾在點陣字母中間，照韓文的比例會比旁邊的字大一號：標題 ×1.2、內文 ×1.0，不加粗。
  // 兩個分支都改（網頁版現在有放 D2R 韓文字型，走第一個）。桌面版的小按鈕字（字高不到 16）用 ×1.5，是因為 Exocet 的大寫比較矮；
  // 網頁版用系統字型，×1.5 的 Ś 會比旁邊的點陣大寫高一截，所以一律 ×1.2（2026-10-27 實測「NOWOŚCI」「WYJŚCIE」）
  {
    label: '外文字大小（波蘭文）', groups: ['size-pl'], optional: true, file: '^ui-.*\\.js$',
    find: pattern('if(<1>()){let <2>=<3>>=20?1.25:1.4;[this.foreignSize,this.foreignFamily]=<4>?[Math.round(<3>*<2>),<5>]:[Math.max(12,Math.round(<3>*1.3)),<6>],this.foreignWeight=<4>?``:`bold `}else[this.foreignSize,this.foreignFamily]=<3><14?[12,<7>]:<3><20?[15,<8>]:[24,<7>];'),
    replace: '[this.foreignSize,this.foreignFamily]=$4?[Math.round($3*1.2),$5]:[Math.max(12,Math.round($3)),$1()?$6:$3<14?$7:$3<20?$8:$7],this.foreignWeight=``;',
  },
  // 點陣字型只在空白處斷行：含中日文的詞再拆成一個字一個字（句末標點黏前一個字、左括號黏後一個字，
  // 數字和英文黏著後面那個字），拆出來的片段接回去時不加空白
  {
    label: '中日文斷行', groups: ['cjk'], optional: true,
    find: pattern('for(let <1> of <2>.split(` `)){let <3>=<4>?`${<4>} ${<1>}`:<1>;'),
    replace: `for(let $1 of $2.split(\` \`).flatMap(w=>(w.match(/[${OPENING}]*[${CJK}][${CLOSING}]*|[^${CJK}]+(?:[${OPENING}]*[${CJK}][${CLOSING}]*)?/g)??[w]).map((x,j)=>j?\`\\u0001\${x}\`:x))){let g=$1[0]===\`\\u0001\`;$1=g?$1.slice(1):$1;let $3=$4?g?$4+$1:\`\${$4} \${$1}\`:$1;`,
  },
  // 升級卡片的進化條件（最大 1/8, 內在火焰, 等級 12）：程式在英文後面接半形「,」，中日文改成「、」。
  // 卡片（canvas）是每個條件一塊，先翻好再接「、」（接在英文後面會查不到字典）；網頁的卡片把「、」放在 span 外面，條件之間不加空白
  {
    label: '進化條件的頓號（卡片）', groups: ['cjk'], optional: true, file: '^saveTransfer-.*\\.js$',
    find: pattern('function <1>(<2>){let <3>=<4>(<2>.head).split(` `).map(<5>=>({text:<5>,color:`gold`})),<6>=<2>.needs.map((<7>,<8>)=>({text:<8><<2>.needs.length-1?`${<7>.text},`:<7>.text,'),
    replace: 'function $1($2){let $3=$4($2.head).split(` `).map($5=>({text:$5,color:`gold`})),$6=$2.needs.map(($7,$8)=>({text:$8<$2.needs.length-1?`${$4($7.text)}、`:$7.text,',
  },
  {
    label: '進化條件的頓號（網頁）', groups: ['cjk'], optional: true, file: '^saveTransfer-.*\\.js$',
    find: pattern('<1>.needs.forEach((<2>,<3>)=><4>.append(` `,<5>(`span`,<2>.met?`met`:`missing`,<2>.text+(<3><<1>.needs.length-1?`,`:``))))'),
    replace: '$1.needs.forEach(($2,$3)=>$4.append($3?``:` `,$5(`span`,$2.met?`met`:`missing`,$2.text),$3<$1.needs.length-1?`、`:``))',
  },
  // 外文字的顏色照點陣字型推算：石頭按鈕的黑字會被當成「灰色填色＋黑色描邊」，中日文看起來像空心的灰字。
  // 填色很暗（門檻 75）又比描邊淡時，只用描邊的顏色畫實心字，再往右 1 像素多畫一次當粗體。跟桌面版的同名規則一樣
  {
    label: '暗色字不加描邊', groups: ['cjk', 'cyrillic', 'latin-ext'], optional: true, file: '^ui-.*\\.js$',
    find: pattern('<1>=[];if(<2>.outline){let <3>=`rgb(${<4>(<2>.outline.level,<2>.outline.own)})`;for(let[<5>,<6>]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])<1>.push([<3>,<5>*<7>,<6>*<7>])}<1>.push([`rgb(${<4>(<2>.level,<2>.own)})`,0,0]);'),
    replace: '$1=[];let d2F=$4($2.level,$2.own),d2U=$2.outline&&$4($2.outline.level,$2.outline.own),d2M=e=>Math.max(...e.split(`,`).map(Number)),d2D=d2U&&d2M(d2F)<75&&d2M(d2U)<d2M(d2F);if($2.outline&&!d2D){let $3=`rgb(${d2U})`;for(let[$5,$6]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])$1.push([$3,$5*$7,$6*$7])}$1.push([`rgb(${d2D?d2U:d2F})`,0,0]);d2D&&$1.push([`rgb(${d2U})`,1,0]);',
  },
  // 標題畫面、主選單底部的版權聲明：第一段寬度上限縮成 360，在句號處折成兩行，不蓋到版本號
  {
    label: '版權聲明寬度', groups: ['cjk'], optional: true,
    find: pattern('let <1>={...<2>(<3>),maxWidth:<4>},<5>=[<3>.text(<6>,<1>),'),
    replace: 'let $1={...$2($3),maxWidth:$4},$5=[$3.text($6,{...$1,maxWidth:360}),',
  },
];
