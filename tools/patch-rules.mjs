// app.asar 的修改規則。patch.mjs 直接用，make-manifest.mjs 寫進 manifest.json 給啟動器用。
// 每條規則：在 assets 裡找到檔案（file 是檔名的 regex；沒有的話就找唯一含有 from 的 .js），
// from 必須剛好出現一次，換成 to。from／to 裡的 {{menu_name}}、{{html_lang}} 依語言代換。
// groups：base 每種語言都套用；dict 換掉韓文字典的語言才套用；cjk 中日文才套用；
//   magic-zh／magic-ja 魔法物品名稱的組合順序（照 D2R 各語言的 MagicFormat）；fullwidth 冒號用全形（只有繁中）。

export const ASSETS_DIR = 'desktop/dist/web/assets';

// 換掉韓文字典的位置（ko 槽位）
export const DICT_TARGET = { file: '^ko-.*\\.js$', template: 'var e={{dict}};export{e as default};' };

const CJK = '\\u3000-\\u9fff\\uff00-\\uffef';
// 不放在行首的字：句末標點、右括號，加上日文的長音、中點和小寫假名（禁則）
const CLOSING = '\\u3001\\u3002\\uff0c\\uff1a\\uff1b\\uff01\\uff1f\\uff09\\u300d\\u300f\\u3011\\u30fc\\u30fb\\u3041\\u3043\\u3045\\u3047\\u3049\\u3063\\u3083\\u3085\\u3087\\u308e\\u30a1\\u30a3\\u30a5\\u30a7\\u30a9\\u30c3\\u30e3\\u30e5\\u30e7\\u30ee\\u30f5\\u30f6';
// 不放在行尾的字：左括號
const OPENING = '\\u300c\\u300e\\u3010\\uff08';
const HANGUL_RANGES = 'return t>=44032&&t<=55203||t>=12592&&t<=12687||t>=4352&&t<=4607}';
// 漢字、擴充 A、中文標點、全形字元、平假名和片假名
const CJK_RANGES = '||t>=19968&&t<=40959||t>=13312&&t<=19903||t>=12288&&t<=12351||t>=65280&&t<=65519||t>=12352&&t<=12543';

