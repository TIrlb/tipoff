/* Tipoff: rotations and playbook for youth basketball. All data stays on this device. */
const APP_VERSION = '1.0.1';
const KEY = 'tipoff.v1';
const { SLOTS, pick } = Rotation;
const { esc, f } = Court;
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const clone = o => JSON.parse(JSON.stringify(o));
const CATS = { half: 'Half court', slob: 'SLOB', blob: 'BLOB', jump: 'Center jump', full: 'Full court' };
const SLOT_LABEL = { pg: 'PG', w1: 'Wing', w2: 'Wing', p1: 'Post', p2: 'Post' };
const SLOT_ROLE = { pg: 'pg', w1: 'w', w2: 'w', p1: 'p', p2: 'p' };
const TOKEN_SLOT = { 1: 'pg', 2: 'w1', 3: 'w2', 4: 'p1', 5: 'p2' };
const GRACE_MS = 60000;

/* ---------- starting spots per play type ---------- */
const SPOTS = {
  half: [[25, 28], [43, 20], [7, 20], [32, 8], [18, 8]],
  slob: [[25, 30], [52.5, 22], [12, 20], [32, 14], [24, 10]],
  blob: [[25, -2.5], [32, 12], [18, 12], [32, 5], [18, 5]],
  jump: [[34, 31], [52, 10], [52, 40], [44.5, 25], [34, 17]],
  full: [[14, 25], [30, 6], [30, 44], [10, 10], [10, 40]]
};
const slotTokens = cat => SPOTS[cat].map((p, i) => ({ id: 't' + (i + 1), label: String(i + 1), side: 'o', x: p[0], y: p[1] }));
const a = (type, tok, pts, to) => ({ id: uid(), type, tok, pts, to });
function sample(name, cat, ball, notes, steps) {
  return { id: uid(), name, cat, court: courtFor(cat), notes, tokens: slotTokens(cat), ball, steps, pen: [], sample: true };
}
const courtFor = cat => (cat === 'jump' || cat === 'full') ? 'full' : 'half';
function samples() {
  return [
    sample('Give and go', 'half', 't1', 'Pass, cut, get it back.', [
      { note: '1 passes to 2 on the wing.', actions: [a('pass', 't1', [], 't2')] },
      { note: '1 cuts hard to the rim.', actions: [a('cut', 't1', [[25, 28], [29, 18], [26, 8]])] },
      { note: '2 hits 1 for the layup.', actions: [a('pass', 't2', [], 't1')] }]),
    sample('Pick and roll', 'half', 't1', 'Ball screen at the top.', [
      { note: '5 comes up and screens for 1.', actions: [a('screen', 't5', [[18, 8], [22, 19], [29.8, 26.5]])] },
      { note: '1 dribbles off the screen. 5 rolls to the rim.', actions: [a('dribble', 't1', [[25, 28], [21, 26], [15, 19]]), a('cut', 't5', [[29.8, 26.5], [28, 16], [25.5, 9]])] },
      { note: '1 passes to 5 rolling.', actions: [a('pass', 't1', [], 't5')] }]),
    sample('SLOB flash', 'slob', 't2', 'Sideline inbound, 2 is the inbounder.', [
      { note: '4 screens for 1. 1 pops to the ball.', actions: [a('screen', 't4', [[32, 14], [31, 26]]), a('cut', 't1', [[25, 30], [34, 31], [42, 27]])] },
      { note: '2 inbounds to 1.', actions: [a('pass', 't2', [], 't1')] },
      { note: '2 steps in and 4 rolls to the rim.', actions: [a('cut', 't2', [[52.5, 22], [44, 18]]), a('cut', 't4', [[31, 26], [28, 16], [26, 8]])] },
      { note: '1 passes to 4 for the layup.', actions: [a('pass', 't1', [], 't4')] }]),
    sample('BLOB box', 'blob', 't1', 'Box set under the hoop, 1 inbounds.', [
      { note: '4 screens across for 5. 5 cuts to the rim.', actions: [a('screen', 't4', [[32, 5], [22, 5]]), a('cut', 't5', [[18, 5], [22, 8], [29, 5]])] },
      { note: '2 and 3 pop out as safety valves.', actions: [a('cut', 't2', [[32, 12], [38, 19]]), a('cut', 't3', [[18, 12], [12, 19]])] },
      { note: '1 passes to 5 for the layup.', actions: [a('pass', 't1', [], 't5')] }]),
    sample('Tip to the guard', 'jump', 't4', '4 jumps at center and tips to 1.', [
      { note: '4 tips back to 1.', actions: [a('pass', 't4', [], 't1')] },
      { note: '1 dribbles up the middle. 2 and 3 run the lanes.', actions: [a('dribble', 't1', [[34, 31], [46, 32], [60, 27]]), a('cut', 't2', [[52, 10], [68, 8], [84, 18]]), a('cut', 't3', [[52, 40], [66, 42], [76, 34]])] },
      { note: '1 passes ahead to 2 for the layup.', actions: [a('pass', 't1', [], 't2')] }]),
    sample('Fast break lanes', 'full', 't1', 'Fill the lanes on the rebound.', [
      { note: '1 pushes up the middle. 2 and 3 sprint the wings.', actions: [a('dribble', 't1', [[14, 25], [32, 25], [52, 25]]), a('cut', 't2', [[30, 6], [50, 6], [72, 8]]), a('cut', 't3', [[30, 44], [50, 44], [72, 42]])] },
      { note: '1 passes ahead to 2.', actions: [a('pass', 't1', [], 't2')] },
      { note: '2 attacks the rim. 4 and 5 trail.', actions: [a('dribble', 't2', [[72, 8], [80, 14], [86, 22]]), a('cut', 't4', [[10, 10], [40, 18], [64, 20]]), a('cut', 't5', [[10, 40], [40, 34], [62, 32]])] }])
  ];
}

