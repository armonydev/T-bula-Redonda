/* ═══ tema.js — os dois temas do Tábula Redonda ═══
   Cartoon (o original) e Escuro (Dark Fantasy). A troca é só um atributo
   no <html>: data-tema. Nenhuma página recarrega, nenhum estado se perde,
   nenhum formulário é zerado — é isso que permite trocar de tema no meio
   da criação de ficha sem perder o que já foi preenchido.

   A pele (as 7 cores da Câmara) continua existindo e é independente:
   ela colore o Cartoon. No Escuro a paleta é fixa, porque a referência
   do tema é uma só. */
window.RSS = window.RSS || {};
(function(){
"use strict";
const CHAVE = "tabula:tema";

/* ⚠ O CARTOON SÓ VALE NA FICHA DE JOGO.
   O Kainã tirou o Cartoon do site: o painel, os sistemas, a loja, a estante
   e os montadores são Dark Fantasy e ponto. O Cartoon ficou onde ele faz
   sentido — a tela de usar a ficha e girar dado, que é a herança da Câmara
   e a única que foi desenhada naquela linguagem.

   Quem decide é o <html data-temavel>. Tem que ser no <html> e não no
   <body>: este arquivo roda dentro do <head>, quando o <body> ainda não
   foi lido — se o marcador estivesse lá, a página piscaria cartoon por um
   quadro antes de virar escura. */
const temavel = () => document.documentElement.hasAttribute("data-temavel");
const TEMAS = {
  cartoon: { nome:"Cartoon",      descricao:"Gordo, colorido e saliente. O original do Ressonância." },
  escuro:  { nome:"Dark Fantasy", descricao:"Escuro, denso e sóbrio. Feito pra biblioteca e consulta." },
};

const guardado = () => { try{ return localStorage.getItem(CHAVE) || ""; }catch{ return ""; } };
const escolhido = () => TEMAS[guardado()] ? guardado() : "";

function aplicar(id, guardar){
  if(!temavel()) id = "escuro";
  else if(!TEMAS[id]) id = (window.RSS.CONFIG && window.RSS.CONFIG.temaPadrao) || "escuro";
  document.documentElement.dataset.tema = id;
  if(guardar){ try{ localStorage.setItem(CHAVE, id); }catch{} }
  document.querySelectorAll("[data-por-tema]").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.porTema === id));
  // a pele só faz sentido no Cartoon
  document.querySelectorAll(".ctrl .peles").forEach(e => e.hidden = (id !== "cartoon"));
  window.dispatchEvent(new CustomEvent("tema", { detail:{ tema:id } }));
}

/* Aplica o tema ANTES da primeira pintura, pra não piscar a cor do outro. */
function cedo(){
  document.documentElement.dataset.tema = temavel()
    ? (escolhido() || (window.RSS.CONFIG && window.RSS.CONFIG.temaPadrao) || "escuro")
    : "escuro";
}

/* A escolha da primeira visita. Não é tela de configuração: é a porta. */
function perguntar(){
  if(!temavel() || escolhido()) return;
  const cx = document.createElement("div");
  cx.className = "porta-tema"; cx.setAttribute("role","dialog"); cx.setAttribute("aria-modal","true");
  cx.innerHTML = `<div class="porta-miolo">
    <h2>Como você quer ver o Tábula Redonda?</h2>
    <p>Dá pra trocar quando quiser, pelo botão de aparência no topo.</p>
    <div class="porta-opcoes">
      ${Object.entries(TEMAS).map(([id,t]) => `
        <button class="porta-op" type="button" data-escolher-tema="${id}">
          <span class="porta-previa previa-${id}" aria-hidden="true">
            <span class="p-topo"></span><span class="p-cartao"></span>
            <span class="p-linha"></span><span class="p-linha curta"></span>
            <span class="p-bt"></span>
          </span>
          <b>${t.nome}</b><i>${t.descricao}</i>
        </button>`).join("")}
    </div>
  </div>`;
  document.body.append(cx);
  requestAnimationFrame(() => cx.classList.add("on"));
  cx.addEventListener("click", ev => {
    const b = ev.target.closest("[data-escolher-tema]"); if(!b) return;
    aplicar(b.dataset.escolherTema, true);
    cx.classList.remove("on");
    setTimeout(() => cx.remove(), 260);
  });
}

/* O botão de trocar, pra pôr no topo de qualquer página. */
function botao(){
  if(!temavel()) return "";
  const atual = document.documentElement.dataset.tema || "escuro";
  return `<span class="troca-tema" role="group" aria-label="Aparência">
    ${Object.entries(TEMAS).map(([id,t]) =>
      `<button type="button" data-por-tema="${id}" aria-pressed="${id===atual}" title="${t.nome}">${t.nome}</button>`).join("")}
  </span>`;
}

document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-por-tema]"); if(!b) return;
  aplicar(b.dataset.porTema, true);
});

window.RSS.Tema = { TEMAS, aplicar, escolhido, perguntar, botao, cedo };
cedo();
})();

/* ═══ papel de parede ═══
   Em TODA página, não só nas de painel — o Kainã pediu imagem por trás de
   tudo, inclusive da estante e do criador.
   ⚠ Não dá pra mandar a url() por variável CSS: o caminho dentro de um
   var() é resolvido contra o arquivo .css, não contra a página, e virava
   css/img/fundo/... — 404. Por isso é um elemento com style inline. */
(function(){
  const pp = window.RSS.CONFIG && window.RSS.CONFIG.papelParede;
  if(!pp) return;
  const por = () => {
    if(!document.body || document.querySelector(".papel-parede")) return;
    const d = document.createElement("div");
    d.className = "papel-parede"; d.setAttribute("aria-hidden","true");
    d.style.backgroundImage = 'url("' + pp + '")';
    document.body.insertBefore(d, document.body.firstChild);
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", por);
  else por();
})();
