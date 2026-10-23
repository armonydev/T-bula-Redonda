/* ═══════════════════════════════════════════════════════════════════
   eventos.config.js — É AQUI QUE VOCÊ MEXE.

   Cada segredo é um objeto declarativo. O motor (segredos.js) lê isto e
   monta a cena sozinho: aparição, câmera, luz, partículas, som, intrusão,
   saída, cooldown, raridade.

   Pra criar um segredo novo você NÃO escreve animação — você descreve o
   evento aqui e aponta pros arquivos em assets/.

   ── GATILHOS DISPONÍVEIS ──────────────────────────────────────────
   { tipo:"cliques",   alvo:"#id ou .classe", vezes:15, janela:9000 }
   { tipo:"teclas",    sequencia:"eco" }
   { tipo:"ocioso",    ms:75000 }
   { tipo:"comando",   palavra:"RED" }          ← terminal
   { tipo:"rolagem",   valor:20 }               ← saiu 20 natural
   { tipo:"aleatorio", chance:0.01 }            ← em qualquer interação
   { tipo:"fim-da-pagina" }                     ← rolou até o fim

   ── CENAS ─────────────────────────────────────────────────────────
   intrusao    entra pela borda, cortado pela tela
   atras       já estava lá; a interface fica translúcida
   atravessar  só passa andando e some
   roleta      a roda gira, desacelera, CLACK
   morador     NÃO entra: mora numa aba. Pra pose parada. (ver lá embaixo)

   ── RARIDADE ──────────────────────────────────────────────────────
   "normal" 1.00 · "alternate" .55 · "special" .22 · "strange" .07 · "secret" .02
   A raridade é um filtro EXTRA: mesmo batendo o gatilho, pode não vir.
   Use "normal" enquanto estiver testando. Morador ignora raridade — ele
   não é sorte, é mobília.
   ═══════════════════════════════════════════════════════════════════ */