/* ---------- state ---------- */
function blank() {
  return { team: 'Grizzlies', players: [], plays: samples(), game: null, board: newBoard(), settings: { fair: 'even', apiKey: '', model: 'claude-sonnet-5-5' } };
}
function newBoard() { return { id: 'board', name: 'Board', cat: 'half', court: 'half', tokens: [], ball: null, steps: [], pen: [], notes: '' }; }
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* start fresh */ }
if (!S) S = blank();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Storage is full. Remove imported photos from plays, then try again.'); }
}
const ui = { view: 'game', cat: 'all', play: null, k: 0, undo: [] };
function toast(m, ms = 2600) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, ms); }
function sheet(html) { $('#sheetCard').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('pointerdown', e => { if (e.target.id === 'sheet') closeSheet(); });

const player = id => S.players.find(p => p.id === id);
const isOut = p => !!p.out;
const here = () => S.players.filter(p => !isOut(p));
function initials(p) {
  if (!p) return '?';
  const w = p.name.trim().split(/\s+/);
  const base = (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : (w[0][1] || ''))).toUpperCase();
  const dup = S.players.filter(q => q !== p && (() => { const v = q.name.trim().split(/\s+/); return (v[0][0] + (v.length > 1 ? v[v.length - 1][0] : (v[0][1] || ''))).toUpperCase() === base; })());
  return dup.length && w[0].length > 1 ? (w[0].slice(0, 2) + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase().slice(0, 3) : base;
}
const posText = p => [p.pos.pg && 'PG', p.pos.w && 'W', p.pos.p && 'P'].filter(Boolean).join('/') || 'No position';
const cr = n => Number.isInteger(n) ? String(n) : String(+n.toFixed(1));

/* ---------- navigation ---------- */
function go(v) { ui.view = v; ui.play = null; ui.undoEd = []; ui.step = 0; render(); }
document.querySelector('nav').addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) go(b.dataset.nav); });
function render() {
  $('#teamName').textContent = S.team;
  const navOn = ui.view === 'view' || ui.view === 'edit' ? (ui.editBoard ? 'board' : 'plays') : ui.view;
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === navOn));
  ({ game: renderGame, roster: renderRoster, plays: renderPlays, view: renderView, edit: renderEdit, board: () => { ui.editBoard = true; ui.play = S.board; ui.step = ui.step || 0; ui.tool = ui.tool || 'move'; renderEdit(); }, setup: renderSetup })[ui.view]();
  if (ui.view !== 'board' && ui.view !== 'edit') ui.editBoard = false;
}

/* ---------- roster ---------- */
function renderRoster() {
  const P = S.players, st = P.filter(p => p.starter).length, inn = here().length;
  const has = k => here().filter(p => p.pos[k]).length;
  $('#main').innerHTML = `<div class="pad">
    <div class="row"><h2 class="grow">Roster</h2><button class="btn pri" data-a="add">Add player</button></div>
    <div class="counts small"><span>${inn} in</span><span class="${st > 5 ? 'warn' : ''}">${st} of 5 starters</span><span>${has('pg')} PG</span><span>${has('w')} wings</span><span>${has('p')} posts</span></div>
    <div class="rtable">${P.map(p => `<div class="rrow ${isOut(p) ? 'isout' : ''}" data-id="${p.id}">
      <div class="ini">${esc(initials(p))}</div>
      <input type="text" data-f="name" value="${esc(p.name)}" aria-label="Name">
      <input type="text" inputmode="numeric" data-f="num" value="${esc(p.num || '')}" placeholder="#" aria-label="Jersey number">
      <div class="chipset">
        <button class="chip ${p.pos.pg ? 'on' : ''}" data-pos="pg" aria-pressed="${!!p.pos.pg}">PG</button>
        <button class="chip ${p.pos.w ? 'on' : ''}" data-pos="w" aria-pressed="${!!p.pos.w}">Wing</button>
        <button class="chip ${p.pos.p ? 'on' : ''}" data-pos="p" aria-pressed="${!!p.pos.p}">Post</button>
      </div>
      <button class="chip star ${p.starter ? 'on' : ''}" data-a="starter" aria-pressed="${!!p.starter}">Starter</button>
      <button class="chip out ${isOut(p) ? 'on' : ''}" data-a="out" aria-pressed="${isOut(p)}">${isOut(p) ? 'Out' : 'In'}</button>
      <button class="x" data-a="del" aria-label="Remove ${esc(p.name)}">×</button></div>`).join('') || '<p class="mute">Add your players to get started. Names stay on this iPad.</p>'}</div></div>`;
  $('#main').onclick = e => {
    const row = e.target.closest('.rrow'), p = row && player(row.dataset.id), b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.a === 'add') { const q = { id: uid(), name: 'Player ' + (P.length + 1), num: '', pos: { pg: false, w: true, p: false }, starter: false }; S.players.push(q); save(); render(); const i = document.querySelector(`[data-id="${q.id}"] input`); i.focus(); i.select(); return; }
    if (!p) return;
    if (b.dataset.pos) p.pos[b.dataset.pos] = !p.pos[b.dataset.pos];
    if (b.dataset.a === 'starter') { if (!p.starter && st >= 5) return toast('You already have 5 starters. Remove one first.'); p.starter = !p.starter; }
    if (b.dataset.a === 'out') setOut(p, !isOut(p));
    if (b.dataset.a === 'del') { sheet(`<h3>Remove ${esc(p.name)}?</h3><div class="row"><button class="btn danger" id="yes">Remove</button><button class="btn" id="no">Keep</button></div>`); $('#yes').onclick = () => { removeFromCourt(p); S.players = S.players.filter(q => q !== p); save(); closeSheet(); render(); }; $('#no').onclick = closeSheet; return; }
    save(); render();
  };
  $('#main').onchange = e => { const row = e.target.closest('.rrow'); if (!row || !e.target.dataset.f) return; player(row.dataset.id)[e.target.dataset.f] = e.target.value.trim() || (e.target.dataset.f === 'name' ? 'Player' : ''); save(); render(); };
}
function setOut(p, out) {
  p.out = out;
  if (out) removeFromCourt(p);
}

/* ---------- game engine ---------- */
function onCourt() { return S.game && S.game.lineup ? Object.values(S.game.lineup).filter(Boolean) : []; }
function nextLineup(must = []) {
  const g = S.game;
  return pick({ players: here(), credits: g ? g.credits : {}, last: onCourt(), history: g ? g.rots.map(r => Object.values(r.lineup)) : [], mode: S.settings.fair, must });
}
function snapshot() { ui.undo.push(clone(S.game)); if (ui.undo.length > 40) ui.undo.shift(); }
function applyLineup(lineup, kind) {
  const g = S.game;
  g.lineup = lineup;
  Object.values(lineup).forEach(id => g.credits[id] = (g.credits[id] || 0) + 1);
  g.rots.push({ lineup: clone(lineup), kind, at: Date.now(), parts: {} });
  save();
}
function startGame(carry) {
  const prev = S.game;
  if (here().length < 5) return toast('You need at least 5 players marked In.');
  S.game = { credits: carry && prev ? clone(prev.credits) : {}, rots: [], lineup: null };
  ui.undo = [];
  const st = here().filter(p => p.starter);
  const res = st.length && !carry ? nextLineup(st.slice(0, 5)) : nextLineup();
  applyLineup(res.lineup, 'start');
  render();
}
function doSub() {
  const res = nextLineup();
  if (!res) return toast('You need at least 5 players marked In.');
  snapshot(); applyLineup(res.lineup, 'sub');
  if (res.off) toast(`${res.off} player${res.off > 1 ? 's' : ''} out of position. Dashed tokens show who.`);
  render();
}
/* Swap inside a rotation. Within the first minute the new kid gets the whole rotation; later they split it. */
function swapIn(benchId, slot) {
  const g = S.game, outId = g.lineup[slot], cur = g.rots[g.rots.length - 1];
  const share = Date.now() - cur.at < GRACE_MS ? 1 : .5;
  if (outId) { g.credits[outId] = Math.max(0, (g.credits[outId] || 0) - share); cur.parts[outId] = 1 - share; }
  g.credits[benchId] = (g.credits[benchId] || 0) + share;
  cur.parts[benchId] = share;
  g.lineup[slot] = benchId;
  cur.lineup[slot] = benchId;
  save();
}
function removeFromCourt(p) {
  const g = S.game; if (!g || !g.lineup) return;
  const slot = Object.keys(g.lineup).find(s => g.lineup[s] === p.id); if (!slot) return;
  const role = SLOT_ROLE[slot], bench = here().filter(q => q !== p && !onCourt().includes(q.id));
  if (!bench.length) return;
  const by = bench.slice().sort((x, y) => ((y.pos[role] ? 1 : 0) - (x.pos[role] ? 1 : 0)) || ((g.credits[x.id] || 0) - (g.credits[y.id] || 0)));
  snapshot(); swapIn(by[0].id, slot); toast(`${by[0].name} in for ${p.name}`);
}
const SPOT_XY = { pg: [50, 66], w1: [83, 44], w2: [17, 44], p1: [66, 22], p2: [34, 22] };

