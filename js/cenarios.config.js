/* ═══════════════════════════════════════════════════════════════════
   cenarios.config.js — AS SALAS. Você mexe aqui.

   ── UM ATOR ───────────────────────────────────────────────────────
   { id:"cinza", asset:"...", x:58, y:70, altura:.34, z:.55, espelhar:false }
     x, y     posição em % da sala (y é o TOPO do ator)
     altura   fração da altura da sala — É O TAMANHO QUE DÁ A PROFUNDIDADE
     z        0 longe → 1 perto. Não mexe no tamanho: manda no parallax
              (quem está perto se desloca mais com o mouse) e em quem
              fica na frente de quem.
     pontos   caixas clicáveis DENTRO da imagem dele, em % dela própria:
              caixa:[x, y, largura, altura]

   ── UM PASSO DE ROTEIRO ───────────────────────────────────────────
   { luz:{tremer:1, duracao:1400} }            a sala pisca
   { clarear:{ate:1, duracao:4200} }           véu branco por cima de TUDO
   { descer:{ator:"x", de:-40, ate:38, giros:3, duracao:4200} }
   { sumir:["a","b"] }   { trocar:{ ator:"novo/arquivo.gif" } }
   { surgir:{ ator:{x,y,altura} } }            traz de volta/reposiciona
   { esperar: 1200 }     { camera:{...} }      { som:"..." }
   { sussurro:"texto" }  { lembrar:"marca" }   ← grava pra sempre

   ── COMO SE CHEGA NA SALA ─────────────────────────────────────────
   entrada: { tipo:"cortina", pausa:900 }
   entrada: { tipo:"tremor",  quemSobe:"...gif", altura:.5, duracao:3400 }
   entrada: { tipo:"circo",   caine:"...", nome:"C A I N E",
              olhos:"...jpg", olhudo:"...png", olhosMs:2600 }

   `seLembrado` aplica passos INSTANTANEAMENTE quando a sala abre e a
   marca já existe. É o que faz a mudança ter acontecido de verdade.
   Pra zerar: console → RSS.Cenario.esquecer()
   ═══════════════════════════════════════════════════════════════════ */

window.CENARIOS = {

  backrooms: {
    descricao: "um corredor amarelo que não termina",
    fundo: "assets/backgrounds/backrooms.jpg",

    /* sem cortina de teatro aqui. Ele sobe na frente da ficha, tudo vibra e
       brilha cada vez mais, e aí a sala simplesmente JÁ É outra — o branco
       dura 140ms, você sabe que piscou mas não vê o corte. */
    entrada: {
      tipo: "tremor",
      quemSobe: "assets/characters/tv.gif",
      altura: 0.52,
      duracao: 3400,     // quanto tempo o tremor cresce antes do corte
      brilho: 0.85,
    },

    atores: [
      /* o amarelo, virado pra direita, apontando a espada pro mouse */
      /* TODOS do mesmo tamanho do estado final (.22). O que está batendo no
         cursor é só um pouco menor — é ele que está mais longe. */
      { id: "amarelo",
        asset: "assets/characters/amarelo-espada.gif",
        x: 34, y: 60, altura: 0.22, z: 0.75 },

      /* o cinza espancando o mouse. O mouse mora DENTRO do gif dele —
         por isso o ponto clicável é uma caixa em % da imagem, não um ator. */
      { id: "cinza",
        asset: "assets/characters/cinza.gif",
        x: 52, y: 62, altura: 0.18, z: 0.62,
        pontos: [
          { caixa: [10, 10, 32, 46], roteiro: "ritual", dica: "o mouse" },
        ] },

      /* estes dois começam escondidos; o roteiro traz */
      { id: "herobrine", asset: "assets/characters/herobrine.gif",
        x: 44, y: -40, altura: 0.26, z: 0.9, oculto: true },
      { id: "alma", asset: "assets/characters/alma.gif",
        x: 54, y: 62, altura: 0.20, z: 0.6, oculto: true },

      /* o do balão: só está lá, lá no fundo do corredor. Pequeno porque
         está longe — é o tamanho que conta a distância. */
      { id: "balao", asset: "assets/characters/balao.gif",
        x: 76, y: 52, altura: 0.17, z: 0.28 },
    ],

    roteiro: {
      ritual: [
        { luz: { tremer: 1, duracao: 9000 }, som: "assets/sounds/tremor.mp3" },
        { esperar: 900 },
        { descer: { ator: "herobrine", de: -38, ate: 34, giros: 4, duracao: 5200 } },
        { clarear: { ate: 1, duracao: 5200 } },
        { esperar: 5400 },

        /* tudo branco: é AQUI que a troca acontece, sem ninguém ver */
        { sumir: ["herobrine", "cinza"] },
        { trocar: { amarelo: "assets/characters/amarelo.gif" } },
        { surgir: { amarelo: { x: 34, y: 60, altura: 0.22 },
                    alma:    { x: 54, y: 62, altura: 0.20 } } },
        { esperar: 600 },

        { clarear: { ate: 0, duracao: 3200 } },
        { sussurro: "ficou mais leve. e mais vazio." },
        { lembrar: "backrooms-ritual" },
      ],
    },

    /* na próxima vez que entrar, a sala já começa assim */
    seLembrado: {
      "backrooms-ritual": [
        { sumir: ["herobrine", "cinza"] },
        { trocar: { amarelo: "assets/characters/amarelo.gif" } },
        { surgir: { amarelo: { x: 34, y: 60, altura: 0.22 },
                    alma:    { x: 54, y: 62, altura: 0.20 } } },
      ],
    },
  },


  /* ═══════════════════════════════════════════════════════════════
     O CIRCO DIGITAL — esqueleto. O palco ainda é dele pra montar:
     é só soltar um `fundo` e ir empilhando atores. O armário já está
     funcionando, e a passagem inteira já acontece.
     ═══════════════════════════════════════════════════════════════ */
  circo: {
    descricao: "o palco ainda não foi montado",

    /* o Caine entra na diagonal do canto de baixo, o nome sai de trás dele,
       a cortina fecha GLITCHANDO, os olhos tomam a tela, e só então abre. */
    entrada: {
      tipo: "circo",
      caine: "assets/characters/caine.png",
      nome: "C A I N E",
      altura: 0.74,
      entradaMs: 2200,                        // ele andando pro meio
      olhos: "assets/effects/olhos.jpg",
      olhudo: "assets/characters/olhudo.png",
      olhosMs: 2600,
      pausaOlhos: 3600,                       // cortina fechada enquanto isso
    },

    // fundo: "assets/backgrounds/circo.jpg",   ← solte o seu aqui
    atores: [
      /* O ARMÁRIO. Clicar abre um pouco e fecha sozinho. Clicar de novo
         antes de fechar segura aberto — e é exatamente isso que acorda
         o que está dentro. 5 cliques dentro de 4s e você leva. */
      { id: "armario",
        asset: "assets/characters/armario-fechado.gif",
        x: 56, y: 30, altura: 0.46, z: 0.55,
        pontos: [
          { caixa: [10, 8, 80, 86],
            dica: "o armário",
            aguentar: {
              abre: "assets/characters/armario-aberto.gif",
              volta: 850,          // quanto ele demora pra fechar sozinho
              cliques: 5,          // quantos cliques seguidos até acordar
              janela: 4000,
              jumpscare: {
                asset: "assets/characters/cara.gif",
                duracao: 1100,
                som: "assets/sounds/susto.mp3",
              },
            } },
        ] },
    ],
  },

};
