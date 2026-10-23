/* ═══ paginas.js — catálogo, página de sistema e compêndio ═══
   Uma única rotina decide qual montar, pelo data-pagina do <body>. */
(function(){
"use strict";
const R = window.RSS.R, Cat = window.RSS.Catalogo, Comp = window.RSS.Compendio;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const param = k => { try{ return new URLSearchParams(location.search).get(k) || ""; }catch{ return ""; } };

/* A imagem que talvez ainda não exista. Nunca deixa <img> quebrada na tela:
   o onerror troca pelo painel com a cor do sistema. */
/* Os PDFs do Jujutsu têm espaço, acento e "&" no nome. Num href isso
   quebra: o "&" vira começo de entidade e o resto do caminho se perde.
   encodeURIComponent só no NOME do arquivo resolve, mantendo a barra. */
const url = caminho => String(caminho||"").split("/").map(encodeURIComponent).join("/");
const temLivro = src => {
  const L = (window.RSS.CONFIG && window.RSS.CONFIG.livros) || [];
  return !!src && L.indexOf(src) !== -1;
};
const temArte = src => {
  const L = (window.RSS.CONFIG && window.RSS.CONFIG.imagens) || [];
  return !!src && L.indexOf(src) !== -1;
};
function arte(src, rotulo, cor, extra){
  const c = cor ? ` style="--c:${esc(cor)}"` : "";
  if(!temArte(src)) return `<span class="arte vazia${extra?" "+extra:""}" data-rotulo="${esc(rotulo||"")}"${c}></span>`;
  return `<span class="arte${extra?" "+extra:""}" data-rotulo="${esc(rotulo||"")}"${c}>
    <img src="${esc(src)}" alt="" loading="lazy"
      onerror="this.parentNode.classList.add('vazia');this.remove()"></span>`;
}

/* ───────────────────────── catálogo ───────────────────────── */
function catalogo(){
  const an = Cat.ANUNCIOS;
  $("#palco-pagina").innerHTML = `
    <section class="vitrola">
      <button class="seta ant" type="button" data-vai="-1" aria-label="Anterior">‹</button>
      <div class="pista" id="pista">${an.map(a => `
        <a class="cartaz" href="${esc(a.href)}">
          ${arte(a.img, a.titulo, a.cor)}
          <span class="texto"><span class="risquinho"></span><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span></span>
        </a>`).join("")}</div>
      <button class="seta prox" type="button" data-vai="1" aria-label="Próximo">›</button>
      <div class="bolinhas" id="bolinhas">${an.map((a,i) =>
        `<button type="button" data-ir="${i}" aria-current="${i===0}" aria-label="Destaque ${i+1}"></button>`).join("")}</div>
    </section>

    <div class="faixa-tit"><h2>Atalhos</h2></div>
    <div class="atalhos">
      ${(Cat.ATALHOS||[]).map(a => `
        <a class="atalho" href="${esc(a.href)}" style="--c:${esc(a.cor)}">
          ${temArte(a.cena) ? `<span class="cena" style="background-image:url('${esc(a.cena)}')"></span>` : ""}
          ${temArte(a.figura) ? `<img class="figura" src="${esc(a.figura)}" alt="" loading="lazy" onerror="this.remove()">` : ""}
          <b>${esc(a.nome)}</b>
        </a>`).join("")}
    </div>

    <div class="faixa-tit"><h2>Sistemas</h2>
      <span class="mais"><a href="#">${Cat.SISTEMAS.length} no catálogo</a></span></div>
    <div class="fileira">${Cat.SISTEMAS.map(s => `
      <a class="capa-sis" href="sistema.html?s=${esc(s.id)}">
        ${arte(s.capa, s.nome, s.cor)}
        <b>${esc(s.nome)}</b>
        <i>${s.pronto ? esc(s.resumo.split(".")[0]) : "estrutura pronta, material a caminho"}</i>
        ${s.pronto ? "" : `<span class="emBreve">em breve</span>`}
      </a>`).join("")}</div>`;

  /* O cartaz do meio fica inteiro; os vizinhos ficam menores e apagados.
     É o que dá a profundidade do carrossel sem precisar de biblioteca. */
  const pista = $("#pista");
  const cartazes = [...pista.querySelectorAll(".cartaz")];
  let atual = 0;
  function marcar(){
    const meio = pista.scrollLeft + pista.clientWidth / 2;
    let perto = 0, menor = Infinity;
    cartazes.forEach((el,i) => {
      const c = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(c - meio);
      if(d < menor){ menor = d; perto = i; }
    });
    atual = perto;
    cartazes.forEach((el,i) => el.classList.toggle("meio", i === atual));
    document.querySelectorAll("#bolinhas [data-ir]").forEach((b,i) =>
      b.setAttribute("aria-current", i === atual));
  }
  function ir(i){
    i = Math.max(0, Math.min(cartazes.length - 1, i));
    const el = cartazes[i];
    pista.scrollTo({ left: el.offsetLeft - (pista.clientWidth - el.offsetWidth) / 2, behavior:"smooth" });
  }
  pista.addEventListener("scroll", marcar, { passive:true });
  document.addEventListener("click", ev => {
    let b;
    if((b = ev.target.closest("#bolinhas [data-ir]"))) return ir(+b.dataset.ir);
    if((b = ev.target.closest("[data-vai]")))          return ir(atual + (+b.dataset.vai));
  });
  /* Abre no cartaz do meio, não no primeiro: assim já tem um de cada lado
     e as duas setas funcionam desde o começo. Quem decide qual é o inicial
     é o catálogo (ANUNCIO_INICIAL), não esta função. */
  const inicial = Math.min(Cat.ANUNCIO_INICIAL || 0, cartazes.length - 1);
  requestAnimationFrame(() => { ir(inicial); marcar(); });
}


/* Sem ?s= na URL, a página NÃO chuta Ressonância. Ela pergunta.
   Era a reclamação do Kainã: o trilho levava sempre pro Ressonância, então
   quem estava no Saa ou no Jujutsu nunca chegava no material certo — e o
   livro resgatado na Loja parecia não ter salvado. */
function escolherSistema(titulo, linha, destino){
  document.title = titulo + " — Tábula Redonda";
  $("#palco-pagina").innerHTML = `
    <div class="hub-cabeca"><div><h2>${esc(titulo)}</h2><p>${esc(linha)}</p></div></div>
    <div class="escolher">${Cat.SISTEMAS.map(s => `
      <a class="cartao-sis" href="${esc(destino)}?s=${esc(s.id)}" style="--c:${esc(s.cor)}">
        ${arte(s.banner || s.capa, s.nome, s.cor)}
        <span class="sombra"></span>
        <span class="marca">${esc(s.sigla)}${s.edicao ? " · " + esc(s.edicao) : ""}</span>
        <span class="txt"><b>${esc(s.nome)}</b></span>
      </a>`).join("")}</div>`;
}

/* O botão de leitura tem três estados, nesta ordem:
   1. o arquivo está em livros/ e listado no config → abre o PDF daqui;
   2. o material tem pdfUrl → manda pro lugar oficial, sem hospedar nada
      (é a saída pra livro de terceiro, ou pra arquivo grande demais);
   3. nenhum dos dois → diz onde largar o arquivo, em vez de abrir em branco. */
function botaoLivro(m){
  if(!m.pdf && !m.pdfUrl) return "";
  if(m.pdf && temLivro(m.pdf))
    return `<a class="bt" href="${esc(url(m.pdf))}" target="_blank" rel="noopener">Ler o PDF</a>`;
  if(m.pdfUrl)
    return `<a class="bt" href="${esc(m.pdfUrl)}" target="_blank" rel="noopener">Baixar no site oficial ↗</a>`;
  return `<button class="bt calado" type="button" data-sem-pdf="${esc(m.pdf)}">Ler o PDF</button>`;
}

/* ───────────────────────── página de sistema ───────────────────────── */
function sistema(){
  if(!param("s")) return escolherSistema("Sistemas", "Escolha o sistema que você quer abrir.", "sistema.html");
  const s = Cat.porId(param("s"));
  if(!s){ $("#palco-pagina").innerHTML = `<div class="vazio-cx"><h3>Sistema não encontrado</h3>
    <p>O endereço aponta pra um sistema que não está no catálogo.</p></div>`; return; }
  document.title = `${s.nome} — Tábula Redonda`;
  const onde = document.getElementById("onde-estou");
  if(onde) onde.textContent = `${s.nome}${s.edicao ? " · " + s.edicao : ""}`;

  /* O Kainã apontou que entrar num sistema era um beco: não dava pra voltar
     pros outros e tudo levava pro compêndio. Então o banner agora carrega
     uma barra com as quatro coisas que a pessoa quer fazer aqui — voltar,
     criar, ver as fichas e abrir o livro — e o Compêndio virou ABA, porque
     é leitura de consulta, não a porta de entrada do sistema. */
  /* Sem aba de Compêndio: o botão "Abrir compêndio" já está no cartão do
     livro, que é onde ele faz sentido — um compêndio é de um livro, não do
     sistema inteiro. Duas portas pra mesma sala é uma a mais. */
  const abas = ["Materiais", ...(s.categorias || []).filter(a => a !== "Materiais" && a !== "Compêndio")];

  $("#palco-pagina").innerHTML = `
    <section class="banner" style="--c:${esc(s.cor)}">
      ${arte(s.banner, s.nome, s.cor)}
      ${temArte(s.figura) ? `<img class="figura-banner" src="${esc(s.figura)}" alt="" onerror="this.remove()">` : ""}
      <div class="dentro">
        <span class="selo-sis">Sistema</span>
        <h1>${esc(s.nome)}</h1>
        <span class="sigla">${esc(s.sigla)}${s.edicao ? " · edição " + esc(s.edicao) : ""}</span>
        <p>${esc(s.resumo)}</p>
        <p class="quem">${esc(s.autoria)}</p>
      </div>
    </section>

    <nav class="barra-sis" aria-label="Atalhos do sistema">
      <a class="bt calado" href="sistema.html">← Voltar para sistemas</a>
    </nav>

    <nav class="abas-sis" id="abas-sis" role="tablist">${abas.map((a,i) =>
      `<button type="button" role="tab" data-aba="${esc(a)}" aria-selected="${i===0}">${esc(a)}</button>`).join("")}</nav>
    <div id="miolo-sis"></div>`;

  function aba(nome){
    const cx = $("#miolo-sis");
    document.querySelectorAll("[data-aba]").forEach(b => b.setAttribute("aria-selected", b.dataset.aba === nome));

    if(nome === "Materiais"){
      if(!(s.materiais || []).length){
        cx.innerHTML = `<div class="vazio-cx"><h3>Ainda sem material</h3><p>${esc(s.faltando || "Nada publicado aqui ainda.")}</p></div>`;
        return;
      }
      /* Material que a pessoa não resgatou não abre: ela vai pra Loja. */
      cx.innerHTML = `<p class="rotulo-bib">Biblioteca oficial (${s.materiais.length})</p>
        <div class="capas largas">${s.materiais.map(m => {
          const meu = Cat.temMaterial(m.id);
          return `<article class="cartao-mat${meu?"":" fechado"}">
            ${arte(m.capa, m.nome, s.cor)}
            <div class="txt">
              <b>${esc(m.nome)}</b>
              <i>${esc(m.tipo)} · ${esc(m.autoria)}${m.paginas?` · ${m.paginas} páginas`:""}</i>
              ${m.resumo ? `<p>${esc(m.resumo)}</p>` : ""}
              <div class="acoes">
                ${!meu ? `<a class="bt" href="loja.html">Resgatar na Loja</a>`
                  : `${botaoLivro(m)}
                     ${m.compendio ? `<a class="bt calado" href="compendio.html?s=${esc(s.id)}">Abrir compêndio</a>` : ""}
                     <span class="tem-selo">✓ na sua biblioteca</span>`}
              </div>
            </div>
          </article>`;}).join("")}</div>`;

    } else if(nome === "Personagens"){
      cx.innerHTML = s.criador
        ? `<p class="rotulo-bib">Seus personagens</p>
           <div class="capas">
             <a class="capa-sis" href="fichas.html">${arte("", "Minhas fichas", "#4bbf84")}<b>Minhas fichas</b><i>o que está salvo neste navegador</i></a>
             <a class="capa-sis" href="${esc(s.criador)}">${arte("", "Criar", s.cor)}<b>Criar personagem</b><i>montador do ${esc(s.nome)}</i></a>
           </div>`
        : `<div class="vazio-cx"><h3>Sem montador de ficha</h3><p>O montador do ${esc(s.nome)} entra quando o material do sistema chegar.</p></div>`;

    } else {
      cx.innerHTML = `<div class="vazio-cx"><h3>${esc(nome)}</h3>
        <p>Nada publicado em ${esc(nome)} ainda. A área existe e está ligada à navegação; falta o conteúdo.</p></div>`;
    }
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest("[data-aba]"); if(b) return aba(b.dataset.aba);
    const sp = ev.target.closest("[data-sem-pdf]");
    if(sp) alert("O arquivo ainda não está na pasta do site.\n\n" +
      "Copie o PDF para:\n" + sp.dataset.semPdf + "\n\n" +
      "Depois acrescente esse mesmo caminho na lista \"livros\" do arquivo js/config.js.");
  });
  aba(abas[0]);
}

/* ───────────────────────── compêndio ───────────────────────── */
function compendio(){
  if(!param("s")) return escolherSistema("Compêndio", "Cada sistema tem a biblioteca dele. Escolha de qual você quer pesquisar.", "compendio.html");
  const s = Cat.porId(param("s"));
  if(!s){ $("#palco-pagina").innerHTML = `<div class="vazio-cx"><h3>Sistema não encontrado</h3></div>`; return; }
  document.title = `Compêndio — ${s.nome}`;
  const onde = document.getElementById("onde-estou");
  if(onde) onde.textContent = `Compêndio · ${s.nome}`;
  const todas = Comp.entradasDe(s.id);
  const cats = Comp.categoriasDe(todas);
  let cat = "Todos", termo = param("q") || "";

  $("#palco-pagina").innerHTML = `
    <div style="margin:4px 0 18px"><a class="bt calado" href="sistema.html?s=${esc(s.id)}">← ${esc(s.nome)}</a></div>
    <div class="comp">
      <aside class="comp-lado">
        <div class="comp-id">
          ${arte(s.capa, s.nome, s.cor)}
          <b>Compêndio ${esc(s.nome)}</b>
          <p>${esc(s.resumo)}</p>
          <span class="quem">${esc(s.autoria)}</span>
        </div>
        <nav class="cats" id="cats"></nav>
      </aside>
      <main>
        <div class="busca">
          <svg viewBox="0 0 24 24"><use href="#i-busca"/></svg>
          <input id="q" type="search" placeholder="Buscar regra, Aplicação, Trilha, perícia…" autocomplete="off">
          <button class="limpar" type="button" id="b-limpar" hidden aria-label="Limpar">×</button>
        </div>
        <div class="comp-topo"><h2 id="t-cat">Todos</h2><span id="t-n"></span></div>
        <div class="entradas" id="lista"></div>
      </main>
    </div>
    <div class="veu-ent" id="veu-ent"><div class="ent-det" id="det" role="dialog" aria-modal="true"></div></div>`;

  function pintarCats(){
    $("#cats").innerHTML = [{nome:"Todos", n:todas.length}, ...cats].map(c =>
      `<button type="button" data-cat="${esc(c.nome)}" aria-current="${c.nome===cat}">
        ${esc(c.nome)}<em>${c.n}</em></button>`).join("");
  }
  function pintarLista(){
    const r = Comp.filtrar(todas, termo, cat);
    $("#t-cat").textContent = cat;
    $("#t-n").textContent = r.length ? `${r.length} entrada${r.length>1?"s":""}` : "";
    $("#b-limpar").hidden = !termo;
    if(!todas.length){
      $("#lista").innerHTML = `<div class="vazio-cx" style="grid-column:1/-1"><h3>Biblioteca vazia</h3>
        <p>${esc(s.faltando || "O material deste sistema ainda não foi publicado.")}</p></div>`;
      return;
    }
    if(!r.length){
      $("#lista").innerHTML = `<div class="vazio-cx" style="grid-column:1/-1"><h3>Nada encontrado</h3>
        <p>Nenhuma entrada em <b>${esc(cat)}</b> combina com “${esc(termo)}”. Tente outra palavra ou volte pra Todos.</p></div>`;
      return;
    }
    $("#lista").innerHTML = r.map(e => `
      <button class="ent" type="button" data-ent="${esc(e.id)}">
        <span class="cat">${esc(e.cat)}</span>
        <b>${esc(e.nome)}</b>
        ${e.etiquetas && e.etiquetas.length ? `<span class="ets">${e.etiquetas.map(([k,v]) =>
          `<span class="et"><i>${esc(k)}</i>${esc(v)}</span>`).join("")}</span>` : ""}
        <span class="res">${esc(e.resumo)}</span>
      </button>`).join("");
  }
  function abrirEnt(id){
    const e = todas.find(x => x.id === id); if(!e) return;
    $("#det").innerHTML = `<span class="cat">${esc(e.cat)}</span><h3>${esc(e.nome)}</h3>
      ${e.etiquetas && e.etiquetas.length ? `<div class="ets">${e.etiquetas.map(([k,v]) =>
        `<span class="et"><i>${esc(k)}</i>${esc(v)}</span>`).join("")}</div>` : ""}
      <dl>${(e.corpo||[]).map(([t,d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>
      <button class="bt calado fechar" type="button" data-fechar-ent>Fechar</button>`;
    $("#veu-ent").classList.add("on");
  }

  document.addEventListener("click", ev => {
    let el;
    if((el = ev.target.closest("[data-cat]"))){ cat = el.dataset.cat; pintarCats(); pintarLista(); return; }
    if((el = ev.target.closest("[data-ent]"))){ abrirEnt(el.dataset.ent); return; }
    if(ev.target.closest("[data-fechar-ent]") || ev.target.id === "veu-ent"){ $("#veu-ent").classList.remove("on"); return; }
    if(ev.target.closest("#b-limpar")){ termo = ""; $("#q").value = ""; pintarLista(); $("#q").focus(); return; }
  });
  document.addEventListener("keydown", ev => {
    if(ev.key === "Escape") $("#veu-ent").classList.remove("on");
  });
  document.addEventListener("input", ev => {
    if(ev.target.id !== "q") return;
    termo = ev.target.value; pintarLista();
  });

  if(termo){ const q = $("#q"); if(q) q.value = termo; }
  pintarCats(); pintarLista();
}


/* ───────────────────────── loja ───────────────────────── */
function loja(){
  const todos = Cat.TODOS_MATERIAIS();
  const destaque = todos[0];
  function pintar(){
    const tem = id => Cat.temMaterial(id);
    $("#palco-pagina").innerHTML = `
      <section class="destaque-loja">
        <div>
          <span class="selo">${esc(destaque.tipo)}</span>
          <h2>${esc(destaque.nome)}</h2>
          <p class="quem">${esc(destaque.autoria)}</p>
          <p class="texto">${esc(destaque.resumo)}</p>
          <div class="linha-preco">
            <span class="preco">Preço<b>${esc(destaque.preco || "Grátis")}</b></span>
            ${tem(destaque.id)
              ? `<span class="tem-selo">✓ na sua biblioteca</span>
                 <a class="bt calado" href="sistema.html?s=${esc(destaque.sistemaId)}">Abrir o sistema</a>`
              : `<button class="bt" type="button" data-resgatar="${esc(destaque.id)}">Resgatar</button>`}
          </div>
        </div>
        ${arte(destaque.capa, destaque.nome, destaque.cor)}
      </section>

      <div class="faixa-tit"><h2>Catálogo</h2><span class="mais"><a href="#">${todos.length} materiais</a></span></div>
      <div class="prateleira">${todos.map(m => `
        <article class="prod">
          ${arte(m.capa, m.nome, m.cor)}
          <b>${esc(m.nome)}</b>
          <i>${esc(m.sistema)} · ${esc(m.tipo)}</i>
          <div class="pe">
            <span>${esc(m.preco || "Grátis")}</span>
            ${tem(m.id)
              ? `<button class="bt calado" type="button" data-devolver="${esc(m.id)}">Remover</button>`
              : `<button class="bt" type="button" data-resgatar="${esc(m.id)}">Resgatar</button>`}
          </div>
          ${tem(m.id) ? `<span class="tem-selo">✓ na sua biblioteca</span>` : ""}
        </article>`).join("")}</div>

      <div class="recado-hub" style="margin-top:26px">
        <b>Tudo aqui é gratuito.</b> O botão Resgatar não cobra nada — ele só marca o que é
        <b>seu</b>, pra página do sistema parar de listar livro que você nunca pegou.
        Cada material aparece com o nome de quem escreveu, no próprio cartão.
      </div>`;
  }
  document.addEventListener("click", ev => {
    let el;
    if((el = ev.target.closest("[data-resgatar]"))){ Cat.resgatar(el.dataset.resgatar); return pintar(); }
    if((el = ev.target.closest("[data-devolver]"))){ Cat.devolver(el.dataset.devolver); return pintar(); }
  });
  /* Voltar pelo botão do navegador restaura a página do cache e a tela
     ficava com o estado velho — parecia que o Resgatar não tinha salvado. */
  window.addEventListener("pageshow", ev => { if(ev.persisted) pintar(); });
  window.addEventListener("storage", ev => { if(ev.key === "tabula:biblioteca") pintar(); });
  pintar();
}

/* ───────────────────────── início ───────────────────────── */
(function(){
  const T = window.TabulaTema;
  const slot = $("#troca-tema"); if(slot && T) slot.innerHTML = T.botao();
  if(T) T.perguntar();
  if(T) T.aplicar(T.escolhido() || (window.RSS.CONFIG&&window.RSS.CONFIG.temaPadrao) || "cartoon", false);
  try{ const p = localStorage.getItem("ressonancia:pele");
    if(p){ document.documentElement.dataset.pele = p;
      document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b.dataset.pele===p)); } }catch{}
  document.addEventListener("click", ev => {
    const el = ev.target.closest(".ctrl button[data-pele]"); if(!el) return;
    document.documentElement.dataset.pele = el.dataset.pele;
    document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b===el));
    try{ localStorage.setItem("ressonancia:pele", el.dataset.pele); }catch{}
  });
  /* A busca da barra de cima não é decoração: ela abre o compêndio já
     filtrado. Na própria página do compêndio, filtra ali mesmo. */
  const bg = document.getElementById("busca-global");
  if(bg){
    bg.addEventListener("keydown", ev => {
      if(ev.key !== "Enter") return;
      const t = bg.value.trim(); if(!t) return;
      if(document.body.dataset.pagina === "compendio"){
        const q = document.getElementById("q");
        if(q){ q.value = t; q.dispatchEvent(new Event("input",{bubbles:true})); q.scrollIntoView({behavior:"smooth",block:"center"}); return; }
      }
      location.href = "compendio.html?s=" + (param("s") || "ressonancia") + "&q=" + encodeURIComponent(t);
    });
    document.addEventListener("keydown", ev => {
      if((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase()==="k"){ ev.preventDefault(); bg.focus(); bg.select(); }
    });
  }

  const qual = document.body.dataset.pagina;
  if(qual === "catalogo") catalogo();
  else if(qual === "sistema") sistema();
  else if(qual === "compendio") compendio();
  else if(qual === "loja") loja();
})();
})();
