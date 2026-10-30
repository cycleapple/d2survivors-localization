// D2 Survivors 中文化（網頁版書籤）：繁體中文、简体中文、日本語，以及 Deutsch、Français、Русский
// 書籤：javascript:import('<這個檔案的網址>').then(m=>m.default()).catch(e=>alert(e))
//
// 做法：跟桌面版一樣用遊戲內建的翻譯系統，只是改在瀏覽器裡做。
// 1. 讀 manifest（../data/manifest.json），抓下遊戲頁面和所有模組，照目前的語言套用 manifest 的 web.rules
//    （多幾個語言、載入字典、點陣字型認得中日文、斷行…）
// 2. 修改過的模組做成 blob 網址，用 import map 換掉原本的模組
// 3. 停掉頁面上正在跑的原版，換成一個同網域的 iframe，在裡面重新開一次修改版
// 任何一步失敗都在第 3 步之前，原版遊戲不受影響。
// 在遊戲裡換語言時，用新語言的規則重新開一次修改版。再按一次書籤＝目前的語言和英文切換。重新整理頁面就回到原版。

import { loadGame, applyRules, rulesFor, ruleVars, relink, bootHtml } from './core.js';

const MANIFEST = new URL('../data/manifest.json', import.meta.url).href;
const LANG_KEY = 'd2s:lang';
const LAST_KEY = 'd2zh:last';   // 最後一次用的翻譯語言（切回英文之後，再按一次書籤要回到它）
const GAME_HOSTS = ['d2survivors.lol', 'www.d2survivors.lol'];
// stopPage 會把頁面的 fetch 換掉，先留一份
const fetch0 = window.fetch.bind(window);

