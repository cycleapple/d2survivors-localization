// app.asar 的修改規則。patch.mjs 直接用，make-manifest.mjs 寫進 manifest.json 給啟動器用。
// 每條規則：在 assets 裡找到檔案（file 是檔名的 regex；沒有的話就找唯一含有 from 的 .js），
// from 必須剛好出現一次，換成 to。from／to 裡的 {{menu_name}}、{{html_lang}} 依語言代換。
// groups：base 每種翻譯語言都套用（English／한국어原版是真正的原版，不套任何規則）；dict 換掉韓文字典的語言才套用；cjk 中日文才套用；
//   magic-zh／magic-ja 魔法物品名稱的組合順序（照 D2R 各語言的 MagicFormat）；fullwidth 冒號用全形（只有繁中）；
//   magic-de／magic-fr／magic-ru、unique-de／unique-fr／unique-ru 有詞性的語言組名稱；cyrillic、font-ru 俄文的字；
//   gender 女性職業用陰性稱號、caps 原文全大寫時譯文也全大寫（德、法、俄、波蘭文）。

export const ASSETS_DIR = 'desktop/dist/web/assets';

// 換掉韓文字典的位置（ko 槽位）
export const DICT_TARGET = { file: '^ko-.*\\.js$', template: 'var e={{dict}};export{e as default};' };

const CJK = '\\u3000-\\u9fff\\uff00-\\uffef';
// 不放在行首的字：句末標點、右括號，加上日文的長音、中點和小寫假名（禁則），和半形的 : ; , . ! ? )（「ライトニングセントリー: +4%」不會斷在冒號前）
const CLOSING = ':;,.!?)\\u3001\\u3002\\uff0c\\uff1a\\uff1b\\uff01\\uff1f\\uff09\\u300d\\u300f\\u3011\\u30fc\\u30fb\\u3041\\u3043\\u3045\\u3047\\u3049\\u3063\\u3083\\u3085\\u3087\\u308e\\u30a1\\u30a3\\u30a5\\u30a7\\u30a9\\u30c3\\u30e3\\u30e5\\u30e7\\u30ee\\u30f5\\u30f6';
// 不放在行尾的字：左括號
const OPENING = '\\u300c\\u300e\\u3010\\uff08';
const HANGUL_RANGES = 'return t>=44032&&t<=55203||t>=12592&&t<=12687||t>=4352&&t<=4607}';
// 漢字、擴充 A、中文標點、全形字元、平假名和片假名
const CJK_RANGES = '||t>=19968&&t<=40959||t>=13312&&t<=19903||t>=12288&&t<=12351||t>=65280&&t<=65519||t>=12352&&t<=12543';

// 有詞性的語言（德、法、俄）的名稱組合，參考實作是 work/translation/compose-proto.mjs（網頁書籤的 web-rules.mjs 輸出要一樣）。
// 字典裡 affix:<詞綴>、unique:<前段> 是每種詞性的形式「[ms]прочный[fs]прочная…」，gender:<名詞> 是名詞的詞性（ms／fs／ns／pl，法文複數 mp／fp，波蘭文中性和複數 nl）
// 挑出詞性 G 的形式：沒有標記就原樣，找不到那個詞性就用第一個
const pick = G => `k=v=>{if(!v.startsWith(\`[\`))return v;let o=v.split(\`[\`).slice(1),w=o.find(x=>x.startsWith(${G}+\`]\`))??o[0];return w.slice(w.indexOf(\`]\`)+1).trim()}`;
// 第一個字母大寫、小寫
const CASE = 'U=v=>v?v[0].toUpperCase()+v.slice(1):v,W=v=>v?v[0].toLowerCase()+v.slice(1):v';
// 魔法物品：遊戲的 translateMagic(e 全名, t 物品)，r 前綴、i 後綴、a 查 affix:。物品的詞性直接查字典（s 是遊戲正規化 key 的函式）
const MAGIC_FROM = 'return[a(i),a(r),this.translateAs(`item`,t)].filter(Boolean).join(` `)';
const magic = expr => `let g=this.exact.get(s(\`gender:\${t.trim()}\`))??\`ms\`,${pick('g')},${CASE},b=this.translateAs(\`item\`,t),p=k(a(r)),q=k(a(i));return ${expr}`;
// 獨特怪物：keepSave 的 Ma(e 查詢函式, t 名稱)，n 是英文的 [前段, 後段, 稱號]，r／i／a 是各段的譯文。
// e(`gender`,…) 查不到時會退回一般翻譯，所以要確認拿到的是詞性代碼
const UNIQUE_FROM = 'let[r,i,a]=n.map(t=>e(`unique`,t));return`${a} ${r} ${i}`';
const unique = expr => `let[r,i,a]=n.map(t=>e(\`unique\`,t)),G=e(\`gender\`,n[1]);G=/^(ms|fs|ns|nl|pl|mp|fp)$/.test(G)?G:\`ms\`;let ${pick('G')},${CASE};return${expr}`;

