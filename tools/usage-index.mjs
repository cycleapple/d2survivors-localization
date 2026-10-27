// 字串用途索引：解析遊戲程式碼和資料檔，找出字典裡每個英文 key 在遊戲裡出現在哪裡、當什麼用
//   node tools/usage-index.mjs <app.asar 解開的 web 資料夾> <從 D2 取出的資料夾> <ko.json> <輸出 .json>
// 用途是從字串在程式碼裡的位置推斷的：所在的屬性名稱、往上幾層的路徑、同一個物件裡的其他欄位。例如
//   skills:{fireBolt:{name:`Fire Bolt`,element:…,tree:…}}    → 技能
//   {id:`vortex`,name:`Vortex`,describe:`…`}                 → 技能變體
//   fcr:{name:…,describe:…,maxRank:…,baseCost:…,ware:…}     → 恰西強化
//   {text:`Required Level: ${n}`,color:…}                    → 說明框的一行
// 樣板字串的 ${…} 當成 *，對到字典 key 的 * 或 #
import { parse } from 'acorn';
import { fullAncestor } from 'acorn-walk';
import fs from 'node:fs';
import path from 'node:path';

const [webDir, d2Dir, koFile, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/usage-index.mjs <web 資料夾> <D2 資料夾> <ko.json> <輸出 .json>'); process.exit(1); }

const PREFIX = /^(item|affix|monster|unique|title):/;
const norm = s => s.replace(/[#*]/g, '*').replace(/\s+/g, ' ').trim().toUpperCase();
// 第二種比對：程式裡的複數常寫成 `bolt${s}`，key 是「bolt」，把黏在字上的 * 拿掉再比
const loose = s => norm(s).replace(/\*(?=[A-Z])|(?<=[A-Z])\*/g, '');
const ko = JSON.parse(fs.readFileSync(koFile, 'utf8'));
const byNorm = new Map(), byLoose = new Map();
const add = (map, n, key) => (map.get(n) ?? map.set(n, []).get(n)).push(key);
for (const key of Object.keys(ko)) {
  add(byNorm, norm(key.replace(PREFIX, '')), key);
  add(byLoose, loose(key.replace(PREFIX, '')), key);
}
// 這些屬性的值是程式內部用的識別字（id: `vortex`），不是畫面上的字
const INTERNAL = new Set(['id', 'key', 'type', 'kind', 'sprite', 'sound', 'icon', 'file', 'code', 'base', 'stat', 'from', 'lean', 'element', 'skill', 'class']);

function classify({ file, prop, path: p, siblings, call, text, list: ctx_list }) {
  const has = k => siblings.includes(k);
  if (file === 'changelog.json') return '改版說明';
  if (file.endsWith('.json')) return `D2 資料（${file.replace('.json', '')}）`;
  if (prop === 'name' && has('id') && has('describe')) return '技能變體';
  if (prop === 'describe' && has('id') && has('name')) return '技能變體說明';
  if (prop === 'name' && (has('element') || has('tree')) ) return '技能';
  if (prop === 'name' && (has('maxRank') || has('baseCost') || has('ware'))) return '恰西強化';
  if (prop === 'name' && has('maxLevel') && (has('apply') || has('describe'))) return '被動';
  if ((prop === 'describe' || prop === 'at' || prop === 'note' || prop === 'endless') && (has('maxRank') || has('ware'))) return '恰西強化說明';
  if ((prop === 'describe' || prop === 'at') && has('maxLevel')) return '被動說明';
  if (prop === 'name' && (has('numeral') || has('zone'))) return '章節名稱';
  if (prop === 'zone') return '區域';
  if (prop === 'text' && (has('color') || has('implicit'))) return '說明框的一行';
  if (prop === 'head' || prop === 'title') return '標題';
  if (call === 'banner') return '提示橫幅';
  if (prop && siblings.length >= 8 && /^[a-z][A-Za-z0-9]*$/.test(prop)) return '名稱對照表';
  if (ctx_list) return `名稱清單（${p.at(-1) ?? '陣列'}）`;
  if (prop === 'describe' || prop === 'description') return '說明';
  if (prop === 'label' || prop === 'name') return `名稱（${p.slice(-2).join('.')}）`;
  if (/^[A-Z0-9 /&:'.!?()-]+$/.test(text) && /[A-Z]{2}/.test(text)) return '按鈕或標題（全大寫）';
  return '其他';
}

const usage = {};
function record(text, ctx) {
  if (INTERNAL.has(ctx.prop)) return;
  // 全小寫的單字（`vortex`）多半是識別字，key 是大寫開頭的（Vortex）就不算
  if (/^[a-z][a-zA-Z0-9]*$/.test(text) && !(byNorm.get(norm(text)) ?? []).some(k => k === text)) return;
  const keys = byNorm.get(norm(text)) ?? byLoose.get(loose(text));
  if (!keys) return;
  const kind = classify({ ...ctx, text });
  for (const key of keys) {
    const u = usage[key] ??= { kinds: {}, refs: [] };
    u.kinds[kind] = (u.kinds[kind] ?? 0) + 1;
    if (u.refs.length < 6) u.refs.push({ file: ctx.file, kind, path: ctx.path.join('.'), siblings: ctx.siblings.slice(0, 8).join(','), ...(ctx.call && { call: ctx.call }) });
  }
}

const keyName = k => k?.type === 'Identifier' ? k.name : k?.type === 'Literal' ? String(k.value) : null;
function contextOf(ancestors) {
  const node = ancestors.at(-1), parent = ancestors.at(-2);
  let prop = null, siblings = [], call = null;
  // 一整排字串的陣列（詞綴、怪物稱號清單）
  const list = parent?.type === 'ArrayExpression' && parent.elements.filter(e => e?.type === 'Literal' || e?.type === 'TemplateLiteral').length >= 5;
  if (parent?.type === 'Property' && parent.value === node) {
    prop = keyName(parent.key);
    const obj = ancestors.at(-3);
    if (obj?.type === 'ObjectExpression') siblings = obj.properties.map(p => keyName(p.key)).filter(Boolean);
  }
  if ((parent?.type === 'CallExpression' || parent?.type === 'NewExpression') && parent.arguments.includes(node)) {
    const c = parent.callee;
    call = c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' ? keyName(c.property) : null;
  }
  const p = [];
  for (const a of ancestors) if (a.type === 'Property' && keyName(a.key)) p.push(keyName(a.key));
  return { prop, siblings, call, list, path: p.slice(-4) };
}

// 遊戲程式碼
const assets = path.join(webDir, 'assets');
for (const file of fs.readdirSync(assets).filter(n => n.endsWith('.js') && !/^ko-/.test(n))) {
  const src = fs.readFileSync(path.join(assets, file), 'utf8');
  if (!/[A-Za-z]{3} [a-z]/.test(src)) continue;   // 沒有英文句子的（純繪圖程式庫）略過
  let ast;
  try { ast = parse(src, { ecmaVersion: 'latest', sourceType: 'module' }); } catch (e) { console.warn(`解析失敗 ${file}：${e.message}`); continue; }
  const short = file.replace(/-[\w-]{8}\.js$/, '.js');
  fullAncestor(ast, (node, _state, ancestors) => {
    if (node.type === 'Literal' && typeof node.value === 'string') record(node.value, { file: short, ...contextOf(ancestors) });
    else if (node.type === 'TemplateLiteral') record(node.quasis.map(q => q.value.cooked ?? '').join('*'), { file: short, ...contextOf(ancestors) });
  });
}

// 資料檔：改版說明，和從 D2 取出的物品、怪物、技能資料
function walkJson(v, file, p = []) {
  if (typeof v === 'string') record(v, { file, prop: p.at(-1) ?? null, path: p.slice(-4), siblings: [], call: null });
  else if (Array.isArray(v)) v.forEach(x => walkJson(x, file, p));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walkJson(x, file, [...p, k]);
}
walkJson(JSON.parse(fs.readFileSync(path.join(webDir, 'changelog.json'), 'utf8')), 'changelog.json');
for (const file of fs.readdirSync(d2Dir).filter(n => n.endsWith('.json') && !/stamp/.test(n))) {
  walkJson(JSON.parse(fs.readFileSync(path.join(d2Dir, file), 'utf8')), file);
}

fs.writeFileSync(outFile, JSON.stringify(usage, null, 1));
const found = Object.keys(usage).length, total = Object.keys(ko).length;
const byKind = {};
for (const u of Object.values(usage)) for (const k of Object.keys(u.kinds)) byKind[k] = (byKind[k] ?? 0) + 1;
console.log(`字典 ${total} 條，在遊戲程式碼或資料裡找到 ${found} 條（${(found / total * 100).toFixed(1)}%）→ ${outFile}`);
console.log(Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${k}：${n}`).join('\n'));
