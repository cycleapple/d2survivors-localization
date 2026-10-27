// 繁中做過人工修正的 key：最後的譯文跟 D2R 自動配對的不一樣（審核、覆寫改掉的）。
// 這些 key 的 D2R 同名字串意思不對（Vortex、KEEP、Hide…），其他語言的自動配對也會犯一樣的錯，要改送翻譯
//   node tools/corrected-keys.mjs <目標語言的 d2r-auto.json> <輸出 .json>
import fs from 'node:fs';

const [targetAuto, outFile] = process.argv.slice(2);
if (!outFile) { console.error('用法：node tools/corrected-keys.mjs <目標語言的 d2r-auto.json> <輸出 .json>'); process.exit(1); }
const twAuto = JSON.parse(fs.readFileSync('dict/d2r-auto.json', 'utf8'));
const twFinal = JSON.parse(fs.readFileSync('dict/zh-TW.json', 'utf8'));
const auto = JSON.parse(fs.readFileSync(targetAuto, 'utf8'));
const keys = Object.keys(auto).filter(k => k in twAuto && twFinal[k] !== twAuto[k]);
fs.writeFileSync(outFile, JSON.stringify(keys, null, 1));
console.log(`繁中修正過、${targetAuto} 也自動配對到的：${keys.length} 條 → ${outFile}`);
