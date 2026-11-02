/* Rotation engine: pure functions, no DOM.
   Slots: 1 PG, 2 wings, 2 posts. credits[id] = rotations played (halves possible after a mid-rotation sub). */
(function (root) {
  const SLOTS = [['pg', 'pg'], ['w1', 'w'], ['w2', 'w'], ['p1', 'p'], ['p2', 'p']];

  function combos(arr, k, must) {
    const out = [], rest = arr.filter(p => !must.includes(p));
    const need = k - must.length;
    if (need < 0) return [must.slice(0, k)];
    (function rec(i, cur) {
      if (cur.length === need) { out.push(must.concat(cur)); return; }
      for (let j = i; j <= rest.length - (need - cur.length); j++) rec(j + 1, cur.concat(rest[j]));
    })(0, []);
    return out;
  }

  /* Best slot assignment for five kids: fewest out-of-position, by trying every order. */
  function assign(five) {
    let best = null, bestOff = 99;
    (function rec(i, used, cur, off) {
      if (off >= bestOff) return;
      if (i === 5) { best = cur.slice(); bestOff = off; return; }
      for (let j = 0; j < five.length; j++) {
        if (used & (1 << j)) continue;
        cur[i] = five[j];
        rec(i + 1, used | (1 << j), cur, off + (five[j].pos && five[j].pos[SLOTS[i][1]] ? 0 : 1));
      }
    })(0, 0, [], 0);
    return { order: best, off: bestOff };
  }

  /* opts: players[], credits{}, last[] (ids on court now), history[] (past id arrays), mode 'even'|'position', must[] (players required)
     Priority: 'even' keeps everyone within one rotation first, then fills positions.
               'position' fills positions first, then evens out. */
  function pick({ players, credits = {}, last = [], history = [], mode = 'even', must = [] }) {
    if (players.length < 5) return null;
    const c = p => credits[p.id] || 0;
    const pairs = {};
    history.forEach(h => { for (let a = 0; a < h.length; a++) for (let b = a + 1; b < h.length; b++) { const k = [h[a], h[b]].sort().join('|'); pairs[k] = (pairs[k] || 0) + 1; } });
    let best = null, bestScore = null;
    for (const five of combos(players, 5, must)) {
      const after = players.map(p => c(p) + (five.includes(p) ? 1 : 0));
      const excess = Math.max(0, Math.max(...after) - Math.min(...after) - 1);
      const { order, off } = assign(five);
      const sq = five.reduce((s, p) => s + (c(p) + 1) ** 2, 0);
      const consec = five.filter(p => last.includes(p.id)).length;
      let tog = 0;
      for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) tog += pairs[[five[a].id, five[b].id].sort().join('|')] || 0;
      const score = mode === 'position' ? [off, excess, sq, consec, tog] : [excess, off, sq, consec, tog];
      let better = !bestScore;
      if (bestScore) for (let i = 0; i < score.length; i++) { if (score[i] !== bestScore[i]) { better = score[i] < bestScore[i]; break; } }
      if (better) { bestScore = score; best = { order, off }; }
    }
    const lineup = {};
    SLOTS.forEach(([s], i) => { lineup[s] = best.order[i].id; });
    return { lineup, off: best.off };
  }

  const api = { SLOTS, pick, assign };
  if (typeof module !== 'undefined') module.exports = api; else root.Rotation = api;
})(this);