function ptok(p, cls, extra) {
  const g = S.game;
  return `<div class="ptok" data-pid="${p.id}" ${extra || ''}>${cls.includes('court') ? '' : ''}<div class="tok ${cls}">${esc(initials(p))}<span class="n">${cr((g.credits[p.id] || 0))}</span></div><div class="tname">${esc(p.name.split(' ')[0])}</div></div>`;
}
function renderGame() {
  const g = S.game;
  if (!g) {
    const st = here().filter(p => p.starter);
    $('#main').innerHTML = `<div class="pad"><h2>Game</h2>
      ${here().length < 5 ? `<p>You need at least 5 players marked In. ${here().length} so far.</p><button class="btn pri" data-nav2="roster">Open roster</button>` :
        `<p>${st.length === 5 ? 'Starters: ' + st.map(p => esc(p.name)).join(', ') + '.' : `${st.length} of 5 starters set. The app fills the rest from who's in.`}</p><button class="btn gold" id="start" style="font-size:26px;min-height:64px;padding:0 28px">Start game</button>`}</div>`;
    const s = $('#start'); if (s) s.onclick = () => startGame(false);
    const r = $('[data-nav2]'); if (r) r.onclick = () => go('roster');
    return;
  }
  const ids = onCourt(), bench = here().filter(p => !ids.includes(p.id)).sort((x, y) => (g.credits[x.id] || 0) - (g.credits[y.id] || 0));
  const nx = nextLineup();
  const nxIds = nx ? Object.values(nx.lineup) : [];
  $('#main').innerHTML = `<div class="game">
    <div class="gcol">
      <div class="floor" id="floor"><svg viewBox="0 0 50 47" preserveAspectRatio="xMidYMin slice">${Court.floor('half').replace(/<rect x="-6"[^>]*>/, '')}</svg>
      ${SLOTS.map(([s, role]) => { const p = player(g.lineup[s]); if (!p) return ''; const xy = SPOT_XY[s]; return `<div class="ptok court" data-pid="${p.id}" data-slot="${s}" style="left:${xy[0]}%;top:${xy[1]}%"><div class="tslot">${SLOT_LABEL[s]}</div><div class="tok ${p.pos[role] ? '' : 'off'}">${esc(initials(p))}<span class="n">${cr(g.credits[p.id] || 0)}</span></div><div class="tname">${esc(p.name.split(' ')[0])}</div></div>`; }).join('')}
      </div>
    </div>
    <div class="gcol">
      <div class="row" style="align-items:stretch"><button class="subbtn" id="sub">Sub<small>Rotation ${g.rots.length + 1} next</small></button>
        <div style="display:flex;flex-direction:column;gap:6px"><button class="btn" id="undo" ${ui.undo.length ? '' : 'disabled'}>Undo</button><button class="btn" id="newg">New game</button></div></div>
      <div class="next"><span>Up next</span>${nxIds.map(id => { const p = player(id); return `<span class="mini" title="${esc(p.name)}">${esc(initials(p))}</span>`; }).join('')}${nx && nx.off ? `<span class="warn small">${nx.off} out of position</span>` : ''}</div>
      <h3>Bench</h3>
      <div class="bench" id="bench">${bench.map(p => ptok(p, '')).join('') || '<span class="mute">Nobody on the bench.</span>'}</div>
      <div class="log">${logTable()}</div>
    </div></div>`;
  $('#sub').onclick = doSub;
  $('#undo').onclick = () => { if (ui.undo.length) { S.game = ui.undo.pop(); save(); render(); } };
  $('#newg').onclick = () => {
    sheet(`<h3>Start a new game</h3><p>Reset starts everyone at zero with your starters. Carry over keeps rotation counts, so kids who played less in the last game go first.</p>
      <button class="btn pri" id="r">Reset counts, use starters</button><button class="btn" id="c">Carry over counts</button><button class="btn" id="e">End game</button><button class="btn" id="n">Cancel</button>`);
    $('#r').onclick = () => { closeSheet(); startGame(false); }; $('#c').onclick = () => { closeSheet(); startGame(true); };
    $('#e').onclick = () => { closeSheet(); S.game = null; ui.undo = []; save(); render(); }; $('#n').onclick = closeSheet;
  };
  bindDrag();
}
function logTable() {
  const g = S.game, rows = S.players.filter(p => (g.credits[p.id] || 0) > 0 || !isOut(p)).sort((x, y) => (g.credits[y.id] || 0) - (g.credits[x.id] || 0));
  return `<table><tr><th>Player</th><th>Total</th>${g.rots.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>${rows.map(p => `<tr><td>${esc(p.name)}</td><td><b>${cr(g.credits[p.id] || 0)}</b></td>${g.rots.map(r => {
    const on = Object.values(r.lineup).includes(p.id), part = r.parts[p.id];
    if (part != null && part > 0 && part < 1) return '<td class="part">½</td>';
    return on ? '<td class="on">●</td>' : '<td></td>';
  }).join('')}</tr>`).join('')}</table>`;
}
/* Drag a token onto another token to swap. A short tap opens that player's options. */
function bindDrag() {
  document.querySelectorAll('.ptok').forEach(el => {
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY; let ghost = null, over = null;
      const move = ev => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!ghost) { ghost = el.querySelector('.tok').cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); el.classList.add('dragging'); }
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        const t = document.elementFromPoint(ev.clientX, ev.clientY), tar = t && t.closest('.ptok');
        if (over) over.querySelector('.tok').classList.remove('drop');
        over = tar && tar !== el ? tar : null;
        if (over) over.querySelector('.tok').classList.add('drop');
      };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        if (ghost) { ghost.remove(); el.classList.remove('dragging'); if (over) dropOn(el, over); else render(); }
        else playerSheet(player(el.dataset.pid));
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });
}
function dropOn(from, to) {
  const g = S.game, fs = from.dataset.slot, ts = to.dataset.slot;
  snapshot();
  if (fs && ts) { const x = g.lineup[fs]; g.lineup[fs] = g.lineup[ts]; g.lineup[ts] = x; const c = g.rots[g.rots.length - 1].lineup; c[fs] = g.lineup[fs]; c[ts] = g.lineup[ts]; save(); }
  else if (!fs && !ts) { ui.undo.pop(); }
  else if (ts) swapIn(from.dataset.pid, ts);
  else swapIn(to.dataset.pid, fs);
  render();
}
function playerSheet(p) {
  if (!p) return;
  const g = S.game, n = g.credits[p.id] || 0;
  sheet(`<h3>${esc(p.name)}</h3><p class="mute">${posText(p)}. ${cr(n)} rotation${n === 1 ? '' : 's'} played.</p>
    <div class="row"><button class="btn" id="m">Take off half</button><button class="btn" id="pl">Add half</button></div>
    <button class="btn danger" id="o">Mark out</button><button class="btn" id="c">Close</button>`);
  $('#m').onclick = () => { snapshot(); g.credits[p.id] = Math.max(0, n - .5); save(); closeSheet(); render(); };
  $('#pl').onclick = () => { snapshot(); g.credits[p.id] = n + .5; save(); closeSheet(); render(); };
  $('#o').onclick = () => { setOut(p, true); save(); closeSheet(); render(); };
  $('#c').onclick = closeSheet;
}

