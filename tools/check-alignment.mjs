// 檢查譯文有沒有對錯 key（例如分段翻譯時把別批的譯文接上來）：
// 英文裡的數字（40%、1.5、3）應該都出現在譯文裡；一批裡大量對不上就是錯位
//   node tools/check-alignment.mjs <字典 .json…>
import fs from 'node:fs';

const numbers = s => (s.match(/\d+(?:\.\d+)?/g) ?? []);
for (const file of process.argv.slice(2)) {
  const dict = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  let withNumbers = 0;
  const bad = [];
  for (const [key, zh] of Object.entries(dict)) {
    const want = numbers(key);
    if (!want.length) continue;
    withNumbers++;
    const have = numbers(zh);
    const missing = want.filter(n => !have.includes(n));
    if (missing.length) bad.push({ key, zh, missing });
  }
  console.log(`${file}：有數字的 ${withNumbers} 條，數字對不上 ${bad.length} 條`);
  for (const b of bad.slice(0, 5)) console.log(`   缺 ${b.missing.join(',')}｜${b.key.slice(0, 70)}\n      → ${b.zh.slice(0, 70)}`);
}
