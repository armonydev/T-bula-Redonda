/* ═══ hub.js — a estante de fichas ═══
   Lista tudo que está salvo neste navegador. Criar, abrir, editar,
   exportar, importar e apagar. Nenhum número daqui: o resumo de cada
   card sai do mesmo regras.js que o criador e a ficha usam. */
(function(){
"use strict";
const R = window.RSS.R, Arm = window.RSS.Arm;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* mesma conta do criador: base + fixos da Origem + escolhidos + Classe */
function atributosDe(f){
  const a = {...(f.atributosBase||{})};
  const o = R.ORIGENS.find(x=>x.id===f.origemId), c = R.CLASSES.find(x=>x.id===f.classeId);
  if(o && o.fixo) for(const [k,v] of Object.entries(o.fixo)) a[k]=(a[k]||0)+v;
  for(const [k,v] of Object.entries(f.escolhaOrigem||{})) a[k]=(a[k]||0)+v;
  if(c && c.bonusCarga) a.CARGA=(a.CARGA||0)+c.bonusCarga;
  return a;
}

/* O que ainda falta pra ficha poder ir pra mesa. É a MESMA lista de
   exigências do criador — se mudar lá, muda aqui. */
function faltaNa(f){
  const q=[];
  if(!f.nome || !f.nome.trim()) q.push("nome");
  /* o orçamento de atributo depende do Nível: 34 no 1°, +2 por nível */
  if(R.somaAtributos(f.atributosBase||{}) !== R.pontosDeAtributo(f.nivel||1)) q.push("atributos");
  if(!f.origemId) q.push("Origem");
  if(!f.classeId) q.push("Classe");
  if(!f.conceito || !f.conceito.trim()) q.push("Conceito");
  if((f.aplicacoes||[]).length < R.APLICACOES_MIN) q.push("Aplicações");
  if(!f.trilhaId) q.push("Trilha");
  return q;
}

/* ═══ o resumo de cada ficha depende do SISTEMA dela ═══
   A estante guarda Ressonância, Saa e Feiticeiros & Maldições no mesmo
   lugar. Até aqui o card lia tudo com as regras do Ressonância, então uma
   ficha do Saa aparecia como "incompleta: atributos" — o cartão estava
   medindo a ficha com a régua errada. Agora cada sistema responde por si. */
function sistemaDe(f){ return f.sistema || "ressonancia"; }
function nomeSistema(f){
  const s = (Cat.SISTEMAS || []).find(x => x.id === sistemaDe(f));
  return s ? s.nome : sistemaDe(f);
}
function faltaSaa(f){
  const S = window.SAA; const q = [];
  if(!f.nome || !f.nome.trim()) q.push("nome");
  if(!S) return q;
  const g = S.ATRIBUTOS.reduce((t,a)=>t+((f.atributos||{})[a.id]||0),0);
  if(g !== S.PONTOS_INICIAIS) q.push("atributos");
  if(!(f.estudos||[]).length) q.push("Estudos");
  return q;
}
function faltaFm(f){
  const F = window.FM; const q = [];
  if(!f.nome || !f.nome.trim()) q.push("nome");
  if(!F) return q;
  if(F.gastoTotal(f.base||{}) !== F.PONTOS_COMPRA) q.push("atributos");
  if(!f.origemId) q.push("Origem");
  if(!f.especId)  q.push("Especialização");
  else if(!f.chave) q.push("atributo-chave");
  return q;
}
function numerosSaa(f){
  const S = window.SAA; if(!S) return [];
  const a = f.atributos || {};
  return [[S.sangueMaximo(a),"Sangue"],[S.conhecimentoMaximo(a),"Conhec."],
          [S.saaMaximo(a),"Saa"],[(f.estudos||[]).length,"Estudos"]];
}
function numerosFm(f){
  const F = window.FM; if(!F) return [];
  const a = {...(f.base||{})};
  for(const [k,v] of Object.entries(f.bonusOrigem||{})) a[k] = (a[k]||10) + (v||0);
  return [[F.pvMaximo(a,f.especId,f.nivel||1),"Vida"],
          [F.peMaximo(a,f.especId,f.nivel||1,f.atrTecnica),"Energia"],
          [F.defesa(a,f.nivel||1),"Defesa"],
          [(F.treinamento(f.nivel||1)>=0?"+":"")+F.treinamento(f.nivel||1),"Maestria"]];
}

function card(f){
  const sis = sistemaDe(f);
  if(sis !== "ressonancia") return cardOutro(f, sis);
  const a = atributosDe(f);
  const c = R.CLASSES.find(x=>x.id===f.classeId), o = R.ORIGENS.find(x=>x.id===f.origemId);
  const falta = faltaNa(f);
  const retrato = f.retrato
    ? `<img src="${esc(f.retrato)}" alt="" onerror="this.remove()">`
    : `<svg viewBox="0 0 24 24"><use href="#i-carga"/></svg>`;
  return `<article class="card-f ${falta.length?"incompleta":""}" data-id="${esc(f.id)}">
    <div class="cabeca-f">
      <div class="retrato-mini">${retrato}<span class="nv">${f.nivel||1}</span></div>
      <div class="quem"><b>${esc(f.nome)||"Sem nome"}</b>
        <i>${esc(f.descricao || f.conceito || "sem conceito")}</i></div>
    </div>
    <div class="chips">
      ${c?`<span class="selo-p"><svg viewBox="0 0 24 24"><use href="#i-classe"/></svg>${esc(c.nome)}</span>`:""}
      ${o?`<span class="selo-p"><svg viewBox="0 0 24 24"><use href="#i-carisma"/></svg>${esc(o.nome)}</span>`:""}
    </div>
    ${falta.length
      ? `<p class="falta">Falta: ${esc(falta.join(" · "))}</p>`
      : `<div class="mini-nums">
          <div><b>${R.vidaMaxima(a,f.classeId,f.nivel||1)}</b><span>Vida</span></div>
          <div><b>${R.reservaMaxima(a,f.classeId)}</b><span>Reserva</span></div>
          <div><b>${R.limitePorAcao(a)}</b><span>Limite</span></div>
          <div><b>${R.defesaPassiva(a)}</b><span>Defesa</span></div>
        </div>`}
    <div class="acoes">
      ${falta.length
        ? `<button class="bt" type="button" data-editar="${esc(f.id)}">Continuar</button>
           <button class="bt calado" type="button" data-abrir="${esc(f.id)}">Abrir assim mesmo</button>`
        : `<button class="bt feito" type="button" data-abrir="${esc(f.id)}">Jogar</button>
           <button class="bt calado" type="button" data-editar="${esc(f.id)}">Editar</button>`}
      <button class="bt calado" type="button" data-exportar="${esc(f.id)}">JSON</button>
      <button class="bt perigo" type="button" data-apagar="${esc(f.id)}">Apagar</button>
    </div>
  </article>`;
}

/* ═══ o hub de três abas ═══
   "Criar personagem é em ficha, po" — então o montador não é mais destino
   solto do trilho: ele é a segunda aba daqui, e cada sistema entra com a
   capa dele. A primeira aba é a estante; a terceira, o backup. */
const Cat = (window.RSS && window.RSS.Catalogo) || { SISTEMAS:[] };
const temArte = src => {
  const L = (window.RSS.CONFIG && window.RSS.CONFIG.imagens) || [];
  return !!src && L.indexOf(src) !== -1;
};
const FIG = ["img/personagens/lanca.png","img/personagens/cogumelo.png",
             "img/personagens/koi.png","img/personagens/olhos-dourados.png"];
let aba = "personagens", termo = "", ordem = "recentes", filtroSis = "todos";

function listaFiltrada(){
  let f = Arm.listar();
  const t = termo.trim().toLowerCase();
  if(t) f = f.filter(x => ((x.nome||"") + " " + (x.conceito||"") + " " + (x.descricao||"")).toLowerCase().includes(t));
  const falta = x => sistemaDe(x) === "ressonancia" ? faltaNa(x)
                   : sistemaDe(x) === "saa" ? faltaSaa(x) : faltaFm(x);
  if(filtroSis === "prontas")   f = f.filter(x => !falta(x).length);
  if(filtroSis === "rascunhos") f = f.filter(x =>  falta(x).length);
  if(ordem === "nome")  f = [...f].sort((a,b)=>(a.nome||"").localeCompare(b.nome||"","pt"));
  if(ordem === "nivel") f = [...f].sort((a,b)=>(b.nivel||1)-(a.nivel||1));
  return f;
}

function abaPersonagens(){
  const todas = Arm.listar(), f = listaFiltrada();
  const fig = FIG.find(temArte) || "";
  return `
    <div class="filtros">
      <span class="campo"><svg viewBox="0 0 24 24"><use href="#i-busca"/></svg>
        <input id="q-ficha" type="search" placeholder="Pesquise por nome ou conceito…" value="${esc(termo)}" autocomplete="off"></span>
      <select class="caixa-sel" id="sel-estado" aria-label="Filtrar">
        <option value="todos">Todas as fichas</option>
        <option value="prontas">Só as prontas</option>
        <option value="rascunhos">Só rascunhos</option>
      </select>
      <select class="caixa-sel" id="sel-ordem" aria-label="Ordenar">
        <option value="recentes">Recentes</option>
        <option value="nome">Por nome</option>
        <option value="nivel">Por Nível</option>
      </select>
      <span class="conta-n">${f.length}${f.length!==todas.length ? " de " + todas.length : ""} ficha${todas.length===1?"":"s"}</span>
    </div>
    <div class="estante" id="estante">
      <a class="novo-grande${!todas.length ? " sozinho" : ""}" href="fichas.html?novo=1" data-ir-criar>
        ${!todas.length && temArte(fig) ? `<img class="figura" src="${esc(fig)}" alt="">` : ""}
        <span class="mais">+</span><b>Criar personagem</b>
        <small>${todas.length ? "Escolha o sistema e monte a ficha passo a passo."
          : "A estante está vazia. Escolha o sistema e monte a primeira — ou use Importar, se alguém te mandou um JSON."}</small></a>
      ${f.map(card).join("")}
      ${todas.length && !f.length ? `<div class="estante-vazia" style="grid-column:1/-1">
          <h3>Nenhuma ficha combina</h3><p>Mude a busca ou volte pra “Todas as fichas”.</p></div>` : ""}
    </div>`;
}

function abaCriar(){
  return `<p class="rotulo-bib">Em qual sistema</p>
    <div class="escolher">${(Cat.SISTEMAS||[]).map(s => {
      const pode = !!s.criador;
      const capa = temArte(s.capa)
        ? `<span class="arte"><img src="${esc(s.capa)}" alt="" loading="lazy"></span>`
        : `<span class="arte vazia" style="--c:${esc(s.cor)}"></span>`;
      return pode
        ? `<a class="cartao-sis" href="${esc(s.criador)}">${capa}<span class="sombra"></span>
            <span class="marca">${esc(s.sigla)}</span>
            <span class="txt"><b>${esc(s.nome)}</b><i>montador completo · edição ${esc(s.edicao||"")}</i></span></a>`
        : `<span class="cartao-sis" style="opacity:.6;cursor:default">${capa}<span class="sombra"></span>
            <span class="marca">${esc(s.sigla)}</span>
            <span class="txt"><b>${esc(s.nome)}</b><i>montador ainda não escrito</i></span></span>`;
    }).join("")}</div>`;
}

function abaImportar(){
  const n = Arm.listar().length;
  return `<div class="estante-vazia" style="text-align:left;padding:28px">
      <h3>Trazer uma ficha de fora</h3>
      <p style="margin:0 0 16px;max-width:60ch">Cada ficha exporta um arquivo <b>.json</b> que carrega tudo,
      inclusive o retrato. É o backup e é também como você manda a ficha pro outro jogador.</p>
      <label class="bt" for="f-importar" style="display:inline-flex;align-items:center;cursor:pointer">Escolher arquivos JSON
        <input id="f-importar" type="file" accept="application/json,.json" multiple hidden></label>
      ${n ? `<button class="bt calado" type="button" id="b-exportar-tudo" style="margin-left:10px">Exportar as ${n} fichas</button>` : ""}
    </div>`;
}

/* Cartão de ficha de outro sistema: mesma casca, números do sistema certo. */
function cardOutro(f, sis){
  const falta = sis === "saa" ? faltaSaa(f) : faltaFm(f);
  const nums  = sis === "saa" ? numerosSaa(f) : numerosFm(f);
  const retrato = f.retrato
    ? `<img src="${esc(f.retrato)}" alt="" onerror="this.remove()">`
    : `<svg viewBox="0 0 24 24"><use href="#i-carga"/></svg>`;
  return `<article class="card-f ${falta.length?"incompleta":""}" data-id="${esc(f.id)}">
    <div class="cabeca-f">
      <div class="retrato-mini">${retrato}${f.nivel?`<span class="nv">${f.nivel}</span>`:""}</div>
      <div class="quem"><b>${esc(f.nome)||"Sem nome"}</b>
        <i>${esc(f.descricao || f.conceito || "sem descrição")}</i></div>
    </div>
    <div class="chips"><span class="selo-p">
      <svg viewBox="0 0 24 24"><use href="#i-classe"/></svg>${esc(nomeSistema(f))}</span></div>
    ${falta.length
      ? `<p class="falta">Falta: ${esc(falta.join(" · "))}</p>`
      : `<div class="mini-nums">${nums.map(([v,k]) =>
          `<div><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join("")}</div>`}
    <div class="acoes">
      <button class="bt" type="button" data-editar="${esc(f.id)}">${falta.length?"Continuar":"Abrir"}</button>
      <button class="bt calado" type="button" data-exportar="${esc(f.id)}">JSON</button>
      <button class="bt perigo" type="button" data-apagar="${esc(f.id)}">Apagar</button>
    </div>
  </article>`;
}

function pintar(){
  document.querySelectorAll("#abas-hub [data-aba]").forEach(b =>
    b.setAttribute("aria-selected", b.dataset.aba === aba));
  const cx = $("#miolo-hub");
  cx.innerHTML = aba === "criar" ? abaCriar() : aba === "importar" ? abaImportar() : abaPersonagens();
  const se = $("#sel-estado"); if(se) se.value = filtroSis;
  const so = $("#sel-ordem");  if(so) so.value = ordem;
}

document.addEventListener("click", ev=>{
  const q = s => ev.target.closest(s); let el;
  if((el=q(".ctrl button[data-pele]"))){
    document.documentElement.dataset.pele = el.dataset.pele;
    document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b===el));
    try{ localStorage.setItem("ressonancia:pele", el.dataset.pele); }catch{}
    return;
  }
  if((el=q("[data-abrir]")))  { Arm.marcarAtual(el.dataset.abrir);  location.href="ficha.html?id="+encodeURIComponent(el.dataset.abrir); return; }
  if((el=q("[data-editar]"))) {
    /* Cada sistema tem o montador dele. Mandar tudo pro criar.html abria a
       ficha do Saa ou do Jujutsu no formulário do Ressonância. */
    const fi = Arm.carregar(el.dataset.editar) || {};
    const sis = (Cat.SISTEMAS || []).find(x => x.id === (fi.sistema || "ressonancia"));
    Arm.marcarAtual(el.dataset.editar);
    location.href = ((sis && sis.criador) || "criar.html") + "?id=" + encodeURIComponent(el.dataset.editar);
    return; }
  if((el=q("[data-exportar]"))){ const f=Arm.carregar(el.dataset.exportar); if(f) Arm.exportar(f); return; }
  if((el=q("[data-apagar]"))){
    const f = Arm.carregar(el.dataset.apagar); if(!f) return;
    if(!confirm(`Apagar "${f.nome||"sem nome"}" de vez?\n\nIsto não tem desfazer. Se você não exportou o JSON, a ficha some.`)) return;
    Arm.apagar(el.dataset.apagar); pintar(); return;
  }
  if((el=q("#abas-hub [data-aba]"))){ aba = el.dataset.aba; pintar(); return; }
  if(q("[data-ir-criar]")){ ev.preventDefault(); aba = "criar"; pintar(); return; }
  if(q("#b-exportar-tudo")){ Arm.listar().forEach(f => Arm.exportar(f)); return; }
});

document.addEventListener("input", ev=>{
  if(ev.target.id !== "q-ficha") return;
  termo = ev.target.value;
  const foco = document.activeElement === ev.target, pos = ev.target.selectionStart;
  pintar();
  const q2 = $("#q-ficha");
  if(foco && q2){ q2.focus(); try{ q2.setSelectionRange(pos,pos); }catch{} }
});
document.addEventListener("change", ev=>{
  if(ev.target.id === "sel-estado"){ filtroSis = ev.target.value; return pintar(); }
  if(ev.target.id === "sel-ordem"){  ordem = ev.target.value;     return pintar(); }
});

document.addEventListener("change", async ev=>{
  if(ev.target.id!=="f-importar") return;
  const arqs = [...(ev.target.files||[])];
  let ok=0, ruim=[];
  for(const arq of arqs){
    try{ const f = await Arm.importar(arq); f.id = Arm.novoId(); Arm.salvar(f); ok++; }
    catch(e){ ruim.push(arq.name+": "+e.message); }
  }
  ev.target.value="";
  /* Importou? A pessoa quer VER o que entrou, não continuar na tela de
     importar olhando pro mesmo botão. */
  if(ok) aba = "personagens";
  pintar();
  if(ruim.length) alert("Não deu pra importar:\n"+ruim.join("\n"));
});

(function(){
  const T = window.TabulaTema;
  const slot = $("#troca-tema"); if(slot && T) slot.innerHTML = T.botao();
  if(T) T.perguntar();                       // só aparece na primeira visita
  if(T) T.aplicar(T.escolhido() || (window.RSS.CONFIG&&window.RSS.CONFIG.temaPadrao) || "cartoon", false);
  if(!Arm.temMemoria()) $("#sem-memoria").hidden = false;
  try{ if(new URLSearchParams(location.search).get("novo")) aba = "criar"; }catch{}
  try{ const p = localStorage.getItem("ressonancia:pele");
    if(p){ document.documentElement.dataset.pele = p;
      document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b.dataset.pele===p)); } }catch{}
  pintar();
})();
})();