/* ---------- playbook ---------- */
function thumb(p) {
  let h = Court.floor(p.court), r = Court.R(p.court);
  p.steps.forEach((_, i) => Court.actionPaths(p, i).forEach(({ a, pts }) => { h += Court.arrow(a.type, pts, r); }));
  p.tokens.forEach(t => { h += Court.token(t, [t.x, t.y], r); });
  return `<svg viewBox="${Court.viewBox(p.court)}" aria-hidden="true">${h}</svg>`;
}
function renderPlays() {
  const list = S.plays.filter(p => ui.cat === 'all' || p.cat === ui.cat);
  $('#main').innerHTML = `<div class="pad">
    <div class="row"><h2 class="grow">Plays</h2><button class="btn" id="imp">Import from image</button><button class="btn pri" id="np">New play</button></div>
    <div class="chips" style="margin-top:10px">${Object.entries({ all: 'All', ...CATS }).map(([k, v]) => `<button class="chip ${ui.cat === k ? 'on' : ''}" data-c="${k}">${v}</button>`).join('')}</div>
    <div class="pgrid">${list.map(p => `<button class="pcard" data-p="${p.id}">${thumb(p)}<b>${esc(p.name)}</b><span>${CATS[p.cat]}, ${p.steps.length} step${p.steps.length === 1 ? '' : 's'}</span></button>`).join('') || '<p class="mute">No plays of this type yet. Tap New play.</p>'}</div></div>`;
  $('#main').onclick = e => {
    const c = e.target.closest('[data-c]'), q = e.target.closest('[data-p]');
    if (c) { ui.cat = c.dataset.c; render(); }
    if (q) { ui.play = S.plays.find(x => x.id === q.dataset.p); ui.k = 0; ui.view = 'view'; render(); }
  };
  $('#np').onclick = () => {
    sheet(`<h3>New play</h3><input type="text" id="nm" placeholder="Play name"><select id="ct">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${ui.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <div class="row"><button class="btn pri" id="ok">Create</button><button class="btn" id="no">Cancel</button></div>`);
    $('#ok').onclick = () => {
      const cat = $('#ct').value, p = { id: uid(), name: $('#nm').value.trim() || 'New play', cat, court: courtFor(cat), notes: '', tokens: slotTokens(cat), ball: 't1', steps: [{ note: '', actions: [] }], pen: [] };
      S.plays.unshift(p); save(); closeSheet(); openEdit(p);
    };
    $('#no').onclick = closeSheet;
  };
  $('#imp').onclick = importSheet;
}
function openEdit(p) { ui.play = p; ui.step = 0; ui.tool = 'move'; ui.undoEd = []; ui.view = 'edit'; ui.editBoard = false; render(); }

/* legend & tool glyphs share the real arrow renderer so they always match */
function glyph(type) { return `<svg viewBox="0 0 12 4" aria-hidden="true">${Court.arrow(type, [[0.3, 2], [11.7, 2]], 0)}</svg>`; }
const legend = () => `<div class="legend">${[['cut', 'Cut'], ['pass', 'Pass'], ['dribble', 'Dribble'], ['screen', 'Screen']].map(([t, l]) => `<div>${glyph(t)}${l}</div>`).join('')}</div>`;

