// 用 acorn 解析遊戲的語系字典檔（var e={...};export{e as default}），不執行它
import { parse } from 'acorn';
import fs from 'node:fs';

export function readDict(file) {
  const ast = parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
  const obj = ast.body.find(n => n.type === 'VariableDeclaration').declarations[0].init;
  const dict = {};
  for (const p of obj.properties) {
    const key = p.key.type === 'Literal' ? p.key.value : p.key.name;
    const v = p.value;
    dict[key] = v.type === 'Literal' ? v.value : v.quasis.map(q => q.value.cooked).join('');
  }
  return dict;
}
