// 發布翻譯：合併每種語言的字典 → 產生 site/data/（manifest v2 和字典）→ 有變動就 commit 到主 repo（不 push）
//   node tools/publish.mjs
// commit 只收 site/data/ 和合併後的 dict/<id>.json（repo 裡的字典和發布出去的一致），其他聊天室的改動不碰。
// push 之後 GitHub Actions 部署 Pages，啟動器和書籤下次開啟就會拿到。v1 的 dist repo 不再更新
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { TARGETS, target, layers } from './langs.mjs';

const OUT = 'site/data';
const node = (...args) => execFileSync(process.execPath, args, { encoding: 'utf8' });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const fail = msg => { console.error(`發布失敗：${msg}`); process.exit(1); };

// 1. 合併：用最新一版遊戲的 key（versions/<版本>/ko.json）；draft 的語言還在做，不發布
const version = fs.readdirSync('versions').filter(n => /^\d+\.\d+\.\d+$/.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1);
const ids = Object.keys(TARGETS).filter(id => TARGETS[id].status !== 'draft');
for (const id of ids) {
  const lang = target(id);
  const out = node('tools/merge-dict.mjs', `versions/${version}/ko.json`, lang.out, ...layers(lang));
  console.log(out.split('\n')[0]);
}

// 2. manifest 和字典
process.stdout.write(node('tools/make-manifest.mjs', OUT));

// 3. 只 commit 自己的檔案。被 .gitignore 排除的話 git add 會失敗；加完還有沒追蹤的也當成錯誤，不要靜靜跳過
const paths = [OUT, ...ids.map(id => target(id).out)];
const ignored = paths.filter(p => { try { git('check-ignore', '-q', '--', p); return true; } catch { return false; } });
if (ignored.length) fail(`被 .gitignore 排除：${ignored.join('、')}`);
git('add', '--', ...paths);
const untracked = git('ls-files', '--others', '--', ...paths);
if (untracked) fail(`git add 之後還有沒追蹤的檔案：\n${untracked}`);
if (!git('diff', '--cached', '--name-only', '--', ...paths)) {
  console.log('翻譯沒有變動，不用發布');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(`${OUT}/manifest.json`, 'utf8'));
const summary = manifest.languages.map(l => `${l.id} ${l.entries}`).join(', ');
git('commit', '-q', '-m', `Publish translations ${manifest.version}: ${summary}`, '-m', 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>', '--', ...paths);
console.log(`已 commit：${summary}（還沒 push）`);
