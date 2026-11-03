/* Tipoff: rotations and playbook for youth basketball. All data stays on this device. */
const APP_VERSION = '1.3.1';
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
  return { id: uid(), name, cat, court: courtFor(cat), notes, tokens: slotTokens(cat), ball, steps, pen: [], sample: true, seq: 2 };
}
const courtFor = cat => (cat === 'jump' || cat === 'full') ? 'full' : 'half';
function samples() {
  return [
    sample('Give and go', 'half', 't1', 'Pass, cut, get it back.', [
      { note: '1 passes to 2 on the wing.', actions: [a('pass', 't1', [], 't2')] },
      { note: '1 cuts hard to the rim.', actions: [a('cut', 't1', [[25, 28], [29, 21], [27, 13]])] },
      { note: '2 hits 1 for the layup.', actions: [a('pass', 't2', [], 't1')] }]),
    sample('Pick and roll', 'half', 't1', 'Ball screen at the top.', [
      { note: '5 comes up and screens for 1.', actions: [a('screen', 't5', [[18, 8], [22, 19], [29.8, 26.5]])] },
      { note: '1 dribbles off the screen. 5 rolls to the rim.', actions: [a('dribble', 't1', [[25, 28], [21, 26], [15, 19]]), a('cut', 't5', [[29.8, 26.5], [28, 16], [25.5, 9]])] },
      { note: '1 passes to 5 rolling.', actions: [a('pass', 't1', [], 't5')] }]),
    sample('SLOB flash', 'slob', 't2', 'Sideline inbound, 2 is the inbounder.', [
      { note: '4 sets a screen for 1.', actions: [a('screen', 't4', [[32, 14], [31, 26]])] },
      { note: '1 pops to the ball off the screen.', actions: [a('cut', 't1', [[25, 30], [34, 31], [42, 27]])] },
      { note: '2 inbounds to 1.', actions: [a('pass', 't2', [], 't1')] },
      { note: '2 steps in and 4 rolls to the rim.', actions: [a('cut', 't2', [[52.5, 22], [44, 18]]), a('cut', 't4', [[31, 26], [28, 16], [26, 8]])] },
      { note: '1 passes to 4 for the layup.', actions: [a('pass', 't1', [], 't4')] }]),
    sample('BLOB box', 'blob', 't1', 'Box set under the hoop, 1 inbounds.', [
      { note: '4 screens across for 5.', actions: [a('screen', 't4', [[32, 5], [22, 5]])] },
      { note: '5 cuts to the rim.', actions: [a('cut', 't5', [[18, 5], [22, 8], [29, 5]])] },
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
function newBoard() { return { id: 'board', name: 'Board', cat: 'half', court: 'half', tokens: [], ball: null, steps: [], pen: [], notes: '', seq: 2 }; }
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* start fresh */ }
if (!S) { S = blank(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* will retry on the next save */ } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Storage is full. Remove imported photos from plays, then try again.'); }
  if (window.Sync) Sync.touched();
}
/* Older plays relied on "screen first" inside a step. Give those screens their own step so the order is visible and editable. */
function migratePlay(p) {
  if (p.seq) return p;
  const out = [];
  (p.steps || []).forEach(st => {
    const scr = st.actions.filter(x => x.type === 'screen'), rest = st.actions.filter(x => x.type !== 'screen');
    if (scr.length && rest.length && !st.together) { out.push({ note: st.note, actions: scr }); out.push({ note: '', actions: rest }); }
    else { const c = { ...st }; delete c.together; out.push(c); }
  });
  p.steps = out; p.seq = 2;
  return p;
}
S.plays.forEach(migratePlay);
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
function rememberPage() { try { localStorage.setItem(KEY + '.page', JSON.stringify({ view: ui.view, play: ui.play && ui.play.id })); } catch (e) { /* not essential */ } }
function restorePage() {
  try {
    const n = JSON.parse(localStorage.getItem(KEY + '.page')); if (!n) return;
    if (n.view === 'view' || n.view === 'edit') {
      const p = S.plays.find(x => x.id === n.play); if (!p) { ui.view = 'plays'; return; }
      Object.assign(ui, { view: n.view, play: p, k: 0, step: 0, sel: null, atStart: false, tray: false, tool: 'move', undoEd: [], editBoard: false });
    } else if (['game', 'roster', 'plays', 'board', 'setup'].includes(n.view)) ui.view = n.view;
  } catch (e) { /* start on Game */ }
}
function render() {
  rememberPage();
  const ver = $('#ver'); ver.textContent = 'v' + APP_VERSION; ver.hidden = ui.view !== 'game';
  $('#teamName').textContent = S.team;
  const navOn = ui.view === 'view' || ui.view === 'edit' ? (ui.editBoard ? 'board' : 'plays') : ui.view;
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === navOn));
  ({ game: renderGame, roster: renderRoster, plays: renderPlays, view: renderView, edit: renderEdit, board: () => { ui.editBoard = true; ui.play = S.board; ui.step = ui.step || 0; ui.tool = ui.tool || 'move'; renderEdit(); }, setup: renderSetup })[ui.view]();
  if (ui.view !== 'board' && ui.view !== 'edit') ui.editBoard = false;
}

/* ---------- roster ---------- */
function renderRoster() {
  const P = S.players.slice().sort((x, y) => x.name.localeCompare(y.name)), st = P.filter(p => p.starter).length, inn = here().length;
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
      <button class="x" data-a="del" aria-label="Remove ${esc(p.name)}">×</button></div>`).join('') || '<p class="mute">Add your players to get started.</p>'}</div></div>`;
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
    $('#main').innerHTML = `<div class="pad pregame"><img class="biglogo" src="logo-full.png" alt="${esc(S.team)} logo">
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
  p.tokens.forEach(t => { h += Court.token(t, [t.x, t.y], r, { label: tokLabel(t) }); });
  return `<svg viewBox="${Court.viewBox(p.court)}" aria-hidden="true">${h}</svg>`;
}
function renderPlays() {
  const list = S.plays.filter(p => ui.cat === 'all' || p.cat === ui.cat).sort((x, y) => (y.created || 0) - (x.created || 0) || x.name.localeCompare(y.name));
  $('#main').innerHTML = `<div class="pad">
    <div class="row"><h2 class="grow">Plays</h2><button class="btn" id="imp">Import from image</button><button class="btn pri" id="np">New play</button></div>
    <div class="small mute" id="syncstat">${window.Sync ? esc(Sync.status()) : ''}</div>
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
      const cat = $('#ct').value, p = { id: uid(), name: $('#nm').value.trim() || 'New play', cat, court: courtFor(cat), notes: '', tokens: slotTokens(cat), ball: 't1', steps: [{ note: '', actions: [] }], pen: [], seq: 2 };
      S.plays.unshift(p); save(); closeSheet(); openEdit(p);
    };
    $('#no').onclick = closeSheet;
  };
  $('#imp').onclick = importSheet;
}
function openEdit(p) { ui.play = p; ui.step = 0; ui.sel = null; ui.atStart = false; ui.tray = false; ui.tool = 'move'; ui.undoEd = []; ui.view = 'edit'; ui.editBoard = false; render(); }

