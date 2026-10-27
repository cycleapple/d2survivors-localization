// 網頁版（書籤）的修改規則。網頁版改版比桌面版頻繁，壓縮後的變數名稱常常不一樣，
// 所以這裡用 regex：變數名稱用 ([\w$]+) 抓下來，替換時用 $1、$2… 放回去。
// 每條規則：file 是檔名的 regex（沒有的話就找唯一符合 find 的模組），find 必須剛好符合一次。
// optional：沒套上也能玩（只是那部分不完美）；其他的沒套上就不啟動，請玩家等更新。
// 替換字串裡的 {{zh_dict}} 由書籤代換成字典模組的網址。
// 跟桌面版（patch-rules.mjs）不同的地方：網頁版不佔用韓文的位置，而是多一個語言 zh（localStorage d2s:lang = zh），
// 所以原版遊戲重新整理後會自動回到英文，不會出現讀不懂的設定。

const CJK = '\\u3000-\\u9fff\\uff00-\\uffef';
const CLOSING = '\\u3001\\u3002\\uff0c\\uff1a\\uff1b\\uff01\\uff1f\\uff09\\u300d';
const ID = '([\\w$]+)';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 把一段原始碼變成 regex：<1>、<2>… 的位置是變數名稱，同一個號碼第二次出現要跟第一次一樣
function pattern(src) {
  const seen = new Set();
  return esc(src).replace(/<(\d)>/g, (_, n) => seen.has(n) ? `\\${n}` : (seen.add(n), ID));
}

export const WEB_RULES = [
  // 語言選單多一個「繁體中文」（選單直接用這個物件的 key 排列）
  { label: '語言選單', file: '^lang-.*\\.js$', find: pattern('{en:`ENGLISH`,ko:`한국어`}'), replace: '{en:`ENGLISH`,ko:`한국어`,zh:`繁體中文`}' },
  // 讀 localStorage 的語言設定時接受 zh
  { label: '接受 zh 設定', file: '^lang-.*\\.js$', find: pattern('<1>=<2>===`en`||<2>===`ko`?<2>:'), replace: '$1=$2===`en`||$2===`ko`||$2===`zh`?$2:' },
  // zh 時載入繁中字典（書籤做的字典模組），<html lang> 設成 zh-Hant；韓文照舊
  {
    label: '載入繁中字典', file: '^lang-.*\\.js$',
    find: pattern('if(<1>()!==`ko`)return;document.documentElement.lang=`ko`;let[<2>]=await Promise.all([<3>(()=>import('),
    replace: 'if($1()!==`ko`&&$1()!==`zh`)return;document.documentElement.lang=$1()===`zh`?`zh-Hant`:`ko`;let[$2]=await Promise.all([$3(()=>$1()===`zh`?import(`{{zh_dict}}`).then(e=>e.default):import(',
  },
  // 在遊戲裡換語言會重新載入頁面；在書籤的框架裡改成請書籤重新開一次修改版，不然會載入原版
  {
    label: '換語言時重新開修改版', optional: true, file: '^lang-.*\\.js$',
    find: pattern('<1>(()=>location.reload())'),
    replace: '$1(()=>parent!==window&&parent.__d2zh?parent.__d2zh.reboot():location.reload())',
  },
  // 讓書籤可以讀、改目前的語言（再按一次書籤＝中英切換）
  {
    label: '語言切換介面', optional: true, file: '^lang-.*\\.js$',
    find: pattern('function <1>(<2>){if(<2>!==<3>()){'),
    replace: 'window.__d2zhLang={get:()=>$3(),set:e=>$1(e)};function $1($2){if($2!==$3()){',
  },
  // 中文字型：遊戲畫「外文字」用的字型家族（D2 Hangul 等）在中文字元範圍改用系統的繁中字型，
  // 沒有的話照瀏覽器預設
  {
    label: '中文字型', optional: true, file: '^lang-.*\\.js$',
    find: pattern('if(typeof FontFace>`u`)return;'),
    replace: 'if(typeof FontFace>`u`)return;await Promise.all([`D2R Kodia`,`D2R Iris`,`D2 Hangul`,`D2 Hangul 14`].map(async f=>{try{document.fonts.add(await new FontFace(f,`local("Microsoft JhengHei UI Bold"), local("Microsoft JhengHei Bold"), local("PingFang TC Semibold"), local("Noto Sans TC Bold"), local("Noto Sans CJK TC Bold"), local("Microsoft JhengHei"), local("PingFang TC"), local("Noto Sans TC"), local("Noto Sans CJK TC")`,{unicodeRange:`U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF`}).load())}catch{}}));',
  },
  // 魔法物品名稱：中文時不加空格（「能量之緋紅便帽」），韓文照舊
  {
    label: '魔法物品名稱組合', optional: true, file: '^translate-.*\\.js$',
    find: pattern('this.translateAs(`item`,<1>)].filter(Boolean).join(` `)'),
    replace: 'this.translateAs(`item`,$1)].filter(Boolean).join(document.documentElement.lang===`zh-Hant`?``:` `)',
  },
  // 「標籤: 值」分開翻再接回去時，標籤是中文就用全形「：」、不加空格
  {
    label: '標籤與值的冒號', optional: true, file: '^translate-.*\\.js$',
    find: pattern('return`${<1>.replace(/:?\\s*$/,`:`)} ${<2>}`'),
    replace: 'return/[\\u4e00-\\u9fff]/.test($1)?`${$1.replace(/[:：]?\\s*$/,`：`)}${$2}`:`${$1.replace(/:?\\s*$/,`:`)} ${$2}`',
  },
  // 點陣字型只把韓文當「外文字」改用 canvas 字型畫，其他查不到的字元畫成「?」：加上漢字、中文標點、全形字元
  {
    label: '外文字判斷',
    find: pattern('return <1>>=44032&&<1><=55203||<1>>=12592&&<1><=12687||<1>>=4352&&<1><=4607}'),
    replace: 'return $1>=44032&&$1<=55203||$1>=12592&&$1<=12687||$1>=4352&&$1<=4607||$1>=19968&&$1<=40959||$1>=13312&&$1<=19903||$1>=12288&&$1<=12351||$1>=65280&&$1<=65519}',
  },
  // 點陣字型只在空白處斷行：含中文的詞再拆成一個字一個字（句末標點黏前一個字），拆出來的片段接回去時不加空白
  {
    label: '中文斷行', optional: true,
    find: pattern('for(let <1> of <2>.split(` `)){let <3>=<4>?`${<4>} ${<1>}`:<1>;'),
    replace: `for(let $1 of $2.split(\` \`).flatMap(w=>(w.match(/[${CJK}][${CLOSING}]*|[^${CJK}]+/g)??[w]).map((x,j)=>j?\`\\u0001\${x}\`:x))){let g=$1[0]===\`\\u0001\`;$1=g?$1.slice(1):$1;let $3=$4?g?$4+$1:\`\${$4} \${$1}\`:$1;`,
  },
  // 標題畫面、主選單底部的版權聲明：中文時第一段寬度上限縮成 360，在句號處折成兩行，不蓋到版本號
  {
    label: '版權聲明寬度', optional: true,
    find: pattern('let <1>={...<2>(<3>),maxWidth:<4>},<5>=[<3>.text(<6>,<1>),'),
    replace: 'let $1={...$2($3),maxWidth:$4},$5=[$3.text($6,document.documentElement.lang===`zh-Hant`?{...$1,maxWidth:360}:$1),',
  },
];
