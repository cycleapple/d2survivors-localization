// 發布翻譯：合併每種語言的字典 → 產生 site/data/（manifest v2、字典、更新紀錄）→ 有變動就 commit 到主 repo（不 push）
//   node tools/publish.mjs
// commit 只收 site/data/、合併後的 dict/<id>.json 和 dict/changelog-next.json（repo 裡的字典和發布出去的一致），其他聊天室的改動不碰。
// 更新紀錄（格式見 docs/manifest-v2.md）：dict/changelog-next.json 是人寫的這次說明，併進 site/data/changelog.json 後清空；
// 沒寫就依統計自動產生。只有字典、規則、語言狀態、啟動器版本有變動才多一筆（game.web_checked 每小時會變，不算）
// push 之後 GitHub Actions 部署 Pages，啟動器和書籤下次開啟就會拿到。v1 的 dist repo 不再更新
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { TARGETS, target, layers } from './langs.mjs';

// --dry-run：在 work/translation/publish-dry/ 的複本上跑，不清空 changelog-next.json、不 commit（試格式用）
const DRY = process.argv.includes('--dry-run');
const OUT = DRY ? 'work/translation/publish-dry' : 'site/data';
// （試跑時 D2S_DRY_FROM 可以指定「上一次發布」的資料夾，測自動摘要用）
if (DRY) { fs.rmSync(OUT, { recursive: true, force: true }); fs.cpSync(process.env.D2S_DRY_FROM ?? 'site/data', OUT, { recursive: true }); }
const NEXT = DRY ? `${OUT}/changelog-next.json` : 'dict/changelog-next.json';
if (DRY && fs.existsSync('dict/changelog-next.json')) fs.copyFileSync('dict/changelog-next.json', NEXT);
const CHANGELOG = `${OUT}/changelog.json`;
const MAX_ENTRIES = 50;
const node = (...args) => execFileSync(process.execPath, args, { encoding: 'utf8' });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const fail = msg => { console.error(`發布失敗：${msg}`); process.exit(1); };
const readJson = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

// manifest 會讀到別的聊天室的檔案（修改規則）：工作目錄裡有還沒 commit 的改動就停下來，免得把做到一半的規則發布出去
const FOREIGN = ['tools/patch-rules.mjs', 'tools/web-rules.mjs'];
const dirty = FOREIGN.filter(p => { try { git('diff', '--quiet', 'HEAD', '--', p); return false; } catch { return true; } });
if (dirty.length && !DRY) fail(`這些檔案有還沒 commit 的改動（別的聊天室在改）：${dirty.join('、')}。等它們 commit 再發布`);
if (dirty.length) console.log(`注意：${dirty.join('、')} 有還沒 commit 的改動，試跑結果會包含它們`);

// 上一次發布的狀態（跟這次比，算出每種語言新增／修改／刪除幾條）
const beforeStatus = id => before?.languages.find(l => l.id === id)?.status;
const before = readJson(`${OUT}/manifest.json`, null);
const beforeDicts = Object.fromEntries((before?.languages ?? []).map(l => [l.id, readJson(`${OUT}/dict/${l.id}.json`, {})]));

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
const manifest = readJson(`${OUT}/manifest.json`);

// 3. 更新紀錄
const stats = manifest.languages.map(l => {
  const now = readJson(`${OUT}/dict/${l.id}.json`), old = beforeDicts[l.id];
  const keys = Object.keys(now).filter(k => !k.startsWith('gender:'));
  if (!old) return { id: l.id, status: l.status, entries: l.entries, added: keys.length, changed: 0, removed: 0, new: true };
  return {
    id: l.id, status: l.status, entries: l.entries,
    added: keys.filter(k => !(k in old)).length,
    changed: keys.filter(k => k in old && old[k] !== now[k]).length,
    removed: Object.keys(old).filter(k => !k.startsWith('gender:') && !(k in now)).length,
    ...(beforeStatus(l.id) !== l.status && { statusFrom: beforeStatus(l.id) }),
  };
});

const rulesChanged = JSON.stringify([before?.desktop, before?.web]) !== JSON.stringify([manifest.desktop, manifest.web]);
const launcherChanged = before?.launcher?.latest !== manifest.launcher?.latest;
const dictChanged = stats.some(s => s.new || s.added || s.changed || s.removed || s.statusFrom) || (before?.languages.length ?? 0) !== manifest.languages.length;
const changelog = readJson(CHANGELOG, { schema: 1, entries: [] });
const next = readJson(NEXT, {});
const hasNext = Object.keys(next).length > 0;
if (hasNext && !next.summary?.['zh-TW']) fail(`${NEXT} 至少要有 summary["zh-TW"]`);
// 第一次（還沒有 changelog.json）也記一筆，讓網站和啟動器有東西可以讀
const needEntry = dictChanged || rulesChanged || launcherChanged || !changelog.entries.length;

