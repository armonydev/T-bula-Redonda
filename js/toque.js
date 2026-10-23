/* ═══ toque.js — ripple, inclinação, luz do cursor, parallax ═══ */
(() => {
"use strict";
const R = window.RSS, { $, $$, REDUZ } = R;
R.Toque = { init(){
  document.addEventListener("pointerdown", e => {
    const alvo = e.target.closest(".atr,.per,.botao,.item,.guia");
    if (!alvo) return;
    const r = alvo.getBoundingClientRect(), d = Math.max(r.width,r.height)*1.9;
    const s = document.createElement("span");
    s.className = "onda-r";
    s.style.width = s.style.height = d+"px";
    s.style.left = (e.clientX-r.left)+"px"; s.style.top = (e.clientY-r.top)+"px";
    alvo.append(s); setTimeout(() => s.remove(), 660);
  }, { passive:true });

  if (REDUZ) return;
  let px=0, py=0, bruto=null, agendado=false, ultimo=null;
  addEventListener("pointermove", e => {
    px = e.clientX; py = e.clientY;
    bruto = e.target.closest("[data-tilt],.atr");
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      const luz = $(".luzmouse");
      luz.style.setProperty("--lx",(px-230)+"px");
      luz.style.setProperty("--ly",(py-230)+"px");
      const ceu = $(".ceu");
      ceu.style.setProperty("--par-x",((px/innerWidth-.5)*-14)+"px");
      ceu.style.setProperty("--par-y",((py/innerHeight-.5)*-14)+"px");
      if (ultimo && ultimo !== bruto){
        ultimo.style.setProperty("--rx","0deg"); ultimo.style.setProperty("--ry","0deg");
        ultimo = null;
      }
      if (!bruto) return;
      ultimo = bruto;
      const r = bruto.getBoundingClientRect();
      const ax = (px-r.left)/r.width, ay = (py-r.top)/r.height;
      const forte = bruto.classList.contains("atr") ? 7 : 3.2;
      bruto.style.setProperty("--mx",(ax*100)+"%");
      bruto.style.setProperty("--my",(ay*100)+"%");
      bruto.style.setProperty("--ry",((ax-.5)*forte)+"deg");
      bruto.style.setProperty("--rx",(-(ay-.5)*forte)+"deg");
    });
  }, { passive:true });
}};
})();