window.SEGREDOS = [

  /* ───────────────────────── RED JOHN ─────────────────────────
     O carro-chefe. Clique repetido → o símbolo aparece sangrando
     num canto → ele fica clicável → ao clicar, a câmera perde o
     controle e o Jane invade pela lateral, cortado pela borda. */
  {
    id: "red_john",
    nome: "—",
    raridade: "normal",          // troque pra "secret" quando cansar de ver
    // o NOME do personagem. Parece que não é clicável — e é exatamente por
    // isso que funciona. (Antes era ".atr", mas clicar num atributo abre o
    // diálogo por cima: o 2º clique caía no véu e a conta nunca passava de 1.)
    gatilho: { tipo:"cliques", alvo:".quem h2", vezes:15, janela:12000 },

    aparicao: {
      asset: "assets/symbols/red-john.png",
      onde: "canto-superior-direito",   // canto-* | atras-do-retrato | aleatorio
      escala: 0.15,                      // fração da menor dimensão da tela
      entrada: "sangrar",                // sangrar | surgir | riscar
      opacidade: 0.82,
      clicavel: true,
      expiraEm: 14000,                   // some sozinho se ninguém clicar
      som: "assets/sounds/aparicao.mp3",
    },

    aoClicar: {
      camera:   { tremor: 1.5, zoom: 1.045, distorcao: 0.7, duracao: 5200 },
      luz:      { cor: "#8b0000", intensidade: 0.55, pulsar: true },
      particulas:{ tipo: "faisca", quantidade: 44, cor: "150,15,15", de: "simbolo" },
      corrupcao: 3,
      som: "assets/sounds/red-john.mp3",

      intrusao: {
        asset: "assets/characters/patrick-jane.png",
        lado: "direita",       // direita | esquerda | baixo | cima
        escala: 0.95,          // fração da altura da tela
        corte: 0.30,           // 30% dele fica FORA da tela
        entrada: "deslizar",   // deslizar | girar | surgir | varrer
        saida: "desvanecer",
        inclinacao: -2,        // graus
        atraso: 900,           // entra depois do tremor começar
        duracao: 4300,
      },
    },

    cooldown: 120000,
    umaVezSo: false,
  },

  /* ───────────────────────── FOXY ─────────────────────────
     Entra pela direita girando, cobre quase a tela toda, e só volta
     quando você aperta o botão de recolher que aparece junto. */
  {
    id: "foxy",
    raridade: "normal",
    gatilho: { tipo:"cliques", alvo:"#retrato", vezes:5, janela:6000 },
    aoDisparar: {
      camera: { tremor: 1.3, zoom: 1.02, duracao: 900 },   // sacode na entrada e PARA
      luz: { cor:"#ff5a3c", intensidade: 0.26 },
      som: "assets/sounds/correr.mp3",
      intrusao: {
        asset: "assets/characters/foxy.png",
        lado: "direita",
        escala: 1.9,           // bem maior que a tela…
        descer: 92,            // …e afundado 92vh: só os ombros pra cima aparecem
        corte: 0.16,
        entrada: "girar",
        giroEntrada: -34,
        inclinacao: -13,       // bem torto, de propósito
        entradaMs: 520,        // ele CHEGA rápido
        saida: "girar",
        duracao: 1900,         // e vai embora rápido. Tudo em menos de 2,5s.
      },
    },
    cooldown: 45000,
  },

  /* ───────────────────────── BILL CIPHER ─────────────────────────
     Não invade: ele já estava lá. Aparece ATRÁS da interface, enorme,
     e os painéis ficam translúcidos por alguns segundos. */
  {
    id: "bill",
    raridade: "normal",
    gatilho: { tipo:"teclas", sequencia:"bill" },
    aoDisparar: {
      camera: { tremor: 0.5, zoom: 0.97, distorcao: 1.1, duracao: 5000 },
      luz: { cor:"#ffd84a", intensidade: 0.45, pulsar: true },
      particulas: { tipo:"faisca", quantidade: 30, cor:"255,216,74", de:"centro" },
      corrupcao: 4,
      som: "assets/sounds/bill.mp3",
      atras: {
        asset: "assets/characters/bill.png",
        escala: 0.8,
        transparenciaDaUI: 0.32,   // a ficha fica translúcida pra ele aparecer por trás
        girar: 8,
        duracao: 5000,
      },
    },
    cooldown: 150000,
  },

  /* ───────────────────────── CAINE + A RODA ─────────────────────────
     É um número de palco. A roda surge de lado e vira em 3D até encarar
     a tela; o Caine sobe pela direita com os holofotes, como apresentador;
     a roda sai voando pela tela girando, volta pro lugar, desacelera,
     CLACK, dá o resultado; os dois vão embora — e SÓ ENTÃO o que saiu
     acontece de verdade. */
  {
    id: "caine",
    raridade: "normal",
    // SEGURAR o símbolo da Ressonância (a bolha do logo), 1,2s. Um anel de
    // ouro enche em volta enquanto você mantém. Soltar antes cancela.
    // Clique continua sendo das cortinas — segurar é outra coisa, no mesmo lugar.
    gatilho: { tipo:"segurar", alvo:".logo .bolha", ms:1200 },
    aoDisparar: {
      camera: { tremor: 0.5, zoom: 1.02, duracao: 10000 },
      luz: { cor:"#ff4fa3", intensidade: 0.34, pulsar: true },
      som: "assets/sounds/caine.mp3",
      roleta: {
        setores: ["RAZÃO","CIRCO DIGITAL","BACKROOMS","ECO","RUÍDO","SORTE"],

        // sem apresentador: a roda é o número inteiro, grande e no meio.
        // O Caine aparece só na passagem pro circo, que é onde ele mora.

        entrada: 1300,   // a roda virando em 3D até encarar a tela
        voo:     3400,   // o passeio dela pela tela
        giros:   6,      // quantas voltas no total
        duracao: 6400,   // do primeiro giro até parar de vez
        leitura: 2200,   // o resultado parado na tela antes de todo mundo sair
        som: "assets/sounds/clack.mp3",

        // alguns setores não são só uma palavra: eles abrem uma SALA.
        // Cada sala tem a PRÓPRIA passagem — ver js/cenarios.config.js.
        seCair: {
          "BACKROOMS":      { cenario: "backrooms" },
          "CIRCO DIGITAL":  { cenario: "circo" },
        },
      },
    },
    cooldown: 90000,
  },

  /* ═════════════════════ MORADORES ═════════════════════
     Estes dois não invadem — eles MORAM numa aba. A pose deles é parada,
     então nada de entrar deslizando: você abre a aba e eles estão lá, como se
     sempre tivessem estado. Sem gatilho, sem raridade, sem cooldown.

     Pra calibrar são três números: `x` e `y` são as bordas em px
     (NEGATIVO = pra fora do cartão) e `altura` é fração da altura da tela.

     telas: f-der · f-per · f-his · f-term · f-eco · f-itens
     cantos: baixo-esquerda · baixo-direita · cima-esquerda · cima-direita */

  /* ── SALLY FACE ── mora na História. Fica ali escutando. */
  {
    id: "sally",
    morador: {
      asset: "assets/characters/sally.gif",
      tela: "f-his",
      canto: "baixo-esquerda",
      altura: 0.22,              // fração da altura da tela
      x: -96, y: -6,             // bem pra fora: ela fica no chão, do lado do cartão
      inclinacao: -3,
      atras: true,               // o que passa por cima do cartão fica ATRÁS dele
      respirar: true,            // sobe 5px em 4,6s. Só pra não parecer adesivo
    },
  },

  /* ── BLASTOISE ── mora nos Itens, do lado da mochila.
     `HIDRO` no terminal não traz ele: abre a aba dele e ele pula no lugar. */
  {
    id: "blastoise",
    morador: {
      asset: "assets/characters/blastoise.gif",
      tela: "f-itens",
      canto: "baixo-direita",
      altura: 0.24,
      fora: "baixo",             // no chão, EMBAIXO do cartão — nunca por cima
      x: 24, y: 10,              // com `fora`, x e y são FOLGAS (px)
      atras: false,              // nada dele fica escondido
      respirar: false,           // o gif já se move sozinho
      reagir: {
        particulas: { tipo:"faisca", quantidade: 60, cor:"90,170,255" },
        camera: { tremor: 0.7, duracao: 900 },
        som: "assets/sounds/hidro.mp3",
      },
    },
  },
];