/* lineup names on the tokens: 1 PG, 2-3 wings, 4-5 posts */
function liveLabel(t) {
  if (t.pid) return initials(player(t.pid));
  if (ui.useLineup && S.game && t.side === 'o' && TOKEN_SLOT[t.label]) return initials(player(S.game.lineup[TOKEN_SLOT[t.label]]));
  return t.label;
}
function renderView() {
  const p = ui.play, n = p.steps.length;
  $('#main').innerHTML = `<div class="stage">
    <div class="board"><svg id="cv" viewBox="${Court.viewBox(p.court)}" preserveAspectRatio="xMidYMid meet"></svg></div>
    <div class="side">
      <div class="row"><div class="title grow">${esc(p.name)}</div><button class="btn" id="back">Plays</button></div>
      <div class="mute small">${CATS[p.cat]}${p.notes ? '. ' + esc(p.notes) : ''}</div>
      <div class="cap" id="cap"></div>
      <button class="nextbtn" id="next">Next</button>
      <div class="row"><button class="btn grow" id="prev">Back</button><button class="btn grow" id="re">Restart</button></div>
      <div class="dots" id="dots"></div>
      ${S.game ? `<button class="chip ${ui.useLineup ? 'on' : ''}" id="ul">Show current lineup</button>` : ''}
      ${legend()}
      <div class="row" style="margin-top:auto"><button class="btn grow" id="ed">Edit play</button><button class="btn danger" id="dl">Delete</button></div>
    </div></div>`;
  drawView();
  $('#back').onclick = () => go('plays');
  $('#next').onclick = () => { if (ui.anim) return; if (ui.k < n) animate(p, ui.k, () => { ui.k++; drawView(); }); else { ui.k = 0; drawView(); } };
  $('#prev').onclick = () => { cancelAnim(); ui.k = Math.max(0, ui.k - 1); drawView(); };
  $('#re').onclick = () => { cancelAnim(); ui.k = 0; drawView(); };
  $('#ed').onclick = () => openEdit(p);
  $('#dl').onclick = () => { sheet(`<h3>Delete ${esc(p.name)}?</h3><div class="row"><button class="btn danger" id="y">Delete</button><button class="btn" id="n">Keep</button></div>`); $('#y').onclick = () => { S.plays = S.plays.filter(x => x !== p); save(); closeSheet(); go('plays'); }; $('#n').onclick = closeSheet; };
  const ul = $('#ul'); if (ul) ul.onclick = () => { ui.useLineup = !ui.useLineup; renderView(); };
}
function cancelAnim() { if (ui.anim) { cancelAnimationFrame(ui.anim); ui.anim = null; } }
function drawView(tokOverride, ballOverride, hideArrows) {
  const p = ui.play, k = ui.k, r = Court.R(p.court), n = p.steps.length, st = Court.stateAt(p, k);
  let h = Court.floor(p.court);
  (p.pen || []).forEach(s => { h += `<path d="${Court.smooth(s)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4" stroke-linecap="round"/>`; });
  if (!hideArrows) Court.actionPaths(p, k).forEach(({ a, pts }) => { h += Court.arrow(a.type, pts, r); });
  const pos = tokOverride || st.pos;
  p.tokens.forEach(t => { h += Court.token(t, pos[t.id], r, { label: liveLabel(t) }); });
  if (ballOverride) h += Court.ballMark(ballOverride, 0);
  else if (st.ball && pos[st.ball]) h += Court.ballMark(pos[st.ball], r);
  $('#cv').innerHTML = h;
  $('#cap').innerHTML = k < n ? `<b>Step ${k + 1} of ${n}</b>${esc(p.steps[k].note) || 'Tap Next to run this step.'}` : `<b>Finished</b>${n ? 'Tap Next to run it again.' : 'This play has no steps yet.'}`;
  const nb = $('#next'); nb.textContent = k < n ? 'Next' : 'Run again';
  $('#dots').innerHTML = p.steps.map((_, i) => `<button class="dot ${i === k ? 'on' : ''}" data-d="${i}" aria-label="Step ${i + 1}">${i + 1}</button>`).join('');
  $('#dots').onclick = e => { const d = e.target.closest('[data-d]'); if (d) { cancelAnim(); ui.k = +d.dataset.d; drawView(); } };
}
function animate(p, k, done) {
  const paths = Court.actionPaths(p, k), st = Court.stateAt(p, k), start = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const hasMoves = paths.some(x => x.a.type !== 'pass'), passes = paths.filter(x => x.a.type === 'pass');
  const dur = reduce ? 1 : (hasMoves ? 1300 : 750), samples = paths.map(x => ({ ...x, s: Court.sample(x.pts) }));
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const frame = now => {
    const t = Math.min(1, (now - start) / dur), e = ease(t), pos = { ...st.pos };
    samples.forEach(x => { if (x.a.type !== 'pass') pos[x.a.tok] = Court.at(x.s, e); });
    let ballXY = null;
    if (passes.length) {
      // a pass leads the receiver: it leaves late enough to land as the cut finishes
      const from = pos[passes[0].a.tok], to = pos[passes[0].a.to], pt = hasMoves ? Math.max(0, (t - .45) / .55) : e;
      ballXY = pt <= 0 ? null : [from[0] + (to[0] - from[0]) * pt, from[1] + (to[1] - from[1]) * pt];
      drawViewBall(pos, ballXY, pt <= 0 ? st.ball : null);
    } else drawViewBall(pos, null, st.ball);
    if (t < 1) ui.anim = requestAnimationFrame(frame);
    else { ui.anim = null; done(); }
  };
  ui.anim = requestAnimationFrame(frame);
}
function drawViewBall(pos, xy, holder) {
  const p = ui.play, r = Court.R(p.court);
  let h = Court.floor(p.court);
  (p.pen || []).forEach(s => { h += `<path d="${Court.smooth(s)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4" stroke-linecap="round"/>`; });
  p.tokens.forEach(t => { h += Court.token(t, pos[t.id], r, { label: liveLabel(t) }); });
  if (holder && pos[holder]) h += Court.ballMark(pos[holder], r);
  if (xy) h += `<g class="ball" transform="translate(${f(xy[0])} ${f(xy[1])})"><circle r="${f(r * .5)}"/></g>`;
  $('#cv').innerHTML = h;
}

