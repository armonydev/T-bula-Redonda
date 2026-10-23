/* ═══ sistemas.js — o catálogo do Tábula Redonda ═══
   Cada sistema declara sua identidade e onde ficam as imagens dele.

   ⚠ AS IMAGENS AINDA NÃO EXISTEM. Os caminhos abaixo estão prontos e
   documentados: é só largar o arquivo com o nome exato em img/ que ele
   aparece sozinho. Enquanto não existir, o site desenha um painel com a
   cor do sistema no lugar — não quebra, não mostra ícone de imagem
   quebrada, e não finge que tem arte que não tem.

   Tamanhos que funcionam bem:
     banner  1600×600  (panorâmico, o topo da página do sistema)
     capa     600×840  (vertical, proporção de livro)
     anuncio 1200×520  (o carrossel do começo) */
window.RSS = window.RSS || {};
(function(){
"use strict";

const SISTEMAS = [
  {
    id:"ressonancia", nome:"Ressonância", sigla:"RSS", edicao:"26.1",
    autoria:"Kainã de Mello Hofman",
    resumo:"Eco, Carga e o preço de canalizar. Sistema d20 com Limite por Ação e Aplicações de lista fechada.",
    cor:"#8a7ff0",
    banner:"img/sistemas/ressonancia-banner.jpg",
    capa:"img/sistemas/ressonancia-capa.jpg",
    figura:"img/personagens/olhos-dourados.png",
    pronto:true,
    criador:"criar.html",
    categorias:["Materiais","Personagens","Aventuras","Homebrews"],
    materiais:[
      { id:"livro-26-1", nome:"Ressonância RPG — Edição 26.1", tipo:"Livro de regras",
        pdf:"livros/ressonancia-26-1.pdf", paginas:86,
        capa:"img/sistemas/ressonancia-capa.jpg", autoria:"Kainã de Mello Hofman",
        resumo:"O livro completo: atributos, Poder, Trilhas, Rituais, Arquétipos e o apêndice de mesa.",
        compendio:true, preco:"Grátis" },
    ],
  },
  {
    id:"saa", nome:"Saa", sigla:"SAA", edicao:"26.1",
    autoria:"João Pedro (Japê) Soares · Pedro Henrique Ferreira Ribeiro · Luiz Fernando de Souza Braga",
    resumo:"Três atributos, nenhuma DC e nenhuma rolagem de dano. O Saa é a força que dá vida ao universo, e quem a canaliza pelo Corpo, Mente e Espírito é um Saaísta.",
    cor:"#6f8f5a",
    banner:"img/sistemas/saa-banner.jpg", capa:"img/sistemas/saa-capa.jpg",
    figura:"img/personagens/cogumelo.png",
    pronto:true,
    criador:"criar-saa.html",
    categorias:["Materiais","Personagens","Aventuras"],
    materiais:[
      { id:"saa-livro", nome:"Saa — Edição 26.1", tipo:"Livro de regras",
        pdf:"livros/saa-26-1.pdf", paginas:20,
        capa:"img/sistemas/saa-capa.jpg", autoria:"Japê, Pedro Henrique e Luiz Fernando",
        resumo:"Os Elementos, os três Atributos, Estudos, Técnicas, Itens e a escada de dados.",
        compendio:true, preco:"Grátis" },
    ],
  },
  {
    id:"fm", nome:"Feiticeiros & Maldições", sigla:"F&M", edicao:"2.5.2",
    autoria:"Setsugiri e Parker · Projeto Onigiri",
    resumo:"RPG de mesa feito por fãs para fãs, no mundo de Jujutsu Kaisen. Projeto gratuito, sem intenção de lucro.",
    cor:"#7a1540",
    banner:"img/sistemas/fm-banner.jpg", capa:"img/sistemas/fm-capa.jpg",
    figura:"img/personagens/koi.png",
    pronto:true,
    criador:"criar-fm.html",
    /* Material de terceiros, liberado pelo pessoal do Projeto Onigiri. O
       crédito anda junto do material, no cartão — não como aviso em cima
       de tudo. */
    faltando:"",
    categorias:["Materiais","Personagens","Aventuras","Homebrews"],
    materiais:[
      { id:"fm-regras", nome:"Livro de Regras v2.5.2", tipo:"Livro de regras",
        pdf:"livros/Feiticeiros & Maldições - Livro de Regras v2.5.2.pdf", paginas:368, compendio:true,
        /* Se um dia você preferir NÃO hospedar os livros do pessoal do
           Onigiri — pra deixar o repositório leve ou porque eles pediram —
           tire o caminho da lista "livros" em config.js e ponha aqui:
             pdfUrl:"https://link-oficial-deles",
           O botão vira "Baixar no site oficial" e nada fica no seu repo. */
        capa:"img/sistemas/fm-capa.jpg", autoria:"Projeto Onigiri", preco:"Grátis",
        resumo:"Criação de personagem, Origens, Especializações, Técnicas Amaldiçoadas, Combate e Votos de Restrição." },
      { id:"fm-enciclopedia", nome:"Enciclopédia Amaldiçoada v0.9", tipo:"Suplemento",
        pdf:"livros/Feiticeiros e Maldições - Enciclopédia Amaldiçoada v0.9.pdf", paginas:264,
        capa:"img/sistemas/fm-banner.jpg", autoria:"Projeto Onigiri", preco:"Grátis",
        resumo:"O complemento de mundo e criaturas." },
    ],
  },
];

/* O carrossel da entrada. Mesma história das imagens: caminho pronto,
   arquivo depois. */
const ANUNCIOS = [
  /* A ORDEM IMPORTA. O cartaz que abre o site é o SEGUNDO, nunca o
     primeiro: assim já tem um de cada lado e as duas setas funcionam desde
     o primeiro segundo. Quem fica no meio é o Bestiário, que é a arte mais
     bonita das quatro. Quem decide é ANUNCIO_INICIAL, logo abaixo. */
  { id:"26-1", titulo:"Ressonância 26.1 no ar", texto:"86 páginas, auditoria fechada e o criador de ficha completo.",
    img:"img/anuncios/26-1.jpg", cor:"#8a7ff0", href:"sistema.html?s=ressonancia" },
  { id:"bestiario", titulo:"Bestiário do Ressonância", texto:"As criaturas da mesa, com ficha, fraqueza e o que elas querem.",
    img:"img/anuncios/bestiario.jpg", cor:"#e8275f", href:"compendio.html?s=ressonancia" },
  { id:"jujutsu", titulo:"Feiticeiros & Maldições", texto:"O RPG de Jujutsu Kaisen do Projeto Onigiri, com ficha e compêndio.",
    img:"img/anuncios/jujutsu.jpg", cor:"#7a1540", href:"sistema.html?s=fm" },
  { id:"ficha", titulo:"Monte sua ficha", texto:"Três sistemas, cada um com o montador dele, direto no navegador.",
    img:"img/anuncios/ficha.jpg", cor:"#4bbf84", href:"fichas.html" },
];
const ANUNCIO_INICIAL = 1;

/* Os atalhos da entrada. cena = imagem bem apagada no fundo;
   figura = personagem recortado por cima. */
const ATALHOS = [
  { nome:"Minhas fichas",     href:"fichas.html",     cor:"#4bbf84",
    cena:"img/atalhos/fichas.jpg",    figura:"img/personagens/lanca.png" },
  { nome:"Criar personagem",  href:"fichas.html?novo=1", cor:"#8a7ff0",
    cena:"img/atalhos/criar.jpg",     figura:"img/personagens/cogumelo.png" },
  { nome:"Compêndio",         href:"compendio.html",  cor:"#e8275f",
    cena:"img/atalhos/compendio.jpg", figura:"img/personagens/olhos-dourados.png" },
  { nome:"Sistemas",          href:"sistema.html",    cor:"#e0b24a",
    cena:"img/atalhos/aventuras.jpg", figura:"img/personagens/koi.png" },
  { nome:"Loja",              href:"loja.html",       cor:"#5bc8e8",
    cena:"img/atalhos/loja.jpg",      figura:"" },
];

const porId = id => SISTEMAS.find(s => s.id === id) || null;

/* ── a biblioteca de quem está usando ──
   Resgatar é de graça (tudo aqui é gratuito), mas existe de propósito: é
   o que separa "o catálogo tem" de "eu tenho". Sem isso a página do
   sistema listava livro que a pessoa nunca pegou, que foi o que o Kainã
   apontou. */
const CHAVE_BIB = "tabula:biblioteca";
const lerBib = () => { try{ return JSON.parse(localStorage.getItem(CHAVE_BIB) || "[]"); }catch{ return []; } };
const temMaterial = id => lerBib().indexOf(id) !== -1;
function resgatar(id){
  const b = lerBib(); if(b.indexOf(id) === -1) b.push(id);
  try{ localStorage.setItem(CHAVE_BIB, JSON.stringify(b)); }catch{}
}
function devolver(id){
  const b = lerBib().filter(x => x !== id);
  try{ localStorage.setItem(CHAVE_BIB, JSON.stringify(b)); }catch{}
}
/* Todo material de todo sistema, achatado — é o que a Loja mostra. */
const TODOS_MATERIAIS = () => SISTEMAS.flatMap(s =>
  (s.materiais || []).map(m => ({ ...m, sistemaId:s.id, sistema:s.nome, cor:s.cor, externo:!!s.externo })));
window.RSS.Catalogo = { SISTEMAS, ANUNCIOS, ANUNCIO_INICIAL, ATALHOS, porId, lerBib, temMaterial, resgatar, devolver, TODOS_MATERIAIS };
})();
