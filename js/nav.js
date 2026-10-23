/* ═══ nav.js — marca o destino atual no trilho ═══
   Rodar isso por JS em vez de escrever à mão em cada página evita o erro
   mais chato de site estático: o link da página que você já está vendo
   apontando pra lugar nenhum, ou nenhum marcado. */
(function(){
"use strict";
const arq = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const s = new URLSearchParams(location.search).get("s") || "";
/* Criar personagem não é destino do trilho: ele mora dentro de Fichas,
   que é onde a pessoa procura. Então criar.html e criar-saa.html marcam
   "fichas" — o trilho não apaga quando você entra no montador. */
const QUAL = {
  "":"inicio", "index.html":"inicio",
  "sistema.html":"sistema", "compendio.html":"compendio",
  "fichas.html":"fichas", "ficha.html":"fichas",
  "criar.html":"fichas", "criar-saa.html":"fichas", "criar-fm.html":"fichas",
  "loja.html":"loja",
};
const aqui = QUAL[arq] || "";
document.querySelectorAll(".trilho-lat [data-nav]").forEach(a => {
  if(a.dataset.nav === aqui) a.setAttribute("aria-current","page");
  else a.removeAttribute("aria-current");
  /* Sistemas guarda o sistema que você estava vendo. Sem ?s= abre a tela
     de escolha — nunca chuta Ressonância. O Compêndio saiu do trilho: ele
     virou aba dentro da página do sistema, que é onde se procura por ele. */
  if(s && a.dataset.nav === "sistema"){
    const base = a.getAttribute("href").split("?")[0];
    a.setAttribute("href", base + "?s=" + encodeURIComponent(s));
  }
});
})();
