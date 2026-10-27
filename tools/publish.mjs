// 發布翻譯：重新產生 dist/（manifest + 字典），有變動就 commit 並 push 到私人 repo
// （cycleapple/d2survivors-zh-tw-dist）。啟動器下次檢查更新就會下載
//   node tools/publish.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const git = (...args) => execFileSync('git', ['-C', 'dist', ...args], { encoding: 'utf8' }).trim();

// manifest 的 updated／version 每次都會變，只有字典或規則有變動才發布
const strip = s => s.replace(/"(updated|version)": "[^"]*"/g, '').trim();
const before = git('show', 'HEAD:manifest.json');
execFileSync('node', ['tools/make-manifest.mjs', 'dist'], { stdio: 'inherit' });
const after = fs.readFileSync('dist/manifest.json', 'utf8');
if (strip(before) === strip(after)) {
  git('checkout', '--', '.');
  console.log('翻譯沒有變動，不用發布');
  process.exit(0);
}

const { languages } = JSON.parse(after);
const summary = languages.map(l => `${l.id} ${l.entries}`).join(', ');
git('add', '-A');
git('commit', '-q', '-m', `Translation ${languages[0].version}: ${summary}`, '-m', 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>');
git('push', '-q');
console.log(`已發布：${summary}`);