/* ---------- editor (plays and the free board) ---------- */
function editPush() { ui.undoEd = ui.undoEd || []; ui.undoEd.push(JSON.stringify(ui.play)); if (ui.undoEd.length > 50) ui.undoEd.shift(); }
function persist() { save(); }
function renderEdit() {
  const p = ui.play, board = ui.editBoard; ui.step = Math.min(ui.step || 0, p.steps.length);
  const usedLabel = l => p.tokens.some(t => t.label === l && !t.pid), usedPid = id => p.tokens.some(t => t.pid === id);
  const TOOLS = [['move', 'Move'], ['cut', 'Cut'], ['pass', 'Pass'], ['dribble', 'Dribble'], ['screen', 'Screen'], ['pen', 'Pen'], ['ball', 'Ball'], ['erase', 'Erase']];
  $('#main').innerHTML = `<div class="stage">
    <div class="board"><svg id="cv" viewBox="${Court.viewBox(p.court)}" preserveAspectRatio="xMidYMid meet"></svg></div>
    <div class="side">
      <div class="row"><input type="text" class="grow" id="pname" value="${esc(p.name)}" aria-label="Play name" ${board ? 'hidden' : ''}>${board ? '<div class="title grow">Board</div>' : ''}<button class="btn pri" id="done">${board ? 'Save as play' : 'Done'}</button></div>
      ${p.underlay ? `<div class="banner">Check this against your image. <button class="btn" id="hideu" style="min-height:34px;padding:2px 8px">${ui.hideU ? 'Show image' : 'Hide image'}</button> <button class="btn" id="delu" style="min-height:34px;padding:2px 8px">Remove image</button></div>` : ''}
      ${board ? `<div class="row"><button class="chip ${p.court === 'half' ? 'on' : ''}" id="ch">Half</button><button class="chip ${p.court === 'full' ? 'on' : ''}" id="cf">Full</button><button class="btn" id="clr">Clear</button>${S.game ? '<button class="btn" id="ln">Place lineup</button>' : ''}</div>` : ''}
      <div class="dots"><button class="dot ${ui.step === 0 ? 'on' : ''}" data-s="0" aria-label="Starting positions and step 1">${p.steps.length ? 1 : 'Start'}</button>${p.steps.slice(1).map((_, i) => `<button class="dot ${ui.step === i + 1 ? 'on' : ''}" data-s="${i + 1}">${i + 2}</button>`).join('')}<button class="dot add" id="adds" aria-label="Add step">+ Step</button>${p.steps.length > 1 ? '<button class="dot" id="dels" aria-label="Delete this step">Delete</button>' : ''}</div>
      <input type="text" id="note" placeholder="What happens in this step" value="${esc((p.steps[ui.step] || {}).note || '')}" aria-label="Step description">
      <div class="tools">${TOOLS.map(([k, l]) => `<button class="tool ${ui.tool === k ? 'on' : ''}" data-t="${k}" aria-pressed="${ui.tool === k}">${Court.COLOR[k] && k !== 'pen' ? glyph(k) : ''}${l}</button>`).join('')}</div>
      <div class="hint" id="hint"></div>
      <div class="tray">${[1, 2, 3, 4, 5].map(i => `<button data-add="${i}" class="${usedLabel(String(i)) ? 'used' : ''}">${i}</button>`).join('')}${[1, 2, 3, 4, 5].map(i => `<button class="d ${usedLabel('X' + i) ? 'used' : ''}" data-add="X${i}">X${i}</button>`).join('')}</div>
      <div class="tray">${S.players.map(q => `<button data-pl="${q.id}" class="${usedPid(q.id) ? 'used' : ''}" title="${esc(q.name)}">${esc(initials(q))}</button>`).join('')}</div>
      <div class="row"><button class="btn grow" id="eund">Undo</button>${board ? '' : '<button class="btn grow" id="prevw">Play it</button>'}</div>
      ${board ? '' : `<textarea id="pnotes" placeholder="Notes" aria-label="Notes">${esc(p.notes || '')}</textarea>`}
    </div></div>`;
  const HINT = { move: ui.step === 0 ? 'Drag a player to set where they start.' : 'Players can only be moved in step 1. Go back to change a start spot.', cut: 'Drag from a player to draw the cut.', pass: 'Drag from the player with the ball to the receiver.', dribble: 'Drag from the player with the ball.', screen: 'Drag from a player to where they set the screen.', pen: 'Draw freely with your finger.', ball: 'Tap the player who starts with the ball.', erase: 'Tap an arrow, player or pen line to remove it.' };
  $('#hint').textContent = HINT[ui.tool];
  drawEdit(); bindEdit();
  const q = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { ui.step = +b.dataset.s; renderEdit(); });
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ui.tool = b.dataset.t; renderEdit(); });
  q('#adds', () => { editPush(); if (!p.steps.length) p.steps.push({ note: '', actions: [] }); p.steps.push({ note: '', actions: [] }); ui.step = p.steps.length - 1; persist(); renderEdit(); });
  q('#dels', () => { editPush(); p.steps.splice(ui.step, 1); ui.step = Math.max(0, ui.step - 1); persist(); renderEdit(); });
  $('#note').onchange = e => { if (!p.steps.length) p.steps.push({ note: '', actions: [] }); p.steps[ui.step].note = e.target.value; persist(); };
  q('#eund', () => { const u = ui.undoEd && ui.undoEd.pop(); if (!u) return; const o = JSON.parse(u); Object.keys(p).forEach(k => delete p[k]); Object.assign(p, o); persist(); renderEdit(); });
  q('#prevw', () => { ui.k = 0; ui.view = 'view'; render(); });
  q('#hideu', () => { ui.hideU = !ui.hideU; renderEdit(); });
  q('#delu', () => { delete p.underlay; persist(); renderEdit(); });
  const nm = $('#pname'); if (nm) nm.onchange = e => { p.name = e.target.value.trim() || p.name; persist(); };
  const pn = $('#pnotes'); if (pn) pn.onchange = e => { p.notes = e.target.value; persist(); };
  q('#done', () => {
    if (board) {
      sheet(`<h3>Save as play</h3><input type="text" id="nm" placeholder="Play name"><select id="ct">${Object.entries(CATS).filter(([k]) => courtFor(k) === p.court).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><div class="row"><button class="btn pri" id="ok">Save play</button><button class="btn" id="no">Cancel</button></div>`);
      $('#ok').onclick = () => { const c = clone(p); c.id = uid(); c.name = $('#nm').value.trim() || 'Board play'; c.cat = $('#ct').value; if (!c.steps.length) c.steps = [{ note: '', actions: [] }]; S.plays.unshift(c); save(); closeSheet(); toast('Saved to Plays'); };
      $('#no').onclick = closeSheet;
    } else { ui.k = 0; ui.view = 'view'; render(); }
  });
  q('#clr', () => { editPush(); Object.assign(p, { tokens: [], steps: [], pen: [], ball: null }); ui.step = 0; persist(); renderEdit(); });
  const setCourt = c => { if (p.court === c) return; editPush(); Object.assign(p, { court: c, cat: c === 'full' ? 'full' : 'half', tokens: [], steps: [], pen: [], ball: null }); ui.step = 0; persist(); renderEdit(); };
  q('#ch', () => setCourt('half')); q('#cf', () => setCourt('full'));
  q('#ln', () => {
    editPush(); const pts = p.court === 'full' ? SPOTS.full : SPOTS.half;
    p.tokens = SLOTS.map(([s], i) => ({ id: uid(), label: String(i + 1), pid: S.game.lineup[s], side: 'o', x: pts[i][0], y: pts[i][1] }));
    p.ball = p.tokens[0].id; p.steps = []; persist(); renderEdit();
  });
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const l = b.dataset.add; editPush();
    const ex = p.tokens.findIndex(t => t.label === l && !t.pid);
    if (ex >= 0) removeToken(p, p.tokens[ex].id); else addToken(p, { label: l, side: l[0] === 'X' ? 'd' : 'o' });
    persist(); renderEdit();
  });
  document.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => {
    editPush(); const ex = p.tokens.find(t => t.pid === b.dataset.pl);
    if (ex) removeToken(p, ex.id); else addToken(p, { label: initials(player(b.dataset.pl)), pid: b.dataset.pl, side: 'o' });
    persist(); renderEdit();
  });
}
function addToken(p, o) {
  const d = Court.dims(p.court), n = p.tokens.length;
  p.tokens.push({ id: uid(), x: d.w * (.25 + .12 * (n % 5)), y: d.h * (.6 + .08 * (Math.floor(n / 5) % 4)), ...o });
}
function removeToken(p, id) {
  p.tokens = p.tokens.filter(t => t.id !== id); if (p.ball === id) p.ball = null;
  p.steps.forEach(s => { s.actions = s.actions.filter(a => a.tok !== id && a.to !== id); });
}
function drawEdit(live) {
  const p = ui.play, r = Court.R(p.court), k = ui.step, st = Court.stateAt(p, k), d = Court.dims(p.court);
  let h = Court.floor(p.court);
  if (p.underlay && !ui.hideU) h += `<image href="${p.underlay}" x="0" y="0" width="${d.w}" height="${d.h}" opacity=".5" preserveAspectRatio="xMidYMid meet"/>`;
  (p.pen || []).forEach((s, i) => { h += `<g data-pen="${i}"><path d="${Court.smooth(s)}" fill="none" stroke="transparent" stroke-width="3"/><path d="${Court.smooth(s)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4" stroke-linecap="round"/></g>`; });
  Court.actionPaths(p, k).forEach(({ a, pts }) => { h += Court.arrow(a.type, pts, r, { id: a.id }); });
  if (live) h += live.type === 'pen' ? `<path d="${Court.smooth(live.pts)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4"/>` : Court.arrow(live.type, live.pts, r);
  p.tokens.forEach(t => { h += Court.token(t, (live && live.drag === t.id) ? live.at : st.pos[t.id], r, { label: t.pid ? initials(player(t.pid)) : t.label }); });
  if (st.ball && st.pos[st.ball]) h += Court.ballMark((live && live.drag === st.ball) ? live.at : st.pos[st.ball], r);
  $('#cv').innerHTML = h;
}
function bindEdit() {
  const svg = $('#cv'), p = ui.play;
  const toW = e => { const m = svg.getScreenCTM().inverse(); const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [q.x, q.y]; };
  const nearest = (xy, pos, tol) => { let b = null, bd = tol; p.tokens.forEach(t => { const q = pos[t.id], dd = Math.hypot(q[0] - xy[0], q[1] - xy[1]); if (dd < bd) { bd = dd; b = t.id; } }); return b; };
  svg.onpointerdown = e => {
    e.preventDefault(); svg.setPointerCapture(e.pointerId);
    const k = ui.step, st = Court.stateAt(p, k), xy = toW(e), r = Court.R(p.court), tool = ui.tool;
    const hit = nearest(xy, st.pos, r * 1.8);
    if (tool === 'ball') { if (k !== 0) return toast('The ball is set in step 1. After that, draw passes.'); if (hit) { editPush(); p.ball = hit; persist(); drawEdit(); } return; }
    if (tool === 'erase') {
      const el = document.elementFromPoint(e.clientX, e.clientY), ar = el && el.closest('[data-action]'), pn = el && el.closest('[data-pen]');
      if (hit && !ar) { editPush(); removeToken(p, hit); }
      else if (ar) { editPush(); (p.steps[k] || { actions: [] }).actions = p.steps[k].actions.filter(x => x.id !== ar.dataset.action); }
      else if (pn) { editPush(); p.pen.splice(+pn.dataset.pen, 1); }
      persist(); renderEdit(); return;
    }
    let mv, up;
    if (tool === 'move') {
      if (!hit) return;
      if (k !== 0) return toast('Go to step 1 to change where a player starts.');
      editPush(); let at = st.pos[hit];
      mv = ev => { at = toW(ev); drawEdit({ type: 'pen', pts: [], drag: hit, at }); };
      up = () => { const t = p.tokens.find(x => x.id === hit); t.x = at[0]; t.y = at[1]; persist(); drawEdit(); };
    } else if (tool === 'pen') {
      const pts = [xy];
      mv = ev => { pts.push(toW(ev)); drawEdit({ type: 'pen', pts }); };
      up = () => { if (pts.length > 2) { editPush(); (p.pen = p.pen || []).push(Court.simplify(pts, .3).map(q => [f(q[0]), f(q[1])])); persist(); } drawEdit(); };
    } else {
      if (!hit) return toast('Start on a player.');
      if ((tool === 'pass' || tool === 'dribble') && st.ball !== hit) return toast(st.ball ? 'Only the player with the ball can do that. Use another step, or the Ball tool.' : 'Give someone the ball first with the Ball tool.');
      const pts = [st.pos[hit]];
      mv = ev => { pts.push(toW(ev)); drawEdit({ type: tool, pts: Court.simplify(pts) }); };
      up = ev => {
        if (!p.steps.length) p.steps.push({ note: '', actions: [] });
        const step = p.steps[ui.step];
        if (tool === 'pass') {
          const end = toW(ev), pos2 = { ...st.pos }; step.actions.forEach(x => { if (x.type !== 'pass' && x.pts.length) pos2[x.tok] = x.pts[x.pts.length - 1]; });
          const to = nearest(end, pos2, r * 3.2);
          if (!to || to === hit) { drawEdit(); return toast('End the pass on a teammate.'); }
          editPush(); step.actions = step.actions.filter(x => x.type !== 'pass'); step.actions.push({ id: uid(), type: 'pass', tok: hit, pts: [], to });
        } else {
          const s = Court.simplify(pts).map(q => [f(q[0]), f(q[1])]), L = Math.hypot(s[s.length - 1][0] - s[0][0], s[s.length - 1][1] - s[0][1]);
          if (L < 2 && s.length < 3) { drawEdit(); return; }
          editPush(); step.actions = step.actions.filter(x => x.type === 'pass' || x.tok !== hit); step.actions.push({ id: uid(), type: tool, tok: hit, pts: s });
        }
        persist(); drawEdit();
      };
    }
    svg.onpointermove = mv;
    svg.onpointerup = svg.onpointercancel = ev => { svg.onpointermove = svg.onpointerup = svg.onpointercancel = null; up(ev); };
  };
}

