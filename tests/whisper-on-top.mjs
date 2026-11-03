// A whisper must sit on top of the town: once it is drawn, no house body is painted after it
// (0.6.2 drew it inside house(), so the next houses to the right cut the line off).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../web/game.js', import.meta.url), 'utf8');
const calls = [];
const grad = { addColorStop() {} };
const g = new Proxy({}, {
  get: (_, k) => k === 'fillText' ? (t) => calls.push(['text', t])
    : k === 'fillRect' ? (x, y, w, h) => calls.push(['rect', w, h])
    : k.startsWith?.('create') ? () => grad
    : k === 'measureText' ? () => ({ width: 0 })
    : () => {},
  set: () => true,
});
const ctx = vm.createContext({
  document: { getElementById: () => ({ getContext: () => g }) },
  window: { devicePixelRatio: 1 }, innerWidth: 1280, innerHeight: 720,
  addEventListener() {}, location: { search: '' }, performance: { now: () => 0 },
  requestAnimationFrame() {}, console, Math,
});
vm.runInContext(src, ctx);
vm.runInContext(`lv = 0; loadLevel(0); state = 'play'; stateT = 10;
  wins[0].lit = 1; wins[0].say = 'TEST WHISPER'; wins[0].sayT = 1;`, ctx);
calls.length = 0;
vm.runInContext('draw()', ctx);
const said = calls.findIndex(c => c[0] === 'text' && c[1] === 'TEST WHISPER');
const lastHouse = calls.findLastIndex(c => c[0] === 'rect' && c[1] === 70 && c[2] === 64);
const houses = calls.filter(c => c[0] === 'rect' && c[1] === 70 && c[2] === 64).length;
const ok = said >= 0 && houses > 1 && said > lastHouse;
console.log(ok ? `ok: whisper drawn after all ${houses} houses` : `FAIL: whisper at ${said}, last house body at ${lastHouse} (${houses} houses)`);
process.exit(ok ? 0 : 1);