export const RULES = [
  // 啟動器用 D2S_QUERY=d2slang=ko 指定語言（翻譯放在 ko 槽位）：只記在這個視窗的 sessionStorage，
  // 不寫進 localStorage。否則遊戲存的語言會變成 ko，玩家之後選原版（不套任何規則、不理會 d2slang）時會開成韓文。
  // 同一個視窗裡重新載入（遊戲更新等）照樣用 sessionStorage 的語言
  {
    label: '啟動器指定語言', groups: ['base'], file: '^lang-.*\\.js$',
    from: 'let e=null;try{e=localStorage.getItem(A)}catch{}',
    to: 'let e=null;try{let q=new URLSearchParams(location.search).get(`d2slang`);q&&!sessionStorage.getItem(`d2slang`)&&sessionStorage.setItem(`d2slang`,q);e=sessionStorage.getItem(`d2slang`)??localStorage.getItem(A)}catch{}',
  },
  // 在遊戲裡切換語言時，sessionStorage 也跟著換（遊戲本身照常存進 localStorage，那是玩家自己選的）
  {
    label: '遊戲裡切換語言', groups: ['base'], file: '^lang-.*\\.js$',
    from: 'j=e;try{localStorage.setItem(A,e)}catch{return}',
    to: 'j=e;try{sessionStorage.setItem(`d2slang`,e);localStorage.setItem(A,e)}catch{return}',
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
  // 德文「前綴 物品 後綴」（D2R MagicFormat %0 %1 %2），前綴結尾是「 -」時跟物品用連字號接（Engels-Ring），句首大寫：Robuste Kappe des Geistes
  // 有前綴、物品名稱又是兩個字以上時，物品名稱第一個字母改小寫（「Robuste」+「Schwere Handschuhe」→ Robuste schwere Handschuhe）；
  // 字典裡的物品名稱是大寫開頭（白色物品單獨顯示時用），一個字的（Kappe）和沒有前綴的照舊
  { label: '魔法物品名稱組合（德文）', groups: ['magic-de'], file: '^lang-.*\\.js$', from: MAGIC_FROM, to: magic('U([p&&(p.endsWith(` -`)?`${p.slice(0,-2)}-${b}`:`${p} ${b.includes(` `)?W(b):b}`),!p&&b,q].filter(Boolean).join(` `))') },
  // 法文「物品 前綴 後綴」（%1 %0 %2）：Coiffe solide de l’esprit
  { label: '魔法物品名稱組合（法文）', groups: ['magic-fr'], file: '^lang-.*\\.js$', from: MAGIC_FROM, to: magic('[b,p,q].filter(Boolean).join(` `)') },
  // 俄文「前綴 物品 後綴」（%0 %1 %2），有前綴時物品小寫開頭，句首大寫：Прочный наголовник разума
  { label: '魔法物品名稱組合（俄文）', groups: ['magic-ru'], file: '^lang-.*\\.js$', from: MAGIC_FROM, to: magic('U([p,p?W(b):b,q].filter(Boolean).join(` `))') },
  // 波蘭文「前綴 物品 後綴」（%0 %1 %2），不改大小寫（D2R 的名稱本來就每個字大寫開頭）：Masywny Kaptur Umysłu
  { label: '魔法物品名稱組合（波蘭文）', groups: ['magic-pl'], file: '^lang-.*\\.js$', from: MAGIC_FROM, to: magic('[p,b,q].filter(Boolean).join(` `)') },
  // 獨特怪物名字（遊戲照韓文排成「稱號 前段 後段」）。
  // 依賴壓縮名稱（Ma 的 e、n），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.2）
  // 德文「前段-後段 稱號」（D2R Monster2Format a0n1）：Düsternis-Hauer der Hungrige
  { label: '獨特怪物名字（德文）', groups: ['unique-de'], from: UNIQUE_FROM, to: 'let[r,i,a]=n.map(t=>e(`unique`,t));return`${r.endsWith(` -`)?`${r.slice(0,-2)}-${i}`:`${r} ${i}`} ${a}`' },
  // 法文「後段 前段 稱號」，前段照後段的詞性挑：Croc mélancolique l’Affamé
  { label: '獨特怪物名字（法文）', groups: ['unique-fr'], from: UNIQUE_FROM, to: unique('`${i} ${k(r)} ${W(a)}`') },
  // 俄文「稱號, 前段 後段」（D2R 的「%2, %0 %1」），前段照後段的詞性挑：Голод, Мрачный клык
  { label: '獨特怪物名字（俄文）', groups: ['unique-ru'], from: UNIQUE_FROM, to: unique('`${U(a)}, ${U(k(r))} ${W(i)}`') },
  // 波蘭文「稱號, 前段 後段」（D2R 的「%2, %0 %1」），前段照後段的詞性挑，不改大小寫：Żarłok, Mroczny Kieł
  { label: '獨特怪物名字（波蘭文）', groups: ['unique-pl'], from: UNIQUE_FROM, to: unique('`${a}, ${k(r)} ${i}`') },
  // 英雄稱號的陰性形式：遊戲只有 Matriarch／Patriarch 依職業分，Destroyer、Conqueror、Guardian、Slayer、Champion 不分，
  // 德、法、俄、波蘭文的女性職業（Bg：amazon、assassin、sorceress）會顯示陽性（Zerstörer）。
  // 女性職業先查 title:<稱號>:f（Zerstörerin），查不到（翻譯函式原樣傳回）就照一般的 title:<稱號>。
  // 依賴壓縮名稱（SO、o_、xi、V、Dt、title 翻譯函式 u、女性職業 r_），對不上時 check-rules 會報（2026.1027.4；2026.1027.2 是 rO、Ug、st、R、qe、Bg）
  // 只有 gender 群組（德、法、俄、波蘭文）：其他語言沒有 :f 的 key，查不到時翻譯器可能把「Destroyer:f」拆開翻成別的字串
  {
    label: '女性職業的稱號', groups: ['gender'], file: '^Game-.*\\.js$',
    from: 'function SO(e,t){let n=o_(e,t);if(!n)return null;let r=xi(e,t);return r>0&&!V(e,t)?`${u(n)} · ${Dt(r)}`:u(n)}',
    to: 'function SO(e,t){let n=o_(e,t);if(!n)return null;let F=r_.includes(t)?u(`${n}:f`):null,T=F&&F!==`${n}:f`?F:u(n),r=xi(e,t);return r>0&&!V(e,t)?`${T} · ${Dt(r)}`:T}',
  },
  // 角色畫面的「Survivor」（沒有稱號時顯示的名字）不經過稱號函式，直接寫 fit(`Survivor`)：
  // 女性職業先查 title:Survivor:f（Überlebende），查不到照原本的 Survivor。v 是 saveTransfer 匯入的翻譯函式，
  // 依賴壓縮名稱（iu、v），對不上時 check-rules 會報（2026.1027.4；2026.1027.2 是 Ql）
  {
    label: '女性職業的 Survivor', groups: ['gender'], file: '^saveTransfer-.*\\.js$',
    from: 'r.push(e.inspect?this.nameBox(e.inspect.name):this.fit(`Survivor`,iu.name,`white`),a)',
    to: 'let $f=[`amazon`,`assassin`,`sorceress`].includes(e.cls)?v(`title:Survivor:f`):null;r.push(e.inspect?this.nameBox(e.inspect.name):this.fit($f&&$f!==`title:Survivor:f`?$f:`Survivor`,iu.name,`white`),a)',
  },
  // 全大寫：翻譯器查字典不分大小寫，SHIELDS 和 Shields、ROGUE ENCAMPMENT 和 Rogue Encampment 是同一個譯文，
  // 英文原文全大寫的地方（拾取篩選器、控制器設定、死亡畫面的按鈕）會變成大小寫混合。
  // 英文有兩個以上的大寫字母、沒有小寫字母時，譯文也轉成全大寫（照語言轉：德文 ß → SS）。查不到的照原樣
  {
    label: '全大寫的原文', groups: ['caps'], file: '^lang-.*\\.js$',
    from: 'let n=this.find(e,0),r=n??e;',
    to: 'let n=this.find(e,0),r=n??e;n!==null&&/[A-Z].*[A-Z]/s.test(e)&&!/[a-z]/.test(e)&&(r=n.toLocaleUpperCase(`{{html_lang}}`));',
  },
  {
    label: '全大寫的原文（分類查詢）', groups: ['caps'], file: '^lang-.*\\.js$',
    from: 'translateAs(e,t){return this.exact.get(s(`${e}:${t.trim()}`))??this.translate(t)}',
    to: 'translateAs(e,t){let n=this.exact.get(s(`${e}:${t.trim()}`));return n===void 0?this.translate(t):/[A-Z].*[A-Z]/s.test(t)&&!/[a-z]/.test(t)?n.toLocaleUpperCase(`{{html_lang}}`):n}',
  },
  // 升級卡片、HUD 的進化條件：遊戲在每個條件後面接半形「,」（點陣字型看起來像句點），中日文改成「、」。
  // 條件先翻譯好再接（接上「、」後就沒有英文字母，畫的時候不會再查一次字典）。v 是 saveTransfer 匯入的翻譯函式（2026.1027.2）
  {
    label: '進化條件的頓號（升級卡片）', groups: ['cjk'], file: '^saveTransfer-.*\\.js$',
    from: '{text:n<e.needs.length-1?`${t.text},`:t.text,color:t.met?`white`:`red`}',
    to: '{text:n<e.needs.length-1?`${v(t.text)}、`:t.text,color:t.met?`white`:`red`}',
  },
  {
    label: '進化條件的頓號（HUD）', groups: ['cjk'], file: '^saveTransfer-.*\\.js$',
    from: 'n.text+(r<e.needs.length-1?`,`:``)',
    to: '(r<e.needs.length-1?`${v(n.text)}、`:n.text)',
  },
  // 日期：遊戲在語言是 ko 時寫死韓文的日期格式（「10월 27일」），翻譯放在 ko 槽位，排行榜和存檔的日期會變成韓文。
  // 改成照 <html lang> 用瀏覽器的格式（繁中「10月27日」、德文「27. Okt.」、俄文「27 окт.」）
  {
    label: '日期格式（排行榜）', groups: ['dict'], file: '^Game-.*\\.js$',
    from: 't===`ko`?`${n.getMonth()+1}월 ${n.getDate()}일`:',
    to: 't===`ko`?n.toLocaleDateString(document.documentElement.lang,{month:`short`,day:`numeric`}):',
  },
  {
    label: '日期格式（完整）', groups: ['dict'], file: '^Game-.*\\.js$',
    from: 'return t===`ko`?`${n.getFullYear()}년 ${n.getMonth()+1}월 ${n.getDate()}일`:',
    to: 'return t===`ko`?n.toLocaleDateString(document.documentElement.lang,{year:`numeric`,month:`long`,day:`numeric`}):',
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
  // 俄文：西里爾字母（U+0400–04FF）點陣字型也沒有，一樣當外文字
  { label: '外文字判斷（西里爾字母）', groups: ['cyrillic'], from: HANGUL_RANGES, to: HANGUL_RANGES.slice(0, -1) + '||t>=1024&&t<=1279}' },
  // 波蘭文：ą ć ę ł ń ś ź ż（拉丁擴充 A，U+0100–017F）點陣字型只有 Latin-1，也當外文字（群組名稱跟網頁書籤一樣）
  { label: '外文字判斷（拉丁擴充 A）', groups: ['latin-ext'], from: HANGUL_RANGES, to: HANGUL_RANGES.slice(0, -1) + '||t>=256&&t<=383}' },
  // 外文字大小（波蘭文）：遊戲照韓文放大（有 D2R 韓文字型時標題 ×1.25～1.4、內文 ×1.3 加粗；沒有時 12／15／24 px），
  // 波蘭文只有幾個字母走外文字、夾在點陣字母中間，會比旁邊的字大一號：標題 ×1.2、內文 ×1.0，不加粗。
  // 標題字型（exocet）不管有沒有 D2R 韓文字型都用 D2R Kodia 這個家族，才會用到 font-pl 註冊的 Exocet。
  // 依賴壓縮名稱（ne 是否有 D2R 韓文字型，g／te／re／ee 是四個字型家族），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.2）
  {
    label: '外文字大小（波蘭文）', groups: ['size-pl'],
    from: 'if(ne()){let e=a>=20?1.25:1.4;[this.foreignSize,this.foreignFamily]=o?[Math.round(a*e),g]:[Math.max(12,Math.round(a*1.3)),te],this.foreignWeight=o?``:`bold `}else[this.foreignSize,this.foreignFamily]=a<14?[12,re]:a<20?[15,ee]:[24,re];',
    to: '[this.foreignSize,this.foreignFamily]=o?[Math.round(a*(a<16?1.5:1.2)),g]:[Math.max(12,Math.round(a)),ne()?te:a<14?re:a<20?ee:re],this.foreignWeight=``;',
  },
  // 外文字的符號（波蘭文）：按鈕字（fontexocet10）大約 11～13 px，Exocet 的 Ś、Ć、Ź 在 11、13 px 直接畫時
  // 尖音符號會整個消失（12、14 px 又有，跟字級和像素格子對齊有關，不是被切掉），Ą 的尾巴也會不見。
  // 標題字型家族（D2R Kodia，g）改成在 4 倍大的暫存 canvas 上畫，再縮小貼回去，符號就留得住（稍微淡一點）；
  // 內文字型直接畫（小字縮小後會太淡，像 ą 會糊成一個點）。
  // 另外符號比點陣字型的格子高（字形高 773／1000，S 只到 592），文字 canvas 上方放不下時，
  // 先往下移（最多移到底部的空間用完），還超出的部分把這個字垂直壓扁到放得下
  {
    label: '外文字不被切掉（波蘭文）', groups: ['size-pl'],
    from: 'for(let n of t)Pp(n)&&e.fillText(n,s+a,r+this.baseline+o),s+=this.advanceOf(n)',
    to: 'for(let n of t){if(Pp(n)){let Z=this.foreignFamily===g?4:1,c=document.createElement(`canvas`),q=c.getContext(`2d`),F=e.font.replace(/([\\d.]+)px/,(x,v)=>v*Z+`px`);q.font=F;let M=q.measureText(n),A=M.actualBoundingBoxAscent/Z,D=M.actualBoundingBoxDescent/Z,L=M.actualBoundingBoxLeft/Z,R=M.actualBoundingBoxRight/Z,h=r+this.baseline,d=Math.max(0,Math.min(Math.ceil(A-h),Math.floor(e.canvas.height-h-D))),y=h+d,k=A>y?y/A:1;if(Z>1){c.width=Math.ceil((L+R+2)*Z);c.height=Math.ceil((A+D+2)*Z);q.font=F;q.fillStyle=e.fillStyle;q.fillText(n,(L+1)*Z,(A+1)*Z);e.imageSmoothingQuality=`high`;e.drawImage(c,s+a-L-1,y+o-(A+1)*k,c.width/Z,c.height/Z*k)}else{e.save();e.translate(s+a,y+o);e.scale(1,k);e.fillText(n,0,0);e.restore()}}s+=this.advanceOf(n)}',
  },
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
  // 沒有字型檔時（從啟動器套用的都是這樣）：先註冊這個語言的系統字型（簡中微軟雅黑、日文遊ゴシック、繁中微軟正黑），
  // 不交給 Chromium 自己挑：自己挑時會照字找字型，簡中同一行混用兩種字型（繁中字型少了簡體字），日文粗體會用到中文字型。
  // 系統字型先註冊、字型檔後註冊：同一個家族裡後註冊的優先，字型檔（只含字典用到的字）缺的字再用系統字型
  {
    label: '中文字型', groups: ['cjk'], file: '^lang-.*\\.js$',
    from: 'if(typeof FontFace>`u`)return;',
    to: 'if(typeof FontFace>`u`)return;{let $r=`U+3000-30FF, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF`,$a=async(f,s)=>{try{document.fonts.add(await new FontFace(f,s,{unicodeRange:$r}).load())}catch{}},$n=[`D2R Kodia`,`D2R Iris`,`D2 Hangul`,`D2 Hangul 14`],$s=({[`zh-Hans`]:[`Microsoft YaHei`,`MicrosoftYaHei`,`Microsoft YaHei UI`,`DengXian`,`SimSun`],ja:[`Yu Gothic Medium`,`YuGothic-Medium`,`Yu Gothic Regular`,`YuGothic-Regular`,`Meiryo`,`MS Gothic`]})[`{{html_lang}}`]??[`Microsoft JhengHei`,`MicrosoftJhengHeiRegular`,`Microsoft JhengHei UI`,`PMingLiU`];await Promise.all($n.map(f=>$a(f,$s.map(n=>`local("${n}")`).join(`,`))));await Promise.all($n.map(f=>$a(f,`url(${new URL(`../fonts-zh/body.woff2`,document.baseURI).href})`)))}',
  },
  // 俄文字型：同樣的做法，標題字型（D2R Kodia）用 title.woff2（D2R 的 Exocet），其他用 body.woff2（Philosopher），範圍限定西里爾字母。
  // 字型檔是 zh-fonts.mjs --lang ru 取出的，跟中文一樣放在 fonts-zh/；沒有時用系統字型
  {
    label: '俄文字型', groups: ['font-ru'], file: '^lang-.*\\.js$',
    from: 'if(typeof FontFace>`u`)return;',
    to: 'if(typeof FontFace>`u`)return;await Promise.all([[`D2R Kodia`,`title.woff2`],[`D2R Iris`,`body.woff2`],[`D2 Hangul`,`body.woff2`],[`D2 Hangul 14`,`body.woff2`]].map(async([f,n])=>{try{document.fonts.add(await new FontFace(f,`url(${new URL(`../fonts-zh/${n}`,document.baseURI).href})`,{unicodeRange:`U+0400-04FF`}).load())}catch{}}));',
  },
  // 波蘭文字型：標題字型（D2R Kodia）用 title.woff2（D2R 的 Exocet），其他用 body.woff2（Formal436，D2R 拉丁字母的內文字型），
  // 範圍限定拉丁擴充 A。字型檔是 zh-fonts.mjs --lang pl 取出的，放在 fonts-zh/；沒有時用系統字型
  {
    label: '波蘭文字型', groups: ['font-pl'], file: '^lang-.*\\.js$',
    from: 'if(typeof FontFace>`u`)return;',
    to: 'if(typeof FontFace>`u`)return;await Promise.all([[`D2R Kodia`,`title.woff2`],[`D2R Iris`,`body.woff2`],[`D2 Hangul`,`body.woff2`],[`D2 Hangul 14`,`body.woff2`]].map(async([f,n])=>{try{document.fonts.add(await new FontFace(f,`url(${new URL(`../fonts-zh/${n}`,document.baseURI).href})`,{unicodeRange:`U+0100-017F`}).load())}catch{}}));',
  },
  // 外文字的顏色是照點陣字型推算的：亮度夠的像素當填色，其餘超過三成就當描邊，畫的時候再乘上指定的顏色。
  // 石頭按鈕的黑字邊緣有一圈較淡的像素，會被當成「灰色填色（#3f3f3f）＋黑色描邊（#070707）」，中文看起來像空心的灰字。
  // 最後算出來的填色很暗、又比描邊淡時，只用描邊的顏色畫實心字（跟英文一樣），再往右 1 像素多畫一次當粗體
  // （英文按鈕字很粗，單畫一次的中文太細）；亮色字（金字、白字）的填色亮，不受影響。
  // 「很暗」的門檻 75：按鈕字的填色最亮 63，升級畫面標題那種褐金色是 97，要照原本的畫法
  {
    label: '暗色字不加描邊', groups: ['cjk', 'cyrillic', 'latin-ext'],
    from: 'c=[];if(a.outline){let e=`rgb(${o(a.outline.level,a.outline.own)})`;for(let[t,n]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])c.push([e,t*s,n*s])}c.push([`rgb(${o(a.level,a.own)})`,0,0]);',
    to: 'c=[],F=o(a.level,a.own),U=a.outline&&o(a.outline.level,a.outline.own),M=e=>Math.max(...e.split(`,`).map(Number)),D=U&&M(F)<75&&M(U)<M(F);if(a.outline&&!D){let e=`rgb(${U})`;for(let[t,n]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])c.push([e,t*s,n*s])}c.push([`rgb(${D?U:F})`,0,0]);D&&c.push([`rgb(${U})`,1,0]);',
  },
  // 標題畫面、主選單底部的版權聲明寬度上限 700：英文會折成兩行，中文比較短只排一行，最底下那行太寬會蓋到左下角的版本號。
  // 這個語言時把第一段（非官方聲明）的上限縮成 360，剛好在句號處折成兩行；標題畫面下一行的 © 聲明照 700，
  // 切回英文時也照原本的 700
  {
    label: '版權聲明寬度', groups: ['cjk'],
    // 依賴壓縮名稱（Y、_r、q），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.4；2026.1027.2 是 fr、J）
    from: 'let r={...Y(e),maxWidth:_r},i=[e.text(q,r)',
    to: 'let r={...Y(e),maxWidth:_r},i=[e.text(q,document.documentElement.lang===`{{html_lang}}`?{...r,maxWidth:360}:r)',
  },
  // 技能變體名稱：有些變體跟別的技能同名（荊棘之靈的 Vengeance vs 聖騎士的 Vengeance），遊戲只有一個 key，
  // 變體卡片會顯示成別的職業的技能。變體表（keepSave 的 zs={技能 id:[{id,name,describe}…]}）定義完之後，
  // 把每個變體的 name 換成 getter：翻譯時先查 modifier:名稱（例如 modifier:Vengeance），查不到就照一般譯名；
  // 沒在翻譯（英文）時照原本的英文。m = 語言模組的 translateAs，h = 是否正在翻譯（keepSave 的匯入名稱）。
  // 專用譯名在 dict/manual/modifiers.json，決定的原因見 docs/term-decisions.md
  {
    label: '技能變體專用譯名', groups: ['dict'],
    // 依賴壓縮名稱（變體表 ws、後面的 Ts、Es、Ds，匯入的 h、m），遊戲改版後用 tools/find-anchors.mjs 找新的寫法（2026.1027.4；2026.1027.2 是 ks、As、js、Ms）
    from: "]},Ts={raiseSkeleton:`Evolved: Revive's skeletons take this option`},Es={};function Ds(e,t){",
    to: "]},Ts={raiseSkeleton:`Evolved: Revive's skeletons take this option`},Es={};for(let l of Object.values(ws))for(let o of l){let n=o.name;Object.defineProperty(o,`name`,{get:()=>h()?m(`modifier`,n):n,enumerable:!0,configurable:!0})}function Ds(e,t){",
  },
];

// 啟動器能選的翻譯語言（en、ko 原版是啟動器內建的）
export const LANGUAGES = [
  { id: 'zh-TW', name: '繁體中文', menu_name: '繁體中文', html_lang: 'zh-Hant', groups: ['base', 'dict', 'cjk', 'magic-zh', 'fullwidth'], dict: 'dict/zh-TW.json' },
  { id: 'zh-CN', name: '简体中文', menu_name: '简体中文', html_lang: 'zh-Hans', groups: ['base', 'dict', 'cjk', 'magic-zh'], dict: 'dict/zh-CN.json' },
  { id: 'ja', name: '日本語', menu_name: '日本語', html_lang: 'ja', groups: ['base', 'dict', 'cjk', 'magic-ja'], dict: 'dict/ja.json' },
  { id: 'de', name: 'Deutsch', menu_name: 'Deutsch', html_lang: 'de', groups: ['base', 'dict', 'gender', 'caps', 'magic-de', 'unique-de'], dict: 'dict/de.json' },
  { id: 'fr', name: 'Français', menu_name: 'Français', html_lang: 'fr', groups: ['base', 'dict', 'gender', 'caps', 'magic-fr', 'unique-fr'], dict: 'dict/fr.json' },
  { id: 'ru', name: 'Русский', menu_name: 'Русский', html_lang: 'ru', groups: ['base', 'dict', 'gender', 'caps', 'cyrillic', 'font-ru', 'magic-ru', 'unique-ru'], dict: 'dict/ru.json' },
  { id: 'pl', name: 'Polski', menu_name: 'Polski', html_lang: 'pl', groups: ['base', 'dict', 'gender', 'caps', 'latin-ext', 'font-pl', 'size-pl', 'magic-pl', 'unique-pl'], dict: 'dict/pl.json' },
];

export function fillTemplate(s, lang) {
  return s.replaceAll('{{menu_name}}', lang.menu_name).replaceAll('{{html_lang}}', lang.html_lang);
}