/* ---------- import from image ---------- */
const IMPORT_PROMPT = `You convert a basketball play diagram image into JSON for a playbook app. Reply with JSON only.
Conventions in diagrams: solid line with arrowhead = cut; dashed line = pass; zigzag or wavy line = dribble; line ending in a short flat bar = screen. Numbered circles or O's are offense, X's are defense. A dot or marking by a player, or the player the first pass or dribble starts from, has the ball.
Coordinates are in feet.
- "half" court: x 0 to 50 left to right, y 0 at the baseline under the hoop to 47 at midcourt. The hoop is at (25, 5.25). Rotate your reading if needed so the hoop is at the top.
- "full" court: x 0 to 94, y 0 to 50, with the offense attacking the hoop at x=94. Rotate your reading if needed.
Inbounders may stand just out of bounds (down to -3 or up to 3 past the far edge).
Schema:
{"name":string,"category":"half"|"slob"|"blob"|"jump"|"full","court":"half"|"full","notes":string,
 "tokens":[{"label":"1","side":"o"|"d","x":number,"y":number,"hasBall":boolean}],
 "steps":[{"note":"short plain sentence","actions":[{"type":"cut"|"pass"|"dribble"|"screen","token":"1","to":"2 (pass only)","path":[[x,y],...] }]}],
 "uncertain":["anything you could not read"]}
Rules: tokens hold starting spots only. Path runs from the token's position at that step to where it ends, with 2 to 5 points following the drawn curve. Omit path on passes. Each step holds actions that happen together. Order steps using numbers on the arrows if present; otherwise use basketball logic: screens before the cut off them, the pass before the receiver acts on it, one pass per step. If several images are supplied they are successive frames of one play.`;