if (needEntry && changelog.entries[0]?.version !== manifest.version) {
  const entry = {
    version: manifest.version,
    date: manifest.updated.slice(0, 10),
    kind: hasNext ? next.kind ?? 'translation' : 'translation',
    announce: hasNext ? !!next.announce : false,
    summary: hasNext ? next.summary : autoSummary(),
    ...(next.notes && { notes: next.notes }),
    game: { ...(manifest.game?.desktop && { desktop: manifest.game.desktop }) },
    ...(manifest.launcher?.latest && { launcher: manifest.launcher.latest }),
    languages: stats.map(({ new: _, statusFrom: __, ...s }) => s),
  };
  changelog.entries = [entry, ...changelog.entries].slice(0, MAX_ENTRIES);
  writeJson(CHANGELOG, changelog);
  if (hasNext) writeJson(NEXT, {});
  console.log(`更新紀錄：${entry.version}（${entry.kind}${entry.announce ? '，要發公告' : ''}）${entry.summary['zh-TW']}`);
}
// manifest 指到更新紀錄：網址帶雜湊（CDN 快取），latest 給啟動器、網站比對有沒有新的
if (fs.existsSync(CHANGELOG)) {
  const buf = fs.readFileSync(CHANGELOG);
  const ref = { url: `changelog.json?v=${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)}`, latest: changelog.entries[0].version };
  if (JSON.stringify(manifest.changelog) !== JSON.stringify(ref)) { manifest.changelog = ref; writeJson(`${OUT}/manifest.json`, manifest); }
}

// 沒寫 changelog-next.json 時的摘要：「繁中修正 30 條、新增 12 條」
function autoSummary() {
  const NAMES = {
    'zh-TW': { 'zh-TW': '繁中', 'zh-CN': '簡中', ja: '日文', de: '德文', fr: '法文', ru: '俄文' },
    'zh-CN': { 'zh-TW': '繁中', 'zh-CN': '简中', ja: '日文', de: '德文', fr: '法文', ru: '俄文' },
    en: { 'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese', ja: 'Japanese', de: 'German', fr: 'French', ru: 'Russian' },
  };
  const WORDS = {
    'zh-TW': { changed: n => `修正 ${n} 條`, added: n => `新增 ${n} 條`, removed: n => `刪除 ${n} 條`, new: '新增', beta: '（測試中）', join: '、', sep: '；', rules: '更新修改規則', launcher: v => `啟動器 ${v}`, none: '更新翻譯', nowAvailable: '改為正式版', nowBeta: '改為測試中' },
    'zh-CN': { changed: n => `修正 ${n} 条`, added: n => `新增 ${n} 条`, removed: n => `删除 ${n} 条`, new: '新增', beta: '（测试中）', join: '、', sep: '；', rules: '更新修改规则', launcher: v => `启动器 ${v}`, none: '更新翻译', nowAvailable: '改为正式版', nowBeta: '改为测试中' },
    en: { changed: n => `${n} fixed`, added: n => `${n} added`, removed: n => `${n} removed`, new: 'New: ', beta: ' (beta)', join: ', ', sep: '; ', rules: 'Updated patch rules', launcher: v => `Launcher ${v}`, none: 'Updated translations', nowAvailable: 'now available', nowBeta: 'now in beta' },
  };
  return Object.fromEntries(Object.entries(WORDS).map(([ui, w]) => {
    const parts = stats.map(s => {
      const name = NAMES[ui][s.id] ?? s.id;
      if (s.new) return ui === 'en' ? `${w.new}${name}${s.status === 'beta' ? w.beta : ''}` : `${w.new}${name}${s.status === 'beta' ? w.beta : ''}`;
      const counts = ['changed', 'added', 'removed'].filter(k => s[k]).map(k => w[k](s[k]));
      if (s.statusFrom) counts.unshift(w[s.status === 'available' ? 'nowAvailable' : 'nowBeta']);
      return counts.length ? (ui === 'en' ? `${name}: ${counts.join(w.join)}` : `${name}${counts.join(w.join)}`) : null;
    }).filter(Boolean);
    if (rulesChanged) parts.push(w.rules);
    if (launcherChanged && manifest.launcher?.latest) parts.push(w.launcher(manifest.launcher.latest));
    return [ui, parts.join(w.sep) || w.none];
  }));
}

if (DRY) { console.log(`試跑完成：${OUT}（沒有 commit）`); process.exit(0); }

// 4. 只 commit 自己的檔案。被 .gitignore 排除的話 git add 會失敗；加完還有沒追蹤的也當成錯誤，不要靜靜跳過
const paths = [OUT, ...ids.map(id => target(id).out), ...(fs.existsSync(NEXT) ? [NEXT] : [])];
const ignored = paths.filter(p => { try { git('check-ignore', '-q', '--', p); return true; } catch { return false; } });
if (ignored.length) fail(`被 .gitignore 排除：${ignored.join('、')}`);
git('add', '--', ...paths);
const untracked = git('ls-files', '--others', '--', ...paths);
if (untracked) fail(`git add 之後還有沒追蹤的檔案：\n${untracked}`);
if (!git('diff', '--cached', '--name-only', '--', ...paths)) {
  console.log('翻譯沒有變動，不用發布');
  process.exit(0);
}
const summary = manifest.languages.map(l => `${l.id} ${l.entries}`).join(', ');
git('commit', '-q', '-m', `Publish translations ${manifest.version}: ${summary}`, '-m', 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>', '--', ...paths);
console.log(`已 commit：${summary}（還沒 push）`);
