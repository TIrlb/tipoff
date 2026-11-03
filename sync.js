/* Play sync. Plays live in localStorage first, so the app always works offline.
   When connected, they are merged with plays.json in a private GitHub repo, one play at a time: newest edit wins.
   The roster, games, the Board and API keys never go up; kid-specific tokens go up without initials. */
window.Sync = (() => {
  const FILE = 'plays.json', API = 'https://api.github.com/repos/';
  let busy = false, again = false, timer = null, msg = '', state = 'off';
  const cfg = () => S.sync && S.sync.token ? S.sync : null;
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };

  /* What a play looks like in the cloud */
  function form(p) {
    const o = clone(p);
    delete o.underlay; delete o.uncertain;
    o.tokens = (o.tokens || []).map(t => t.pid ? { ...t, label: /^\d$/.test(t.label) ? t.label : '•' } : t);
    return o;
  }
  const sig = p => { const o = form(p); delete o.updatedAt; delete o.created; return hash(JSON.stringify(o)); };

  /* Notice local edits and deletions, however they were made */
  function stamp() {
    const c = cfg(); let changed = false; const now = Date.now(), ids = new Set();
    S.plays.forEach(p => {
      ids.add(p.id); const h = sig(p);
      if (!p.created) p.created = now;
      if (c.base[p.id] !== h) { c.base[p.id] = h; p.updatedAt = now; changed = true; }
    });
    Object.keys(c.base).forEach(id => { if (!ids.has(id)) { delete c.base[id]; c.deleted[id] = now; changed = true; } });
    return changed;
  }

  async function req(path, opt = {}) {
    const c = cfg();
    return fetch(API + c.repo + path, { cache: 'no-store', ...opt, headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + c.token, ...(opt.headers || {}) } });
  }
  const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), ch => ch.charCodeAt(0)));
  function b64enc(s) { const b = new TextEncoder().encode(s); let o = ''; for (let i = 0; i < b.length; i += 8190) o += String.fromCharCode(...b.subarray(i, i + 8190)); return btoa(o); }

  async function pull() {
    const r = await req('/contents/' + FILE);
    if (r.status === 404) return { doc: null, sha: null };
    if (!r.ok) throw httpErr(r);
    const j = await r.json();
    let text = j.encoding === 'base64' && j.content ? b64dec(j.content) : null;
    if (text == null) { const raw = await req('/contents/' + FILE, { headers: { Accept: 'application/vnd.github.raw+json' } }); if (!raw.ok) throw httpErr(raw); text = await raw.text(); }
    return { doc: JSON.parse(text), sha: j.sha };
  }
  function httpErr(r) {
    const e = new Error(r.status === 401 ? 'GitHub rejected the token. Check it in Setup.' : r.status === 403 ? 'The token needs read and write access to Contents on this repo.' : r.status === 404 ? 'GitHub could not find that repo with this token.' : `GitHub returned error ${r.status}.`);
    e.fatal = r.status === 401 || r.status === 403; return e;
  }

  function merge(doc) {
    const c = cfg(), rPlays = (doc && doc.plays) || {}, rDel = (doc && doc.deleted) || {};
    const deleted = { ...rDel }; Object.entries(c.deleted).forEach(([k, v]) => { if (!(deleted[k] >= v)) deleted[k] = v; });
    let changedHere = false;
    Object.values(rPlays).forEach(rp => {
      const lp = S.plays.find(p => p.id === rp.id);
      if (lp) {
        if ((rp.updatedAt || 0) > (lp.updatedAt || 0)) {
          const under = lp.underlay; Object.keys(lp).forEach(k => delete lp[k]); Object.assign(lp, clone(rp));
          if (under) lp.underlay = under;
          c.base[lp.id] = sig(lp); changedHere = true;
        }
      } else if (!(deleted[rp.id] >= (rp.updatedAt || 0))) {
        S.plays.push(clone(rp)); c.base[rp.id] = sig(rp); changedHere = true;
      }
    });
    S.plays = S.plays.filter(p => {
      if (deleted[p.id] >= (p.updatedAt || 0)) { delete c.base[p.id]; changedHere = true; return false; }
      delete deleted[p.id]; return true;
    });
    c.deleted = deleted;
    const out = { v: 1, plays: {}, deleted };
    S.plays.forEach(p => { out.plays[p.id] = form(p); });
    return { out, changedHere };
  }

  /* Refresh what's on screen, but never yank the screen out from under an animation */
  function refresh() {
    if (ui.anim) return;
    if (ui.view === 'plays') render();
    else if ((ui.view === 'view' || ui.view === 'edit') && ui.play && !ui.editBoard) {
      if (!S.plays.includes(ui.play)) { toast('That play was deleted on another device.'); go('plays'); }
      else if (ui.view === 'view') { ui.k = Math.min(ui.k, ui.play.steps.length); render(); }
    } else if (ui.view === 'setup') render();
  }
  function show() { const e = document.getElementById('syncstat'); if (e) e.textContent = status(); }

  async function run() {
    const c = cfg(); if (!c) return;
    if (busy) { again = true; return; }
    busy = true; state = 'busy'; show();
    try {
      for (let tries = 0; tries < 4; tries++) {
        const { doc, sha } = await pull();
        if (!c.joined) { if (doc) S.plays = S.plays.filter(p => !p.sample); c.joined = true; }
        stamp();
        const { out, changedHere } = merge(doc);
        const same = doc && JSON.stringify(sortDoc(doc)) === JSON.stringify(sortDoc(out));
        save0();
        if (changedHere) refresh();
        if (same) break;
        const r = await req('/contents/' + FILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Update plays', content: b64enc(JSON.stringify(out)), ...(sha ? { sha } : {}) }) });
        if (r.ok) break;
        if ((r.status === 409 || r.status === 422) && tries < 3) continue; // another device saved first: merge again
        throw httpErr(r);
      }
      c.last = Date.now(); state = 'ok'; msg = ''; save0();
    } catch (e) {
      const offline = e instanceof TypeError || !navigator.onLine;
      state = offline ? 'offline' : 'error'; msg = offline ? '' : e.message;
    }
    busy = false; show();
    if (again) { again = false; run(); }
  }
  function sortDoc(d) {
    const k = o => Object.keys(o || {}).sort().reduce((a, x) => (a[x] = o[x], a), {});
    return { plays: k(d.plays), deleted: k(d.deleted) };
  }
  const save0 = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* surfaced by save() on the next edit */ } };

  /* Called after any save: push soon, only if plays actually changed */
  function touched() {
    const c = cfg(); if (!c || !c.joined) return;
    if (!S.plays.some(p => c.base[p.id] !== sig(p)) && !Object.keys(c.base).some(id => !S.plays.some(p => p.id === id))) return;
    clearTimeout(timer); timer = setTimeout(run, 3000); state = 'pending'; show();
  }
  function status() {
    const c = cfg(); if (!c) return '';
    if (state === 'busy') return 'Syncing plays';
    if (state === 'pending') return 'Saved here, syncing soon';
    if (state === 'offline') return 'Offline. Plays are saved here and will sync later.';
    if (state === 'error') return msg;
    if (c.last) return 'Plays synced ' + new Date(c.last).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return '';
  }
  async function connect(repo, token) {
    S.sync = { repo, token, base: {}, deleted: {}, joined: false, last: 0 };
    const r = await req('');
    if (!r.ok) { const e = httpErr(r); S.sync = null; save0(); throw e; }
    state = 'off'; save0(); await run();
    if (state === 'error') { const m = msg; S.sync = null; save0(); throw new Error(m); }
  }
  function disconnect() { S.sync = null; state = 'off'; save0(); }
  const code = () => 'tipoff:' + btoa(JSON.stringify({ r: S.sync.repo, t: S.sync.token, k: S.settings.apiKey || '' }));
  function parseCode(s) { const j = JSON.parse(atob(s.slice(7).trim())); return { repo: j.r, token: j.t, key: j.k }; }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  window.addEventListener('online', run);
  setInterval(() => { if (!document.hidden && !ui.anim) run(); }, 60000);
  return { run, touched, status, connect, disconnect, code, parseCode, cfg };
})();
Sync.run();