function importSheet() {
  const hasKey = !!S.settings.apiKey;
  sheet(`<h3>Import from image</h3>
    <p class="small">${hasKey ? 'Pick one photo or diagram, or several frames of the same play. The photo is sent to Claude, then you review the result.' : 'Add a Claude API key in Setup to convert images in the app. Without one, trace the image or use the Claude app.'}</p>
    <button class="btn pri" id="ai" ${hasKey ? '' : 'disabled'}>Choose image and convert</button>
    <button class="btn" id="tr">Trace over an image by hand</button>
    <button class="btn" id="cp">Copy prompt for the Claude app</button>
    <button class="btn" id="pj">Paste play JSON</button>
    <button class="btn" id="cn">Cancel</button>`);
  $('#cn').onclick = closeSheet;
  $('#ai').onclick = () => pickImages(true, convertImages);
  $('#tr').onclick = () => pickImages(false, async files => {
    const under = await shrink(files[0], 720, .6), cat = 'half';
    const p = { id: uid(), name: 'Traced play', cat, court: 'half', notes: '', tokens: slotTokens(cat), ball: 't1', steps: [{ note: '', actions: [] }], pen: [], underlay: under };
    S.plays.unshift(p); save(); closeSheet(); openEdit(p);
  });
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(IMPORT_PROMPT); toast('Prompt copied. Paste it into Claude with your image, then paste the reply here.'); } catch (e) { toast('Copy was blocked by the browser.'); } };
  $('#pj').onclick = () => {
    sheet(`<h3>Paste play JSON</h3><textarea id="js" style="min-height:220px" placeholder="Paste the reply here"></textarea><div class="row"><button class="btn pri" id="go">Create play</button><button class="btn" id="cn2">Cancel</button></div>`);
    $('#cn2').onclick = closeSheet;
    $('#go').onclick = () => { try { const p = playFromJSON($('#js').value); finishImport(p, null); } catch (e) { toast(e.message); } };
  };
}
function pickImages(multi, cb) {
  const inp = $('#file'); inp.accept = 'image/*'; inp.multiple = multi; inp.value = '';
  inp.onchange = () => { const fs = [...inp.files]; if (fs.length) cb(fs); };
  inp.click();
}
function shrink(file, max, q) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file could not be opened as an image.')); };
    im.src = url;
  });
}
async function convertImages(files) {
  sheet(`<h3>Converting</h3><p>Reading the play. This usually takes under a minute.</p>`);
  try {
    const imgs = await Promise.all(files.slice(0, 6).map(x => shrink(x, 1568, .85)));
    const content = imgs.map(d => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: d.split(',')[1] } }));
    content.push({ type: 'text', text: IMPORT_PROMPT });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': S.settings.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: S.settings.model || 'claude-sonnet-5-5', max_tokens: 4000, messages: [{ role: 'user', content }] })
    });
    if (!r.ok) {
      const body = await r.text(); let m = body; try { m = JSON.parse(body).error.message; } catch (e) { /* keep raw */ }
      throw new Error(r.status === 401 ? 'The API key was rejected. Check it in Setup.' : `Claude returned an error: ${m}`);
    }
    const data = await r.json(), text = data.content.filter(c => c.type === 'text').map(c => c.text).join('');
    const under = await shrink(files[0], 720, .6);
    finishImport(playFromJSON(text), under);
  } catch (e) {
    sheet(`<h3>Import did not finish</h3><p>${esc(e.message === 'Failed to fetch' ? 'Could not reach Claude. Check the connection and try again.' : e.message)}</p><button class="btn" id="cn">Close</button>`);
    $('#cn').onclick = closeSheet;
  }
}
function finishImport(p, under) {
  if (under) p.underlay = under;
  S.plays.unshift(p); save(); closeSheet(); openEdit(p);
  if (p.uncertain) toast('Check this: ' + p.uncertain, 6000);
}
/* Turn the model's reply into a valid play, dropping anything that doesn't hold together */
function playFromJSON(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No play data found in that text.');
  let j; try { j = JSON.parse(m[0]); } catch (e) { throw new Error('That play data could not be read.'); }
  if (!Array.isArray(j.tokens) || !j.tokens.length) throw new Error('No players were found in that play.');
  const cat = CATS[j.category] ? j.category : (j.court === 'full' ? 'full' : 'half');
  const court = j.court === 'full' || j.court === 'half' ? j.court : courtFor(cat), d = Court.dims(court);
  const cx = v => f(Math.max(-5, Math.min(d.w + 5, +v || 0))), cy = v => f(Math.max(-5, Math.min(d.h + 5, +v || 0)));
  const byLabel = {};
  const tokens = j.tokens.map((t, i) => { const lab = String(t.label || i + 1).slice(0, 3), o = { id: 't' + i + uid(), label: lab, side: t.side === 'd' ? 'd' : 'o', x: cx(t.x), y: cy(t.y) }; byLabel[lab] = o.id; return o; });
  const holder = j.tokens.findIndex(t => t.hasBall);
  const steps = (j.steps || []).map(s => ({
    note: String(s.note || ''),
    actions: (s.actions || []).map(x => {
      const tok = byLabel[String(x.token)], type = ['cut', 'pass', 'dribble', 'screen'].includes(x.type) ? x.type : 'cut';
      if (!tok) return null;
      if (type === 'pass') { const to = byLabel[String(x.to)]; return to && to !== tok ? { id: uid(), type, tok, pts: [], to } : null; }
      const pts = (x.path || []).filter(q => Array.isArray(q)).map(q => [cx(q[0]), cy(q[1])]);
      return pts.length >= 1 ? { id: uid(), type, tok, pts: pts.length === 1 ? [pts[0], pts[0]] : pts } : null;
    }).filter(Boolean)
  })).filter(s => s.actions.length);
  return { id: uid(), name: String(j.name || 'Imported play'), cat, court, notes: String(j.notes || ''), tokens, ball: holder >= 0 ? tokens[holder].id : null, steps: steps.length ? steps : [{ note: '', actions: [] }], pen: [], uncertain: (j.uncertain || []).join('; ') };
}

/* ---------- setup ---------- */
function renderSetup() {
  const st = S.settings;
  $('#main').innerHTML = `<div class="pad"><h2>Setup</h2>
    <div class="card"><label>Team name<input type="text" id="tn" value="${esc(S.team)}"></label></div>
    <div class="card"><h3>When the Sub button can't do both</h3>
      <div class="chipset"><button class="chip ${st.fair === 'even' ? 'on' : ''}" data-fair="even">Even minutes first</button><button class="chip ${st.fair === 'position' ? 'on' : ''}" data-fair="position">Positions first</button></div>
      <p class="small mute">${st.fair === 'even' ? 'Everyone stays within one rotation. A kid may play out of position; the token gets a dashed ring.' : 'Every slot gets a kid who plays it. Kids at a thin position may play more than the others.'}</p></div>
    <div class="card"><h3>Image import</h3>
      <label>Claude API key<input type="password" id="key" value="${esc(st.apiKey)}" placeholder="sk-ant-..." autocomplete="off"></label>
      <label>Model<input type="text" id="mdl" value="${esc(st.model)}"></label>
      <p class="small mute">The key stays on this device and is left out of backups. Images go straight from here to Anthropic.</p></div>
    <div class="card"><h3>Backup</h3><p class="small mute">Roster, plays and the current game live only on this device.</p>
      <div class="row"><button class="btn" id="exp">Save backup</button><button class="btn" id="imb">Restore backup</button></div></div>
    <p class="mute small">Version ${APP_VERSION}</p></div>`;
  $('#tn').onchange = e => { S.team = e.target.value.trim() || 'Team'; save(); render(); };
  $('#key').onchange = e => { st.apiKey = e.target.value.trim(); save(); };
  $('#mdl').onchange = e => { st.model = e.target.value.trim() || 'claude-sonnet-5-5'; save(); };
  document.querySelectorAll('[data-fair]').forEach(b => b.onclick = () => { st.fair = b.dataset.fair; save(); render(); });
  $('#exp').onclick = () => {
    const o = clone(S); o.settings.apiKey = '';
    const url = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })), l = document.createElement('a');
    l.href = url; l.download = `tipoff-backup-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  $('#imb').onclick = () => {
    const inp = $('#file'); inp.accept = '.json,application/json'; inp.multiple = false; inp.value = '';
    inp.onchange = async () => { try { const o = JSON.parse(await inp.files[0].text()); if (!Array.isArray(o.players) || !Array.isArray(o.plays)) throw 0; o.settings.apiKey = st.apiKey; S = o; save(); toast('Backup restored'); render(); } catch (e) { toast('That file is not a Tipoff backup.'); } };
    inp.click();
  };
}

render();
if ('serviceWorker' in navigator && isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
