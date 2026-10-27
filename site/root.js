// 首頁（語言選擇）：不自動跳轉，只標出建議的語言（上次選的，或依瀏覽器語言）。
// 舊網址 /?lang=zh-CN 這種明確指定的才轉到該語言頁。

import { SITE_LANGS } from './src/config.mjs';

const q = new URLSearchParams(location.search).get('lang');
const asked = SITE_LANGS.find(s => s.id.toLowerCase() === (q || '').toLowerCase());
if (asked) location.replace(`${asked.path}/${location.hash}`);

function suggest() {
  try {
    const saved = localStorage.getItem('d2s-site-lang');
    if (SITE_LANGS.some(s => s.id === saved)) return saved;
  } catch {}
  for (const l of navigator.languages || [navigator.language]) {
    if (/^zh/i.test(l)) return /^zh-(TW|HK|MO)\b|Hant/i.test(l) ? 'zh-TW' : 'zh-CN';
    const hit = SITE_LANGS.find(s => s.id.toLowerCase() === l.toLowerCase() || s.id.split('-')[0] === l.split('-')[0].toLowerCase());
    if (hit) return hit.id;
  }
  return 'en';
}

const card = document.querySelector(`#root-langs li[data-lang="${suggest()}"]`);
if (card) {
  card.classList.add('suggested');
  card.querySelector('.root-suggested').hidden = false;
}
document.querySelectorAll('#root-langs li').forEach(li => li.querySelector('a').addEventListener('click', () => {
  try { localStorage.setItem('d2s-site-lang', li.dataset.lang); } catch {}
}));