/* legend & tool glyphs share the real arrow renderer so they always match */
function glyph(type) { return `<svg viewBox="0 0 12 4" aria-hidden="true">${Court.arrow(type, [[0.3, 2], [11.7, 2]], 0)}</svg>`; }
const legend = () => `<div class="legend">${[['cut', 'Cut'], ['pass', 'Pass'], ['dribble', 'Dribble'], ['screen', 'Screen']].map(([t, l]) => `<div>${glyph(t)}${l}</div>`).join('')}</div>`;

/* lineup names on the tokens: 1 PG, 2-3 wings, 4-5 posts */
/* A kid's token shows initials on devices that have that kid in the roster */
const tokLabel = t => t.pid && player(t.pid) ? initials(player(t.pid)) : t.label;
function liveLabel(t) {
  if (t.pid) return tokLabel(t);
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
      <div class="row" style="margin-top:auto"><button class="btn grow" id="flip">Flip</button><button class="btn grow" id="ed">Edit play</button><button class="btn danger" id="dl">Delete</button></div>
    </div></div>`;
  drawView();
  $('#back').onclick = () => go('plays');
  $('#next').onclick = () => { if (ui.anim) return; if (ui.k < n) animate(p, ui.k, () => { ui.k++; drawView(); }); else { ui.k = 0; drawView(); } };
  $('#prev').onclick = () => { cancelAnim(); ui.k = Math.max(0, ui.k - 1); drawView(); };
  $('#re').onclick = () => { cancelAnim(); ui.k = 0; drawView(); };
  $('#flip').onclick = () => { cancelAnim(); flipPlay(p); save(); drawView(); };
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
/* Everything in a step runs at the same time. A pass in the same step as a cut leads the receiver. */
const SPEEDS = { 1: 'Normal', 0.6: 'Slow', 1.5: 'Fast' };
function stepTiming(step, x) {
  const scale = (matchMedia('(prefers-reduced-motion:reduce)').matches ? .001 : 1) / (step.speed || 1), D_M = 1300 * scale, D_P = 750 * scale;
  const moves = x.some(q => q.a.type !== 'pass'), hasPass = x.some(q => q.a.type === 'pass');
  return { screenDur: D_M, moveStart: 0, moveDur: D_M, passStart: moves ? .45 * D_M : 0, passEnd: moves ? D_M : D_P, total: moves ? D_M : (hasPass ? D_P : 1) };
}
/* Mirror the play to the other side of the floor. Half court flips left and right; full court flips across its length, still attacking the same hoop. */
function flipPlay(p) {
  const m = p.court === 'full' ? q => [q[0], f(50 - q[1])] : q => [f(50 - q[0]), q[1]];
  p.tokens.forEach(t => { const [x, y] = m([t.x, t.y]); t.x = x; t.y = y; });
  p.steps.forEach(st => st.actions.forEach(x => { x.pts = (x.pts || []).map(m); }));
  p.pen = (p.pen || []).map(l => l.map(m));
  if (p.underlay) { if (p.underFlip) delete p.underFlip; else p.underFlip = true; }
}
function animate(p, k, done) {
  const paths = Court.actionPaths(p, k), st = Court.stateAt(p, k), start = performance.now(), step = p.steps[k];
  const T = stepTiming(step, paths), items = paths.map(x => ({ ...x, s: Court.sample(x.pts) })), pass = items.find(x => x.a.type === 'pass');
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2, clamp = t => Math.min(1, Math.max(0, t));
  const r = Court.R(p.court);
  const frame = now => {
    const ms = now - start, pos = { ...st.pos };
    items.forEach(x => {
      if (x.a.type === 'screen') pos[x.a.tok] = Court.at(x.s, ease(clamp(ms / T.screenDur)));
      else if (x.a.type !== 'pass') pos[x.a.tok] = Court.at(x.s, ease(clamp((ms - T.moveStart) / T.moveDur)));
    });
    // while the screen is being set, show what comes next
    const waiting = ms < T.moveStart ? items.filter(x => x.a.type !== 'screen').map(x => Court.arrow(x.a.type, x.pts, r)).join('') : '';
    if (pass) {
      const from = pos[pass.a.tok], to = pos[pass.a.to], pt = clamp((ms - T.passStart) / (T.passEnd - T.passStart));
      const xy = pt <= 0 ? null : [from[0] + (to[0] - from[0]) * pt, from[1] + (to[1] - from[1]) * pt];
      drawViewBall(pos, xy, pt <= 0 ? st.ball : null, waiting);
    } else drawViewBall(pos, null, st.ball, waiting);
    if (ms < T.total) ui.anim = requestAnimationFrame(frame);
    else { ui.anim = null; done(); }
  };
  ui.anim = requestAnimationFrame(frame);
}
function drawViewBall(pos, xy, holder, extra = '') {
  const p = ui.play, r = Court.R(p.court);
  let h = Court.floor(p.court);
  (p.pen || []).forEach(s => { h += `<path d="${Court.smooth(s)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4" stroke-linecap="round"/>`; });
  h += extra;
  p.tokens.forEach(t => { h += Court.token(t, pos[t.id], r, { label: liveLabel(t) }); });
  if (holder && pos[holder]) h += Court.ballMark(pos[holder], r);
  if (xy) h += `<g class="ball" transform="translate(${f(xy[0])} ${f(xy[1])})"><circle r="${f(r * .5)}"/></g>`;
  $('#cv').innerHTML = h;
}

/* ---------- editor (plays and the free board) ---------- */
function editPush() { ui.undoEd = ui.undoEd || []; ui.undoEd.push(JSON.stringify(ui.play)); if (ui.undoEd.length > 50) ui.undoEd.shift(); }
function persist() { save(); }
function askText(title, value, cb, multi) {
  sheet(`<h3>${esc(title)}</h3>${multi ? `<textarea id="askv">${esc(value || '')}</textarea>` : `<input type="text" id="askv" value="${esc(value || '')}">`}
    <div class="row"><button class="btn pri" id="asky">Save</button><button class="btn" id="askn">Cancel</button></div>`);
  $('#askv').focus();
  $('#asky').onclick = () => { const v = $('#askv').value.trim(); closeSheet(); cb(v); };
  $('#askn').onclick = closeSheet;
}
const TOOLS = [['move', 'Select'], ['cut', 'Cut'], ['pass', 'Pass'], ['dribble', 'Dribble'], ['screen', 'Screen'], ['pen', 'Pen'], ['ball', 'Ball'], ['erase', 'Erase']];
function toolHint() {
  const sel = ui.sel && findAction(ui.sel);
  if (ui.tool === 'move' && sel) return sel.a.type === 'pass' ? 'Drag the white dot onto a different receiver.' : 'Drag a white dot to change where the player goes.';
  return { move: ui.step === 0 ? 'Drag a player to set their start. Tap an arrow to adjust it.' : 'Tap an arrow to adjust it. Starting spots are set in step 1.', cut: `Drag from a player. Goes in step ${ui.step + 1}.`, pass: `Drag from the ball handler to a teammate. Goes in step ${ui.step + 1}.`, dribble: `Drag from the ball handler. Goes in step ${ui.step + 1}.`, screen: `Drag from a player to the screen spot. Goes in step ${ui.step + 1}.`, pen: 'Draw freely with your finger.', ball: 'Tap the player who starts with the ball.', erase: 'Tap an arrow, player or pen line to remove it.' }[ui.tool];
}
function findAction(id) {
  const steps = ui.play.steps;
  for (let i = 0; i < steps.length; i++) { const j = steps[i].actions.findIndex(x => x.id === id); if (j >= 0) return { i, j, a: steps[i].actions[j] }; }
  return null;
}
const tokName = id => { const t = ui.play.tokens.find(x => x.id === id); return t ? tokLabel(t) : '?'; };
function actionLabel(a) {
  if (a.type === 'pass') return `${esc(tokName(a.tok))} passes to ${esc(tokName(a.to))}`;
  return `${esc(tokName(a.tok))} ${{ cut: 'cuts', dribble: 'dribbles', screen: 'screens' }[a.type]}`;
}
/* Actions that can't happen in this order, because that player won't have the ball yet */
function ballProblems(p) {
  const bad = {}; let ball = p.ball;
  p.steps.forEach(st => {
    st.actions.forEach(x => { if ((x.type === 'pass' || x.type === 'dribble') && x.tok !== ball) bad[x.id] = true; });
    st.actions.forEach(x => { if (x.type === 'pass') ball = x.to; });
  });
  return bad;
}
const clashes = (st, a) => st.actions.some(x => x.id !== a.id && (a.type === 'pass' ? x.type === 'pass' : x.type !== 'pass' && x.tok === a.tok));
function pruneEmpty(p) {
  p.steps = p.steps.filter(st => st.actions.length || st.note);
  if (!p.steps.length && !ui.editBoard) p.steps = [{ note: '', actions: [] }];
  ui.step = Math.max(0, Math.min(ui.step, p.steps.length - 1));
}
function moveAction(id, dir) {
  const p = ui.play, f = findAction(id); if (!f) return;
  const st = p.steps[f.i], alone = st.actions.length === 1, t = f.i + dir;
  if (!alone) { st.actions.splice(f.j, 1); p.steps.splice(dir > 0 ? f.i + 1 : f.i, 0, { note: '', actions: [f.a] }); ui.step = dir > 0 ? f.i + 1 : f.i; return true; }
  if (t < 0 || t >= p.steps.length) return false;
  const to = p.steps[t];
  if (clashes(to, f.a)) { p.steps[f.i] = to; p.steps[t] = st; ui.step = t; return true; }
  to.actions.push(f.a); to.note = to.note || st.note; p.steps.splice(f.i, 1); ui.step = dir > 0 ? t - 1 : t;
  return true;
}
function dropAction(id, tgt) {
  const p = ui.play, f = findAction(id); if (!f) return;
  const anchor = tgt.join != null ? p.steps[tgt.join] : null;
  if (anchor && anchor === p.steps[f.i]) return;
  if (anchor && clashes(anchor, f.a)) return toast(f.a.type === 'pass' ? 'A step can only hold one pass.' : 'A player can only make one move per step.');
  editPush();
  const newStep = anchor ? null : { note: '', actions: [] };
  if (newStep) p.steps.splice(tgt.gap, 0, newStep);
  const src = findAction(id);
  p.steps[src.i].actions.splice(src.j, 1);
  (anchor || newStep).actions.push(f.a);
  ui.step = p.steps.indexOf(anchor || newStep);
  const keep = p.steps[ui.step];
  p.steps = p.steps.filter(st => st.actions.length || st.note || st === keep);
  ui.step = p.steps.indexOf(keep);
  persist(); refreshEdit();
}
/* Dropping a move above or below another in its own step means "run in this order", so the step splits */
function splitInStep(id, targetId, above) {
  const p = ui.play, src = findAction(id), st = p.steps[src.i];
  const rest = st.actions.filter(x => x.id !== id), at = rest.findIndex(x => x.id === targetId) + (above ? 0 : 1);
  const parts = [rest.slice(0, at), [src.a], rest.slice(at)].filter(x => x.length);
  editPush();
  const made = parts.map((actions, i) => { const n = { note: i === 0 ? st.note : '', actions }; if (st.speed) n.speed = st.speed; return n; });
  p.steps.splice(src.i, 1, ...made);
  ui.step = src.i + parts.findIndex(x => x[0].id === id); ui.sel = id;
  persist(); refreshEdit();
  toast('Now in that order. Each step is one tap of Next.');
}
function dropStep(i, gap) {
  const p = ui.play;
  if (gap === i || gap === i + 1) return;
  editPush();
  const st = p.steps[i]; p.steps.splice(i, 1); p.steps.splice(gap > i ? gap - 1 : gap, 0, st);
  ui.step = p.steps.indexOf(st); persist(); refreshEdit();
}
function seqHtml() {
  const p = ui.play, bad = ballProblems(p), gap = i => `<div class="gap" data-gap="${i}"><span>New step here</span></div>`;
  return `<button class="startrow ${ui.atStart ? 'on' : ''}" data-startrow>Starting positions</button>${gap(0)}` + p.steps.map((st, i) => `
    <div class="stepcard ${i === ui.step && !ui.atStart ? 'on' : ''}" data-stepcard="${i}">
      <div class="stephead" data-pick="${i}"><span class="grip" data-gripstep="${i}" aria-hidden="true">⠿</span><b>${i + 1}</b>
        <button class="note" data-note="${i}">${esc(st.note) || '<i>Add description</i>'}</button>
        <button class="spd" data-speed="${i}">${SPEEDS[st.speed || 1]}</button></div>
      ${st.actions.map(x => `<div class="act ${x.id === ui.sel ? 'on' : ''}" data-act="${x.id}"><span class="grip" data-grip="${x.id}" aria-hidden="true">⠿</span>${glyph(x.type)}<span class="grow">${actionLabel(x)}</span>${bad[x.id] ? '<span class="warn small">No ball yet</span>' : ''}</div>
        ${x.id === ui.sel ? `<div class="actbar"><button data-do="early">Earlier</button><button data-do="late">Later</button>${x.type === 'pass' ? '' : `<button data-do="bend">Add bend</button><button data-do="straight">Straighten</button>`}<button data-do="del" class="warn">Delete</button></div>` : ''}`).join('') || '<div class="hint pad0">Draw on the court to add a move.</div>'}
    </div>${gap(i + 1)}`).join('') + `<button class="dot add addstep" id="adds">+ New step</button>`;
}
function refreshEdit() {
  const p = ui.play;
  if (ui.sel && !findAction(ui.sel)) ui.sel = null;
  const box = $('#seq'); if (!box) return;
  const top = box.scrollTop; box.innerHTML = seqHtml(); box.scrollTop = top;
  $('#hint').textContent = toolHint();
  document.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', b.dataset.t === ui.tool); b.setAttribute('aria-pressed', b.dataset.t === ui.tool); });
  const used = (l) => p.tokens.some(t => t.label === l && !t.pid);
  document.querySelectorAll('[data-add]').forEach(b => b.classList.toggle('used', used(b.dataset.add)));
  document.querySelectorAll('[data-pl]').forEach(b => b.classList.toggle('used', p.tokens.some(t => t.pid === b.dataset.pl)));
  drawEdit();
}
function renderEdit() {
  const p = ui.play, board = ui.editBoard; ui.step = Math.max(0, Math.min(ui.step || 0, p.steps.length - 1));
  const trayOpen = board || ui.tray;
  $('#main').innerHTML = `<div class="stage edit">
    <div class="board"><svg id="cv" viewBox="${Court.viewBox(p.court)}" preserveAspectRatio="xMidYMid meet"></svg></div>
    <div class="side">
      <div class="row">${board ? '<div class="title grow">Board</div>' : `<button class="namebtn grow" id="pname">${esc(p.name)}</button>`}<button class="btn pri" id="done">${board ? 'Save as play' : 'Done'}</button></div>
      ${p.underlay ? `<div class="banner">Check this against your image. <button class="btn" id="hideu" style="min-height:34px;padding:2px 8px">${ui.hideU ? 'Show image' : 'Hide image'}</button> <button class="btn" id="delu" style="min-height:34px;padding:2px 8px">Remove image</button></div>` : ''}
      ${board ? `<div class="row"><button class="chip ${p.court === 'half' ? 'on' : ''}" id="ch">Half</button><button class="chip ${p.court === 'full' ? 'on' : ''}" id="cf">Full</button><button class="btn" id="clr">Clear</button>${S.game ? '<button class="btn" id="ln">Place lineup</button>' : ''}</div>` : ''}
      <div class="tools">${TOOLS.map(([k, l]) => `<button class="tool" data-t="${k}">${Court.COLOR[k] && k !== 'pen' ? glyph(k) : ''}${l}</button>`).join('')}</div>
      <div class="hint" id="hint"></div>
      <div class="seq" id="seq"></div>
      <div id="traybox" ${trayOpen ? '' : 'hidden'}>
        <div class="tray">${[1, 2, 3, 4, 5].map(i => `<button data-add="${i}">${i}</button>`).join('')}${[1, 2, 3, 4, 5].map(i => `<button class="d" data-add="X${i}">X${i}</button>`).join('')}</div>
        <div class="tray" style="margin-top:4px">${S.players.map(q => `<button data-pl="${q.id}" title="${esc(q.name)}">${esc(initials(q))}</button>`).join('')}</div>
      </div>
      <div class="row"><button class="btn grow" id="eund">Undo</button><button class="btn grow" id="eflip">Flip</button>${board ? '' : '<button class="btn grow" id="traybtn">Players</button><button class="btn grow" id="pnotes">Notes</button><button class="btn grow" id="prevw">Play it</button>'}</div>
    </div></div>`;
  refreshEdit(); bindEdit(); bindSeq();
  const q = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ui.tool = b.dataset.t; ui.atStart = false; refreshEdit(); });
  q('#eund', () => { const u = ui.undoEd && ui.undoEd.pop(); if (!u) return; const o = JSON.parse(u); Object.keys(p).forEach(k => delete p[k]); Object.assign(p, o); ui.step = Math.min(ui.step, Math.max(0, p.steps.length - 1)); persist(); refreshEdit(); });
  q('#eflip', () => { editPush(); flipPlay(p); persist(); refreshEdit(); });
  q('#traybtn', () => { ui.tray = !ui.tray; $('#traybox').hidden = !ui.tray; });
  q('#prevw', () => { pruneEmpty(p); persist(); ui.k = 0; ui.view = 'view'; render(); });
  q('#hideu', () => { ui.hideU = !ui.hideU; renderEdit(); });
  q('#delu', () => { delete p.underlay; persist(); renderEdit(); });
  q('#pname', () => askText('Play name', p.name, v => { if (v) { p.name = v; persist(); $('#pname').textContent = v; } }));
  q('#pnotes', () => askText('Play notes', p.notes, v => { p.notes = v; persist(); }, true));
  q('#done', () => {
    if (board) {
      sheet(`<h3>Save as play</h3><input type="text" id="nm" placeholder="Play name"><select id="ct">${Object.entries(CATS).filter(([k]) => courtFor(k) === p.court).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><div class="row"><button class="btn pri" id="ok">Save play</button><button class="btn" id="no">Cancel</button></div>`);
      $('#ok').onclick = () => { const c = clone(p); c.id = uid(); c.name = $('#nm').value.trim() || 'Board play'; c.cat = $('#ct').value; if (!c.steps.length) c.steps = [{ note: '', actions: [] }]; S.plays.unshift(c); save(); closeSheet(); toast('Saved to Plays'); };
      $('#no').onclick = closeSheet;
    } else { pruneEmpty(p); persist(); ui.k = 0; ui.view = 'view'; render(); }
  });
  q('#clr', () => { editPush(); Object.assign(p, { tokens: [], steps: [], pen: [], ball: null }); ui.step = 0; persist(); refreshEdit(); });
  const setCourt = c => { if (p.court === c) return; editPush(); Object.assign(p, { court: c, cat: c === 'full' ? 'full' : 'half', tokens: [], steps: [], pen: [], ball: null }); ui.step = 0; persist(); renderEdit(); };
  q('#ch', () => setCourt('half')); q('#cf', () => setCourt('full'));
  q('#ln', () => {
    editPush(); const pts = p.court === 'full' ? SPOTS.full : SPOTS.half;
    p.tokens = SLOTS.map(([s], i) => ({ id: uid(), label: String(i + 1), pid: S.game.lineup[s], side: 'o', x: pts[i][0], y: pts[i][1] }));
    p.ball = p.tokens[0].id; p.steps = []; persist(); refreshEdit();
  });
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const l = b.dataset.add; editPush();
    const ex = p.tokens.findIndex(t => t.label === l && !t.pid);
    if (ex >= 0) removeToken(p, p.tokens[ex].id); else addToken(p, { label: l, side: l[0] === 'X' ? 'd' : 'o' });
    persist(); refreshEdit();
  });
  document.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => {
    editPush(); const ex = p.tokens.find(t => t.pid === b.dataset.pl);
    if (ex) removeToken(p, ex.id); else addToken(p, { label: initials(player(b.dataset.pl)), pid: b.dataset.pl, side: 'o' });
    persist(); refreshEdit();
  });
}
/* The sequence panel: tap to pick, drag a handle to reorder or group */
function bindSeq() {
  const box = $('#seq'), p = ui.play;
  box.onclick = e => {
    const b = e.target.closest('button,[data-act],[data-pick]'); if (!b) return;
    if (b.dataset.startrow != null) { ui.atStart = true; ui.step = 0; ui.sel = null; ui.tool = 'move'; return refreshEdit(); }
    if (b.id === 'adds') { editPush(); p.steps.push({ note: '', actions: [] }); ui.step = p.steps.length - 1; ui.sel = null; ui.atStart = false; persist(); refreshEdit(); box.scrollTop = box.scrollHeight; return; }
    if (b.dataset.note != null) { const i = +b.dataset.note; return askText(`Step ${i + 1} description`, p.steps[i].note, v => { editPush(); p.steps[i].note = v; persist(); refreshEdit(); }); }
    if (b.dataset.speed != null) { const st = p.steps[+b.dataset.speed], order = [1, .6, 1.5]; editPush(); const nx = order[(order.indexOf(st.speed || 1) + 1) % 3]; if (nx === 1) delete st.speed; else st.speed = nx; persist(); return refreshEdit(); }
    if (b.dataset.do) {
      const fa = findAction(ui.sel); if (!fa) return;
      editPush();
      if (b.dataset.do === 'early' && !moveAction(ui.sel, -1)) ui.undoEd.pop();
      if (b.dataset.do === 'late' && !moveAction(ui.sel, 1)) ui.undoEd.pop();
      if (b.dataset.do === 'bend') { const n = fa.a.pts.length, u = fa.a.pts[n - 2], v = fa.a.pts[n - 1]; fa.a.pts.splice(n - 1, 0, [f((u[0] + v[0]) / 2), f((u[1] + v[1]) / 2)]); }
      if (b.dataset.do === 'straight') fa.a.pts = [fa.a.pts[0], fa.a.pts[fa.a.pts.length - 1]];
      if (b.dataset.do === 'del') { p.steps[fa.i].actions.splice(fa.j, 1); ui.sel = null; }
      persist(); return refreshEdit();
    }
    if (b.dataset.act) { const f = findAction(b.dataset.act); ui.sel = ui.sel === b.dataset.act ? null : b.dataset.act; ui.step = f.i; ui.atStart = false; ui.tool = 'move'; return refreshEdit(); }
    if (b.dataset.pick != null) { ui.step = +b.dataset.pick; ui.sel = null; ui.atStart = false; return refreshEdit(); }
  };
  box.onpointerdown = e => {
    const g = e.target.closest('[data-grip],[data-gripstep]'); if (!g) return;
    e.preventDefault();
    const isStep = g.dataset.gripstep != null, src = isStep ? g.closest('.stepcard') : g.closest('.act'), sx = e.clientX, sy = e.clientY;
    let ghost = null, over = null, scroller = 0, inRow = 'top';
    const clear = () => { if (over) over.classList.remove('hot', 'hot-top', 'hot-bot'); over = null; };
    const mv = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        ghost = src.cloneNode(true); ghost.classList.add('seqghost'); ghost.style.width = src.offsetWidth + 'px'; document.body.append(ghost);
        src.classList.add('dragging'); box.classList.add('draggingseq');
      }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      const r = box.getBoundingClientRect(); scroller = ev.clientY < r.top + 30 ? -8 : ev.clientY > r.bottom - 30 ? 8 : 0;
      const el = document.elementFromPoint(ev.clientX, ev.clientY), home = isStep ? null : src.closest('.stepcard');
      let t = el && (el.closest('[data-gap]') || (isStep ? null : el.closest('[data-stepcard]')));
      clear();
      if (t && t === home) {
        // inside its own step: find the row above or below the drop point
        const rows = [...home.querySelectorAll('.act')].filter(x => x !== src);
        const row = rows.find(x => { const q = x.getBoundingClientRect(); return ev.clientY >= q.top - 8 && ev.clientY <= q.bottom + 8; });
        if (!row) return;
        const q = row.getBoundingClientRect(); inRow = ev.clientY < q.top + q.height / 2 ? 'top' : 'bot';
        over = row; row.classList.add('hot-' + inRow); return;
      }
      if (t) { over = t; t.classList.add('hot'); }
    };
    const tick = setInterval(() => { if (scroller) box.scrollTop += scroller; }, 16);
    const up = () => {
      clearInterval(tick);
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (!ghost) return;
      ghost.remove(); src.classList.remove('dragging'); box.classList.remove('draggingseq');
      const t = over; clear();
      if (!t) return refreshEdit();
      if (t.dataset.act) splitInStep(g.dataset.grip, t.dataset.act, inRow === 'top');
      else if (isStep) dropStep(+g.dataset.gripstep, +t.dataset.gap);
      else dropAction(g.dataset.grip, t.dataset.gap != null ? { gap: +t.dataset.gap } : { join: +t.dataset.stepcard });
      refreshEdit();
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
}
function addToken(p, o) {
  const d = Court.dims(p.court), n = p.tokens.length;
  p.tokens.push({ id: uid(), x: d.w * (.25 + .12 * (n % 5)), y: d.h * (.6 + .08 * (Math.floor(n / 5) % 4)), ...o });
}
function removeToken(p, id) {
  p.tokens = p.tokens.filter(t => t.id !== id); if (p.ball === id) p.ball = null;
  p.steps.forEach(s => { s.actions = s.actions.filter(a => a.tok !== id && a.to !== id); });
}
function handlesFor(p, k) {
  const f = ui.sel && findAction(ui.sel); if (!f || f.i !== k) return [];
  const st = Court.stateAt(p, k);
  if (f.a.type === 'pass') { const ends = { ...st.pos }; p.steps[k].actions.forEach(x => { if (x.type !== 'pass' && x.pts.length) ends[x.tok] = x.pts[x.pts.length - 1]; }); return ends[f.a.to] ? [{ i: 'to', at: ends[f.a.to] }] : []; }
  return f.a.pts.map((q, i) => ({ i, at: q })).filter(h => h.i > 0);
}
function drawEdit(live) {
  const p = ui.play, r = Court.R(p.court), k = ui.step, st = Court.stateAt(p, k), d = Court.dims(p.court);
  let h = Court.floor(p.court);
  if (p.underlay && !ui.hideU) h += `<image href="${p.underlay}" x="0" y="0" width="${d.w}" height="${d.h}" opacity=".5" preserveAspectRatio="xMidYMid meet" ${p.underFlip ? `transform="${p.court === 'full' ? 'translate(0 50) scale(1 -1)' : 'translate(50 0) scale(-1 1)'}"` : ''}/>`;
  (p.pen || []).forEach((s, i) => { h += `<g data-pen="${i}"><path d="${Court.smooth(s)}" fill="none" stroke="transparent" stroke-width="3"/><path d="${Court.smooth(s)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4" stroke-linecap="round"/></g>`; });
  if (!ui.atStart) Court.actionPaths(p, k).forEach(({ a, pts }) => { h += Court.arrow(a.type, pts, r, { id: a.id, opacity: ui.sel && a.id !== ui.sel ? .45 : 1 }); });
  if (live && live.type !== 'none') h += live.type === 'pen' ? `<path d="${Court.smooth(live.pts)}" fill="none" stroke="${Court.COLOR.pen}" stroke-width=".4"/>` : Court.arrow(live.type, live.pts, r);
  p.tokens.forEach(t => { h += Court.token(t, (live && live.drag === t.id) ? live.at : st.pos[t.id], r, { label: tokLabel(t) }); });
  if (st.ball && st.pos[st.ball]) h += Court.ballMark((live && live.drag === st.ball) ? live.at : st.pos[st.ball], r);
  if (!ui.atStart) handlesFor(p, k).forEach(q => { h += `<circle cx="${f(q.at[0])}" cy="${f(q.at[1])}" r="1.15" class="hd"/>`; });
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
    let mv, up;
    const finish = () => { svg.onpointermove = mv; svg.onpointerup = svg.onpointercancel = ev => { svg.onpointermove = svg.onpointerup = svg.onpointercancel = null; up(ev); }; };
    /* drag a white dot to reshape the selected arrow */
    const hd = !ui.atStart && tool !== 'pen' && tool !== 'erase' ? handlesFor(p, k).find(q => Math.hypot(q.at[0] - xy[0], q.at[1] - xy[1]) < 2.6) : null;
    if (hd) {
      const fa = findAction(ui.sel); editPush();
      if (hd.i === 'to') {
        up = ev => { const ends = { ...st.pos }; p.steps[k].actions.forEach(x => { if (x.type !== 'pass' && x.pts.length) ends[x.tok] = x.pts[x.pts.length - 1]; }); const to = nearest(toW(ev), ends, r * 3); if (to && to !== fa.a.tok) fa.a.to = to; persist(); refreshEdit(); };
        mv = ev => drawEdit({ type: 'pass', pts: [st.pos[fa.a.tok], toW(ev)] });
      } else {
        mv = ev => { const w = toW(ev); fa.a.pts[hd.i] = [f(w[0]), f(w[1])]; drawEdit(); };
        up = () => { persist(); refreshEdit(); };
      }
      return finish();
    }
    if (tool === 'ball') { if (k !== 0) return toast('The ball is set in step 1. After that, draw passes.'); if (hit) { editPush(); p.ball = hit; persist(); refreshEdit(); } return; }
    if (tool === 'erase') {
      const el = document.elementFromPoint(e.clientX, e.clientY), ar = el && el.closest('[data-action]'), pn = el && el.closest('[data-pen]');
      if (ar) { editPush(); const fa = findAction(ar.dataset.action); p.steps[fa.i].actions.splice(fa.j, 1); }
      else if (hit) { editPush(); removeToken(p, hit); }
      else if (pn) { editPush(); p.pen.splice(+pn.dataset.pen, 1); }
      persist(); refreshEdit(); return;
    }
    if (tool === 'move') {
      const el = document.elementFromPoint(e.clientX, e.clientY), ar = el && el.closest('[data-action]');
      if (hit && (k === 0)) {
        editPush(); let at = st.pos[hit], moved = false;
        mv = ev => { at = toW(ev); moved = true; drawEdit({ type: 'none', drag: hit, at }); };
        up = () => { if (!moved) { ui.undoEd.pop(); return refreshEdit(); } const t = p.tokens.find(x => x.id === hit); t.x = f(at[0]); t.y = f(at[1]); persist(); refreshEdit(); };
        return finish();
      }
      if (ar) { ui.sel = ar.dataset.action; ui.atStart = false; refreshEdit(); return; }
      if (hit) return toast('Starting spots are set in step 1.');
      if (ui.sel) { ui.sel = null; refreshEdit(); }
      return;
    }
    if (tool === 'pen') {
      const pts = [xy];
      mv = ev => { pts.push(toW(ev)); drawEdit({ type: 'pen', pts }); };
      up = () => { if (pts.length > 2) { editPush(); (p.pen = p.pen || []).push(Court.simplify(pts, .3).map(q => [f(q[0]), f(q[1])])); persist(); } refreshEdit(); };
      return finish();
    }
    if (!hit) return toast('Start on a player.');
    if ((tool === 'pass' || tool === 'dribble') && st.ball !== hit) return toast(st.ball ? `Only the player with the ball can do that in step ${k + 1}.` : 'Give someone the ball first with the Ball tool.');
    ui.atStart = false;
    const pts = [st.pos[hit]];
    mv = ev => { pts.push(toW(ev)); drawEdit({ type: tool, pts: Court.simplify(pts) }); };
    up = ev => {
      if (!p.steps.length) p.steps.push({ note: '', actions: [] });
      const step = p.steps[ui.step];
      if (tool === 'pass') {
        const end = toW(ev), pos2 = { ...st.pos }; step.actions.forEach(x => { if (x.type !== 'pass' && x.pts.length) pos2[x.tok] = x.pts[x.pts.length - 1]; });
        const to = nearest(end, pos2, r * 3.2);
        if (!to || to === hit) { refreshEdit(); return toast('End the pass on a teammate.'); }
        editPush(); step.actions = step.actions.filter(x => x.type !== 'pass');
        const na = { id: uid(), type: 'pass', tok: hit, pts: [], to }; step.actions.push(na); ui.sel = na.id;
      } else {
        const s = Court.simplify(pts).map(q => [f(q[0]), f(q[1])]), L = Math.hypot(s[s.length - 1][0] - s[0][0], s[s.length - 1][1] - s[0][1]);
        if (L < 2 && s.length < 3) { refreshEdit(); return; }
        editPush(); step.actions = step.actions.filter(x => x.type === 'pass' || x.tok !== hit);
        const na = { id: uid(), type: tool, tok: hit, pts: s }; step.actions.push(na); ui.sel = na.id;
      }
      persist(); refreshEdit();
    };
    finish();
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
Rules: tokens hold starting spots only. Path runs from the token's position at that step to where it ends, with 2 to 5 points following the drawn curve. Omit path on passes. Each step holds actions that happen at the same moment. A screen goes in its own step before the cut off it. Order steps using numbers on the arrows if present; otherwise use basketball logic: screens before the cut off them, the pass before the receiver acts on it, one pass per step. If several images are supplied they are successive frames of one play.`;

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
    const p = { id: uid(), name: 'Traced play', cat, court: 'half', notes: '', tokens: slotTokens(cat), ball: 't1', steps: [{ note: '', actions: [] }], pen: [], underlay: under, seq: 2 };
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
  return { id: uid(), name: String(j.name || 'Imported play'), cat, court, notes: String(j.notes || ''), tokens, ball: holder >= 0 ? tokens[holder].id : null, steps: steps.length ? steps : [{ note: '', actions: [] }], pen: [], uncertain: (j.uncertain || []).join('; '), seq: 2 };
}

/* ---------- setup ---------- */
function renderSetup() {
  const st = S.settings;
  $('#main').innerHTML = `<div class="pad"><div class="row"><h2 class="grow">Setup</h2><span id="setupver">Version ${APP_VERSION}</span></div>
    <div class="card"><label>Team name<input type="text" id="tn" value="${esc(S.team)}"></label></div>
    <div class="card"><h3>When the Sub button can't do both</h3>
      <div class="chipset"><button class="chip ${st.fair === 'even' ? 'on' : ''}" data-fair="even">Even minutes first</button><button class="chip ${st.fair === 'position' ? 'on' : ''}" data-fair="position">Positions first</button></div>
      <p class="small mute">${st.fair === 'even' ? 'Everyone stays within one rotation. A kid may play out of position; the token gets a dashed ring.' : 'Every slot gets a kid who plays it. Kids at a thin position may play more than the others.'}</p></div>
    <div class="card"><h3>Image import</h3>
      <label>Claude API key<input type="text" class="secret" id="key" value="${esc(st.apiKey)}" placeholder="sk-ant-..." autocomplete="off"></label>
      <label>Model<input type="text" id="mdl" value="${esc(st.model)}"></label>
      <p class="small mute">The key stays on this device and is left out of backups. Images go straight from here to Anthropic.</p></div>
    <div class="card"><h3>Sync plays and roster</h3>${window.Sync && Sync.cfg() ? `
      <p class="small">Connected to ${esc(S.sync.repo)}. <span id="syncstat">${esc(Sync.status())}</span></p>
      <div class="row"><button class="btn" id="synow">Sync now</button><button class="btn" id="sycode">Copy setup code</button><button class="btn danger" id="sydis">Disconnect</button></div>
      <p class="small mute">Paste the setup code into the token box on your other devices. It holds your sync token and Claude key, so treat it like a password.</p>` : `
      <label>Private GitHub repo<input type="text" id="syrepo" value="TIrlb/tipoff-data" autocomplete="off" autocapitalize="off"></label>
      <label>GitHub token or setup code<input type="text" class="secret" id="sytok" autocomplete="off"></label>
      <button class="btn pri" id="sygo">Connect</button>
      <p class="small mute">Plays and the roster are saved here first and sync when online. Games and the Board stay on this device.</p>`}</div>
    <div class="card"><h3>Backup</h3><p class="small mute">Includes the current game, which exists only on this device.</p>
      <div class="row"><button class="btn" id="exp">Save backup</button><button class="btn" id="imb">Restore backup</button></div></div>
    </div>`;
  $('#tn').onchange = e => { S.team = e.target.value.trim() || 'Team'; save(); render(); };
  $('#key').onchange = e => { st.apiKey = e.target.value.trim(); save(); };
  $('#mdl').onchange = e => { st.model = e.target.value.trim() || 'claude-sonnet-5-5'; save(); };
  document.querySelectorAll('[data-fair]').forEach(b => b.onclick = () => { st.fair = b.dataset.fair; save(); render(); });
  const clk = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  clk('#synow', () => { Sync.run().then(() => { toast(Sync.status() || 'Synced'); render(); }); });
  clk('#sycode', async () => { try { await navigator.clipboard.writeText(Sync.code()); toast('Setup code copied'); } catch (e) { toast('Copy was blocked by the browser.'); } });
  clk('#sydis', () => { Sync.disconnect(); toast('Disconnected. Plays stay on this device.'); render(); });
  clk('#sygo', async () => {
    let repo = $('#syrepo').value.trim(), tok = $('#sytok').value.trim();
    try {
      if (tok.startsWith('tipoff:')) { const c = Sync.parseCode(tok); repo = c.repo; tok = c.token; if (c.key && !st.apiKey) st.apiKey = c.key; }
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !tok) return toast('Enter the repo as owner/name, plus a token.');
      $('#sygo').disabled = true;
      await Sync.connect(repo, tok); toast('Connected. Plays are syncing.'); render();
    } catch (e) { toast(e instanceof TypeError ? 'Could not reach GitHub. Check the connection.' : e.message, 5000); const b = $('#sygo'); if (b) b.disabled = false; }
  });
  $('#exp').onclick = () => {
    const o = clone(S); o.settings.apiKey = ''; delete o.sync;
    const url = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })), l = document.createElement('a');
    l.href = url; l.download = `tipoff-backup-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  $('#imb').onclick = () => {
    const inp = $('#file'); inp.accept = '.json,application/json'; inp.multiple = false; inp.value = '';
    inp.onchange = async () => { try { const o = JSON.parse(await inp.files[0].text()); if (!Array.isArray(o.players) || !Array.isArray(o.plays)) throw 0; o.settings.apiKey = st.apiKey; if (S.sync) o.sync = S.sync; S = o; save(); toast('Backup restored'); render(); } catch (e) { toast('That file is not a Tipoff backup.'); } };
    inp.click();
  };
}

/* These fields hold play names and settings, not logins, so password managers should leave them alone */
function noFill(root) { root.querySelectorAll('input,textarea').forEach(el => { el.setAttribute('autocomplete', 'off'); el.setAttribute('data-1p-ignore', ''); el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-bwignore', ''); el.setAttribute('data-form-type', 'other'); }); }
new MutationObserver(() => noFill(document)).observe(document.body, { childList: true, subtree: true });
noFill(document);
restorePage();
render();
if ('serviceWorker' in navigator && isSecureContext) {
  /* When a new version finishes downloading, load it right away unless you're mid-edit in a pop-up */
  const hadWorker = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker || reloaded) return;
    if (!$('#sheet').hidden || ['INPUT', 'TEXTAREA'].includes((document.activeElement || {}).tagName) || ui.anim) return toast('Update ready. Refresh to load it.');
    reloaded = true; location.reload();
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
