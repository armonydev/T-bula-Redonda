/* ═══ app.js — liga tudo. Ordem importa: núcleo → sistemas → ficha → segredos ═══ */
(() => {
"use strict";
const R = window.RSS, { $, $$, REDUZ } = R;

R.Tema.init();
R.Camera.init();
R.Luz.init();
R.Po.init();
R.Toque.init();
R.Ficha.montar();
R.Terminal.init();
R.Falha.registrar(".quem h2,.atr .v,.der .v,.per .t b,.guia,.logo h1");
R.Estado.set("normal");
R.Cenario.init();
R.Segredos.init(window.SEGREDOS || []);
if (!REDUZ) R.Falha.espreitar();

/* temas — escolha manual, sempre.
   ATENÇÃO ao seletor: a tag <html> também tem data-pele (é onde o tema mora).
   Com "[data-pele]" solto, o <html> entrava na lista e virava um botão que
   cobre a tela toda: QUALQUER clique na página subia até ele, jogava faísca
   e ainda resetava o tema pro "eco" por baixo dos panos. Daí a "faísca em
   todo clique". O seletor tem que ser só o dos botões. */
$$(".ctrl button[data-pele]").forEach(b => b.addEventListener("click", () => {
  R.Tema.set(b.dataset.pele); R.Som.bip("clique"); R.Estado.pulso("eco", 900);
  R.Po.jorro("faisca", innerWidth/2, 120, 12, "255,255,255");
}));
$("#som").addEventListener("click", () => R.Som.alternar());

/* abas */
const ANIMS = ["anim-sobe","anim-lado","anim-corte"];
$$(".guias").forEach(grupo => {
  const guias = [...grupo.querySelectorAll(".guia")];
  guias.forEach((g, idx) => g.addEventListener("click", () => {
    if (g.getAttribute("aria-selected") === "true") return;
    R.Som.bip("guia");
    guias.forEach(o => {
      o.setAttribute("aria-selected", String(o === g));
      const f = document.getElementById(o.dataset.folha);
      if (o === g){ f.hidden = false; f.classList.remove(...ANIMS); void f.offsetWidth;
                    f.classList.add(ANIMS[idx % ANIMS.length]); }
      else f.hidden = true;
    });
    if (Math.random() < .2) R.Falha.disparar(.5);
  }));
});

/* itens expansíveis */
document.addEventListener("click", e => {
  const it = e.target.closest(".item[aria-expanded]");
  if (!it) return;
  it.setAttribute("aria-expanded", String(it.getAttribute("aria-expanded") === "false"));
  R.Som.bip("clique");
});

/* ── logo 5× : CORTINAS de verdade ── */
let cl = 0, tl = null;
$("#logo").addEventListener("click", () => {
  cl++; clearTimeout(tl); tl = setTimeout(() => cl = 0, 1200);
  R.Som.bip("clique");
  if (cl < 5) return;
  cl = 0;
  R.Estado.pulso("espetaculo", 3200);
  R.Segredos.cortinas(3200, () => {
    R.Po.jorro("confete", innerWidth/2, innerHeight*.35, 70, "255,200,87");
    R.Camera.batida(1);
    sussurrar("alguma coisa estava esperando atrás");
  });
});

/* ── retrato 3× ── */
let cr = 0;
$("#retrato").addEventListener("click", e => {
  if (e.target.closest("#nivel")) return;
  cr++;
  if (cr < 3) return;      // nada de faísca a cada clique: só no 3º
  cr = 0;
  R.Po.jorro("faisca", e.clientX, e.clientY, 14, "187,140,255");
  const f = ["o Eco está ouvindo","…ainda aí?","duas metades discordam"];
  sussurrar(f[Math.floor(Math.random()*f.length)]);
  R.Luz.acender({ cor:"#bb8cff", intensidade:.3 });
  setTimeout(() => R.Luz.apagar(), 1400);
  R.Falha.disparar(1.6);
});

/* ── parado 75s, com cooldown ── */
let ultimo = Date.now(), avisouEm = 0;
["pointermove","keydown","click","scroll"].forEach(ev =>
  addEventListener(ev, () => ultimo = Date.now(), { passive:true }));
setInterval(() => {
  if (document.hidden) return;
  if (Date.now()-ultimo > 75000 && Date.now()-avisouEm > 300000){
    avisouEm = Date.now();
    sussurrar("você ainda está aí?", 4200);
    R.Estado.pulso("vazio", 3200);
    R.Falha.disparar(1.2);
  }
}, 5000);

function sussurrar(txt, ms=3000){
  const s = $("#sussurro"); s.textContent = txt; s.classList.add("on");
  clearTimeout(sussurrar._t); sussurrar._t = setTimeout(() => s.classList.remove("on"), ms);
}
R.sussurrar = sussurrar;

/* retrato do personagem: aceita qualquer extensão */
(async () => {
  const img = $(".retrato .arte");
  if (!img) return;
  const certo = await R.resolverAsset("assets/characters/theodor.png");
  if (certo) img.src = certo; else img.remove();
})();

/* aviso de asset faltando — só no console, nunca na cara do usuário */
setTimeout(() => {
  if (R.Segredos.faltando.size)
    console.info("%c[câmara] segredos esperando arquivo:\n" +
      [...R.Segredos.faltando].map(x => "  " + x).join("\n"),
      "color:#bb8cff;font-weight:bold");
}, 2500);
})();
