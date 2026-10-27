// 遊戲改版後，找出依賴壓縮名稱的修改規則在新版裡的寫法（用語法樹，不靠變數名稱）
//   node tools/find-anchors.mjs <app.asar 解開的資料夾>
// 印出「版權聲明寬度」「技能變體專用譯名」兩條規則新的 from／to，照著更新 tools/patch-rules.mjs
import { parse } from 'acorn';
import { simple, fullAncestor } from 'acorn-walk';
import fs from 'node:fs';
import path from 'node:path';

const [root] = process.argv.slice(2);
if (!root) { console.error('用法：node tools/find-anchors.mjs <app.asar 解開的資料夾>'); process.exit(1); }
const assets = path.join(root, 'desktop/dist/web/assets');
const file = re => path.join(assets, fs.readdirSync(assets).find(n => re.test(n)));
const load = f => { const src = fs.readFileSync(f, 'utf8'); return { src, ast: parse(src, { ecmaVersion: 'latest', sourceType: 'module' }) }; };
const count = (src, s) => src.split(s).length - 1;

// 語言模組：translateAs（return M?M.translateAs(e,t):t）和「是否正在翻譯」（return M!==null）匯出成什麼名稱
const lang = load(file(/^lang-.*\.js$/));
const fnByBody = {};
simple(lang.ast, {
  FunctionDeclaration(n) {
    const body = lang.src.slice(n.body.start, n.body.end);
    if (/\.translateAs\(\w+,\w+\):\w+/.test(body)) fnByBody.translateAs = n.id.name;
    if (/^\{return \w+!==null\}$/.test(body)) fnByBody.isTranslating = n.id.name;
  },
});
const langExports = {};
for (const n of lang.ast.body) if (n.type === 'ExportNamedDeclaration') for (const s of n.specifiers) langExports[s.local.name] = s.exported.name;
const exported = { translateAs: langExports[fnByBody.translateAs], isTranslating: langExports[fnByBody.isTranslating] };
console.log(`語言模組：translateAs = ${fnByBody.translateAs}（匯出為 ${exported.translateAs}），是否正在翻譯 = ${fnByBody.isTranslating}（匯出為 ${exported.isTranslating}）`);

// 技能變體表：{fireBolt:[{id,name,describe…}…],…}
const ks = load(file(/^keepSave-.*\.js$/));
const local = {};
for (const n of ks.ast.body) if (n.type === 'ImportDeclaration' && /lang-/.test(n.source.value)) for (const s of n.specifiers) local[s.imported.name] = s.local.name;
const m = local[exported.translateAs], h = local[exported.isTranslating];
let table = null;
simple(ks.ast, {
  VariableDeclarator(n) {
    const first = n.init?.type === 'ObjectExpression' && n.init.properties[0];
    if (first?.key?.name === 'fireBolt' && first.value.type === 'ArrayExpression' && first.value.elements[0]?.properties?.some(p => p.key.name === 'describe')) table = n;
  },
});
if (!table || !m || !h) console.log('技能變體專用譯名：找不到變體表或匯入名稱，要人工看');
else {
  const end = table.init.end;
  // 從物件結尾往後取到下一個 function 宣告的開頭，當作插入點
  const after = ks.src.slice(end, end + 200);
  const anchor = ks.src.slice(end - 2, end) + after.slice(0, after.indexOf('{', after.indexOf('function')) + 1);
  console.log(`\n技能變體專用譯名（變體表 ${table.id.name}，keepSave 的匯入：translateAs = ${m}、是否正在翻譯 = ${h}）`);
  console.log(`  出現次數：${count(ks.src, anchor)}（要是 1）`);
  const semi = anchor.indexOf(';') + 1;
  const insert = `for(let l of Object.values(${table.id.name}))for(let o of l){let n=o.name;Object.defineProperty(o,\`name\`,{get:()=>${h}()?${m}(\`modifier\`,n):n,enumerable:!0,configurable:!0})}`;
  console.log(`  from: ${JSON.stringify(anchor)}`);
  console.log(`  to:   ${JSON.stringify(anchor.slice(0, semi) + insert + anchor.slice(semi))}`);
}

// 版權聲明：存「Unofficial fan project…」的變數，以及 e.text(那個變數,r) 那行
const sc = load(file(/^screens-.*\.js$/));
let noticeVar = null;
simple(sc.ast, {
  VariableDeclarator(n) {
    const v = n.init?.type === 'TemplateLiteral' ? n.init.quasis.map(q => q.value.cooked).join('') : n.init?.value;
    if (typeof v === 'string' && v.startsWith('Unofficial fan project')) noticeVar = n.id.name;
  },
});
let notice = null;
fullAncestor(sc.ast, (n, _s, anc) => {
  if (notice || n.type !== 'CallExpression' || n.arguments[0]?.name !== noticeVar || n.callee.property?.name !== 'text') return;
  // 往上找宣告 r={...,maxWidth:…} 的那個 let
  const decl = [...anc].reverse().find(a => a.type === 'VariableDeclaration');
  if (decl) notice = sc.src.slice(decl.start, n.end);
});
if (!notice) console.log('\n版權聲明寬度：找不到，要人工看');
else {
  const optsVar = /let (\w+)=\{/.exec(notice)?.[1];
  const from = notice;
  const to = from.replace(`.text(${noticeVar},${optsVar})`, `.text(${noticeVar},document.documentElement.lang===\`{{html_lang}}\`?{...${optsVar},maxWidth:360}:${optsVar})`);
  console.log(`\n版權聲明寬度（聲明的變數 ${noticeVar}）`);
  console.log(`  出現次數：${count(sc.src, from)}（要是 1）`);
  console.log(`  from: ${JSON.stringify(from)}`);
  console.log(`  to:   ${JSON.stringify(to)}`);
}