export const RULES = [
  // 啟動器用 D2S_QUERY=d2slang=<en|ko> 指定語言：每個視窗只在第一次載入時寫進 localStorage，
  // 之後在遊戲裡切換語言（會重新載入頁面）照樣有效
  {
    label: '啟動器指定語言', groups: ['base'], file: '^lang-.*\\.js$',
    from: 'let e=null;try{e=localStorage.getItem(A)}catch{}',
    to: 'let e=null;try{let q=new URLSearchParams(location.search).get(`d2slang`);if(q&&!sessionStorage.getItem(`d2slang`)){sessionStorage.setItem(`d2slang`,q);localStorage.setItem(A,q)}e=localStorage.getItem(A)}catch{}',
  },
  { label: '語言選單名稱', groups: ['dict'], file: '^lang-.*\\.js$', from: 'ko:`한국어`', to: 'ko:`{{menu_name}}`' },
  { label: '頁面語言標記', groups: ['dict'], file: '^lang-.*\\.js$', from: 'document.documentElement.lang=`ko`', to: 'document.documentElement.lang=`{{html_lang}}`' },
  // 魔法物品名稱：遊戲照韓文排成「後綴 前綴 物品」（i 是物品名稱後面那段、r 是前面那段）。
  // 中文的順序一樣（D2R 繁中、簡中的 MagicFormat「%2%0%1」，%0 前綴、%1 物品、%2 後綴），但不加空格：能量之緋紅便帽
  {
    label: '魔法物品名稱組合', groups: ['magic-zh'], file: '^lang-.*\\.js$',
    from: 'this.translateAs(`item`,t)].filter(Boolean).join(` `)',
    to: 'this.translateAs(`item`,t)].filter(Boolean).join(``)',
  },
  // 日文是「前綴 後綴 物品」（D2R 日文的 MagicFormat「%0%2%1」），也不加空格：頑丈な魔力のキャップ
  {
    label: '魔法物品名稱組合（日文）', groups: ['magic-ja'], file: '^lang-.*\\.js$',
    from: 'return[a(i),a(r),this.translateAs(`item`,t)].filter(Boolean).join(` `)',
    to: 'return[a(r),a(i),this.translateAs(`item`,t)].filter(Boolean).join(``)',
  },
  // 「標籤: 值」整句查不到時，翻譯器分開翻再接回去，一律接成半形「: 」；標籤是中文就改用全形「：」、不加空格。
  // 只有繁中：D2R 的簡中、日文本來就用半形冒號（「掉宝率: +%d%%」）
  {
    label: '標籤與值的冒號', groups: ['fullwidth'], file: '^lang-.*\\.js$',
    from: 'return`${t.replace(/:?\\s*$/,`:`)} ${r}`',
    to: 'return/[\\u4e00-\\u9fff]/.test(t)?`${t.replace(/[:：]?\\s*$/,`：`)}${r}`:`${t.replace(/:?\\s*$/,`:`)} ${r}`',
  },
  // D2 點陣字型只把韓文當「外文字」改用 canvas 字型畫，其他字元查不到就畫成「?」。
  // 加上中日韓漢字（含擴充 A）、中文標點、全形字元的範圍
  { label: '外文字判斷', groups: ['cjk'], from: HANGUL_RANGES, to: HANGUL_RANGES.slice(0, -1) + CJK_RANGES + '}' },
  // 點陣字型的斷行只在空白處斷，中文句子會整行超出。
  // 切完空白後，把含中文的詞再拆成一個字一個字（句末標點黏在前一個字後面、左括號黏在後一個字前面，
  // 數字和英文黏著後面那個字，「1発」「D2と」不會拆開）；拆出來的片段前面標 \u0001，接回去時不加空白
  {
    label: '中文斷行', groups: ['cjk'],
    from: 'for(let i of r.split(` `)){let r=e?`${e} ${i}`:i;',
    to: `for(let i of r.split(\` \`).flatMap(w=>(w.match(/[${OPENING}]*[${CJK}][${CLOSING}]*|[^${CJK}]+(?:[${OPENING}]*[${CJK}][${CLOSING}]*)?/g)??[w]).map((x,j)=>j?\`\\u0001\${x}\`:x))){let g=i[0]===\`\\u0001\`;i=g?i.slice(1):i;let r=e?g?e+i:\`\${e} \${i}\`:i;`,
  },
  // 中文字型：載入韓文字型之前，用同樣的字型家族名稱註冊 fonts-zh/ 的繁中字型，字元範圍限定中文，
  // 遊戲的「外文字」用 canvas 畫字時就會用到它。大小字都用 D2R 繁中的內文字型：
  // 標題字型（方新書）筆畫太細，在石頭按鈕上比系統字型還難讀。
  // 字型檔是 tools/zh-fonts.mjs 從玩家自己的 D2R 取出的，只有 patch.mjs 在本機打包時才會放進去；
  // 沒有字型檔時載入失敗，照舊用系統字型
  {
    label: '中文字型', groups: ['cjk'], file: '^lang-.*\\.js$',
    from: 'if(typeof FontFace>`u`)return;',
    to: 'if(typeof FontFace>`u`)return;await Promise.all([[`D2R Kodia`,`body.woff2`],[`D2R Iris`,`body.woff2`],[`D2 Hangul`,`body.woff2`],[`D2 Hangul 14`,`body.woff2`]].map(async([f,n])=>{try{document.fonts.add(await new FontFace(f,`url(${new URL(`../fonts-zh/${n}`,document.baseURI).href})`,{unicodeRange:`U+3000-30FF, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF`}).load())}catch{}}));',
  },
  // 外文字的顏色是照點陣字型推算的：亮度夠的像素當填色，其餘超過三成就當描邊，畫的時候再乘上指定的顏色。
  // 石頭按鈕的黑字邊緣有一圈較淡的像素，會被當成「灰色填色（#3f3f3f）＋黑色描邊（#070707）」，中文看起來像空心的灰字。
  // 最後算出來的填色很暗、又比描邊淡時，只用描邊的顏色畫實心字（跟英文一樣），再往右 1 像素多畫一次當粗體
  // （英文按鈕字很粗，單畫一次的中文太細）；亮色字（金字、白字）的填色亮，不受影響。
  // 「很暗」的門檻 75：按鈕字的填色最亮 63，升級畫面標題那種褐金色是 97，要照原本的畫法
  {
    label: '暗色字不加描邊', groups: ['cjk'],
    from: 'c=[];if(a.outline){let e=`rgb(${o(a.outline.level,a.outline.own)})`;for(let[t,n]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])c.push([e,t*s,n*s])}c.push([`rgb(${o(a.level,a.own)})`,0,0]);',
    to: 'c=[],F=o(a.level,a.own),U=a.outline&&o(a.outline.level,a.outline.own),M=e=>Math.max(...e.split(`,`).map(Number)),D=U&&M(F)<75&&M(U)<M(F);if(a.outline&&!D){let e=`rgb(${U})`;for(let[t,n]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])c.push([e,t*s,n*s])}c.push([`rgb(${D?U:F})`,0,0]);D&&c.push([`rgb(${U})`,1,0]);',
  },
  // 標題畫面、主選單底部的版權聲明寬度上限 700：英文會折成兩行，中文比較短只排一行，最底下那行太寬會蓋到左下角的版本號。
  // 這個語言時把第一段（非官方聲明）的上限縮成 360，剛好在句號處折成兩行；標題畫面下一行的 © 聲明照 700，
  // 切回英文時也照原本的 700
  {
    label: '版權聲明寬度', groups: ['cjk'],
    // 依賴壓縮名稱（Y、ur、J），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.1）
    from: 'let r={...Y(e),maxWidth:ur},i=[e.text(J,r)',
    to: 'let r={...Y(e),maxWidth:ur},i=[e.text(J,document.documentElement.lang===`{{html_lang}}`?{...r,maxWidth:360}:r)',
  },
  // 技能變體名稱：有些變體跟別的技能同名（荊棘之靈的 Vengeance vs 聖騎士的 Vengeance），遊戲只有一個 key，
  // 變體卡片會顯示成別的職業的技能。變體表（keepSave 的 zs={技能 id:[{id,name,describe}…]}）定義完之後，
  // 把每個變體的 name 換成 getter：翻譯時先查 modifier:名稱（例如 modifier:Vengeance），查不到就照一般譯名；
  // 沒在翻譯（英文）時照原本的英文。m = 語言模組的 translateAs，h = 是否正在翻譯（keepSave 的匯入名稱）。
  // 專用譯名在 dict/manual/modifiers.json，決定的原因見 docs/term-decisions.md
  {
    label: '技能變體專用譯名', groups: ['dict'],
    // 依賴壓縮名稱（變體表 Bs、後面的 mre、Vs、Hs，匯入的 h、m），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.1）
    from: "]},mre={raiseSkeleton:`Evolved: Revive's skeletons take this option`},Vs={};function Hs(e,t){",
    to: "]},mre={raiseSkeleton:`Evolved: Revive's skeletons take this option`},Vs={};for(let l of Object.values(Bs))for(let o of l){let n=o.name;Object.defineProperty(o,`name`,{get:()=>h()?m(`modifier`,n):n,enumerable:!0,configurable:!0})}function Hs(e,t){",
  },
];

// 啟動器能選的翻譯語言（en、ko 原版是啟動器內建的）
export const LANGUAGES = [
  { id: 'zh-TW', name: '繁體中文', menu_name: '繁體中文', html_lang: 'zh-Hant', groups: ['base', 'dict', 'cjk', 'magic-zh', 'fullwidth'], dict: 'dict/zh-TW.json' },
  { id: 'zh-CN', name: '简体中文', menu_name: '简体中文', html_lang: 'zh-Hans', groups: ['base', 'dict', 'cjk', 'magic-zh'], dict: 'dict/zh-CN.json' },
  { id: 'ja', name: '日本語', menu_name: '日本語', html_lang: 'ja', groups: ['base', 'dict', 'cjk', 'magic-ja'], dict: 'dict/ja.json' },
];

export function fillTemplate(s, lang) {
  return s.replaceAll('{{menu_name}}', lang.menu_name).replaceAll('{{html_lang}}', lang.html_lang);
}
