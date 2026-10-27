// 檢查譯文有沒有對錯 key（例如分段翻譯時把別批的譯文接上來）：
// 英文裡的數字（40%、1.5、3）應該都出現在譯文裡；一批裡大量對不上就是錯位
//   node tools/check-alignment.mjs <字典 .json…>
import fs from 'node:fs';

// 譯文可以用當地的數字寫法：小數逗號（德、法、俄「1,5」）、千分位的點或空格（「1.000」「1 000」），比對前換回英文寫法
const numbers = s => (s.match(/\d+(?:\.\d+)?/g) ?? []);
// （英文 key 的「1,000」也一樣拿掉千分位，兩邊都寫成 1000）
// 中文的「第四層」「第二章」（D2R 官方譯名）用國字，也換成數字
const CN = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9' };
const localNumbers = s => numbers(s.replace(/(\d)[,.  ](?=\d{3}(?!\d))/g, '$1').replace(/(\d),(\d)/g, '$1.$2').replace(/(?<=第)[一二三四五六七八九](?=[層章幕階])/g, c => ` ${CN[c]} `));
for (const file of process.argv.slice(2)) {
  const dict = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  let withNumbers = 0;
  const bad = [];
  for (const [key, zh] of Object.entries(dict)) {
    const want = numbers(key);
    if (!want.length) continue;
    withNumbers++;
    const have = numbers(zh);
    const local = localNumbers(zh), wantLocal = localNumbers(key);
    const missing = want.filter(n => !have.includes(n)).length && wantLocal.filter(n => !local.includes(n)).length
      ? wantLocal.filter(n => !local.includes(n)) : [];
    if (missing.length) bad.push({ key, zh, missing });
  }
  console.log(`${file}：有數字的 ${withNumbers} 條，數字對不上 ${bad.length} 條`);
  for (const b of bad.slice(0, 5)) console.log(`   缺 ${b.missing.join(',')}｜${b.key.slice(0, 70)}\n      → ${b.zh.slice(0, 70)}`);
}