/* ═══════════════ CÓDIGOS DO TERMINAL ═══════════════
   Alguns disparam segredo, outros só respondem, e alguns mentem. */
window.CODIGOS = {
  ECHO:    { diz: "a câmara repete o que você não disse." },
  ECO:     { diz: "…eco.", estado: "eco" },
  VOID:    { diz: "não há nada aqui. continue.", estado: "vazio" },
  ERROR:   { diz: "ERRO: nenhum erro encontrado." },
  ROOM:    { diz: "a sala ainda não foi construída. volte depois." },
  HELP:    { diz: "não." },
  WHOAMI:  { diz: "você é quem está lendo isto." },
  DEBUG:   { diz: "modo depuração: já estava ligado." },
  RED:     { diz: "ele atende. não por esse nome, mas atende.", segredo: "red_john" },
  JANE:    { diz: "ele chega quando quiser.", segredo: "red_john" },
  CIRCUS:  { diz: "as cortinas abrem.", segredo: "caine" },
  CLOWN:   { diz: "qual deles?" },
  CAIN:    { diz: "quase. mas ele atende assim mesmo.", segredo: "caine" },
  CAINE:   { diz: "as cortinas abrem.", segredo: "caine" },
  HIDRO:   { diz: "…", morador: "blastoise" },
  SALLY:   { diz: "ela está onde sempre esteve." },
  BACKROOMS: { diz: "você já esteve aqui.", cenario: "backrooms" },
  CIRCO:   { diz: "o palco está sendo montado.", cenario: "circo" },
  BILL:    { diz: "ERA DE SE ESPERAR", segredo: "bill" },
  "???":   { diz: "exatamente." },
};
