// 各翻譯語言的設定，工具共用。新增語言：在這裡加一筆，patch-rules.mjs 的 LANGUAGES 也加一筆
//   col：D2R 字串檔裡的欄位
//   script：譯文該有的文字（拿來判斷 D2R 的這個語言欄位是不是真的有翻，沒翻的會是英文）
//   affixForm：稀有名稱的前段／後段專用的形式（繁中後段「之咬」、日文前段「獣の」）。
//              沒有前綴的單一英文字是一般名詞（遊戲整句查不到時會逐字翻），不能用這種形式
//   skip：D2R 裡不能用的譯文（日文的技能名稱有截斷過的「チェインライトニ…」）
//   font：D2R 裡給這個語言用的字型（data\hd\ui\fonts\）
//   status：發布到 manifest 的狀態。available（可用）或 beta（測試中：翻完、進遊戲驗證過，但還沒有玩家實際玩過的回報）；
//           draft：還在做，不放進 manifest
//   latin：拉丁字母的語言（譯文跟英文同一套字母，script 不能拿來判斷有沒有翻）
//   gendered：D2R 的字串有詞性標記（[ms]、[fs]、[ns]、[pl]），見 cleanD2R
//   rareJoin：稀有名稱前段和後段怎麼接（預設直接接起來）
//   字典：繁中沿用最早的路徑（dict/d2r-auto.json、dict/manual/），其他語言放在 dict/<id>/
import fs from 'node:fs';
import path from 'node:path';

export const TARGETS = {
  'zh-TW': { col: 'zhTW', name: '繁體中文', script: /[一-鿿]/, affixForm: v => v.startsWith('之'), font: 'blizzardglobaltcunicode.ttf', status: 'available' },
  'zh-CN': { col: 'zhCN', name: '简体中文', script: /[一-鿿]/, affixForm: v => v.startsWith('之'), font: 'blizzardglobal-v5_81.ttf', status: 'beta' },
  'ja': { col: 'jaJP', name: '日本語', script: /[぀-ヿ一-鿿]/, affixForm: v => /の$/.test(v), skip: v => v.includes('…'), font: 'bljap_v8_3.ttf', status: 'beta' },
  // 德文跟英文都是拉丁字母，不能用文字範圍判斷有沒有翻（latin）；點陣字型本來就有 ä ö ü ß（Latin-1），不用另外的字型。
  // 稀有名稱前段是「Bestien -」，跟後段接成「Bestien-Schneide」；詞性見下面的 gendered
  'de': {
    col: 'deDE', name: 'Deutsch', latin: true, gendered: true, script: /[A-Za-zÄÖÜäöüß]/,
    affixForm: v => / -$/.test(v), rareJoin: (front, back) => / -$/.test(front) ? `${front.slice(0, -2)}-${back}` : `${front} ${back}`,
    status: 'draft',
  },
};

// D2R 字串 → 一般顯示用的文字：拿掉顏色碼（ÿc4）和詞性標記。
// 德文、法文這類有詞性的語言，形容詞會列出每種詞性的形式「[fs]robuste[ms]robuster[ns]robustes[pl]robuste」，
// 名詞前面標自己的詞性「[fs]Kappe」。一般顯示用陽性單數（沒有就用第一個）
export function cleanD2R(s) {
  s = s.replace(/ÿc./g, '');
  const forms = genderForms(s);
  return (forms ? forms.ms ?? Object.values(forms)[0] : s.replace(/\[[a-z]{2}\]/g, '')).trim();
}
// 「[fs]robuste[ms]robuster…」→ { fs: 'robuste', ms: 'robuster', … }；不是多種詞性的形式就回傳 null
export function genderForms(s) {
  const parts = [...s.replace(/ÿc./g, '').matchAll(/\[([a-z]{2})\]([^[]*)/g)];
  if (parts.length < 2 || s.replace(/ÿc./g, '').trim().indexOf('[') !== 0) return null;
  return Object.fromEntries(parts.map(([, g, v]) => [g, v.trim()]));
}
// 「[fs]Kappe」→ 'fs'；沒有標記或是多種詞性的形式就回傳 null
export function nounGender(s) {
  const m = /^\[([a-z]{2})\][^[]*$/.exec(s.replace(/ÿc./g, '').trim());
  return m ? m[1] : null;
}

export function target(id = 'zh-TW') {
  const t = TARGETS[id];
  if (!t) throw new Error(`不認得的語言：${id}（可用：${Object.keys(TARGETS).join('、')}）`);
  const base = id === 'zh-TW' ? 'dict' : `dict/${id}`;
  return {
    id, ...t,
    // 譯文是不是這個語言：中日文看文字範圍；拉丁字母的語言沒辦法判斷，有字就算
    isText: v => t.latin ? /\S/.test(v) : t.script.test(v),
    rareJoin: t.rareJoin ?? ((front, back) => front + back),
    auto: `${base}/d2r-auto.json`,
    manual: id === 'zh-TW' ? 'dict/manual' : `dict/${id}/manual`,
    out: `dict/${id}.json`,
    fonts: id === 'zh-TW' ? 'work/fonts-zh' : `work/fonts/${id}`,
  };
}

// 從命令列取出 --lang <id>，其餘參數照原順序回傳
export function takeLang(argv) {
  const i = argv.indexOf('--lang');
  if (i < 0) return { lang: target(), args: argv };
  return { lang: target(argv[i + 1]), args: [...argv.slice(0, i), ...argv.slice(i + 2)] };
}

// 合併時的字典層次（後面的蓋過前面的），merge-dict 和 where 共用
export function layers(lang) {
  const dir = lang.manual;
  const list = re => fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => re.test(n)).sort().map(n => path.join(dir, n).replace(/\\/g, '/')) : [];
  return [lang.auto, ...list(/^audit-.*\.json$/), ...list(/^ui-.*\.json$/), ...list(/^long-.*\.json$/), ...list(/^new-.*\.json$/), ...list(/^modifiers\.json$/), ...list(/^overrides\.json$/)].filter(f => fs.existsSync(f));
}
