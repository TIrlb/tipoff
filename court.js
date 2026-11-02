/* Court drawing, arrow styles and play replay. Units are feet.
   Half court: x 0-50, y 0-47, hoop at top. Full court: x 0-94, y 0-50, attacking the right hoop. */
(function (root) {
  const PAD = 6;
  const dims = c => c === 'full' ? { w: 94, h: 50 } : { w: 50, h: 47 };
  const viewBox = c => { const d = dims(c); return `${-PAD} ${-PAD} ${d.w + PAD * 2} ${d.h + PAD * 2}`; };
  const R = c => c === 'full' ? 2.3 : 2.1;
  const COLOR = { cut: '#14284B', pass: '#B3261E', dribble: '#1B6E4B', screen: '#6A2C91', pen: '#14284B' };

  /* One end of the floor, hoop at top */
  function end() {
    return `<rect x="19" y="0" width="12" height="19" class="paint"/>
      <rect x="19" y="0" width="12" height="19" class="ln"/>
      <path d="M19 19a6 6 0 0 1 12 0" class="ln dash"/><path d="M19 19a6 6 0 0 0 12 0" class="ln"/>
      <line x1="19" x2="31" y1="16" y2="16" class="ln ft12"/>
      <path d="M3 0V9A22 22 0 0 0 47 9V0" class="ln"/>
      <line x1="22" x2="28" y1="4" y2="4" class="ln bb"/>
      <circle cx="25" cy="5.25" r=".85" class="rim"/>`;
  }
  function floor(c) {
    if (c === 'full') return `<rect x="${-PAD}" y="${-PAD}" width="106" height="62" class="apron"/><rect width="94" height="50" class="wood"/>
      <g transform="matrix(0 -1 1 0 0 50)">${end()}</g><g transform="matrix(0 1 -1 0 94 0)">${end()}</g>
      <rect width="94" height="50" class="ln"/><line x1="47" x2="47" y1="0" y2="50" class="ln"/><circle cx="47" cy="25" r="6" class="ln"/>`;
    return `<rect x="${-PAD}" y="${-PAD}" width="62" height="59" class="apron"/><rect width="50" height="47" class="wood"/>${end()}
      <path d="M19 47a6 6 0 0 1 12 0" class="ln"/><rect width="50" height="47" class="ln"/>`;
  }

  /* Smooth line through points */
  function smooth(pts) {
    if (pts.length < 2) return '';
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }
  const f = n => Math.round(n * 100) / 100;

  /* Dense points along the same curve, used for wavy lines, animation and trimming */
  function sample(pts, step = .5) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const cr = a => .5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3);
        out.push([cr(0), cr(1)]);
      }
    }
    return out;
  }
  const length = s => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return l; };
  function at(s, t) {
    if (s.length < 2) return s[0];
    const L = length(s) * Math.min(1, Math.max(0, t)); let l = 0;
    for (let i = 1; i < s.length; i++) {
      const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      if (l + d >= L && d > 0) { const u = (L - l) / d; return [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * u, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * u]; }
      l += d;
    }
    return s[s.length - 1];
  }
  function trim(s, a, b) {
    let i = 0, l = 0;
    while (i < s.length - 1 && l < a) { l += Math.hypot(s[i + 1][0] - s[i][0], s[i + 1][1] - s[i][1]); i++; }
    let j = s.length - 1; l = 0;
    while (j > i && l < b) { l += Math.hypot(s[j][0] - s[j - 1][0], s[j][1] - s[j - 1][1]); j--; }
    return s.slice(i, j + 1);
  }

  /* The four arrow styles. Same shape and colour everywhere in the app:
     cut solid, pass dashed, dribble wavy, screen solid with a flat bar at the end. */
  function arrow(type, pts, r, o = {}) {
    let s = sample(pts);
    s = trim(s, r, type === 'pass' ? r + .3 : (type === 'screen' ? .1 : .2));
    if (s.length < 2) return '';
    const col = COLOR[type], op = o.opacity != null ? ` opacity="${o.opacity}"` : '';
    const n = s.length, a = s[Math.max(0, n - 4)], b = s[n - 1];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    let line, tip;
    if (type === 'screen') {
      const w = 2, px = Math.cos(ang + Math.PI / 2) * w, py = Math.sin(ang + Math.PI / 2) * w;
      tip = `<line x1="${f(b[0] + px)}" y1="${f(b[1] + py)}" x2="${f(b[0] - px)}" y2="${f(b[1] - py)}" stroke="${col}" stroke-width=".75" stroke-linecap="round"/>`;
    } else {
      const h = 1.9, sp = .48;
      tip = `<path d="M${f(b[0])} ${f(b[1])}L${f(b[0] - h * Math.cos(ang - sp))} ${f(b[1] - h * Math.sin(ang - sp))}L${f(b[0] - h * Math.cos(ang + sp))} ${f(b[1] - h * Math.sin(ang + sp))}Z" fill="${col}"/>`;
    }
    const body = type === 'screen' || type === 'cut' ? s : s.slice(0, Math.max(2, n - 3));
    if (type === 'dribble') {
      const L = length(body), N = Math.max(8, Math.round(L * 3)), wave = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, p = at(body, t), q = at(body, Math.min(1, t + .01)), an = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const amp = .62 * Math.sin(t * L * 2 * Math.PI / 2.4) * Math.min(1, (1 - t) * L / 1.2);
        wave.push(`${f(p[0] - Math.sin(an) * amp)} ${f(p[1] + Math.cos(an) * amp)}`);
      }
      line = `<path d="M${wave.join('L')}" fill="none" stroke="${col}" stroke-width=".5" stroke-linejoin="round"/>`;
    } else {
      line = `<path d="M${body.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" fill="none" stroke="${col}" stroke-width=".55" stroke-linecap="round" ${type === 'pass' ? 'stroke-dasharray="1.5 1"' : ''}/>`;
    }
    const data = o.id ? ` data-action="${o.id}"` : '';
    return `<g${op}${data} class="arrow">${o.id ? `<path d="M${s.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" fill="none" stroke="transparent" stroke-width="3"/>` : ''}${line}${tip}</g>`;
  }

  /* Replay: where everyone stands after the first k steps. */
  function stateAt(play, k) {
    const pos = {}; play.tokens.forEach(t => { pos[t.id] = [t.x, t.y]; });
    let ball = play.ball || null;
    for (let i = 0; i < k && i < play.steps.length; i++) {
      for (const a of play.steps[i].actions) {
        if (a.type === 'pass') continue;
        if (pos[a.tok] && a.pts && a.pts.length) pos[a.tok] = a.pts[a.pts.length - 1].slice();
      }
      for (const a of play.steps[i].actions) if (a.type === 'pass' && pos[a.to]) ball = a.to;
    }
    return { pos, ball };
  }
  /* The path each action draws at step k, starting from where the player really is */
  function actionPaths(play, k) {
    const { pos } = stateAt(play, k), end = { ...pos };
    const st = play.steps[k]; if (!st) return [];
    st.actions.forEach(a => { if (a.type !== 'pass' && a.pts && a.pts.length && pos[a.tok]) end[a.tok] = a.pts[a.pts.length - 1]; });
    return st.actions.map(a => {
      if (!pos[a.tok]) return null;
      if (a.type === 'pass') return pos[a.to] ? { a, pts: [pos[a.tok], end[a.to]] } : null;
      return { a, pts: [pos[a.tok], ...(a.pts || []).slice(a.pts && a.pts.length > 1 ? 1 : 0)] };
    }).filter(Boolean);
  }

  function token(t, p, r, o = {}) {
    const d = t.side === 'd', lab = esc(o.label || t.label), fs = lab.length > 2 ? r * .78 : r * 1.02;
    return `<g class="tk ${d ? 'def' : 'off'}" data-tok="${t.id}" transform="translate(${f(p[0])} ${f(p[1])})">
      <circle r="${r + 1.4}" fill="transparent"/><circle r="${r}" class="disc"/><text y="${f(fs * .36)}" font-size="${f(fs)}">${lab}</text></g>`;
  }
  const ballMark = (p, r, cls = '') => `<g class="ball ${cls}" transform="translate(${f(p[0] + r * .78)} ${f(p[1] - r * .78)})"><circle r="${f(r * .46)}"/><path d="M${f(-r * .46)} 0H${f(r * .46)}M0 ${f(-r * .46)}V${f(r * .46)}" /></g>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Thin freehand points to the few that define the shape */
  function simplify(pts, tol = .9) {
    if (pts.length < 3) return pts;
    let md = 0, mi = 0; const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if (d > md) { md = d; mi = i; } }
    if (md <= tol) return [a, b];
    return simplify(pts.slice(0, mi + 1), tol).slice(0, -1).concat(simplify(pts.slice(mi), tol));
  }

  root.Court = { PAD, dims, viewBox, R, COLOR, floor, smooth, sample, at, arrow, stateAt, actionPaths, token, ballMark, esc, simplify, f };
})(this);
