/* ==========================================================================
   Estelas de condensación · interaccións e visualizacións
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (v, d = 1) => {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    return v.toFixed(d).replace('.', ',').replace('-', '−');
  };
  const fmtSigned = (v, d = 1) => (v > 0 ? '+' : '') + fmt(v, d);

  /* ----------------------------------------------------------------------
     Tema e utilidades de debuxo
     ---------------------------------------------------------------------- */
  let TH = {};
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n) => cs.getPropertyValue(n).trim();
    TH = {
      ink: g('--ink'), inkSoft: g('--ink-soft'), muted: g('--muted'),
      grid: g('--grid'), rule: g('--rule'), accent: g('--accent'),
      warm: g('--warm'), pos: g('--pos'), neg: g('--neg'),
      surface: g('--surface'), bg: g('--bg'), chip: g('--chip'),
      s1: g('--s1'), s2: g('--s2'), s3: g('--s3'), s4: g('--s4'), s5: g('--s5'),
      sat: [g('--s1'), g('--s2'), g('--s3'), g('--s4'), g('--s5')]
    };
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const txt = $('#themeTxt'), ico = $('#themeIcon');
    if (txt) txt.textContent = isDark ? 'Claro' : 'Escuro';
    if (ico) ico.textContent = isDark ? '☀' : '☾';
  }

  const MONO = '11px "JetBrains Mono", ui-monospace, Menlo, monospace';
  const MONO_SM = '9.5px "JetBrains Mono", ui-monospace, Menlo, monospace';
  const DISP = '600 11px "Archivo", "Helvetica Neue", Arial, sans-serif';
  const DISP_SM = '600 10px "Archivo", "Helvetica Neue", Arial, sans-serif';

  function prep(cv, H) {
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(220, cv.clientWidth || cv.parentNode.clientWidth || 300);
    cv.style.height = H + 'px';
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    return { c, W, H };
  }

  function rr(c, x, y, w, h, r) {
    if (w < 0) { x += w; w = -w; }
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function labelRotated(c, text, x, y) {
    c.save();
    c.translate(x, y);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 0, 0);
    c.restore();
  }

  /* ----------------------------------------------------------------------
     Navegación, progreso e botóns xerais
     ---------------------------------------------------------------------- */
  const progress = $('#progressBar');
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }

  const navLinks = $$('.nav-links a');
  const navSections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  function updateNav() {
    const y = window.scrollY + 130;
    let current = navSections[0];
    navSections.forEach((s) => { if (s.offsetTop <= y) current = s; });
    navLinks.forEach((a) => a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id));
  }

  let scrollRaf = null;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      updateProgress();
      updateNav();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  const themeBtn = $('#btnTheme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = cur ? cur === 'dark' : sysDark;
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      readTheme();
      drawAll();
    });
  }

  const printBtn = $('#btnPrint');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  const backtop = $('#backtop');
  if (backtop) backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ----------------------------------------------------------------------
     01 · Gráfico de forzamento radiativo
     ---------------------------------------------------------------------- */
  const ERF = [
    { id: 'contrail', label: 'Cirros de estela', short: 'Cirros de estela', erf: 57.4, erfLo: 17, erfHi: 98, rf: 111.4, rfLo: 33, rfHi: 189, conf: 'Baixa', color: () => TH.warm, note: 'Nubes de xeo persistentes. É o termo positivo máis grande da aviación, pero tamén o de maior incerteza: o rango vai de 17 a 98 mW/m².' },
    { id: 'co2', label: 'CO₂', short: 'CO₂', erf: 34.3, erfLo: 28, erfHi: 40, rf: 34.3, rfLo: 31, rfHi: 38, conf: 'Alta', color: () => TH.s1, note: 'Efecto ben coñecido e de longa duración. O CO₂ permanece na atmosfera durante séculos, polo que a súa redución é irrenunciable.' },
    { id: 'nox', label: 'NOₓ (neto)', short: 'NOₓ neto', erf: 17.5, erfLo: 0.6, erfHi: 29, rf: 8.2, rfLo: -4.8, rfHi: 16, conf: 'Baixa', color: () => TH.s3, note: 'O NOₓ produce ozono (que quenta) e destrúe metano (que arrefría). O efecto neto é positivo, pero con moita incerteza.' },
    { id: 'h2o', label: 'Vapor de auga estratosférico', short: 'Vapor de auga', erf: 2.0, erfLo: 0.8, erfHi: 3.2, rf: 2.0, rfLo: 0.8, rfHi: 3.2, conf: 'Media', color: () => TH.s5, note: 'O vapor de auga emitido directamente na estratosfera ten un efecto pequeno pero non desprezable.' },
    { id: 'soot', label: 'Aerosois de feluxe', short: 'Feluxe', erf: 0.94, erfLo: 0.1, erfHi: 4.0, rf: 0.94, rfLo: 0.1, rfHi: 4.0, conf: 'Baixa', color: () => TH.s4, note: 'As partículas de feluxe poden actuar como núcleos de condensación e alterar as nubes. O efecto é pequeno e incerto.' },
    { id: 'sulf', label: 'Aerosois de xofre', short: 'Xofre', erf: -7.4, erfLo: -19, erfHi: -2.6, rf: -7.4, rfLo: -19, rfHi: -2.6, conf: 'Baixa', color: () => TH.muted, note: 'Os aerosois de xofre reflicten radiación solar e producen un efecto neto de arrefriamento. É o único termo negativo principal.' },
    { id: 'total', label: 'Total aviación', short: 'Total aviación', erf: 100.9, erfLo: 55, erfHi: 145, rf: null, rfLo: null, rfHi: null, conf: '—', color: () => TH.ink, note: 'Suma dos termos principais. A aviación contribúe arredor do 3,5 % do forzamento antropoxénico. A incerteza total é ampla, sobre todo pola contribución das estelas.' }
  ];

  let erfMode = 'erf';
  let erfSel = 0;
  let erfGeom = [];

  function erfValue(d) { return erfMode === 'erf' ? d.erf : d.rf; }
  function erfLo(d) { return erfMode === 'erf' ? d.erfLo : d.rfLo; }
  function erfHi(d) { return erfMode === 'erf' ? d.erfHi : d.rfHi; }

  function drawErf() {
    const cv = $('#cvErf');
    if (!cv) return;
    const { c, W, H } = prep(cv, 380);
    const m = { l: W < 560 ? 122 : 184, r: W < 560 ? 52 : 76, t: 18, b: 34 };
    const domain = erfMode === 'erf' ? [-25, 160] : [-40, 200];
    const ticks = erfMode === 'erf' ? [-20, 0, 40, 80, 120, 160] : [-40, 0, 40, 80, 120, 160, 200];
    const X = (v) => m.l + (v - domain[0]) / (domain[1] - domain[0]) * (W - m.l - m.r);
    const rowH = (H - m.t - m.b) / ERF.length;

    c.font = MONO_SM;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    ticks.forEach((v) => {
      const x = Math.round(X(v)) + 0.5;
      c.strokeStyle = v === 0 ? TH.rule : TH.grid;
      c.lineWidth = v === 0 ? 1.4 : 1;
      c.beginPath(); c.moveTo(x, m.t - 2); c.lineTo(x, H - m.b); c.stroke();
      c.fillStyle = TH.muted;
      c.fillText(String(v), x, H - m.b + 7);
    });

    c.font = DISP;
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillStyle = TH.muted;
    c.fillText('mW/m²', m.l, H - 4);

    erfGeom = [];
    ERF.forEach((d, i) => {
      const cy = m.t + rowH * (i + 0.5);
      const v = erfValue(d);
      const selected = i === erfSel;

      c.font = selected ? DISP : DISP_SM;
      c.fillStyle = selected ? TH.ink : TH.muted;
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillText(d.short, m.l - 10, cy);

      if (v === null) {
        c.fillStyle = TH.muted;
        c.textAlign = 'left';
        c.fillText('—', m.l + 8, cy);
      } else {
        const x0 = X(0), x1 = X(v);
        const bx = Math.min(x0, x1), bw = Math.abs(x1 - x0);
        const bh = Math.min(20, rowH * 0.52);
        c.fillStyle = d.color();
        c.globalAlpha = selected ? 1 : 0.78;
        rr(c, bx, cy - bh / 2, bw, bh, 4);
        c.fill();
        c.globalAlpha = 1;
        if (selected) {
          c.strokeStyle = TH.ink;
          c.lineWidth = 1.6;
          c.stroke();
        }

        const lo = X(erfLo(d)), hi = X(erfHi(d));
        c.strokeStyle = TH.inkSoft;
        c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(lo, cy); c.lineTo(hi, cy); c.stroke();
        [lo, hi].forEach((x) => {
          c.beginPath(); c.moveTo(x, cy - 5); c.lineTo(x, cy + 5); c.stroke();
        });

        c.font = MONO;
        c.fillStyle = TH.ink;
        c.textAlign = 'right';
        c.textBaseline = 'middle';
        c.fillText(fmt(v, 1), W - 8, cy);
      }

      erfGeom.push({ i, y: cy, h: rowH });
    });

    c.font = MONO_SM;
    c.fillStyle = TH.muted;
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(erfMode === 'erf' ? 'ERF · forzamento radiativo efectivo' : 'RF · forzamento radiativo', m.l, 2);
  }

  function updateErfDetail() {
    const d = ERF[erfSel];
    const v = erfValue(d);
    const lo = erfLo(d), hi = erfHi(d);
    const label = erfMode === 'erf' ? 'ERF' : 'RF';
    const unit = 'mW/m²';
    const range = (v === null) ? 'non dispoñible para RF' : `${fmt(lo, 1)} – ${fmt(hi, 1)} ${unit}`;
    const val = v === null ? '—' : `${fmt(v, 1)} ${unit}`;
    $('#erfDetail').innerHTML = `<strong>${d.label}</strong><br><span style="font-family:var(--f-mono);font-size:1.05rem">${label}: ${val}</span><br><span class="small">Rango 5–95 %: ${range} · Confianza: ${d.conf}</span><p style="margin-top:6px">${d.note}</p>`;
  }

  function initErf() {
    const sel = $('#erfSelect');
    if (sel) {
      ERF.forEach((d, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = d.label;
        sel.appendChild(o);
      });
      sel.value = String(erfSel);
      sel.addEventListener('change', () => {
        erfSel = Number(sel.value);
        drawErf();
        updateErfDetail();
      });
    }

    const seg = $('#segErf');
    if (seg) {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
        erfMode = b.dataset.v;
        drawErf();
        updateErfDetail();
      });
    }

    const cv = $('#cvErf');
    if (cv) {
      cv.style.cursor = 'pointer';
      cv.addEventListener('click', (e) => {
        const rect = cv.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hit = erfGeom.find((g) => Math.abs(y - g.y) < g.h / 2);
        if (hit) {
          erfSel = hit.i;
          const s = $('#erfSelect');
          if (s) s.value = String(erfSel);
          drawErf();
          updateErfDetail();
        }
      });
    }
    updateErfDetail();
  }

  /* ----------------------------------------------------------------------
     02 · Simulador de formación de estelas
     ---------------------------------------------------------------------- */
  const pressureHPa = (h) => 1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  const esat = (TK) => 611.21 * Math.exp(17.502 * (TK - 273.15) / (TK - 32.19));
  const esatIce = (TK) => 611.15 * Math.exp(22.452 * (TK - 273.15) / (TK - 0.55));
  const desat = (TK) => {
    const d = 0.01;
    return (esat(TK + d) - esat(TK - d)) / (2 * d);
  };
  const gSlope = (pPa, eta = 0.30) => 1.23 * pPa * 1004 / (0.622 * (1 - eta) * 43e6);

  function bisect(f, a, b, it = 90) {
    let fa = f(a), fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) return null;
    for (let i = 0; i < it; i++) {
      const m = (a + b) / 2;
      const fm = f(m);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  }

  function calcSim() {
    const h = Number($('#rgAlt').value);
    const tC = Number($('#rgTemp').value);
    const rh = Number($('#rgRh').value) / 100;
    const p = pressureHPa(h * 1000);
    const pPa = p * 100;
    const g = gSlope(pPa);
    const Ta = tC + 273.15;
    const Tt = bisect((TK) => desat(TK) - g, 170, 300);
    const eA = rh * esat(Ta);

    let Tcrit = null;
    let Smax = rh;
    let forms = false;
    let persistent = false;

    if (Tt !== null) {
      const ft = esat(Tt) - g * Tt;
      Tcrit = bisect((TK) => rh * esat(TK) - g * TK - ft, 150, Tt);
      const Tpeak = Math.max(Ta, Tt);
      Smax = (eA + g * (Tpeak - Ta)) / esat(Tpeak);
      forms = Smax >= 1;
      const rhIce = rh * esat(Ta) / esatIce(Ta);
      persistent = forms && Ta < 235 && rhIce > 1;
    }

    return { h, tC, rh, p, g, Ta, Tt, Tcrit, eA, Smax, forms, persistent };
  }

  function drawMix(r) {
    const cv = $('#cvMix');
    if (!cv) return;
    const { c, W, H } = prep(cv, 330);
    const m = { l: 46, r: 18, t: 18, b: 42 };
    const x0 = clamp(Math.floor((r.Ta - 12) / 10) * 10, 160, 255);
    const x1 = Math.min(320, Math.max(r.Ta + 70, (r.Tt === null ? r.Ta : r.Tt) + 45));
    const y0 = -2.2, y1 = 1.35;
    const X = (TK) => m.l + (TK - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = (v) => m.t + (y1 - v) / (y1 - y0) * (H - m.t - m.b);

    c.font = MONO_SM;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (let TK = Math.ceil(x0 / 20) * 20; TK <= x1; TK += 20) {
      const x = Math.round(X(TK)) + 0.5;
      c.strokeStyle = TH.grid;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, m.t); c.lineTo(x, H - m.b); c.stroke();
      c.fillStyle = TH.muted;
      c.fillText(fmt(TK - 273.15, 0), x, H - m.b + 7);
    }
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    [-2, -1, 0, 1].forEach((v) => {
      const y = Math.round(Y(v)) + 0.5;
      c.strokeStyle = v === 0 ? TH.warm : TH.grid;
      c.lineWidth = v === 0 ? 1.4 : 1;
      if (v === 0) c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(m.l, y); c.lineTo(W - m.r, y); c.stroke();
      c.setLineDash([]);
      c.fillStyle = v === 0 ? TH.warm : TH.muted;
      c.fillText(String(v), m.l - 7, y);
    });

    c.fillStyle = TH.muted;
    c.font = DISP_SM;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Temperatura (°C)', m.l + (W - m.l - m.r) / 2, H - 16);
    c.save();
    c.translate(10, m.t + (H - m.t - m.b) / 2);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('log₁₀ S', 0, 0);
    c.restore();

    // vertical de referencia: ambiente
    const xa = Math.round(X(r.Ta)) + 0.5;
    c.strokeStyle = TH.accent;
    c.setLineDash([3, 4]);
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(xa, m.t); c.lineTo(xa, H - m.b); c.stroke();
    c.setLineDash([]);

    // curva de mestura
    const pts = [];
    const start = Math.max(x0, r.Ta);
    for (let TK = start; TK <= x1; TK += 0.8) {
      const e = r.eA + r.g * (TK - r.Ta);
      if (e <= 0) break;
      const S = e / esat(TK);
      pts.push({ x: TK, y: Math.log10(Math.max(S, 1e-3)) });
    }
    if (pts.length > 1) {
      c.strokeStyle = TH.accent;
      c.lineWidth = 2.4;
      c.lineJoin = 'round';
      c.beginPath();
      pts.forEach((p, i) => {
        const px = X(p.x), py = Y(clamp(p.y, y0, y1));
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      });
      c.stroke();
    }

    // puntos: ambiente e pico
    const yAmb = Math.log10(Math.max(r.rh, 1e-3));
    const Tpeak = Math.max(r.Ta, r.Tt === null ? r.Ta : r.Tt);
    const yPeak = Math.log10(Math.max(r.Smax, 1e-3));

    c.fillStyle = TH.warm;
    c.strokeStyle = TH.surface;
    c.lineWidth = 2;
    c.beginPath(); c.arc(X(r.Ta), Y(clamp(yAmb, y0, y1)), 4.2, 0, Math.PI * 2); c.fill(); c.stroke();

    c.fillStyle = r.forms ? TH.s3 : TH.muted;
    c.beginPath(); c.arc(X(Tpeak), Y(clamp(yPeak, y0, y1)), 5, 0, Math.PI * 2); c.fill(); c.stroke();

    if (W > 450) {
      c.font = DISP_SM;
      c.fillStyle = TH.warm;
      c.textAlign = 'right';
      c.textBaseline = 'top';
      c.fillText('ambiente', X(r.Ta) - 6, Y(clamp(yAmb, y0, y1)) + 6);
      c.fillStyle = r.forms ? TH.s3 : TH.muted;
      c.textAlign = 'right';
      c.fillText('pico', X(Tpeak) - 7, Y(clamp(yPeak, y0, y1)) - 5);
    }

    c.fillStyle = TH.muted;
    c.font = MONO_SM;
    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillText('S = 1', W - m.r - 4, Y(0) + 4);
  }

  function drawPlane(c, x, y, scale) {
    c.save();
    c.translate(x, y);
    c.rotate(-0.07);
    c.scale(scale, scale);
    c.fillStyle = '#f2f9ff';
    c.beginPath();
    c.moveTo(-33, -4);
    c.quadraticCurveTo(8, -7, 34, 0);
    c.quadraticCurveTo(8, 7, -33, 4);
    c.closePath();
    c.fill();
    c.beginPath(); c.moveTo(-4, 0); c.lineTo(12, 20); c.lineTo(18, 20); c.lineTo(6, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-4, 0); c.lineTo(12, -20); c.lineTo(18, -20); c.lineTo(6, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-28, 0); c.lineTo(-38, -12); c.lineTo(-32, -12); c.lineTo(-22, 0); c.closePath(); c.fill();
    c.fillStyle = '#b9d7ea';
    c.beginPath(); c.ellipse(2, 8, 5, 3, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawSky(r) {
    const cv = $('#cvSky');
    if (!cv) return;
    const { c, W, H } = prep(cv, 330);
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, r.h > 8 ? '#071728' : '#1a4266');
    sky.addColorStop(0.58, r.h > 8 ? '#12324f' : '#4d83a6');
    sky.addColorStop(1, r.h > 8 ? '#4b7f9f' : '#9cc6dc');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    // estrelas tenues a alta altitude
    if (r.h > 7) {
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 197 + 17) % 100) / 100 * W;
        const sy = ((i * 311 + 29) % 100) / 100 * H * 0.62;
        c.fillStyle = `rgba(220,240,255,${0.12 + (i % 5) * 0.06})`;
        c.beginPath(); c.arc(sx, sy, i % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2); c.fill();
      }
    }

    // sol / brillo
    const sunX = W * 0.86, sunY = H * 0.16;
    const sun = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, W * 0.25);
    sun.addColorStop(0, 'rgba(255,244,210,.55)');
    sun.addColorStop(1, 'rgba(255,244,210,0)');
    c.fillStyle = sun;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,250,225,.9)';
    c.beginPath(); c.arc(sunX, sunY, 3.5, 0, Math.PI * 2); c.fill();

    const px = W * 0.72, py = H * 0.43;
    const scale = clamp(W / 640, 0.78, 1.15);

    if (r.forms) {
      const strength = clamp(r.Smax - 1, 0, 1);
      const len = r.persistent ? W * 0.78 : W * (0.20 + 0.28 * strength);
      const startX = Math.max(10, px - len);
      const endX = px - 22;
      const baseW = r.persistent ? 19 : 7 + 4 * strength;
      const n = 46;
      const top = [], bot = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = startX + (endX - startX) * t;
        const y = py + Math.sin(t * 5.2) * 2.4 + (1 - t) * 7;
        const w = baseW * (0.22 + 0.78 * t) * (r.persistent ? 1 : 0.72);
        top.push({ x, y: y - w });
        bot.push({ x, y: y + w });
      }
      const grad = c.createLinearGradient(startX, 0, endX, 0);
      grad.addColorStop(0, 'rgba(236,248,255,0)');
      grad.addColorStop(0.35, 'rgba(236,248,255,.30)');
      grad.addColorStop(1, 'rgba(255,255,255,.92)');
      c.fillStyle = grad;
      c.beginPath();
      top.forEach((p, i) => { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); });
      for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i].x, bot[i].y);
      c.closePath();
      c.fill();

      // halo difuso
      c.save();
      c.globalAlpha = r.persistent ? 0.22 : 0.12;
      c.strokeStyle = '#eaf7ff';
      c.lineWidth = baseW * 1.8;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(startX + 12, py + 9);
      c.quadraticCurveTo((startX + endX) / 2, py - 4, endX, py);
      c.stroke();
      c.restore();

      // cristais
      const dots = r.persistent ? 54 : 22;
      for (let i = 0; i < dots; i++) {
        const t = (i * 37 % 100) / 100;
        const x = startX + (endX - startX) * t;
        const spread = (r.persistent ? 16 : 7) * (0.35 + 0.65 * t);
        const y = py + Math.sin(t * 7 + i) * spread * 0.55 + ((i * 13) % 9 - 4);
        c.fillStyle = `rgba(240,250,255,${0.25 + (i % 4) * 0.12})`;
        c.beginPath(); c.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2); c.fill();
      }

      if (r.persistent) {
        // cirro difuso no extremo esquerdo
        c.save();
        c.globalAlpha = 0.16;
        c.fillStyle = '#eaf7ff';
        for (let i = 0; i < 5; i++) {
          c.beginPath();
          c.ellipse(startX + 6 + i * 7, py - 4 + (i % 3) * 4, 16 + i * 4, 7 + i * 2, -0.3, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    } else {
      // pequeno penacho, sen estela
      c.save();
      c.globalAlpha = 0.28;
      c.fillStyle = '#eaf7ff';
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.arc(px - 30 - i * 4, py + 2 + (i % 3) * 2, 4 + (i % 3), 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    drawPlane(c, px, py, scale);

    // HUD
    c.font = MONO;
    c.fillStyle = 'rgba(234,246,255,.9)';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`${fmt(r.h, 1)} km · ${fmt(r.tC, 0)} °C · RH ${fmt(r.rh * 100, 0)} %`, 12, 12);
    c.font = DISP_SM;
    c.fillStyle = 'rgba(234,246,255,.75)';
    c.fillText(r.persistent ? 'estela persistente · cirro' : r.forms ? 'estela curta' : 'sen estela', 12, 32);

    // frecha de tempo
    c.strokeStyle = 'rgba(234,246,255,.45)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(12, H - 20); c.lineTo(76, H - 20); c.stroke();
    c.beginPath(); c.moveTo(76, H - 20); c.lineTo(70, H - 24); c.moveTo(76, H - 20); c.lineTo(70, H - 16); c.stroke();
    c.font = MONO_SM;
    c.fillStyle = 'rgba(234,246,255,.7)';
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillText(r.persistent ? 'tempo · horas' : 'tempo · minutos', 12, H - 24);
  }

  function updateSimLabels(r) {
    $('#vAlt').textContent = fmt(r.h, 1) + ' km';
    $('#vTemp').textContent = fmt(r.tC, 0) + ' °C';
    $('#vRh').textContent = fmt(r.rh * 100, 0) + ' %';
    $('#roPress').textContent = fmt(r.p, 0) + ' hPa';
    $('#roTcrit').textContent = r.Tcrit === null ? '—' : fmt(r.Tcrit - 273.15, 0) + ' °C';
    const margin = r.Tcrit === null ? null : r.Tcrit - r.Ta;
    $('#roMargin').textContent = margin === null ? '—' : fmtSigned(margin, 0) + ' K';
    $('#roSmax').textContent = fmt(r.Smax, 2);
    $('#roPersist').textContent = r.forms ? (r.persistent ? 'Si' : 'Non') : '—';
    $('#simBadge').textContent = r.forms ? (r.persistent ? 'Estela persistente' : 'Estela curta') : 'Sen estela';

    const state = $('#simState');
    if (!r.forms) {
      state.className = 'status no';
      state.textContent = 'Sen estela: a liña de mestura non alcanza a saturación. O aire é demasiado cálido ou demasiado seco.';
      $('#skyKey').textContent = 'estado: sen estela';
    } else if (r.persistent) {
      state.className = 'status ok';
      state.textContent = 'Estela persistente: hai sobresaturación respecto do xeo. Pode durar horas, estenderse e transformarse nun cirro.';
      $('#skyKey').textContent = 'estado: persistente';
    } else {
      state.className = 'status warm';
      state.textContent = 'Estela curta: fórmaa, pero o aire está seco respecto do xeo. Os cristais subliman en minutos.';
      $('#skyKey').textContent = 'estado: curta';
    }
  }

  function drawSim() {
    const r = calcSim();
    updateSimLabels(r);
    drawMix(r);
    drawSky(r);
  }

  function initSim() {
    ['#rgAlt', '#rgTemp', '#rgRh'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', drawSim);
    });

    $$('[data-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        const p = b.dataset.preset;
        const v = p === 'wet' ? [11, -55, 85] : p === 'dry' ? [11, -45, 20] : p === 'low' ? [3, 5, 80] : [10, -50, 80];
        $('#rgAlt').value = String(v[0]);
        $('#rgTemp').value = String(v[1]);
        $('#rgRh').value = String(v[2]);
        drawSim();
      });
    });
  }

  /* ----------------------------------------------------------------------
     03 · Simulador de dúas canles (BTD)
     ---------------------------------------------------------------------- */
  function drawSplit() {
    const cv = $('#cvSplit');
    if (!cv) return;
    const op = Number($('#rgOpacity').value) / 100;
    const phase = $('#selPhase').value;
    let bt10, bt12;
    if (phase === 'ice') {
      bt10 = 285 - 25 * op;
      bt12 = 285 - 40 * op;
    } else {
      bt10 = 285 - 28 * op;
      bt12 = 285 - 22 * op;
    }
    const btd = bt12 - bt10;

    $('#vOpacity').textContent = fmt(op * 100, 0) + ' %';
    $('#roBt10').textContent = fmt(bt10, 1) + ' K';
    $('#roBt12').textContent = fmt(bt12, 1) + ' K';
    $('#roBtd').textContent = fmt(btd, 1) + ' K';

    const state = $('#splitState');
    let cls = 'no';
    let txt = 'Claro / sinal feble';
    if (btd < -1.5) { cls = 'ok'; txt = 'Estela / cirro de xeo'; }
    else if (btd > 0.5) { cls = 'warm'; txt = 'Nube de auga'; }
    state.className = 'status ' + cls;
    state.textContent = txt + ' · BTD ' + fmt(btd, 1) + ' K';

    const note = $('#splitNote');
    if (op < 0.03) {
      note.textContent = 'Sen nube apreciable, as dúas canles ven practicamente a mesma superficie: BTD ≈ 0.';
    } else if (phase === 'ice') {
      note.textContent = 'O xeo absorbe máis en 12,0 µm ca en 10,8 µm. A canle de 12,0 µm ve máis frío e a BTD faise negativa: é a sinatura que busca o algoritmo.';
    } else {
      note.textContent = 'A auga líquida ten unha sinatura espectral distinta. A BTD pode ser positiva ou próxima a cero; por iso non abonda con mirar o brillo visible.';
    }

    const { c, W, H } = prep(cv, 300);
    c.fillStyle = '#071523';
    c.fillRect(0, 0, W, H);

    // fondo oceánico con algunhas texturas
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0b2033');
    bg.addColorStop(0.55, '#0e2a40');
    bg.addColorStop(1, '#12364d');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    for (let i = 0; i < 18; i++) {
      const x = ((i * 173 + 31) % 100) / 100 * W;
      const y = ((i * 271 + 47) % 100) / 100 * H;
      c.fillStyle = `rgba(120,180,215,${0.012 + (i % 4) * 0.008})`;
      c.beginPath(); c.ellipse(x, y, 30 + (i % 5) * 12, 10 + (i % 4) * 5, i * 0.4, 0, Math.PI * 2); c.fill();
    }

    // reixa de lat/lon
    c.strokeStyle = 'rgba(160,210,240,.10)';
    c.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y <= H; y += H / 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }

    // estela diagonal
    const p0 = { x: W * 0.16, y: H * 0.12 };
    const p1 = { x: W * 0.78, y: H * 0.86 };
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const bandW = 10 + 60 * op;
    const color = phase === 'ice' ? [125, 220, 255] : [255, 160, 70];

    for (let k = -bandW; k <= bandW; k += 2) {
      const a = Math.exp(-(k * k) / (2 * Math.pow(bandW * 0.34, 2))) * (0.04 + 0.28 * op);
      c.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${a.toFixed(3)})`;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(p0.x + nx * k, p0.y + ny * k);
      c.lineTo(p1.x + nx * k, p1.y + ny * k);
      c.stroke();
    }

    // núcleo
    c.strokeStyle = `rgba(255,255,255,${(0.10 + 0.55 * op).toFixed(2)})`;
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();

    // avión no inicio da estela
    c.save();
    c.translate(p0.x, p0.y);
    c.rotate(Math.atan2(dy, dx));
    c.fillStyle = 'rgba(240,250,255,.9)';
    c.beginPath(); c.moveTo(-7, -2); c.lineTo(7, 0); c.lineTo(-7, 2); c.closePath(); c.fill();
    c.restore();

    // barra de cor
    const cbX = W - 36, cbY = 26, cbH = H - 58, cbW = 12;
    const cb = c.createLinearGradient(0, cbY + cbH, 0, cbY);
    cb.addColorStop(0, '#08306b');
    cb.addColorStop(0.5, '#f7fbff');
    cb.addColorStop(1, '#b2182b');
    c.fillStyle = cb;
    c.fillRect(cbX, cbY, cbW, cbH);
    c.strokeStyle = 'rgba(255,255,255,.25)';
    c.lineWidth = 1;
    c.strokeRect(cbX + 0.5, cbY + 0.5, cbW - 1, cbH - 1);
    c.font = MONO_SM;
    c.fillStyle = 'rgba(234,246,255,.8)';
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    [-10, -5, 0, 5].forEach((v) => {
      const y = cbY + cbH * (1 - (v + 10) / 15);
      c.fillText(fmt(v, 0), cbX - 5, y);
    });
    c.save();
    c.translate(cbX + 26, cbY + cbH / 2);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('BTD (K)', 0, 0);
    c.restore();

    c.font = MONO;
    c.fillStyle = 'rgba(234,246,255,.85)';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('SIMULACIÓN · SEVIRI', 12, 12);
    c.font = DISP_SM;
    c.fillStyle = 'rgba(234,246,255,.6)';
    c.fillText(phase === 'ice' ? 'nube de xeo' : 'nube de auga', 12, 30);
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillText('vista idealizada · non a escala', 12, H - 10);
  }

  function initSplit() {
    const op = $('#rgOpacity');
    const ph = $('#selPhase');
    if (op) op.addEventListener('input', drawSplit);
    if (ph) ph.addEventListener('change', drawSplit);
  }

  /* ----------------------------------------------------------------------
     04 · Pipeline
     ---------------------------------------------------------------------- */
  function initPipeline() {
    const tabs = $$('.pipe-tab');
    const panels = $$('.pipe-panel');
    if (!tabs.length || !panels.length) return;

    function select(index) {
      tabs.forEach((t, i) => t.setAttribute('aria-selected', i === index ? 'true' : 'false'));
      panels.forEach((p, i) => { p.hidden = i !== index; });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (i + 1) % tabs.length;
          tabs[next].focus();
          select(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (i - 1 + tabs.length) % tabs.length;
          tabs[prev].focus();
          select(prev);
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     07 · Quiz
     ---------------------------------------------------------------------- */
  function initQuiz() {
    const quiz = $('#quizBox');
    if (!quiz) return;
    const check = $('#btnCheckQuiz');
    const reset = $('#btnResetQuiz');
    const score = $('#quizScore');
    const questions = $$('.q', quiz);

    function checkQuiz() {
      let correct = 0;
      let answered = 0;
      questions.forEach((q) => {
        const chosen = q.querySelector('input:checked');
        const fb = q.querySelector('.q-feedback');
        q.querySelectorAll('.q-option').forEach((o) => o.classList.remove('correct', 'incorrect'));
        if (!chosen) {
          fb.className = 'q-feedback show no';
          fb.textContent = 'Selecciona unha opción para poder corrixir.';
          return;
        }
        answered++;
        const isCorrect = chosen.value === q.dataset.correct;
        if (isCorrect) correct++;
        fb.className = 'q-feedback show ' + (isCorrect ? 'ok' : 'no');
        fb.textContent = (isCorrect ? '✓ Correcto. ' : '✕ Revisa. ') + q.dataset.explain;
        chosen.closest('.q-option').classList.add(isCorrect ? 'correct' : 'incorrect');
        const right = q.querySelector(`input[value="${q.dataset.correct}"]`);
        if (right) right.closest('.q-option').classList.add('correct');
      });
      score.textContent = answered === 0 ? 'Sen corrixir' : `${correct} de ${questions.length} respostas correctas`;
    }

    function resetQuiz() {
      questions.forEach((q) => {
        q.querySelectorAll('input').forEach((i) => { i.checked = false; });
        q.querySelectorAll('.q-option').forEach((o) => o.classList.remove('correct', 'incorrect'));
        const fb = q.querySelector('.q-feedback');
        fb.className = 'q-feedback';
        fb.textContent = '';
      });
      score.textContent = 'Sen corrixir';
    }

    if (check) check.addEventListener('click', checkQuiz);
    if (reset) reset.addEventListener('click', resetQuiz);
  }

  /* ----------------------------------------------------------------------
     Arranque e redimensionado
     ---------------------------------------------------------------------- */
  function drawAll() {
    drawErf();
    drawSim();
    drawSplit();
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 180);
  });

  function boot() {
    readTheme();
    initErf();
    initSim();
    initSplit();
    initPipeline();
    initQuiz();
    updateProgress();
    updateNav();
    drawAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // MathJax cambia a altura dalgúns bloques: redibuxar unha vez estea listo.
  window.addEventListener('load', () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => drawAll());
    }
    setTimeout(drawAll, 700);
  });
})();
