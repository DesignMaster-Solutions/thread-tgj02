// Every stitched window speaks once: one short line per window in the game, none too long to read in 3 s.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../web/game.js', import.meta.url), 'utf8');
const LEVELS = eval(src.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1]);
const m = src.match(/const WHISPERS = (\[[\s\S]*?\n\]);/);
if (!m) { console.log('FAIL: no WHISPERS'); process.exit(1); }
const WHISPERS = eval(m[1]);
const windows = LEVELS.reduce((n, L) => n + L.wins.length, 0);
const long = WHISPERS.filter(s => s.length > 44);
const ok = WHISPERS.length >= windows && !long.length && new Set(WHISPERS).size === WHISPERS.length;
console.log(ok ? `ok: ${WHISPERS.length} whispers for ${windows} windows` : `FAIL: ${WHISPERS.length} for ${windows}, long: ${long}`);
process.exit(ok ? 0 : 1);
