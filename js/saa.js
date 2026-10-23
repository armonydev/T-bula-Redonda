/* ═══ saa.js — as regras do Saa, edição 26.1 ═══
   Fonte: o livro do Japê, Pedro Henrique e Luiz Fernando. Mesmo princípio
   do regras.js do Ressonância: nenhum número mora fora daqui.

   O Saa é bem mais enxuto que o Ressonância — três atributos, nenhuma DC
   e nenhuma rolagem de dano — então a ficha é outra coisa, e tem montador
   próprio em vez de tentar caber no mesmo formulário. */
window.SAA = (function(){
"use strict";

const EDICAO = "26.1";
const PONTOS_INICIAIS = 12;

const ATRIBUTOS = [
  { id:"CORPO",    nome:"Corpo",    cor:"#c2544f",
    cobre:"Força, destreza, constituição, percepção sensorial e a quantidade de Sangue.",
    recurso:"Sangue" },
  { id:"MENTE",    nome:"Mente",    cor:"#2fa5b8",
    cobre:"Inteligência, carisma, memória e capacidade de resolver problemas.",
    recurso:"Conhecimento" },
  { id:"ESPIRITO", nome:"Espírito", cor:"#6f8f5a",
    cobre:"Força espiritual, presença e a capacidade de canalizar os Elementos.",
    recurso:"Saa" },
];

/** A cada 2 pontos, +1 de modificador. 0-1=+0, 2-3=+1, 4-5=+2… */
const modificador = n => Math.floor((n || 0) / 2);

/* O modificador de cada atributo É o recurso correspondente. */
const sangueMaximo       = a => modificador(a.CORPO);
const conhecimentoMaximo = a => modificador(a.MENTE);
const saaMaximo          = a => modificador(a.ESPIRITO);

/** Quantos Estudos e quantas Técnicas cabem: ambos limitados por Conhecimento. */
const maxEstudos  = a => conhecimentoMaximo(a);
const maxTecnicas = a => conhecimentoMaximo(a);

const ESTUDO_INICIAL  = 1;   // todo Estudo novo entra com 1 ponto
const TECNICA_INICIAL = 1;   // toda Técnica nova entra com 1 ponto
const ESTUDOS_POR_TECNICA = 3;  // une 3 Estudos diferentes

/* ── A escada de dados ──
   Os Pontos Totais da ação dizem quais dados rolar. O livro lista até
   25-28 e diz que "a progressão segue infinitamente, mantendo o mesmo
   sistema". A tabela abaixo é a do livro, literal; acima dela a função
   continua o padrão em vez de inventar número. */
const ESCADA = [
  [1,4,"1d4"], [5,6,"1d6"], [7,8,"1d8"], [9,10,"1d10"], [11,12,"1d12"],
  [13,16,"1d12+1d4"], [17,18,"1d12+1d6"], [19,20,"1d12+1d8"], [21,22,"1d12+1d10"],
  [23,24,"2d12"], [25,28,"2d12+1d4"],
];
function dadosDe(pontos){
  const p = Math.max(1, Math.floor(pontos || 0));
  for(const [de, ate, d] of ESCADA) if(p >= de && p <= ate) return d;
  /* Acima da tabela: cada 12 pontos a mais acrescenta um d12, e o resto
     volta a percorrer a mesma escada. */
  const extras = Math.floor((p - 1) / 12);
  const resto  = p - extras * 12;
  const base   = ESCADA.find(([de,ate]) => resto >= de && resto <= ate);
  const cauda  = base ? base[2].replace(/^1d12\+?/, "") : "";
  return `${extras}d12` + (cauda ? "+" + cauda : "");
}

/** Pontos Totais de uma ação = modificador do atributo + pontos do Estudo
 *  (ou, numa Técnica, os 3 Estudos + os pontos da própria Técnica). */
const pontosDaAcao = (modAtributo, pontosEstudo) => (modAtributo||0) + (pontosEstudo||0);
const pontosDaTecnica = (modAtributo, pontosEstudos, pontosTecnica) =>
  (modAtributo||0) + (pontosEstudos||0) + (pontosTecnica||0);

const TIPOS_ITEM = [
  { id:"arma",        nome:"Arma",        nota:"Começa com 1 ponto. Sem saber usar, começa em 0 — e em 0 o Item não funciona." },
  { id:"ferramenta",  nome:"Ferramenta",  nota:"Funciona igual à Arma, mas feita pra um propósito específico." },
  { id:"vestimenta",  nome:"Vestimenta",  nota:"Protege do clima. Algumas são Armaduras e dão redução de dano." },
  { id:"comida",      nome:"Comida",      nota:"1 ingrediente = 1 ponto. 1 ponto recupera 1 de Sangue OU 1 de Saa, só em Descanso." },
  { id:"extra",       nome:"Extra",       nota:"O que não cabe em nenhuma das outras." },
];

const ELEMENTO_CUSTO = { transformar:{ sangue:1, saa:1 }, acao:{ saa:1 } };

/* Regras curtas que a mesa consulta, e que viram entradas de compêndio. */
const REGRAS_CURTAS = [
  ["Empate é do defensor", "Em caso de empate entre o acerto e a esquiva, o ataque não funciona."],
  ["Não existe rolagem de dano", "Só existe rolagem de acerto. Os pontos usados determinam o desempenho da ação."],
  ["Não existem Classes de Dificuldade", "O sucesso de um ataque sai da comparação entre o acerto do atacante e a esquiva do alvo."],
  ["Alvo inanimado", "Não precisa rolar acerto, a menos que esteja mais longe do que o alcance do corpo do personagem."],
  ["Sangue em 0", "O personagem morre."],
  ["Saa em 0", "O personagem fica incapaz de utilizar o Saa."],
  ["Dois Estudos ao mesmo tempo", "Impossível, exceto quando os dois fazem parte de uma mesma Técnica."],
  ["Evoluir dois Estudos ao mesmo tempo", "Impossível."],
  ["Cura", "Não existe outra mecânica de cura além da Comida, e só durante o Descanso."],
  ["Transformar Sangue em Elemento", "Custa 1 ponto de Sangue e 1 ponto de Saa. Cada ação que controla o Elemento custa mais 1 de Saa."],
  ["Controlar o próprio Sangue", "Um Saaísta não consegue. Ele controla o Elemento criado a partir dele."],
];

return { EDICAO, PONTOS_INICIAIS, ATRIBUTOS, modificador,
  sangueMaximo, conhecimentoMaximo, saaMaximo, maxEstudos, maxTecnicas,
  ESTUDO_INICIAL, TECNICA_INICIAL, ESTUDOS_POR_TECNICA,
  ESCADA, dadosDe, pontosDaAcao, pontosDaTecnica,
  TIPOS_ITEM, ELEMENTO_CUSTO, REGRAS_CURTAS };
})();
