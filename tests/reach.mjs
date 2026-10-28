// Every level must be solvable on common screens: some order of windows where each is
// within the thread's reach (minus the 26 px hit radius) of the previous anchor.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../web/game.js', import.meta.url), 'utf8');
const LEVELS = eval(src.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1]);
const sizes = [[1280, 720], [1440, 900], [1920, 1080], [1024, 768], [800, 600]];
let bad = 0;
function solve(wins, at, reach, W, H, used) {
  if (used.size === wins.length) return true;
  const R = reach * Math.min(W, H) * 1.6 + 26;
  for (let i = 0; i < wins.length; i++) {
    if (used.has(i)) continue;
    const d = Math.hypot((wins[i][0] - at[0]) * W, (wins[i][1] - at[1]) * H);
    if (d <= R) { used.add(i); if (solve(wins, wins[i], reach + 0.03, W, H, used)) return true; used.delete(i); }
  }
  return false;
}
LEVELS.forEach((L, i) => sizes.forEach(([W, H]) => {
  if (!solve(L.wins, [0.12, 0.86], L.reach, W, H, new Set())) { bad++; console.log(`level ${i + 1} unsolvable at ${W}x${H}`); }
}));
console.log(bad ? `FAIL ${bad}` : `ok: ${LEVELS.length} levels solvable on ${sizes.length} screen sizes`);
process.exit(bad ? 1 : 0);
