/* ═══════════════════════════════════════════════════════════════════
   nucleo.js — os sistemas de base. Nada aqui conhece a ficha.
   Tema · Estado · Câmera · Luz · Corrupção · Anim · Som
   ═══════════════════════════════════════════════════════════════════ */
(() => {
"use strict";
const raiz = document.documentElement;
const R = window.RSS = window.RSS || {};
R.REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
R.$  = s => document.querySelector(s);
R.$$ = s => [...document.querySelectorAll(s)];
R.rnd = (a,b) => a + Math.random()*(b-a);
const { $, $$, rnd } = R;

/* ───────────── TEMA ───────────── escolha manual, nunca automática */
R.Tema = {
  lista: ["eco","pessego","mar","bosque","crt","vazio","corrompido"],
  set(p){
    if (!this.lista.includes(p)) return;
    raiz.dataset.pele = p;
    // ".ctrl button" de novo: sem isso o <html> (que carrega o tema) entra na
    // conta e ganha um aria-pressed que não significa nada.
    $$(".ctrl button[data-pele]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pele === p)));
    try { localStorage.setItem("rss-pele", p); } catch {}
  },
  init(){ let p = "eco"; try { p = localStorage.getItem("rss-pele") || "eco"; } catch {} this.set(p); },
};

/* ───────────── ESTADO VISUAL ───────────── só filtra, nunca repinta o tema */
const CFG = {
  normal:     { po:1.0, glitch:1.0 },
  eco:        { po:1.8, glitch:0.6 },
  sobrecarga: { po:2.2, glitch:2.4 },
  corrompido: { po:0.6, glitch:6.0 },
  espetaculo: { po:3.0, glitch:0.4 },
  vazio:      { po:0.2, glitch:0.2 },
};
R.Estado = {
  atual:"normal", _t:null, travado:false,
  set(e){ if (!CFG[e] || this.travado) return; this.atual = e; raiz.dataset.estado = e; },
  pulso(e, ms=1400){
    const antes = this.travado ? this.atual : (this.atual === "sobrecarga" ? "sobrecarga" : "normal");
    this.travado = false; this.set(e); this.travado = true;
    clearTimeout(this._t);
    this._t = setTimeout(() => { this.travado = false; this.set(antes); }, ms);
  },
  cfg(){ return CFG[this.atual] || CFG.normal; },
};

/* ───────────── CÂMERA ───────────── tremor, zoom, distorção, tudo em transform */
R.Camera = {
  el:null, tremor:0, zoom:1, skew:0, rodando:false, _ate:0,
  init(){ this.el = $("#camera"); },
  aplicar({ tremor=0, zoom=1, distorcao=0, duracao=1200 } = {}){
    if (R.REDUZ){ return; }
    this.tremor = Math.max(this.tremor, tremor);
    this.zoom = zoom; this.skew = distorcao;
    this.el.style.setProperty("--cam-zoom", zoom);
    this.el.style.setProperty("--cam-blur", (distorcao*0.7).toFixed(2) + "px");
    this.el.classList.toggle("distorcendo", distorcao > 0);
    // duracao 0 nunca significa "pra sempre" — significa "o padrão curto".
    // Antes caía em Infinity e a tela tremia até alguém chamar soltar().
    this._ate = performance.now() + (duracao || 1200);
    if (!this.rodando){ this.rodando = true; requestAnimationFrame(t => this.quadro(t)); }
  },
  soltar(){
    this._ate = 0; this.tremor = 0; this.zoom = 1; this.skew = 0;
    this.el.style.setProperty("--cam-zoom", 1);
    this.el.style.setProperty("--cam-x","0px"); this.el.style.setProperty("--cam-y","0px");
    this.el.style.setProperty("--cam-rot","0deg");
    this.el.style.setProperty("--cam-blur","0px");
    this.el.classList.remove("distorcendo");
  },
  quadro(t){
    if (t > this._ate){ this.rodando = false; this.soltar(); return; }
    const f = this.tremor;
    this.el.style.setProperty("--cam-x", (rnd(-3.4,3.4)*f).toFixed(2) + "px");
    this.el.style.setProperty("--cam-y", (rnd(-2.6,2.6)*f).toFixed(2) + "px");
    this.el.style.setProperty("--cam-rot", (rnd(-.22,.22)*f).toFixed(3) + "deg");
    requestAnimationFrame(x => this.quadro(x));
  },
  // batida curta e seca, independente de evento
  batida(forca=1){
    if (R.REDUZ) return;
    const antes = this.tremor;
    this.aplicar({ tremor: Math.max(antes, forca*1.6), zoom: 1, duracao: 260 });
  },
};

/* ───────────── LUZ ───────────── brilho colorido por cima de tudo */
R.Luz = {
  el:null,
  init(){ this.el = $("#luz-evento"); },
  acender({ cor="#fff", intensidade=.4, pulsar=false } = {}){
    this.el.style.setProperty("--luz-cor", cor);
    this.el.style.opacity = intensidade;
    this.el.classList.toggle("pulsando", !!pulsar && !R.REDUZ);
  },
  apagar(){ this.el.style.opacity = 0; this.el.classList.remove("pulsando"); },
};

/* ───────────── CORRUPÇÃO ───────────── 0 a 6, some sozinha */
R.Corrupcao = {
  nivel:0, _t:null,
  set(n, ms=2600){
    this.nivel = Math.max(0, Math.min(6, n));
    raiz.dataset.corrupcao = this.nivel;
    clearTimeout(this._t);
    if (this.nivel > 0) this._t = setTimeout(() => this.set(0), ms);
  },
};

/* ───────────── ANIM ───────────── números, deltas, varredura */
R.Anim = {
  numero(el, de, ate, ms=520, molde = v => v){
    if (R.REDUZ || de === ate){ el.textContent = molde(ate); return; }
    const t0 = performance.now();
    const passo = t => {
      const k = Math.min(1,(t-t0)/ms), e = 1 - Math.pow(1-k,3);
      el.textContent = molde(Math.round(de + (ate-de)*e));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  },
  delta(el, d){
    if (R.REDUZ || !d) return;
    const s = document.createElement("span");
    s.className = "delta"; s.textContent = (d>0?"+":"") + d;
    s.style.color = d>0 ? "var(--menta)" : "var(--vida)";
    const r = el.getBoundingClientRect();
    s.style.left = (r.right-6)+"px"; s.style.top = (r.top-4)+"px";
    document.body.append(s); setTimeout(() => s.remove(), 950);
  },
};

/* ───────────── SOM ───────────── arquivo se existir, oscilador se não */
R.Som = {
  ligado:false, ctx:null, cache:new Map(),
  alternar(){
    this.ligado = !this.ligado;
    const b = $("#som"); if (b) b.setAttribute("aria-pressed", String(this.ligado));
    if (this.ligado){ this.ctx ||= new (window.AudioContext||window.webkitAudioContext)(); this.bip("clique"); }
  },
  // toca assets/sounds/x.mp3; se o arquivo não existir, cai no bip
  arquivo(caminho, volume=.6){
    if (!this.ligado || !caminho) return;
    let a = this.cache.get(caminho);
    if (!a){ a = new Audio(caminho); this.cache.set(caminho, a); }
    a.volume = volume; a.currentTime = 0;
    a.play().catch(() => this.bip("clique"));
  },
  bip(tipo){
    if (!this.ligado || !this.ctx) return;
    const v = { hover:[880,.03,.04], clique:[520,.05,.07], guia:[660,.04,.06],
                critico:[1320,.12,.18], erro:[150,.14,.2], nivel:[440,.2,.3],
                falha:[90,.08,.1], clack:[1800,.07,.05] }[tipo];
    if (!v) return;
    const [f,g,d] = v, o = this.ctx.createOscillator(), a = this.ctx.createGain();
    o.type = (tipo==="erro"||tipo==="falha") ? "sawtooth" : "triangle";
    o.frequency.setValueAtTime(f, this.ctx.currentTime);
    if (tipo==="nivel") o.frequency.exponentialRampToValueAtTime(f*2, this.ctx.currentTime+d);
    a.gain.setValueAtTime(g, this.ctx.currentTime);
    a.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime+d);
    o.connect(a).connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+d);
  },
};
})();
