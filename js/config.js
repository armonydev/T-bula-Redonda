/* ═══ config.js — os interruptores do site ═══
   Carregue ANTES de todo o resto. É o único arquivo que você mexe pra
   ligar ou desligar partes do Tábula Redonda. */
window.RSS = window.RSS || {};

window.RSS.CONFIG = {
  /* Os segredos da Câmara (sustos, intrusões, cenários) dependem da pasta
     assets/, que tem personagem dos outros dentro.
     false → nenhuma requisição é feita, console limpo, site completo. */
  segredos: false,

  /* O site é Dark Fantasy. O Cartoon sobrou só na ficha de jogo, que é a
     tela herdada da Câmara — e lá ele é o padrão.
     Quem pode trocar de tema é a página que tem <body data-temavel>. */
  temaPadrao: "escuro",

  /* O papel de parede do painel. Fica em 5% de opacidade — é textura, não
     quadro. Troque o caminho ou ponha "" pra desligar. */
  papelParede: "img/fundo/painel.jpg",

  /* OS PDFs QUE ESTÃO NA PASTA livros/.
     O site só oferece "Ler o PDF" do que está nesta lista. O que não está
     mostra onde largar o arquivo, em vez de abrir uma aba em branco.

     Os nomes do Jujutsu têm espaço, acento e "&" — o site codifica isso
     sozinho na hora de montar o link, então pode deixar como veio. */
  livros: [
    "livros/ressonancia-26-1.pdf",
    "livros/saa-26-1.pdf",
    "livros/Feiticeiros & Maldições - Livro de Regras v2.5.2.pdf",
    "livros/Feiticeiros e Maldições - Enciclopédia Amaldiçoada v0.9.pdf",
  ],

  /* AS IMAGENS QUE EXISTEM DE VERDADE, pelo caminho exato.
     O site só pede o que está nesta lista; o que não está vira painel
     colorido, sem 404 no console. Largou arte nova em img/? Acrescente
     o caminho aqui e ela aparece. */
  imagens: [
    "img/sistemas/ressonancia-capa.jpg",
    "img/sistemas/ressonancia-banner.jpg",
    "img/sistemas/ressonancia-manual.jpg",
    "img/sistemas/saa-capa.jpg",
    "img/sistemas/saa-banner.jpg",
    "img/sistemas/fm-capa.jpg",
    "img/sistemas/fm-banner.jpg",
    "img/anuncios/26-1.jpg",
    "img/anuncios/bestiario.jpg",
    "img/anuncios/compendio.jpg",
    "img/anuncios/ficha.jpg",
    "img/anuncios/jujutsu.jpg",
    "img/atalhos/fichas.jpg",
    "img/atalhos/criar.jpg",
    "img/atalhos/compendio.jpg",
    "img/atalhos/aventuras.jpg",
    "img/atalhos/loja.jpg",
    "img/personagens/olhos-dourados.png",
    "img/personagens/cogumelo.png",
    "img/personagens/koi.png",
    "img/personagens/lanca.png",
  ],
};
