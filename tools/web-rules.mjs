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
// 不放在行首的字：句末標點、右括號，加上日文的長音、中點和小寫假名（禁則）。跟 patch-rules.mjs 一樣
const CLOSING = '\\u3001\\u3002\\uff0c\\uff1a\\uff1b\\uff01\\uff1f\\uff09\\u300d\\u300f\\u3011\\u30fc\\u30fb\\u3041\\u3043\\u3045\\u3047\\u3049\\u3063\\u3083\\u3085\\u3087\\u308e\\u30a1\\u30a3\\u30a5\\u30a7\\u30a9\\u30c3\\u30e3\\u30e5\\u30e7\\u30ee\\u30f5\\u30f6';
// 不放在行尾的字：左括號
const OPENING = '\\u300c\\u300e\\u3010\\uff08';
const ID = '([\\w$]+)';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 把一段原始碼變成 regex：<1>、<2>… 的位置是變數名稱，同一個號碼第二次出現要跟第一次一樣。
// 號碼就是 regex 的群組編號（replace 的 $1、$2…），所以要照第一次出現的順序編
function pattern(src) {
  const seen = new Set();
  return esc(src).replace(/<(\d)>/g, (_, n) => {
    if (seen.has(n)) return `\\${n}`;
    if (+n !== seen.size + 1) throw new Error(`pattern：<${n}> 要照第一次出現的順序編號：${src}`);
    seen.add(n);
    return ID;
  });
}

export const WEB_PLAY_URL = 'https://d2survivors.lol/play/';
export const WEB_CHECKED = '2026-10-27T12:22:13.404Z';

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
    fonts: ['Meiryo UI Bold', 'Meiryo Bold', 'Hiragino Sans W6', 'Hiragino Kaku Gothic ProN W6', 'Noto Sans JP Bold', 'Noto Sans CJK JP Bold', 'Meiryo', 'Hiragino Sans', 'Noto Sans JP', 'Noto Sans CJK JP'],
  },
];

const MAGIC = pattern('return[<1>(<2>),<1>(<3>),this.translateAs(`item`,<4>)].filter(Boolean).join(` `)');

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
  // 點陣字型只在空白處斷行：含中日文的詞再拆成一個字一個字（句末標點黏前一個字、左括號黏後一個字，
  // 數字和英文黏著後面那個字），拆出來的片段接回去時不加空白
  {
    label: '中日文斷行', groups: ['cjk'], optional: true,
    find: pattern('for(let <1> of <2>.split(` `)){let <3>=<4>?`${<4>} ${<1>}`:<1>;'),
    replace: `for(let $1 of $2.split(\` \`).flatMap(w=>(w.match(/[${OPENING}]*[${CJK}][${CLOSING}]*|[^${CJK}]+(?:[${OPENING}]*[${CJK}][${CLOSING}]*)?/g)??[w]).map((x,j)=>j?\`\\u0001\${x}\`:x))){let g=$1[0]===\`\\u0001\`;$1=g?$1.slice(1):$1;let $3=$4?g?$4+$1:\`\${$4} \${$1}\`:$1;`,
  },
  // 外文字的顏色照點陣字型推算：石頭按鈕的黑字會被當成「灰色填色＋黑色描邊」，中日文看起來像空心的灰字。
  // 填色很暗（門檻 75）又比描邊淡時，只用描邊的顏色畫實心字，再往右 1 像素多畫一次當粗體。跟桌面版的同名規則一樣
  {
    label: '暗色字不加描邊', groups: ['cjk'], optional: true, file: '^ui-.*\.js$',
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