const MESSAGES = {
  'zh-TW': {
    loading: '正在載入繁體中文…', on: '繁體中文已開啟。再按一次書籤可以切換中英文。翻譯模式下成績不會上傳到排行榜，要上榜請重新整理頁面用原版。', to: '切換成繁體中文',
    failed: '中文化載入失敗：', outdated: '遊戲改版了，中文化需要更新', page: '請先打開 D2 Survivors 的遊戲頁面（https://d2survivors.lol/play/），再按這個書籤。',
    old: '書籤需要更新：請到中文化網站重新安裝書籤。', loop: '中文化一直重新載入，已停止。請重新整理頁面。', frame: '中文化載入失敗：框架打不開。請重新整理頁面。',
  },
  'zh-CN': {
    loading: '正在加载简体中文…', on: '简体中文已开启。再按一次书签可以切换中英文。汉化模式下成绩不会上传到排行榜，要上榜请刷新页面用原版。', to: '切换成简体中文',
    failed: '汉化加载失败：', outdated: '游戏更新了，汉化需要更新', page: '请先打开 D2 Survivors 的游戏页面（https://d2survivors.lol/play/），再按这个书签。',
    old: '书签需要更新：请到汉化网站重新安装书签。', loop: '汉化一直重新加载，已停止。请刷新页面。', frame: '汉化加载失败：框架打不开。请刷新页面。',
  },
  ja: {
    loading: '日本語を読み込んでいます…', on: '日本語になりました。もう一度ブックマークを押すと英語に切り替わります。翻訳中の記録はリーダーボードに送信されません。ランキングに載せるにはページを再読み込みして元の版で遊んでください。', to: '日本語に切り替えます',
    failed: '日本語化の読み込みに失敗しました：', outdated: 'ゲームが更新されたため、日本語化の更新が必要です', page: 'D2 Survivors のゲームページ（https://d2survivors.lol/play/）を開いてから、このブックマークを押してください。',
    old: 'ブックマークの更新が必要です。日本語化サイトでブックマークを入れ直してください。', loop: '読み込みが繰り返されたため停止しました。ページを再読み込みしてください。', frame: '日本語化の読み込みに失敗しました：フレームを開けません。ページを再読み込みしてください。',
  },
  de: {
    loading: 'Deutsch wird geladen…', on: 'Deutsch ist aktiv. Lesezeichen erneut anklicken, um zwischen Deutsch und Englisch zu wechseln. Mit der Übersetzung werden keine Läufe an die Bestenliste gesendet; für die Bestenliste die Seite neu laden und das Original spielen.', to: 'Wechsel zu Deutsch',
    failed: 'Übersetzung konnte nicht geladen werden: ', outdated: 'Das Spiel wurde aktualisiert, die Übersetzung muss angepasst werden', page: 'Bitte zuerst die Spielseite von D2 Survivors öffnen (https://d2survivors.lol/play/) und dann das Lesezeichen anklicken.',
    old: 'Das Lesezeichen ist veraltet. Bitte auf der Übersetzungsseite neu installieren.', loop: 'Die Übersetzung lädt immer wieder neu und wurde gestoppt. Bitte die Seite neu laden.', frame: 'Übersetzung konnte nicht geladen werden: Rahmen lässt sich nicht öffnen. Bitte die Seite neu laden.',
  },
  fr: {
    loading: 'Chargement du français…', on: 'Le français est activé. Cliquez à nouveau sur le favori pour basculer entre français et anglais. Avec la traduction, les parties ne sont pas envoyées au classement ; pour y figurer, rechargez la page et jouez à la version originale.', to: 'Passage au français',
    failed: 'Échec du chargement de la traduction : ', outdated: 'Le jeu a été mis à jour, la traduction doit l’être aussi', page: 'Ouvrez d’abord la page de jeu de D2 Survivors (https://d2survivors.lol/play/), puis cliquez sur ce favori.',
    old: 'Le favori est obsolète. Réinstallez-le depuis le site de la traduction.', loop: 'La traduction se recharge en boucle et a été arrêtée. Rechargez la page.', frame: 'Échec du chargement de la traduction : impossible d’ouvrir le cadre. Rechargez la page.',
  },
  ru: {
    loading: 'Загрузка русского перевода…', on: 'Русский перевод включен. Нажмите закладку еще раз, чтобы переключиться между русским и английским. С переводом забеги не отправляются в таблицу лидеров; чтобы попасть в нее, обновите страницу и играйте в оригинал.', to: 'Переключение на русский',
    failed: 'Не удалось загрузить перевод: ', outdated: 'Игра обновилась, перевод нужно обновить', page: 'Сначала откройте страницу игры D2 Survivors (https://d2survivors.lol/play/), затем нажмите эту закладку.',
    old: 'Закладка устарела. Установите ее заново на сайте перевода.', loop: 'Перевод постоянно перезагружается и был остановлен. Обновите страницу.', frame: 'Не удалось загрузить перевод: не открывается фрейм. Обновите страницу.',
  },
  pl: {
    loading: 'Wczytywanie polskiego tłumaczenia…', on: 'Polski jest włączony. Kliknij zakładkę ponownie, aby przełączać między polskim a angielskim. Z tłumaczeniem wyniki nie są wysyłane do rankingu; aby się w nim znaleźć, odśwież stronę i graj w oryginał.', to: 'Przełączanie na polski',
    failed: 'Nie udało się wczytać tłumaczenia: ', outdated: 'Gra została zaktualizowana, tłumaczenie wymaga aktualizacji', page: 'Najpierw otwórz stronę gry D2 Survivors (https://d2survivors.lol/play/), a potem kliknij tę zakładkę.',
    old: 'Zakładka jest nieaktualna. Zainstaluj ją ponownie ze strony tłumaczenia.', loop: 'Tłumaczenie ciągle się przeładowuje i zostało zatrzymane. Odśwież stronę.', frame: 'Nie udało się wczytać tłumaczenia: nie można otworzyć ramki. Odśwież stronę.',
  },
};

