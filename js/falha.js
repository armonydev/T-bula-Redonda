/* ═══ falha.js — glitch como EVENTO, nunca como estado permanente ═══ */
(() => {
"use strict";
const R = window.RSS, { $, $$, rnd, REDUZ } = R;
R.Falha = {
  base:1, alvos:[],
  registrar(sel){ this.alvos = $$(sel); },
  disparar(forca=1){
    if (REDUZ) return;
    const f = forca * this.base * R.Estado.cfg().glitch;
    if (f <= 0) return;
    R.Som.bip("falha");
    const tv = $("#tv"); tv.classList.remove("on"); void tv.offsetWidth; tv.classList.add("on");
    const n = Math.min(4, Math.max(1, Math.round(f)));
    for (let i=0;i<n;i++){
      const el = this.alvos[Math.floor(Math.random()*this.alvos.length)];
      if (!el) continue;
      el.classList.remove("falhando"); void el.offsetWidth; el.classList.add("falhando");
      if (f > 2 && el.dataset.puro == null){
        el.dataset.puro = el.textContent;
        el.textContent = el.dataset.puro.replace(/[a-zà-ú]/gi,
          c => Math.random()<.35 ? "▓▒░#@%"[Math.floor(Math.random()*6)] : c);
        setTimeout(() => { el.textContent = el.dataset.puro; delete el.dataset.puro; }, 150);
      }
      setTimeout(() => el.classList.remove("falhando"), 300);
    }
  },
  espreitar(){
    const prox = () => {
      const esp = R.Estado.atual === "corrompido" ? rnd(1200,3000) : rnd(26000,70000);
      setTimeout(() => { this.disparar(R.Estado.atual === "corrompido" ? 2 : .8); prox(); }, esp);
    };
    prox();
  },
};
})();
