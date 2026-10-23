/* ═══════════════════════════════════════════════════════════════════════
   regras.js — A FONTE ÚNICA DA MATEMÁTICA E DAS LISTAS FECHADAS
   Ressonância RPG, edição 26.1.

   Script CLÁSSICO de propósito: a Câmara de Eco e o Criador de Ficha
   carregam este MESMO arquivo, do mesmo jeito. Se virasse módulo ES, a
   ordem de execução quebraria a câmara (módulo roda depois de script
   comum), e aí existiriam duas fontes de número — que é exatamente o que
   este arquivo existe pra impedir.

   Tudo fica em window.RSS.R. O window.RSS.REGRAS antigo continua valendo,
   apontando pra cá, pra ficha.js da câmara não precisar mudar.

   ⚠ OS `id` SÃO CHAVE DE PERSISTÊNCIA. Mudar um id quebra toda ficha já
   salva. Pra renomear, muda só o `nome` — nunca o `id`. É por isso que a
   Classe Perito ainda tem id "andarilho".
   ═══════════════════════════════════════════════════════════════════════ */
window.RSS = window.RSS || {};
(function(){
"use strict";
/* ═══════════════════════════════════════════════════════════════════════
   regras.js — A FONTE ÚNICA DA MATEMÁTICA E DAS LISTAS FECHADAS
   Ressonância RPG, edição 26.1.

   Nenhum outro arquivo deste projeto inventa número nem lista. Mudou a
   regra no livro? Muda aqui, e a interface inteira acompanha.

   ⚠ OS `id` SÃO CHAVE DE PERSISTÊNCIA. Mudar um `id` quebra toda ficha já
   salva. Pra renomear qualquer coisa, muda só o `nome` — nunca o `id`.
   É por isso que a classe Perito ainda tem id "andarilho".
   ═══════════════════════════════════════════════════════════════════════ */
const EDICAO = "26.1";

/* ───────────────────────── atributos e derivados ───────────────────── */
const ATRIBUTOS = [
  { id:"FOR",   nome:"Força",         cor:"#ff9057" },
  { id:"DES",   nome:"Destreza",      cor:"#7ddc96" },
  { id:"CON",   nome:"Constituição",  cor:"#ff5a7a" },
  { id:"INT",   nome:"Inteligência",  cor:"#bb8cff" },
  { id:"CARGA", nome:"Carga",         cor:"#56d6ea" },
  { id:"CAR",   nome:"Carisma",       cor:"#ffc857" },
];

const PONTOS_ATRIBUTO_CRIACAO = 34;
const ATRIBUTO_MIN = 1;
const ATRIBUTO_TETO_BASE = 20;

/** Teto de atributo: 20 na criação, +3 a cada 3 Níveis, num atributo só. */
const tetoAtributo = (vezesEstourado = 0) =>
  ATRIBUTO_TETO_BASE + vezesEstourado * 3;

const somaAtributos = a =>
  ATRIBUTOS.reduce((s, { id }) => s + (a[id] || 0), 0);

/* Vida do Bastião é a única que olha o Nível: +2 por Nível, acumulativo. */
const vidaMaxima = (a, classeId = null, nivel = 1) =>
  10 + a.CON * 4 + (classeId === "bastiao" ? 2 * nivel : 0);

/* Ressonante soma +2 DEPOIS da fórmula. */
const reservaMaxima = (a, classeId = null) =>
  (a.INT + a.CARGA) * 2 + (classeId === "ressonante" ? 2 : 0);

const limitePorAcao   = a => a.CARGA;
const estouroMaximo   = a => Math.ceil(a.CARGA / 2);
const defesaPassiva   = a => 10 + a.CON;
const defesaAtiva     = (a, carga) => defesaPassiva(a) + carga;
const pesoMaximo      = (a, mochilas = 0) => a.FOR * 2 + mochilas;
const reducaoDeDano   = a => Math.floor(a.CON / 2);
const iniciativa      = a => `1d20 + ${a.DES}`;

/** Fadiga igual ao atributo Carga = Debilitado na hora, sem teste. */
const fadigaParaDebilitar = a => a.CARGA;

/* ───────────────────────── orçamentos ──────────────────────────────── */
const pontosDeConcepcao = nivel => 2 + nivel;
const pontosDeTrilha    = nivel => 1 + Math.floor(nivel / 4);
const tetoDeLastro      = rankDeTrilha => 2 + Math.max(0, rankDeTrilha - 1);

/** Carga para repartir entre Acerto e Dano — o Custo Base sai de DENTRO. */
const cargaParaRepartir = (a, custoBase) => limitePorAcao(a) - custoBase;

/** Teto absoluto: nenhuma Aplicação de Eco passa de 6 de Dano Base. */
const TETO_DANO_BASE_ECO = 6;

/* ───────────────────────── perícias ────────────────────────────────── */
const GRAUS = [
  { id:"destreinado",  nome:"Destreinado",  custo:0,  bonus:0 },
  { id:"treinado",     nome:"Treinado",     custo:1,  bonus:2 },
  { id:"adepto",       nome:"Adepto",       custo:3,  bonus:3 },
  { id:"especialista", nome:"Especialista", custo:6,  bonus:4 },
  { id:"mestre",       nome:"Mestre",       custo:10, bonus:5 },
];

/** Custo ACUMULADO: subir de grau paga só a diferença. */
const custoDoGrau = (de, para) => GRAUS[para].custo - GRAUS[de].custo;

/** O Nível não dá bônus — só limita até que grau dá pra comprar. */
const grauMaximoPorNivel = nivel =>
  nivel >= 16 ? 4 : nivel >= 11 ? 3 : nivel >= 6 ? 2 : 1;

const PERICIAS = [
  { id:"atletismo",     nome:"Atletismo",     attr:"FOR",   cobre:"Correr, saltar, escalar, nadar sob esforço, forçar portas" },
  { id:"luta",          nome:"Luta",          attr:"FOR",   cobre:"Combate corpo a corpo sem Eco" },
  { id:"acrobacia",     nome:"Acrobacia",     attr:"DES",   cobre:"Equilíbrio, esquiva acrobática, contorcionismo" },
  { id:"furtividade",   nome:"Furtividade",   attr:"DES",   cobre:"Esconder-se, mover-se sem ser notado" },
  { id:"pontaria",      nome:"Pontaria",      attr:"DES",   cobre:"Ataques à distância sem Eco" },
  { id:"fortitude",     nome:"Fortitude",     attr:"CON",   cobre:"Resistir veneno, doença, exaustão, fome" },
  { id:"sobrevivencia", nome:"Sobrevivência", attr:"CON",   cobre:"Orientar-se, rastrear, aguentar condições adversas" },
  { id:"investigacao",  nome:"Investigação",  attr:"INT",   cobre:"Examinar pistas, deduzir, achar detalhes escondidos" },
  { id:"ocultismo",     nome:"Ocultismo",     attr:"INT",   cobre:"Conhecimento sobre Ressonância, Ecos, Pactos, lore" },
  { id:"tatica",        nome:"Tática",        attr:"INT",   cobre:"Ler um combate, prever movimento, planejar cerco" },
  { id:"percepcao",     nome:"Percepção",     attr:"INT",   cobre:"Notar o que está fora do lugar, sentir Ressonância ao redor" },
  { id:"concentracao",  nome:"Concentração",  attr:"CARGA", cobre:"Manter um efeito sob pressão, resistir a ser interrompido" },
  { id:"diplomacia",    nome:"Diplomacia",    attr:"CAR",   cobre:"Negociar, persuadir, pedir favor" },
  { id:"enganacao",     nome:"Enganação",     attr:"CAR",   cobre:"Mentir, blefar, disfarçar intenção" },
  { id:"intimidacao",   nome:"Intimidação",   attr:"CAR",   cobre:"Ameaçar, impor presença, forçar reação por medo" },
];

const bonusDePericia = (a, pericia, grauIndice) =>
  (a[pericia.attr] || 0) + GRAUS[grauIndice].bonus;

/* ───────────────────────── classes ─────────────────────────────────── */
const CLASSES = [
  {
    id:"bastiao", nome:"Bastião",
    pergunta:"Encosta, aguenta e bate.",
    foco:"Força, Constituição, Destreza",
    pontosPericia:2,
    bonus:"+1 em Dano Físico, uma vez, e +2 em Vida Máxima a cada Nível (acumulativo).",
    nivel1:"Fôlego de Combate — 1×/combate, ação bônus, recupera 2 × Constituição de Vida.",
    nivel5:"Golpe Decisivo — 1×/combate, gasta a Ação Principal inteira para causar Dano em dobro no próximo Acerto que conectar.",
  },
  {
    id:"ressonante", nome:"Ressonante",
    pergunta:"Canaliza o Eco, com o maior leque de opções.",
    foco:"Inteligência, Carga",
    pontosPericia:2, bonusCarga:1,
    bonus:"+2 na Reserva Máxima (somados depois da fórmula) e o atributo Carga começa 1 ponto acima do normal.",
    nivel1:"Estudo do Eco — 1 Ação identifica o Vetor/tipo de Eco de um alvo observado.",
    nivel5:"Segunda Canalização — 1×/combate investe Carga em duas rolagens diferentes na mesma rodada, cada uma com o Limite por Ação inteiro.",
  },
  {
    // ⚠ id "andarilho" é chave de persistência. O nome mudou pra Perito no 26.1; o id NÃO muda.
    id:"andarilho", nome:"Perito",
    pergunta:"Resolve sem bater: investiga, convence, contorna.",
    foco:"Destreza, Carisma, Inteligência",
    pontosPericia:6,
    bonus:"2 dos Pontos de Perícia só gastam em perícias de Carisma ou Inteligência; vantagem em testes de percepção sobre presença de Devaneio.",
    nivel1:"Leitura de Cena — 1×/cena, pede ao Mestre uma pista extra sobre o ambiente ou um NPC.",
    nivel5:"Contato — possui um NPC recorrente acionável por cena.",
  },
];

/* ───────────────────────── origens ─────────────────────────────────── */
const PONTOS_PERICIA_DA_ORIGEM = 2;

const ORIGENS = [
  { id:"desperto-recente", nome:"Desperto Recente",
    quando:"O poder apareceu nele, sem explicação e sem ninguém antes. Acordou assim semana passada.",
    bonus:"+2 pontos de atributo à escolha", escolheAtributo:2,
    marca:"Vantagem em Iniciativa na 1ª rodada contra algo ligado a Devaneio." },
  { id:"herdeiro", nome:"Herdeiro",
    quando:"O poder vem de antes dele: família, casa, sobrenome. Alguém já teve, e alguém ensinou.",
    bonus:"+1 em Carga e +1 no atributo da linhagem", fixo:{ CARGA:1 }, escolheAtributo:1,
    marca:"Acesso a uma variante herdada de uma técnica ancestral." },
  { id:"zona-de-devaneio", nome:"Nascido numa Zona de Devaneio",
    quando:"Cresceu dentro do fenômeno. Pra ele isso é paisagem, não é notícia.",
    bonus:"+2 em Constituição ou Carisma", escolheEntre:["CON","CAR"], escolheQuanto:2,
    obrigacao:"Desconexão — você não entende uma coisa do mundo moderno que todo mundo entende. Escolha qual; Desvantagem em qualquer teste que dependa dela, e isso não melhora com o Nível.",
    marca:"Resistência a um risco comum da zona de origem." },
  { id:"sobrevivente-pacto-maldicao", nome:"Sobrevivente de Pacto/Maldição",
    quando:"O poder foi negociado ou imposto, e a conta ainda está aberta.",
    bonus:"+2 em Carga, −1 em Carisma", fixo:{ CARGA:2, CAR:-1 },
    obrigacao:"Cláusula — uma coisa que você não pode fazer. Fez, o seu poder cala por uma cena inteira, e a entidade fica sabendo.",
    marca:"1×/sessão negocia com a entidade, convertendo uma violação em benefício." },
  { id:"manifestacao", nome:"Manifestação (Eco sem portador)",
    quando:"Ele é o Eco. Não tem corpo de origem.",
    bonus:"Imune a dano que não leve Carga investida",
    obrigacao:"Âncora obrigatória — um objeto pessoal ou uma relíquia, à sua escolha; o que fizerem com ela, fazem com você. E Vulnerabilidade Espiritual: dano com Carga te acerta com +2 por ponto de Carga investido.",
    marca:"1×/sessão ignora a Vulnerabilidade Espiritual num ataque." },
  { id:"devoto", nome:"Devoto",
    quando:"O poder vem de uma fé que ele pratica, não de si mesmo.",
    bonus:"Acesso ao Milagre — um efeito de Bênção de Tier Menor sem gastar Carga, 1× por Descanso Longo",
    obrigacao:"Se você quebrou uma regra da sua própria fé nesta sessão, o Milagre não funciona. Quem decide é o Mestre, e ele avisa depois de você tentar.",
    marca:"Mais usos de Milagre por Descanso Longo." },
];

/* ───────────────────────── trilhas ─────────────────────────────────── */
/** Ranks em 1, 6, 11, 16 e 20. */
const rankDeTrilhaPorNivel = nivel =>
  nivel >= 20 ? 5 : nivel >= 16 ? 4 : nivel >= 11 ? 3 : nivel >= 6 ? 2 : 1;

const TRILHAS = [
  { id:"espadachim-ritualista", nome:"Espadachim Ritualista", classe:["ressonante"], cargaMin:4,
    conceito:"Combate corpo a corpo canalizado por Inteligência através de um objeto — a arma carrega o poder, não a pessoa." },
  { id:"metamorfose", nome:"Metamorfose", classe:["bastiao","ressonante"], cargaMin:6,
    conceito:"Transformação corporal ativa por Carga; a Carga vira atributo físico temporário." },
  { id:"canalizacao", nome:"Canalização", classe:["ressonante"], cargaMin:3,
    conceito:"Efeito pontual investido numa única rolagem, sem manter uma manifestação ativa." },
  { id:"vinculo-com-objeto", nome:"Vínculo com Objeto", classe:null, cargaMin:0,
    conceito:"Um item específico carrega Vínculo Ecoado permanente, crescendo junto com o personagem." },
  { id:"forjador", nome:"Forjador", classe:null, cargaMin:5,
    conceito:"Cria e ativa Objetos Ecoados a partir de itens comuns." },
  { id:"suporte", nome:"Suporte / Buffer", classe:null, cargaMin:3,
    conceito:"Concede bônus temporários a aliados em vez de dano direto." },
  { id:"amaldicoador", nome:"Amaldiçoador", classe:["ressonante"], cargaMin:6,
    conceito:"Impõe Condições e efeitos de Maldição a inimigos." },
  { id:"vinculo-amplo", nome:"Vínculo Amplo", classe:null, cargaMin:8,
    conceito:"Controla múltiplos Fragmentos/reservatórios menores simultaneamente." },
  { id:"mago", nome:"Mago", classe:["ressonante"], cargaMin:7,
    conceito:"Vários Espíritos Menores com contratos leves, em vez de um único Eco pessoal coerente." },
  { id:"ritualista", nome:"Ritualista", classe:null, cargaMin:4,
    conceito:"Conduz Rituais: conta como várias Vozes sozinho e enxerga Escala e Peso de um Ritual alheio." },
  { id:"andarilho-t", nome:"Andarilho", classe:["andarilho"], cargaMin:0,
    conceito:"Trilha do Perito: movimento, rota e o que se atravessa. Não gasta Carga em Rank nenhum." },
  { id:"investigador", nome:"Investigador", classe:["andarilho"], cargaMin:0,
    conceito:"Trilha do Perito: pista, dedução e o que estava escondido. Não gasta Carga em Rank nenhum." },
  { id:"artifice", nome:"Artífice", classe:["andarilho"], cargaMin:0,
    conceito:"Trilha do Perito: ferramenta, conserto e improviso material. Não gasta Carga em Rank nenhum." },
  { id:"furia", nome:"Fúria", classe:["bastiao"], cargaMin:0,
    conceito:"Trilha de combate: ganha um Escalonamento de graça em cima da Vida perdida." },
  { id:"punho-ressonante", nome:"Punho Ressonante", classe:["bastiao"], cargaMin:0,
    conceito:"Trilha de combate corpo a corpo com Carga investida no próprio corpo." },
  { id:"golpe-certeiro", nome:"Golpe Certeiro", classe:["bastiao","andarilho"], cargaMin:0,
    conceito:"Trilha de precisão: menos golpes, cada um valendo mais." },
  { id:"inspiracao", nome:"Inspiração", classe:["andarilho"], cargaMin:0,
    conceito:"Trilha de liderança: o que você dá aos outros vale mais que o que você faz sozinho." },
];

/** A trilha é de outra Classe? Custa 2 Pontos de Concepção permanentes a partir do Nível 6. */
const custoDeTrilhaForaDaClasse = (trilha, classeId, nivel) =>
  (trilha.classe && !trilha.classe.includes(classeId) && nivel >= 6) ? 2 : 0;

/** Faltar exatamente 1 de Carga não tranca: custa 1 Ponto de Concepção a mais. */
function checarCargaDeTrilha(trilha, carga) {
  const falta = trilha.cargaMin - carga;
  if (falta <= 0) return { ok:true,  custoExtra:0 };
  if (falta === 1) return { ok:true,  custoExtra:1, aviso:`Falta 1 de Carga para ${trilha.nome} — custa 1 Ponto de Concepção a mais.` };
  return { ok:false, custoExtra:0, erro:`${trilha.nome} pede Carga ${trilha.cargaMin}; você tem ${carga}.` };
}

/* ───────────────────────── aplicações ──────────────────────────────── */
/* As 23 da lista fechada. custoBase é a Carga mínima pra ligar; sai de
   DENTRO do Limite por Ação. Toda Aplicação custa 1 Ponto de Concepção. */
const CUSTO_CONCEPCAO_APLICACAO = 1;
const CUSTO_CONCEPCAO_REFORCO   = 1;
const APLICACOES_MIN = 2;
const APLICACOES_MAX = 4;

const APLICACOES = [
  { id:"dano-direto", nome:"Dano Direto", custoBase:1, danoBase:3, duracao:"instantâneo",
    faz:"Ataca um alvo usando a Carga investida." },
  { id:"alteracao-atributo", nome:"Alteração de Atributo Próprio", custoBase:2, danoBase:null, duracao:"1 rodada",
    faz:"Muda temporariamente Força, Destreza ou Constituição do usuário." },
  { id:"controle-debuff", nome:"Controle/Debuff em Alvo", custoBase:2, danoBase:null, duracao:"1 rodada",
    faz:"Reduz a Defesa Passiva ou penaliza uma rolagem específica do alvo." },
  { id:"deteccao", nome:"Detecção/Utilidade", custoBase:1, danoBase:null, duracao:"instantâneo",
    faz:"Acha, identifica ou percebe algo ligado ao Conceito. Alcance 10m + 10m por Carga além do Custo Base." },
  { id:"deslocamento", nome:"Deslocamento", custoBase:1, danoBase:null, duracao:"instantâneo",
    faz:"Move o usuário por uma distância curta. Ação Bônus. 10m + 5m por Carga além do Custo Base." },
  { id:"terreno", nome:"Terreno/Obstáculo", custoBase:2, danoBase:null, duracao:"1 cena",
    faz:"Cria ou altera um elemento do cenário. Não causa dano." },
  { id:"controle-corporal", nome:"Controle Corporal Alheio", custoBase:2, danoBase:null, duracao:"1 rodada",
    faz:"Restringe o movimento ou a ação de um alvo." },
  { id:"invocacao", nome:"Invocação de Aliado", custoBase:3, danoBase:null, duracao:"1 cena",
    faz:"Convoca um companheiro com três números tirados de você e um Traço." },
  { id:"suporte-cura", nome:"Suporte/Cura em Aliado", custoBase:2, danoBase:null, duracao:"instantâneo",
    faz:"Aplica um efeito benéfico em outra pessoa em vez de em si mesmo." },
  { id:"ilusao", nome:"Ilusão", custoBase:2, danoBase:null, duracao:"1 cena",
    faz:"Cria uma imagem, som ou presença falsa. Não causa dano." },
  { id:"interferencia-mental", nome:"Interferência Mental", custoBase:3, danoBase:null, duracao:"1 rodada",
    faz:"Mexe na percepção ou na decisão de um alvo, por uma rodada." },
  { id:"dominio-maquina", nome:"Domínio de Máquina", custoBase:2, danoBase:null, duracao:"1 cena",
    faz:"Comanda um dispositivo ou mecanismo." },
  { id:"penetracao", nome:"Penetração", custoBase:1, danoBase:null, duracao:"na ação",
    faz:"Ignora parte da redução ou da cobertura do alvo." },
  { id:"troca", nome:"Troca", custoBase:0, danoBase:null, duracao:"na ação",
    faz:"Troca de lugar, de alvo ou de recurso dentro da própria ação." },
  { id:"escalonamento", nome:"Escalonamento", custoBase:0, danoBase:null, duracao:"enquanto o número contar",
    faz:"Converte um número que a mesa já conta em bônus crescente. O Teto é a exceção declarada à regra de 1 Ponto, 1 Aplicação." },
  { id:"efeito-passivo", nome:"Efeito Passivo", custoBase:0, danoBase:null, duracao:"sempre ligado",
    faz:"Um efeito sempre ligado, que não precisa ser ativado nem recebe Carga." },
  { id:"modo", nome:"Modo", custoBase:1, danoBase:null, duracao:"até trocar de novo",
    faz:"Dois lados: um melhora, o outro piora. 1 de Carga pra trocar de lado." },
  { id:"transformacao", nome:"Transformação", custoBase:4, danoBase:null, duracao:"1 cena",
    faz:"Vira outra forma, redistribuindo os atributos. Aceita Repertório." },
  { id:"consumo", nome:"Consumo", custoBase:0, danoBase:null, duracao:"instantâneo",
    faz:"Gasta algo para obter efeito imediato." },
  { id:"copia", nome:"Cópia", custoBase:null, custoBaseTexto:"o dobro do que o dono paga, mínimo 1 e nunca acima do seu Limite",
    danoBase:null, danoBaseTexto:"o do dono, −2", duracao:"1 cena",
    faz:"Reproduz a Aplicação de outra pessoa por uma cena." },
  { id:"revide", nome:"Revide", custoBase:2, danoBase:null, danoBaseTexto:"o da sua Aplicação de ataque", duracao:"reação",
    faz:"Reação: disputa o Acerto dele com o seu; empate é seu. A Carga sai do Limite da rodada seguinte." },
  { id:"regeneracao", nome:"Regeneração", custoBase:0, danoBase:null, duracao:"sempre ligada",
    faz:"Recupera 1 de Vida por Ponto de Reforço no início do seu turno, até 4. Para em 0 de Vida." },
  { id:"transformacao-parcial", nome:"Transformação Parcial", custoBase:2, danoBase:null, duracao:"1 cena",
    faz:"Redistribui UM atributo em até 3 pontos. Membro permanente é Lastro, não Aplicação." },
];

const aplicacaoPorId = id => APLICACOES.find(x => x.id === id) || null;

/** Repertório: 1 Ponto de Concepção a cada 2 formas ALÉM da primeira. */
const APLICACOES_COM_REPERTORIO = ["transformacao","invocacao","modo"];
const custoDeRepertorio = formas => Math.ceil(Math.max(0, formas - 1) / 2);
const formasPorPontos   = pontos => 1 + 2 * pontos;

/** Aplicação cujo Custo Base é maior que o Limite por Ação não liga. */
const aplicacaoLiga = (aplicacao, a) =>
  aplicacao.custoBase === null || aplicacao.custoBase <= limitePorAcao(a);

/* ───────────────────────── lastro ──────────────────────────────────── */
/* Lastro dá Pontos de Concepção a mais, em troca de desvantagem permanente.
   O de meio ponto só conta EM PAR. */
const LASTRO = [
  { id:"membro", nome:"Um membro a menos, ou algo que o substitui mal", pontos:2 },
  { id:"sentido", nome:"Um sentido perdido ou muito prejudicado", pontos:2 },
  { id:"perseguido", nome:"Alguém ou algo caça você, e sabe onde procurar", pontos:2 },
  { id:"dependencia", nome:"Dependência de uma substância, ritual ou objeto", pontos:1 },
  { id:"marca", nome:"Uma marca visível que te identifica em qualquer lugar", pontos:1 },
  { id:"juramento", nome:"Um juramento que te tira opções em cena", pontos:1 },
  { id:"medo", nome:"Um medo específico que trava você", pontos:0.5 },
  { id:"fama-ruim", nome:"Fama ruim numa comunidade específica", pontos:0.5 },
  { id:"divida-material", nome:"Uma dívida material que cobra de tempos em tempos", pontos:0.5 },
];

/** Meio Lastro sozinho não paga nada: só conta em par. */
const pontosDeLastro = ids => {
  const itens = ids.map(id => LASTRO.find(l => l.id === id)).filter(Boolean);
  const inteiros = itens.filter(l => l.pontos >= 1).reduce((s, l) => s + l.pontos, 0);
  const meios = itens.filter(l => l.pontos === 0.5).length;
  return inteiros + Math.floor(meios / 2);
};

/* ───────────────────────── régua de DC ─────────────────────────────── */
const DC = [
  { nome:"Simples",  dc:9,  quando:"Alguém treinado quase não erra; só rola porque a cena está tensa." },
  { nome:"Comum",    dc:12, quando:"O teste padrão do dia a dia de aventura. Comece sempre aqui." },
  { nome:"Difícil",  dc:15, quando:"Exige treino de verdade ou uma boa ideia." },
  { nome:"Severa",   dc:18, quando:"Especialistas erram; sem preparo, praticamente não acontece." },
  { nome:"Extrema",  dc:21, quando:"No limite do que um humano faz. Avise antes." },
];
const DC_SALVAGUARDA = { leve:12, moderada:15, severa:18 };

window.RSS.R = { EDICAO, ATRIBUTOS, PONTOS_ATRIBUTO_CRIACAO, ATRIBUTO_MIN, ATRIBUTO_TETO_BASE, tetoAtributo, somaAtributos, vidaMaxima, reservaMaxima, limitePorAcao, estouroMaximo, defesaPassiva, defesaAtiva, pesoMaximo, reducaoDeDano, iniciativa, fadigaParaDebilitar, pontosDeConcepcao, pontosDeTrilha, tetoDeLastro, cargaParaRepartir, TETO_DANO_BASE_ECO, GRAUS, custoDoGrau, grauMaximoPorNivel, PERICIAS, bonusDePericia, CLASSES, PONTOS_PERICIA_DA_ORIGEM, ORIGENS, rankDeTrilhaPorNivel, TRILHAS, custoDeTrilhaForaDaClasse, checarCargaDeTrilha, CUSTO_CONCEPCAO_APLICACAO, CUSTO_CONCEPCAO_REFORCO, APLICACOES_MIN, APLICACOES_MAX, APLICACOES, aplicacaoPorId, APLICACOES_COM_REPERTORIO, custoDeRepertorio, formasPorPontos, aplicacaoLiga, LASTRO, pontosDeLastro, DC, DC_SALVAGUARDA };

/* ponte pro ficha.js da câmara, que já destrutura window.RSS.REGRAS */
/* Lê a Classe da ficha aberta: sem isso o criador dizia Reserva 38 e a
   câmara dizia 36 pro MESMO personagem, porque o +2 do Ressonante e o
   +2/Nível do Bastião ficavam de fora. Duas telas, um número só. */
const _classe = () => (window.RSS.ficha && window.RSS.ficha.classeId) || null;
const _nivel  = () => (window.RSS.ficha && window.RSS.ficha.nivel) || 1;
window.RSS.REGRAS = {
  vidaMaxima: a => vidaMaxima(a, _classe(), _nivel()),
  reserva:    a => reservaMaxima(a, _classe()),
  limite:     limitePorAcao,
  defesaPassiva, pesoMaximo,
  alcance: c => 5 + 5 * c,
  DC: DC.map(d => [d.nome.toLowerCase(), d.dc]),
};
})();