// manifest 的 status：beta＝測試中、draft＝草稿（用那個語言自己寫）
const STATUS = {
  'zh-TW': { beta: '（測試中）', draft: '（草稿）' },
  'zh-CN': { beta: '（测试中）', draft: '（草稿）' },
  ja: { beta: '（テスト中）', draft: '（下書き）' },
  de: { beta: '(Beta)', draft: '(Entwurf)' },
  fr: { beta: '(bêta)', draft: '(brouillon)' },
  ru: { beta: '(бета)', draft: '(черновик)' },
  pl: { beta: '(beta)', draft: '(wersja robocza)' },
  en: { beta: '(beta)', draft: '(draft)' },
};

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* 存不了就只有這次 */ } },
};
// 舊版書籤存的 zh＝繁中
const normalize = id => id === 'zh' ? 'zh-TW' : id;
// 書籤要開哪個語言：遊戲設定 → 上次用的 → 瀏覽器語言 → 繁中
function wanted(ids) {
  for (const id of [normalize(store.get(LANG_KEY)), store.get(LAST_KEY)]) if (ids.includes(id)) return id;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const id = /^zh\b.*\b(Hans|CN|SG|MY)\b/i.test(tag) ? 'zh-CN' : /^zh\b/i.test(tag) ? 'zh-TW' : /^(ja|de|fr|ru|pl)\b/i.exec(tag)?.[1].toLowerCase() ?? null;
    if (id && ids.includes(id)) return id;
  }
  return ids.includes('zh-TW') ? 'zh-TW' : ids[0];
}
let msg = MESSAGES[wanted(Object.keys(MESSAGES))];

export default function run() {
  if (window.__d2zh) return window.__d2zh.toggle();
  return start().catch(e => {
    hideStatus();
    console.error(e);
    alert(`${msg.failed}${e.message || e}`);
  });
}

