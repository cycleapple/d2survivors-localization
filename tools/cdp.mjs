// 對以 --remote-debugging-port 啟動的遊戲頁面送 DevTools 指令（測試用）
//   node tools/cdp.mjs <port> eval "<js 運算式>"
//   node tools/cdp.mjs <port> preload "<js>"（頁面載入前先執行，然後重新載入）
//   node tools/cdp.mjs <port> shot <輸出.png>
//   node tools/cdp.mjs <port> hover <x> <y>
//   node tools/cdp.mjs <port> click <x> <y>
//   node tools/cdp.mjs <port> key <按鍵，例如 Escape>
import fs from 'node:fs';

const [port, cmd, ...args] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.startsWith('app://game/'));
if (!page) throw new Error('找不到遊戲頁面');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let nextId = 1;
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => ws.addEventListener('message', function on(e) {
    const m = JSON.parse(e.data);
    if (m.id !== id) return;
    ws.removeEventListener('message', on);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  }));
}

if (cmd === 'eval') {
  const r = await send('Runtime.evaluate', { expression: args[0], awaitPromise: true, returnByValue: true });
  console.log(JSON.stringify(r.exceptionDetails ?? r.result.value, null, 2));
} else if (cmd === 'preload') {
  // 頁面載入前先執行這段 JS（例如掛上攔截），然後重新載入。
  // 註冊的腳本只在這條連線存在時有效，所以要等頁面載入完才能斷線
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: args[0] });
  const loaded = new Promise(r => ws.addEventListener('message', function on(e) {
    if (JSON.parse(e.data).method === 'Page.loadEventFired') { ws.removeEventListener('message', on); r(); }
  }));
  await send('Page.reload');
  await loaded;
} else if (cmd === 'shot') {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(args[0], Buffer.from(r.data, 'base64'));
  console.log(args[0]);
} else if (cmd === 'hover') {
  const [x, y] = args.map(Number);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
} else if (cmd === 'click') {
  const [x, y] = args.map(Number);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
} else if (cmd === 'key') {
  const key = args[0];
  const code = /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : key;
  const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : { Escape: 27, Enter: 13, Tab: 9, Space: 32 }[key];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, text: key.length === 1 ? key : undefined });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
} else {
  throw new Error(`不認得的指令：${cmd}`);
}
ws.close();
