/* ═══ terminal.js — códigos. Alguns respondem, alguns mentem, alguns abrem porta ═══ */
(() => {
"use strict";
const R = window.RSS, { $ } = R;
R.Terminal = { init(){
  const campo = $("#term-entrada"), saida = $("#term-saida");
  const diz = (txt, classe="") => {
    const l = document.createElement("div");
    l.className = "linha-term " + classe; l.textContent = txt;
    saida.append(l); saida.scrollTop = saida.scrollHeight;
    while (saida.children.length > 40) saida.firstChild.remove();
  };
  diz("câmara de eco · terminal", "fraca");
  diz("digite algo. a maioria não faz nada.", "fraca");

  campo.addEventListener("keydown", async e => {
    if (e.key !== "Enter") return;
    const cru = campo.value.trim(); campo.value = "";
    if (!cru) return;
    diz("> " + cru, "eco-cmd");
    const c = window.CODIGOS?.[cru.toUpperCase()];
    if (!c){
      const mudas = ["nada.","…","não reconhecido.","tente outra coisa.","a câmara não responde a isso."];
      diz(mudas[Math.floor(Math.random()*mudas.length)], "fraca");
      if (Math.random() < .12) R.Falha.disparar(1.4);
      return;
    }
    diz(c.diz);
    if (c.estado) R.Estado.pulso(c.estado, 4000);
    if (c.cenario){
      const foi = await R.Cenario?.abrir(c.cenario);
      if (!foi) diz("…a porta não está aí agora.", "fraca");
    }
    // morador: não entra em cena, só reage onde já estava (e abre a aba dele)
    if (c.morador){
      const foi = R.Segredos.chamarMorador(c.morador);
      if (!foi) diz("…não tem ninguém com esse nome aqui.", "fraca");
    }
    if (c.segredo){
      const foi = await R.Segredos.tentar(c.segredo, { forcar:true });
      if (!foi) diz("…mas não agora.", "fraca");
    }
  });
}};
})();
