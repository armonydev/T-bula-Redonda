/* ═══════════════════════════════════════════════════════════════════════
   fm.js — as regras de Feiticeiros & Maldições v2.5.2
   Sistema do Projeto Onigiri (Setsugiri e Parker), no universo de Jujutsu
   Kaisen, de Gege Akutami. Projeto de fã, gratuito.

   Tudo aqui foi lido do Livro de Regras v2.5.2 e conferido contra o
   "Modelo de Ficha v2.5" em Excel, que é a fonte das fórmulas. Onde o
   livro e a planilha divergem, vale o LIVRO, e o comentário diz onde.

   ⚠ Script clássico, não módulo — pelo mesmo motivo de regras.js e saa.js:
   script de módulo é adiado e rodaria depois dos clássicos da câmara.
   ═══════════════════════════════════════════════════════════════════════ */
window.FM = (function(){
"use strict";

/* ── atributos ──────────────────────────────────────────────────────── */
const ATRIBUTOS = [
  ["FOR","Força","Poder muscular e bruto. Dano de armas, força bruta, peso erguido, altura do salto."],
  ["DES","Destreza","Agilidade, reflexos e rapidez. Equilíbrio, esquiva, armas leves, acrobacias."],
  ["CON","Constituição","Resistência e vigor. Pontos de Vida, fortitude, fôlego, aguentar o cansaço."],
  ["INT","Inteligência","Raciocínio e intelecto. Aprendizado, assimilação de informação, rapidez da mente."],
  ["SAB","Sabedoria","Conhecimento pela experiência e ligação com o mundo. O quanto você percebe."],
  ["PRE","Presença","Força da personalidade. Influenciar com palavras, gestos, simpatia ou beleza."],
];

/* Modificador: +1 a cada 2 acima de 10, -1 a cada 2 abaixo.
   Math.floor resolve os dois lados de uma vez — 9 → floor(-0.5) = -1,
   que é exatamente o que a tabela do livro diz (8-9 → -1). */
const mod = v => Math.floor((Number(v||0) - 10) / 2);

/* Compra por pontos: 17 pontos, todos começam em 10, teto de 15.
   Os valores 8 e 9 DEVOLVEM pontos. A tabela é do livro, p.18. */
const CUSTO = { 8:-2, 9:-1, 10:0, 11:2, 12:3, 13:4, 14:5, 15:7 };
const PONTOS_COMPRA = 17;
const VALORES_FIXOS = [15,14,13,12,10,8];
const custoDe = v => (CUSTO[v] !== undefined ? CUSTO[v] : 0);
const gastoTotal = base => Object.values(base||{}).reduce((s,v)=>s+custoDe(v),0);

/* ── nível, maestria ────────────────────────────────────────────────── */
const NIVEL_MAX = 20;
/* Bônus de Treinamento (a maestria). Planilha: 1 + ARREDONDAR.PARA.CIMA(Nv/4) */
const treinamento = nv => 1 + Math.ceil(Math.max(1, nv||1) / 4);
const metadeNivel = nv => Math.floor(Math.max(1, nv||1) / 2);

/* ── origens ────────────────────────────────────────────────────────── */
const ORIGENS = [
  { id:"inato", nome:"Inato", resumo:"Nasceu com a afinidade e uma técnica própria, única no mundo.",
    exemplos:"Nobara Kugisaki, Kento Nanami",
    bonus:{ tipo:"2e1" },
    tracos:[
      ["Bônus em Atributo","Aumenta o valor de um atributo em 2 e o de outro em 1."],
      ["Talento Natural","Um Talento à sua escolha no 1° nível. Uma única vez a partir do 4°, pode escolher um talento adicional ao subir de nível."],
      ["Marca Registrada","Um Feitiço adicional, com o custo reduzido em 1 PE."],
    ] },
  { id:"herdado", nome:"Herdado", resumo:"A técnica veio da linhagem. Herdeiro de um dos clãs.",
    exemplos:"Megumi Fushiguro, Toge Inumaki",
    bonus:{ tipo:"cla" }, pedeCla:true,
    tracos:[
      ["Bônus em Atributo","Depende do clã escolhido."],
      ["Treinamentos de Clã","Cada clã concede treinamento ou maestria em perícias específicas."],
      ["Herança de Clã","Técnicas e capacidades herdadas da linhagem."],
    ] },
  { id:"derivado", nome:"Derivado", resumo:"A energia veio depois, de fonte alternativa e provavelmente não natural.",
    exemplos:"Yuuji Itadori, Junpei",
    bonus:{ tipo:"2e1" },
    tracos:[
      ["Bônus em Atributo","Aumenta o valor de um atributo em 2 e o de outro em 1."],
      ["Energia Antinatural","Uma Aptidão Amaldiçoada de Aura cujos requisitos você atenda. Como Ação Bônus, uma vez por dia, recupera PE igual ao dobro do bônus de treinamento."],
      ["Desenvolvimento Inesperado","A cada 4 níveis, um ponto de atributo adicional e +1 no limite daquele atributo."],
    ] },
  { id:"restringido", nome:"Restringido", resumo:"Energia quase nula. Em troca, um físico anormal e o manejo magistral de ferramentas.",
    exemplos:"Toji Fushiguro, Maki Zenin",
    bonus:{ tipo:"fisicos", fixo:{FOR:1,DES:1,CON:1}, extra:2, extraEm:["FOR","DES","CON"] },
    prendeEspec:"restringido",
    tracos:[
      ["Bônus em Atributo","+1 em Força, Destreza e Constituição, mais 2 pontos para distribuir entre os físicos."],
      ["Físico Abençoado","Deslocamento +3 m, imune a doenças mundanas, vantagem contra venenos e metade do bônus de treinamento em dados curados no descanso curto."],
      ["Ápice Corporal Humano","Limite 30 em Força, Destreza e Constituição. A cada 6 níveis, +2 em um deles. Dobra peso erguido e distância saltada."],
      ["Resiliência Imediata","Vezes igual ao bônus de treinamento, reduz um dano recebido em metade do nível (mín. 1) × 5, ou evita um desmembramento."],
    ] },
  { id:"feto", nome:"Feto Amaldiçoado Híbrido", resumo:"Metade humano, metade maldição. Anatomia própria e relação estranha com a energia reversa.",
    exemplos:"Choso",
    bonus:{ tipo:"2e1" },
    tracos:[
      ["Bônus em Atributo","Aumenta o valor de um atributo em 2 e o de outro em 1."],
      ["Herança Maldita","Cura por energia reversa cai pela metade. Com uma habilidade de cura reversa, pode tratá-la como energia amaldiçoada gastando 2 PE no lugar de 1 de reversa, curando o valor cheio."],
      ["Físico Amaldiçoado","Uma Característica de Anatomia. Outra a cada 5 níveis."],
      ["Vigor Maldito","Uma vez por descanso longo, Ação Bônus pra recuperar 5 + mod. de Constituição em PV. Usos adicionais nos níveis 4, 8 e 12."],
    ] },
  { id:"sem-tecnica", nome:"Sem Técnica", resumo:"Nenhuma técnica amaldiçoada. Só dedicação, perícia e ferramenta.",
    exemplos:"Kasumi Miwa, Atsuya Kusakabe",
    bonus:{ tipo:"livre", pontos:4, tetoPorAtributo:3 },
    semTecnica:true, proibeEspec:["esp-tecnica"],
    tracos:[
      ["Bônus em Atributo","4 pontos adicionais para distribuir, no máximo 3 no mesmo atributo."],
      ["Estudos Dedicados","Treinado em 2 perícias à sua escolha."],
      ["Empenho Implacável","Nv 1: um talento ou aptidão. Nv 3: +1 em 2 perícias e em um ataque ou TR. Nv 6: habilidade de especialização adicional. Nv 10, 13, 15, 17: segue a escada."],
    ] },
  { id:"mutante", nome:"Corpo Amaldiçoado Mutante", resumo:"Corpo criado, com consciência própria e vários núcleos.",
    exemplos:"Panda",
    bonus:{ tipo:"livre", pontos:2, tetoPorAtributo:2 },
    tracos:[
      ["Bônus em Atributo","2 pontos adicionais para distribuir."],
      ["Forma de Vida Sintética","Imune a dano venenoso e à condição envenenado. Não recebe efeito de refeições nem de itens do tipo Medicina."],
      ["Mutação Abrupta","Três núcleos, um deles o Primário. Trocar o núcleo ativo em combate é uma Ação Bônus."],
    ] },
];

const CLAS = [
  { id:"gojo",    nome:"Clã Gojo",    resumo:"A linhagem dos Seis Olhos e do Infinito." },
  { id:"inumaki", nome:"Clã Inumaki", resumo:"A Fala Amaldiçoada: a palavra que obriga." },
  { id:"kamo",    nome:"Clã Kamo",    resumo:"Manipulação do próprio sangue." },
  { id:"zenin",   nome:"Clã Zenin",   resumo:"Tradição marcial e técnicas de sombra." },
];

/* ── especializações ────────────────────────────────────────────────── */
/* pv: fixo no 1° nível · pvNivel: média oferecida nos seguintes (dá pra
   rolar o dado no lugar) · pe: por nível · peAtributo: soma o mod. do
   atributo de técnica uma única vez. */
const ESPECIALIZACOES = [
  { id:"lutador", nome:"Lutador", resumo:"O corpo é a arma. Rápido, destruidor e resistente.",
    exemplos:"Yuuji Itadori, Kinji Hakari, Hajime Kashimo",
    pv:12, pvNivel:6, dadoVida:"d10", pe:4, peAtributo:false,
    chave:["FOR","DES"],
    treinos:"Armas Simples, Armas Marciais e Escudo Leve. Um TR entre Fortitude ou Reflexos. Uma perícia de Ofício, Atletismo ou Acrobacia e outras três quaisquer.",
    pericias:{ n:4, de:["Atletismo","Acrobacia"], livres:3 },
    base:"Corpo Treinado — o corpo vira arma, e certas armas entram na luta corpo a corpo.",
    multiclasse:"Força ou Destreza 16." },
  { id:"esp-combate", nome:"Especialista em Combate", resumo:"Arma na mão e adaptação a qualquer situação do campo de batalha.",
    exemplos:"Kento Nanami, Yuta Okkotsu, Atsuya Kusakabe",
    pv:12, pvNivel:6, dadoVida:"d10", pe:4, peAtributo:false,
    chave:["FOR","DES","SAB"],
    treinos:"Todas as armas e escudos. Um TR entre Fortitude ou Reflexos. Duas perícias de Ofício, Atletismo ou Acrobacia e três outras quaisquer.",
    pericias:{ n:4, de:["Atletismo","Acrobacia"], livres:3 },
    base:"Repertório do Especialista — um estilo de combate (Defensivo, Arremessador, Duelista e outros) mais a Arte do Combate.",
    multiclasse:"Força ou Destreza 16." },
  { id:"esp-tecnica", nome:"Especialista em Técnica", resumo:"Domina os fundamentos do jujutsu e altera a própria técnica por dentro.",
    exemplos:"Satoru Gojo, Ryomen Sukuna",
    pv:10, pvNivel:5, dadoVida:"d8", pe:6, peAtributo:true,
    chave:["INT","SAB"],
    treinos:"Armas Simples e Armas a Distância. Um TR entre Astúcia ou Vontade. Duas perícias de Ofício, Feitiçaria, Ocultismo e duas outras quaisquer.",
    pericias:{ n:4, fixas:["Feitiçaria","Ocultismo"], livres:2 },
    base:"Domínio dos Fundamentos — duas Mudanças de Fundamento no 1° nível, outra no 12°.",
    multiclasse:"Inteligência ou Sabedoria 16." },
  { id:"controlador", nome:"Controlador", resumo:"Invocações. Shikigamis e corpos amaldiçoados dominando o campo.",
    exemplos:"Megumi Fushiguro, Kokichi Muta, Suguru Geto",
    pv:10, pvNivel:5, dadoVida:"d8", pe:5, peAtributo:true,
    chave:["PRE","SAB"],
    treinos:"Armas Simples e Armas a Distância. Um TR entre Astúcia ou Vontade. Uma perícia de Ofício, Percepção, Persuasão e outras duas quaisquer.",
    pericias:{ n:4, fixas:["Percepção","Persuasão"], livres:2 },
    base:"Treinamento em Controle — duas Invocações iniciais, mais uma nos níveis 3, 6, 9, 10, 12, 15 e 18.",
    multiclasse:"Presença ou Sabedoria 16." },
  { id:"suporte", nome:"Suporte", resumo:"Cura, amplia e administra o campo. Mestre da energia reversa.",
    exemplos:"Shoko Ieiri, Hana Kurusu, Kirara Hoshi",
    pv:10, pvNivel:5, dadoVida:"d8", pe:5, peAtributo:true,
    chave:["PRE","SAB"],
    treinos:"Armas Simples e Escudos. Um TR entre Astúcia ou Vontade. Duas perícias de Ofício, Medicina, Prestidigitação e outras três quaisquer.",
    pericias:{ n:5, fixas:["Medicina","Prestidigitação"], livres:3 },
    base:"Suporte em Combate — Apoiar como ação bônus e cura de 2d6 + mod. de Presença ou Sabedoria ao toque.",
    multiclasse:"Presença ou Sabedoria 16." },
  { id:"restringido", nome:"Restringido", resumo:"Sem energia amaldiçoada. Físico sobre-humano e ferramenta na mão.",
    exemplos:"Toji Fushiguro, Maki Zenin",
    pv:16, pvNivel:7, dadoVida:"d12", pe:0, peAtributo:false, semEnergia:true,
    chave:["FOR","DES","CON","INT","SAB","PRE"],
    treinos:"Todas as armas e escudos. TRs de Fortitude E Reflexos. Uma perícia de Ofício e outras quatro quaisquer, exceto Feitiçaria.",
    pericias:{ n:5, livres:5, proibidas:["Feitiçaria"] },
    base:"Restrito pelos Céus — soma Força ou Constituição na Defesa (limitado pelo nível), ferramenta de 4° grau, Arsenal Amaldiçoado e uma Dádiva do Céu a cada 4 níveis.",
    exigeOrigem:"restringido",
    multiclasse:"Restringidos não fazem multiclasse, nem para nem a partir." },
];

/* ── perícias ───────────────────────────────────────────────────────── */
const PERICIAS = [
  ["Atletismo","FOR"], ["Acrobacia","DES"], ["Furtividade","DES"], ["Prestidigitação","DES"],
  ["Feitiçaria","INT"], ["História","INT"], ["Investigação","INT"], ["Ofício","INT"],
  ["Tecnologia","INT"], ["Teologia","INT"],
  ["Direção","SAB"], ["Intuição","SAB"], ["Medicina","SAB"], ["Ocultismo","SAB"],
  ["Percepção","SAB"], ["Sobrevivência","SAB"],
  ["Enganação","PRE"], ["Intimidação","PRE"], ["Performance","PRE"], ["Persuasão","PRE"],
];
const RESISTENCIAS = [
  ["Astúcia","INT","Resistir a enganação, ilusão e truque mental."],
  ["Fortitude","CON","Resistir a veneno, doença, dor e ao que ataca o corpo."],
  ["Integridade","CON","Resistir ao que ataca a alma, não o corpo."],
  ["Reflexos","DES","Sair da área a tempo."],
  ["Vontade","SAB","Resistir a medo, controle e ao que ataca a cabeça."],
];

/* ── valores derivados ──────────────────────────────────────────────── */
function espPorId(id){ return ESPECIALIZACOES.find(e=>e.id===id) || null; }
function origemPorId(id){ return ORIGENS.find(o=>o.id===id) || null; }

/* PV = base da Especialização + mod.CON, e em cada nível acima do 1° soma
   de novo o valor por nível + mod.CON. O mod. de CON é retroativo: se ele
   sobe, o total sobe desde o 1° nível — por isso a conta é multiplicada,
   e não guardada nível a nível. */
function pvMaximo(atr, espId, nivel){
  const e = espPorId(espId); if(!e) return 0;
  const c = mod(atr.CON), nv = Math.max(1, nivel||1);
  return e.pv + c + (nv - 1) * (e.pvNivel + c);
}
/* Integridade da Alma é igual ao PV máximo. Está no livro, p.20.
   (A planilha inverte os dois campos; vale o livro.) */
const integridade = (atr, espId, nivel) => pvMaximo(atr, espId, nivel);

function peMaximo(atr, espId, nivel, atrTecnica){
  const e = espPorId(espId); if(!e || e.semEnergia) return 0;
  const nv = Math.max(1, nivel||1);
  return e.pe * nv + (e.peAtributo && atrTecnica ? mod(atr[atrTecnica]) : 0);
}
const defesa      = (atr, nivel, outros) => 10 + mod(atr.DES) + metadeNivel(nivel) + (outros||0);
const iniciativa  = atr => mod(atr.DES);
const deslocamento= (origemId) => 9 + (origemId === "restringido" ? 3 : 0);
const limiteCarga = atr => mod(atr.FOR) * 2 + 8;

/* Perícia, TR e ataque usam a mesma escada:
   metade do nível + modificador + (treinado ? maestria : 0),
   e mestre vale maestria × 1,5, arredondado pra baixo no fim. */
function bonusPericia(atr, chave, nivel, grau, outros){
  const m = mod(atr[chave] || 10), t = treinamento(nivel);
  const miolo = grau === "mestre" ? m + t * 1.5 : grau === "treinado" ? m + t : m;
  return metadeNivel(nivel) + Math.floor(miolo) + (outros||0);
}
const atencao = (atr, nivel, grauPercep) => 10 + bonusPericia(atr, "SAB", nivel, grauPercep);
const cdDe    = (atr, chave, nivel) => 10 + mod(atr[chave]||10) + treinamento(nivel) + metadeNivel(nivel);

/* ── referência de mesa ─────────────────────────────────────────────── */
const DIFICULDADES = [["Fácil",10],["Média",15],["Difícil",20],["Muito Difícil",30],["Lendário",40],["Quase Impossível",50]];
const GRAUS = ["Quarto Grau","Terceiro Grau","Semi-Segundo Grau","Segundo Grau","Semi-Primeiro Grau","Primeiro Grau","Primeiro Grau Especial","Grau Especial"];
const APTIDOES = [
  ["Aura","O que vaza de você. Pressão, detecção e o que a energia faz só por estar ali."],
  ["Controle e Leitura","Economia e precisão: ler a energia alheia e medir a sua."],
  ["Barreira","Véus, muros e o que separa um espaço do mundo."],
  ["Domínio","A expansão: o território onde a sua regra vale."],
  ["Energia Reversa","A energia invertida. Cura, e no outro sentido, destrói maldição."],
];
const TREINAMENTOS = [
  ["Treino de Agilidade","Crítico em TR de Reflexos 2 mais fácil, Deslocamento +4,5 m."],
  ["Treino de Barreiras","Toda parede de Barreira recebe RD igual ao seu Nível de Aptidão em Barreiras."],
  ["Treino de Compreensão","Aumenta em 1 um Nível de Aptidão à sua escolha."],
  ["Controle de Energia","No começo de toda rodada de combate, PE temporário igual a metade do bônus de maestria."],
  ["Treino de Domínios","Recebe a aptidão Modificação Completa."],
  ["Energia Reversa","Regeneração Aprimorada cura a exaustão de técnica em 1 turno por 2 pontos de reversa."],
  ["Treino de Luta","Crítico em desarmado, e uma rolagem de Luta com vantagem por rodada."],
  ["Manejo de Arma","A arma escolhida ganha uma propriedade de ferramenta amaldiçoada a mais."],
  ["Treino de Perícia","Resultado menor que 5 no d20 daquela perícia pode ser rolado de novo."],
  ["Potencial Físico","No começo de toda rodada, recupera vigor igual a metade do bônus de maestria."],
  ["Treino de Resistência","Crítico em Fortitude 2 mais fácil, ignora a 1ª falha em teste de morte por cena, +10 PV máximo."],
];
const CONDICOES = [
  ["Condenado","Física","Toda habilidade sua custa +1 PE."],
  ["Engasgando","Física","Fica mudo e precisa segurar o ar."],
  ["Enjoado","Física","Não pode converter ações na Hierarquia de Ações."],
  ["Envenenado","Física","-2 em ataque, TR e perícia enquanto durar."],
  ["Sangramento","Física","Perde vida no início do turno; TR de Fortitude no fim dele pra encerrar."],
  ["Sofrendo","Física","-5 em concentração e em Prestidigitação pra ritual, -3 m de movimento."],
  ["Atordoado","Incapacitação","Fica desprevenido e não realiza ações nem reações."],
  ["Inconsciente","Incapacitação","Cai, larga tudo, falha em Reflexos, e todo ataque contra você acerta como crítico."],
  ["Paralisado","Incapacitação","Só ações mentais. -10 de Defesa, falha em Reflexos, crítico em todo corpo a corpo."],
  ["Indefeso","Incapacitação","Imóvel e atordoado. Ao alcance de toque, uma ação completa mata ou causa Ferimento Complexo."],
  ["Abalado","Mental","-1 em ataque e perícia."],
  ["Amedrontado","Mental","-3 em ataque e perícia. É a evolução de Abalado, não acumula."],
  ["Aterrorizado","Mental","Não pode se aproximar voluntariamente de quem causou."],
  ["Confuso","Mental","Se move em direção aleatória a cada 1,5 m e -4 pra se manter de pé."],
  ["Enfeitiçado","Mental","-2 em todo teste contra quem enfeitiçou."],
  ["Agarrado","Movimento","Desprevenido e imóvel. Tiro à distância tem 50% de pegar o alvo errado."],
  ["Caído","Movimento","-3 em corpo a corpo, 4,5 m rastejando, -3 de Defesa perto e +3 de longe."],
  ["Enredado","Movimento","Metade do deslocamento, -2 de Defesa e de ataque."],
  ["Imóvel","Movimento","Não anda, não se esgueira, não levanta, não pula. Não recebe Deslocamento de fonte nenhuma."],
  ["Lento","Movimento","Toda forma de movimento cai pela metade."],
  ["Cego","Sensorial","Surpreso e lento, falha em teste de visão, -5 em Percepção, alvos com Camuflagem Total."],
  ["Desorientado","Sensorial","Sem reação contra a próxima ação ofensiva. Encerra depois disso."],
  ["Desprevenido","Sensorial","-3 na Defesa e em Reflexos."],
  ["Invisível","Sensorial","Não pode ser visto, +10 em Furtividade, Esconder vira Ação Livre."],
  ["Surdo","Sensorial","Falha em teste de audição e -5 em Iniciativa, inclusive no valor já rolado."],
  ["Surpreso","Sensorial","Desprevenido e sem reação contra quem o surpreendeu."],
  ["Exposto","Vulnerabilidade","Ataques contra você recebem +4 e causam dano extra igual ao nível do atacante."],
  ["Fragilizado","Vulnerabilidade","RD a zero e resistências anuladas. Imunidades continuam."],
];

return {
  ATRIBUTOS, mod, CUSTO, PONTOS_COMPRA, VALORES_FIXOS, custoDe, gastoTotal,
  NIVEL_MAX, treinamento, metadeNivel,
  ORIGENS, CLAS, ESPECIALIZACOES, PERICIAS, RESISTENCIAS,
  espPorId, origemPorId,
  pvMaximo, integridade, peMaximo, defesa, iniciativa, deslocamento, limiteCarga,
  bonusPericia, atencao, cdDe,
  DIFICULDADES, GRAUS, APTIDOES, TREINAMENTOS, CONDICOES,
};
})();