async function get(url, cache = 'default') {
  const res = await fetch0(url, { cache });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function start() {
  if (!GAME_HOSTS.includes(location.hostname) || !document.getElementById('d2-files')) {
    alert(msg.page);
    return;
  }
  const playUrl = new URL(location.pathname.replace(/[^/]*$/, ''), location.origin).href;
  const [manifest, game] = await Promise.all([
    get(MANIFEST, 'no-cache').then(JSON.parse),
    loadGame(playUrl, url => get(url, url.startsWith(location.origin) ? 'default' : 'no-cache')),
  ]);
  if (manifest.schema !== 2 || !manifest.web?.rules) throw new Error(msg.old);
  // 有 web 欄位的語言才能選
  // beta、draft 在遊戲的語言選單名稱後面標示（不認得的 status 當成 draft）
  const langs = manifest.languages.filter(l => l.web).map(l => {
    const status = ['available', 'beta', 'draft'].includes(l.status) ? l.status : 'draft';
    const label = status === 'available' ? '' : (STATUS[l.id] ?? STATUS.en)[status];
    return { ...l, ...l.web, status, menu_name: label ? `${l.web.menu_name}${label.startsWith('（') ? '' : ' '}${label}` : l.web.menu_name, dict: new URL(l.dict.url, MANIFEST).href };
  });
  const ids = langs.map(l => l.id);
  if (!ids.length) throw new Error(msg.old);
  const first = wanted(ids);
  msg = MESSAGES[first] ?? msg;
  showStatus(msg.loading);

  // 照某個語言做出修改版的遊戲頁面（不是翻譯語言時只套 base 規則）
  const dicts = new Map();
  const dictModule = lang => {
    if (!dicts.has(lang.id)) {
      const p = get(lang.dict).then(src => URL.createObjectURL(new Blob([`export default ${src};`], { type: 'text/javascript' })));
      p.catch(() => dicts.delete(lang.id));
      dicts.set(lang.id, p);
    }
    return dicts.get(lang.id);
  };
  const build = async id => {
    const lang = langs.find(l => l.id === id) ?? null;
    const modules = new Map(game.modules);
    const failed = applyRules(modules, rulesFor(manifest.web.rules, lang), ruleVars(langs, lang, lang && await dictModule(lang)));
    if (failed.length) console.warn('[D2 中文化] 沒套上的修改：', failed.map(r => `${r.label}（${r.found}）`));
    const fatal = failed.filter(r => !r.optional);
    if (fatal.length) throw new Error(`${(MESSAGES[id] ?? msg).outdated}（${fatal.map(r => r.label).join('、')}）`);
    const imports = {};
    for (const [url, src] of modules) imports[url] = URL.createObjectURL(new Blob([relink(url, src)], { type: 'text/javascript' }));
    return { html: bootHtml(game.html, playUrl, game.entry, { imports }), blobs: Object.values(imports) };
  };

  const page = await build(first);
  await stopPage();
  store.set(LANG_KEY, first);
  store.set(LAST_KEY, first);
  openShell(page, { ids, build, first, playUrl });
}

// 停掉原版：關掉它的聲音、畫面更新、計時器、WebGL
async function stopPage() {
  // 遊戲用 Web Lock 防止開兩個分頁，要等 pagehide（persisted）才放掉；遊戲也會在 pagehide 時存檔
  try { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); } catch { /* 舊瀏覽器 */ }
  // AudioContext 沒辦法從外面找到：攔截 state、currentTime 一小段時間，遊戲讀到的那個就是。
  // 遊戲每次按鍵都會檢查 state（被瀏覽器暫停就恢復），所以送一個沒有作用的按鍵（F24）讓它讀一次
  const contexts = new Set();
  const proto = window.BaseAudioContext?.prototype;
  const hooked = ['state', 'currentTime'].map(name => [name, proto && Object.getOwnPropertyDescriptor(proto, name)]).filter(([, d]) => d?.get);
  for (const [name, d] of hooked) Object.defineProperty(proto, name, { ...d, get() { contexts.add(this); return d.get.call(this); } });
  for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { key: 'F24', code: 'F24', bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  for (const [name, d] of hooked) Object.defineProperty(proto, name, d);
  // 背景音樂是接進 AudioContext 的 <audio>，關掉 AudioContext 就一起沒聲音了
  for (const c of contexts) c.close().catch(() => {});

  // 原版可能還在載入（await 到一半）：之後的網路請求都不回應，讓它停在那裡
  window.fetch = () => new Promise(() => {});
  window.requestAnimationFrame = () => 0;
  const last = setTimeout(() => {});
  for (let i = 0; i <= last; i++) { clearTimeout(i); clearInterval(i); }
  for (const c of document.querySelectorAll('canvas')) {
    try { (c.getContext('webgl2') || c.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* 2D canvas */ }
  }
}

// 外層頁面只剩一個滿版的 iframe；document.open 會清掉原版的 DOM 和 window 上的事件
function openShell(firstPage, { ids, build, first, playUrl }) {
  const gamePaths = [new URL(playUrl).pathname, new URL('index.html', playUrl).pathname];
  const title = document.title;
  document.open();
  document.write(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title></title>
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{display:block;border:0;width:100%;height:100%}
body>:not(iframe):not(#d2zh-toast){display:none!important}
#d2zh-toast{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:1;padding:8px 14px;border:1px solid #6b5326;border-radius:6px;
background:rgba(12,10,8,.92);color:#e8dfcc;font:14px/1.4 "Microsoft JhengHei","Microsoft YaHei","Meiryo","PingFang TC","Hiragino Sans","Noto Sans CJK TC",sans-serif;pointer-events:none;transition:opacity .4s}
</style></head><body></body></html>`);
  document.close();
  document.title = title;
  // 原版還在跑的程式可能再往頁面加東西（載入失敗的畫面…）：一律移掉
  new MutationObserver(() => {
    for (const el of [...document.body.children]) if (el.tagName !== 'IFRAME' && el.id !== 'd2zh-toast') el.remove();
  }).observe(document.body, { childList: true });

  let frame = null;
  let blobs = [];
  let boots = [];
  const current = () => normalize(store.get(LANG_KEY));
  const show = (page, auto) => {
    // 修改版自己一直重新載入（例如 Service Worker 沒接手）就停下來，不要無限迴圈。
    // 只算 iframe 自己換頁回到 /play/ 的那種；玩家自己換語言（遊戲的語言選單、按書籤）不算
    if (auto) {
      const now = Date.now();
      boots = boots.filter(t => now - t < 15000).concat(now);
      if (boots.length > 3) {
        toast(msg.loop, 0);
        for (const url of page.blobs) URL.revokeObjectURL(url);
        return;
      }
    }
    const old = frame;
    const oldBlobs = blobs;
    const next = frame = document.createElement('iframe');
    blobs = page.blobs;
    next.title = title;
    next.allow = 'fullscreen; gamepad; autoplay; clipboard-read; clipboard-write; screen-wake-lock';
    next.allowFullscreen = true;
    // 先載入一個同網域、不會跑遊戲的頁面：這樣 iframe 才歸遊戲的 Service Worker 管
    // （用自己的 D2 檔案時，遊戲靠它讀檔），再把修改版寫進去
    next.src = new URL('/robots.txt', location.origin).href;
    next.addEventListener('load', () => {
      let doc = null;
      try { doc = next.contentDocument; } catch { /* 不同網域 */ }
      if (!doc) { toast(msg.frame, 0); return; }
      doc.open();
      doc.write(page.html);
      doc.close();
      // 之後 iframe 自己換頁（遊戲的「重新載入」、選檔案的 setup.html 選完回來…）會載入原版：
      // 回到遊戲頁面（/play/）時再換成修改版。setup.html 照原版
      next.addEventListener('load', () => {
        let d = null;
        try { d = next.contentDocument; } catch { /* 不同網域 */ }
        if (next === frame && d && !d.querySelector('meta[name="d2zh"]') && gamePaths.includes(next.contentWindow.location.pathname)) reboot(true);
      });
      next.focus();
    }, { once: true });
    if (old) {
      // 遊戲在 pagehide 時存檔、放掉防止開兩個分頁的鎖
      try { old.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); } catch { /* 已經關掉 */ }
      old.replaceWith(next);
      for (const url of oldBlobs) URL.revokeObjectURL(url);
    } else {
      document.body.append(next);
    }
  };
  // 照目前的語言設定（遊戲剛寫進 localStorage）重新開一次修改版。
  // auto：iframe 自己換頁回到 /play/（算進上面的迴圈保護）；沒有＝玩家自己換語言。
  // 建到一半又被叫（玩家連續切換）：建完的那份丟掉，照最新的設定再建一次，最後停在最後選的語言
  let running = null;
  let again = false;
  let againAuto = true;
  const reboot = (auto = false) => {
    again = true;
    againAuto &&= auto;
    running ??= (async () => {
      try {
        while (again) {
          const a = againAuto;
          again = false;
          againAuto = true;
          const id = current();
          if (ids.includes(id)) { store.set(LAST_KEY, id); msg = MESSAGES[id] ?? msg; }
          try {
            const page = await build(id);
            if (again) { for (const url of page.blobs) URL.revokeObjectURL(url); continue; }
            show(page, a);
          } catch (e) {
            if (!again) { console.error(e); toast(`${msg.failed}${e.message || e}`, 0); }
          }
        }
      } finally {
        running = null;
      }
    })();
    return running;
  };

  window.__d2zh = {
    reboot,
    toggle() {
      const api = frame?.contentWindow?.__d2zhLang;
      let now = null;
      try { now = normalize(api ? api.get() : current()); } catch { /* 讀不到當成英文 */ }
      const last = store.get(LAST_KEY);
      const next = ids.includes(now) ? 'en' : ids.includes(last) ? last : first;
      toast(next === 'en' ? 'Switching to English. Runs still are not sent to the leaderboard until you reload the page.' : (MESSAGES[next] ?? msg).to, next === 'en' ? 6000 : 3500);
      // 遊戲自己存設定、再請書籤重新開（語言切換介面）；沒有的話自己寫 localStorage
      if (api) return api.set(next);
      store.set(LANG_KEY, next);
      reboot();
    },
  };
  show(firstPage);
  toast(msg.on, 8000);
}

let statusEl = null;
function showStatus(text) {
  statusEl ??= Object.assign(document.createElement('div'), { id: 'd2zh-status' });
  statusEl.textContent = text;
  statusEl.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;padding:8px 14px;border:1px solid #6b5326;border-radius:6px;background:rgba(12,10,8,.92);color:#e8dfcc;font:14px/1.4 "Microsoft JhengHei","Microsoft YaHei","Meiryo","PingFang TC","Hiragino Sans","Noto Sans CJK TC",sans-serif';
  document.body.append(statusEl);
}
function hideStatus() { statusEl?.remove(); }

function toast(text, ms = 3500) {
  let el = document.getElementById('d2zh-toast');
  if (!el) { el = Object.assign(document.createElement('div'), { id: 'd2zh-toast' }); document.body.append(el); }
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(toast.timer);
  if (ms) toast.timer = setTimeout(() => { el.style.opacity = '0'; }, ms);
}
