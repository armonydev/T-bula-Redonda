/* ═══ compendio.js — a biblioteca pesquisável ═══
   As entradas do Ressonância NÃO são digitadas aqui: elas são montadas a
   partir do regras.js, que é a mesma fonte que o criador e a ficha usam.
   Mudou uma Aplicação no livro, mudou no compêndio no mesmo instante.

   Os outros sistemas entram quando o material deles chegar. Até lá a
   página diz isso, em vez de inventar conteúdo. */
window.RSS = window.RSS || {};
(function(){
"use strict";
const R = window.RSS.R;

/* Uma entrada: { id, cat, nome, resumo, etiquetas:[[rótulo,valor]], corpo:[[título,texto]] } */
function doRessonancia(){
  const E = [];

  R.APLICACOES.forEach(a => {
    const et = [["Custo Base", a.custoBaseTexto || String(a.custoBase)]];
    if (a.danoBase) et.push(["Dano Base", String(a.danoBase)]);
    else if (a.danoBaseTexto) et.push(["Dano", a.danoBaseTexto]);
    et.push(["Duração", a.duracao]);
    if (R.APLICACOES_COM_REPERTORIO.includes(a.id)) et.push(["Aceita", "Repertório"]);
    E.push({ id:"apl-"+a.id, cat:"Aplicações", nome:a.nome, resumo:a.faz, etiquetas:et,
      corpo:[["O que faz", a.faz],
             ["Custo em Concepção", "1 Ponto. Cada Reforço custa mais 1."],
             ["Na mesa", typeof a.custoBase === "number"
               ? `Ligar custa ${a.custoBase} do seu Limite por Ação. O que sobra é o que você reparte entre Acerto e Dano.`
               : "O Custo Base desta Aplicação é variável — veja a regra dela no livro."]] });
  });

  R.PERICIAS.forEach(p => {
    E.push({ id:"per-"+p.id, cat:"Perícias", nome:p.nome, resumo:p.cobre,
      etiquetas:[["Atributo", p.attr]],
      corpo:[["Cobre", p.cobre],
             ["O teste", `1d20 + ${p.attr} + o bônus do Grau, contra a DC.`],
             ["Graus", R.GRAUS.map(g => `${g.nome} (custo ${g.custo}, +${g.bonus})`).join(" · ")]] });
  });

  R.TRILHAS.forEach(t => {
    const et = [["Carga mínima", t.cargaMin ? String(t.cargaMin) : "nenhuma"]];
    et.push(["Classe", t.classe ? t.classe.map(c => (R.CLASSES.find(x=>x.id===c)||{nome:c}).nome).join(" ou ") : "Qualquer"]);
    E.push({ id:"tri-"+t.id, cat:"Trilhas", nome:t.nome, resumo:t.conceito, etiquetas:et,
      corpo:[["Conceito", t.conceito],
             ["Carga mínima", t.cargaMin ? `${t.cargaMin}. Faltar exatamente 1 não tranca: custa 1 Ponto de Concepção a mais.` : "Não pede Carga."],
             ["Fora da Classe", "A partir do Nível 6, Trilha de outra Classe custa 2 Pontos de Concepção permanentes."]] });
  });

  R.ORIGENS.forEach(o => {
    const et = [["Pontos de Perícia", String(R.PONTOS_PERICIA_DA_ORIGEM)]];
    if (o.obrigacao) et.push(["Tem", "Obrigação"]);
    E.push({ id:"ori-"+o.id, cat:"Origens", nome:o.nome, resumo:o.quando, etiquetas:et,
      corpo:[["Quando ela é a sua", o.quando],
             ["Bônus inicial", o.bonus],
             ...(o.obrigacao ? [["Obrigação", o.obrigacao]] : []),
             ["Marca de Origem (Nível 5)", o.marca]] });
  });

  R.CLASSES.forEach(c => {
    E.push({ id:"cls-"+c.id, cat:"Classes", nome:c.nome, resumo:c.pergunta,
      etiquetas:[["Pontos de Perícia", String(c.pontosPericia)], ["Foco", c.foco]],
      corpo:[["Numa cena de ação", c.pergunta],
             ["Bônus inicial", c.bonus],
             ["Nível 1", c.nivel1], ["Nível 5", c.nivel5]] });
  });

  R.LASTRO.forEach(l => {
    E.push({ id:"las-"+l.id, cat:"Lastro", nome:l.nome, resumo:`Vale ${l.pontos} Ponto(s) de Concepção.`,
      etiquetas:[["Rende", String(l.pontos)]],
      corpo:[["O que é", "Desvantagem permanente que compra Ponto de Concepção."],
             ["Rende", `${l.pontos} Ponto(s).` + (l.pontos === 0.5 ? " Meio Lastro só conta EM PAR — um sozinho não paga nada." : "")]] });
  });

  /* As fórmulas derivadas. Faltavam, e é o que mais se procura no meio da
     sessão — "quanto é o Estouro mesmo?". Os números saem das funções do
     regras.js aplicadas a uma ficha de exemplo, então nunca divergem. */
  const ex = { FOR:6, DES:7, CON:7, INT:8, CARGA:8, CAR:4 };
  const FORMULAS = [
    ["Vida Máxima", "10 + (Constituição × 4)", R.vidaMaxima(ex),
     "O Bastião soma +2 por Nível em cima disso, acumulativo."],
    ["Reserva de Carga", "(Inteligência + Carga) × 2", R.reservaMaxima(ex),
     "Quanto você tem no total. O Ressonante soma +2 depois da fórmula."],
    ["Limite por Ação", "o valor do atributo Carga", R.limitePorAcao(ex),
     "Quanto você canaliza DE UMA VEZ. É o número mais importante da ficha, e não se confunde com a Reserva."],
    ["Estouro máximo", "metade da Carga, para cima", "+" + R.estouroMaximo(ex),
     "Passar do Limite custa 1 de Fadiga por ponto. Cada Fadiga tira 1 do Limite. Fadiga igual à Carga = Debilitado na hora."],
    ["Defesa Passiva", "10 + Constituição", R.defesaPassiva(ex),
     "O número parado. Defesa Ativa soma a Carga investida; Esquiva troca por 1d20 + Destreza."],
    ["Redução de dano", "Constituição ÷ 2, para baixo", R.reducaoDeDano(ex),
     "Sai de todo dano recebido, físico ou de Eco."],
    ["Iniciativa e Esquiva", "1d20 + Destreza", R.iniciativa(ex), "Rolada uma vez no começo do combate."],
    ["Peso Máximo", "(Força × 2) + mochilas", R.pesoMaximo(ex),
     "Passou disso, você fica Sobrecarregado: deslocamento pela metade."],
    ["Pontos de Concepção", "2 + Nível", R.pontosDeConcepcao(5),
     "O orçamento do Poder. 1 Ponto compra 1 Aplicação ou 1 Reforço. O Lastro rende mais."],
    ["Pontos de Trilha", "1 + (Nível ÷ 4, para baixo)", R.pontosDeTrilha(5), "Ranks em 1, 6, 11, 16 e 20."],
    ["Carga para repartir", "Limite por Ação − Custo Base", R.cargaParaRepartir(ex, 2),
     "O Custo Base sai de DENTRO do Limite. O que resta é o que você divide entre Acerto e Dano, antes de rolar."],
  ];
  FORMULAS.forEach(([nome, conta, valor, nota]) => {
    E.push({ id:"frm-"+nome.toLowerCase().replace(/[^a-z]+/g,"-"), cat:"Fórmulas", nome,
      resumo:conta, etiquetas:[["Conta", conta]],
      corpo:[["A conta", conta],
             ["Exemplo", `Com FOR 6 · DES 7 · CON 7 · INT 8 · CARGA 8 · CAR 4 (Nível 5), dá ${valor}.`],
             ["Na mesa", nota]] });
  });

  /* O empate, que é a regra que a mesa mais erra. */
  E.push({ id:"reg-empate", cat:"Fórmulas", nome:"Empate é defesa",
    resumo:"O ataque só conecta se o Acerto for MAIOR que a Defesa.",
    etiquetas:[["Vale em","tudo"]],
    corpo:[["A regra", "O ataque só conecta se o Acerto for MAIOR que a Defesa. Igualar não é acertar."],
           ["Onde vale", "Em todo o sistema: Acerto contra Defesa, Salvaguarda contra DC, e disputa entre dois personagens. O empate é sempre de quem se defende."],
           ["Na mesa", "É a regra que mais muda rodada. Um ponto de Carga no Acerto pode valer a luta inteira."]] });

  R.DC.forEach(d => {
    E.push({ id:"dc-"+d.dc, cat:"Dificuldade", nome:`${d.nome} — DC ${d.dc}`, resumo:d.quando,
      etiquetas:[["DC", String(d.dc)]],
      corpo:[["Quando usar", d.quando],
             ["A régua", "Comece sempre em 12 e mexa daí. Chuva não sobe a DC: chuva dá Desvantagem."]] });
  });

  return E;
}

/* ── Saa ── mesma ideia: sai do saa.js, não é digitado aqui. */
function doSaa(){
  const S = window.SAA; if(!S) return [];
  const E = [];
  S.ATRIBUTOS.forEach(a => {
    E.push({ id:"saa-atr-"+a.id.toLowerCase(), cat:"Atributos", nome:a.nome, resumo:a.cobre,
      etiquetas:[["Vira", a.recurso]],
      corpo:[["O que cobre", a.cobre],
             ["O modificador", "A cada 2 pontos, +1. O modificador deste atributo É a sua quantidade de " + a.recurso + "."],
             ["Na criação", `Os ${S.PONTOS_INICIAIS} pontos iniciais se dividem entre os três atributos.`]] });
  });
  S.ESCADA.forEach(([de, ate, d]) => {
    E.push({ id:"saa-dado-"+de, cat:"Escada de dados", nome:`${de}–${ate} pontos`, resumo:`Rola ${d}.`,
      etiquetas:[["Dados", d]],
      corpo:[["A regra", `Pontos Totais entre ${de} e ${ate} rolam ${d}.`],
             ["Pontos Totais", "Modificador do atributo da ação + pontos do Estudo. Numa Técnica, soma os 3 Estudos e os pontos dela."],
             ["Acima da tabela", "A progressão segue infinitamente, mantendo o mesmo padrão."]] });
  });
  S.TIPOS_ITEM.forEach(t => {
    E.push({ id:"saa-item-"+t.id, cat:"Itens", nome:t.nome, resumo:t.nota,
      etiquetas:[["Tipo de Item", t.nome]], corpo:[["Como funciona", t.nota]] });
  });
  S.REGRAS_CURTAS.forEach(([nome, txt], i) => {
    E.push({ id:"saa-reg-"+i, cat:"Regras", nome, resumo:txt, etiquetas:[], corpo:[["A regra", txt]] });
  });
  E.push({ id:"saa-estudos", cat:"Regras", nome:"Estudos",
    resumo:"Qualquer conhecimento relevante vira um Estudo. Os Elementos também são Estudos.",
    etiquetas:[["Quantos", "igual ao Conhecimento"], ["Começa com", String(S.ESTUDO_INICIAL)]],
    corpo:[["O que é", "O conhecimento acumulado pelo personagem. Artes marciais, medicina, meditação, malabarismo — e os Elementos."],
           ["Quantos cabem", "Uma quantidade igual aos seus pontos de Conhecimento."],
           ["Pontos", `Todo Estudo novo entra com ${S.ESTUDO_INICIAL} ponto e sobe 1 a cada conhecimento novo relacionado. Não há teto.`],
           ["Usando", "Soma os pontos do Estudo ao modificador do atributo da ação."]] });
  E.push({ id:"saa-tecnicas", cat:"Regras", nome:"Técnicas",
    resumo:`Unir ${S.ESTUDOS_POR_TECNICA} Estudos diferentes cria uma Técnica.`,
    etiquetas:[["Quantas", "igual ao Conhecimento"], ["Começa com", String(S.TECNICA_INICIAL)]],
    corpo:[["O que é", `A união de ${S.ESTUDOS_POR_TECNICA} Estudos diferentes. Qualquer combinação que faça sentido vale.`],
           ["A conta", "Soma os pontos dos 3 Estudos, o modificador do atributo da ação, e os pontos da própria Técnica."],
           ["Travas", "Evoluir a Técnica não evolui os Estudos dela. Usando uma Técnica, você não usa nenhum Estudo de fora dela."]] });
  return E;
}

/** Devolve as entradas de um sistema, ou [] quando o material não chegou. */

/* ── Feiticeiros & Maldições ──────────────────────────────────────────
   Mesma regra do resto: nada é digitado aqui. Tudo sai do fm.js, que foi
   lido do Livro de Regras v2.5.2 e conferido contra o Modelo de Ficha.
   Isto é um índice de consulta — o livro continua sendo o livro. */
function doFm(){
  const F = window.FM; if(!F) return [];
  const E = [];
  const nv = n => `No nível ${n}`;

  F.ATRIBUTOS.forEach(([id,nome,texto]) => {
    E.push({ id:"fm-atr-"+id, cat:"Atributos", nome, resumo:texto,
      etiquetas:[["Sigla",id]],
      corpo:[["O que mede", texto],
             ["Modificador","+1 a cada 2 acima de 10, −1 a cada 2 abaixo. Um 10 é a média."],
             ["Limite","20 na criação. Certas origens e talentos levam até 30."]] });
  });

  F.ORIGENS.forEach(o => {
    E.push({ id:"fm-org-"+o.id, cat:"Origens", nome:o.nome, resumo:o.resumo,
      etiquetas:[["Exemplos", o.exemplos]],
      corpo:[["Em uma frase", o.resumo], ...o.tracos] });
  });

  F.CLAS.forEach(c => {
    E.push({ id:"fm-cla-"+c.id, cat:"Origens", nome:c.nome, resumo:c.resumo,
      etiquetas:[["Exige","Origem Herdado"]],
      corpo:[["A herança", c.resumo],
             ["Onde está","Os bônus de atributo, treinamentos e herança de cada clã estão no capítulo Heranças de Clãs, p.29."]] });
  });

  F.ESPECIALIZACOES.forEach(e => {
    E.push({ id:"fm-esp-"+e.id, cat:"Especializações", nome:e.nome, resumo:e.resumo,
      etiquetas:[["PV inicial", e.pv + " + CON"], ["Dado de vida", e.dadoVida],
                 ["PE", e.semEnergia ? "nenhum" : e.pe + "/nível"],
                 ["Chave", e.chave.join(" ou ")]],
      corpo:[["Em uma frase", e.resumo],
             ["Exemplos da obra", e.exemplos],
             ["Pontos de Vida", `${e.pv} + mod. de Constituição no 1° nível. Depois, ${e.dadoVida} (ou ${e.pvNivel} fixo) + mod. de Constituição por nível.`],
             ["Pontos de Energia", e.semEnergia ? "Nenhum: um Restringido usa Pontos de Estamina."
               : `${e.pe} por nível` + (e.peAtributo ? ", somando uma única vez o modificador do atributo de técnica." : ".")],
             ["Treinamentos", e.treinos],
             ["Habilidade base", e.base],
             ["Multiclasse", e.multiclasse]] });
  });

  F.PERICIAS.forEach(([nome,at]) => {
    E.push({ id:"fm-per-"+nome.toLowerCase(), cat:"Perícias", nome, resumo:`Perícia de ${at}.`,
      etiquetas:[["Atributo", at]],
      corpo:[["O teste","1d20 + metade do nível + modificador do atributo, mais a maestria se for treinado."],
             ["Treinado","Soma o bônus de maestria (1 + nível ÷ 4, pra cima)."],
             ["Mestre","Soma uma vez e meia a maestria, arredondando pra baixo no fim."]] });
  });

  F.RESISTENCIAS.forEach(([nome,at,txt]) => {
    E.push({ id:"fm-tr-"+nome.toLowerCase(), cat:"Testes de Resistência", nome, resumo:txt,
      etiquetas:[["Atributo", at]],
      corpo:[["Contra o quê", txt],
             ["O teste","Mesma escada da perícia: metade do nível + modificador + maestria se treinado."],
             ["Quem concede","A Especialização. O Restringido recebe Fortitude e Reflexos."]] });
  });

  const FORMULAS = [
    ["Pontos de Vida","Base da Especialização + mod. de Constituição, e de novo por nível.",
      "O mod. de Constituição é retroativo: se ele sobe, o total sobe desde o 1° nível."],
    ["Pontos de Energia","Valor da Especialização × nível, mais o mod. do atributo de técnica uma única vez (quando a Especialização somar).",
      "O Restringido não tem PE — ele usa Pontos de Estamina."],
    ["Integridade da Alma","Igual ao seu máximo de Pontos de Vida.",
      "Subiu o PV máximo, sobe a Integridade junto."],
    ["Defesa","10 + mod. de Destreza + metade do nível + outros bônus.",
      "Com uniforme comum. Um Restringido ainda soma Força ou Constituição, limitado pelo nível."],
    ["Iniciativa","Modificador de Destreza + outros bônus.", "A condição Surdo tira 5, inclusive do valor já rolado."],
    ["Atenção","10 + bônus na perícia Percepção + outros bônus.", "É a percepção passiva: o que você nota sem procurar."],
    ["Deslocamento","9 metros de caminhada.", "O Físico Abençoado do Restringido soma 3."],
    ["Bônus de Maestria","1 + nível ÷ 4, arredondando pra cima.", "Nível 1 a 4 dá +2; 5 a 8 dá +3; e assim por diante até +6."],
    ["CD de Especialização","10 + atributo-chave + maestria + metade do nível.", "O atributo-chave é escolhido entre os que a Especialização oferece."],
    ["CD de Técnica","10 + atributo de técnica + maestria + metade do nível.", "É a dificuldade pra resistir aos seus Feitiços."],
    ["Limite de Carga","Modificador de Força × 2 + 8 espaços.", "Cada item ocupa espaços, não quilos."],
    ["Compra por Pontos","17 pontos, todos partindo de 10, teto de 15.", "Baixar para 9 devolve 1 ponto; para 8 devolve 2. Subir para 11 custa 2, 12 custa 3, 13 custa 4, 14 custa 5 e 15 custa 7."],
  ];
  FORMULAS.forEach(([nome,f,obs]) => {
    E.push({ id:"fm-form-"+nome.toLowerCase().replace(/[^a-z]+/g,"-"), cat:"Fórmulas", nome,
      /* Sem etiqueta aqui: a fórmula inteira numa etiqueta é um texto
         comprido numa caixa que não quebra linha, e era ela que esticava o
         compêndio pra 675px no celular. A conta já está no corpo. */
      resumo:f, corpo:[["A conta", f], ["Detalhe", obs]] });
  });

  F.CONDICOES.forEach(([nome,grupo,txt]) => {
    E.push({ id:"fm-cond-"+nome.toLowerCase(), cat:"Condições", nome, resumo:txt,
      etiquetas:[["Grupo", grupo]],
      corpo:[["Efeito", txt],
             ["Acumula?","Condições com o mesmo efeito não somam — aplique só a mais severa."],
             ["Qual teste","O Narrador decide o TR, ou o jogador no caso de um Feitiço."]] });
  });

  F.APTIDOES.forEach(([nome,txt]) => {
    E.push({ id:"fm-apt-"+nome.toLowerCase().replace(/[^a-z]+/g,"-"), cat:"Níveis de Aptidão",
      nome:"Aptidão em " + nome, resumo:txt,
      corpo:[["O que é", txt],
             ["Como sobe","Pelo Treino de Compreensão, por habilidades de Especialização e por talentos."]] });
  });

  F.TREINAMENTOS.forEach(([nome,txt]) => {
    E.push({ id:"fm-tre-"+nome.toLowerCase().replace(/[^a-z]+/g,"-"), cat:"Treinamentos",
      nome, resumo:txt, etiquetas:[["Etapas","4"]],
      corpo:[["Treinamento completo", txt],
             ["Como funciona","Quatro etapas. O benefício acima é o da etapa final."]] });
  });

  E.push({ id:"fm-dificuldade", cat:"Referência", nome:"Classes de Dificuldade",
    resumo:"Fácil 10 · Média 15 · Difícil 20 · Muito Difícil 30 · Lendário 40 · Quase Impossível 50.",
    etiquetas:F.DIFICULDADES.map(([n,v]) => [n, String(v)]),
    corpo:[["A escada", F.DIFICULDADES.map(([n,v]) => `${n}: ${v}`).join(" · ")],
           ["Quando não pedir","Tarefa fácil o bastante não precisa de teste. Não role pelo prazer de rolar."]] });

  E.push({ id:"fm-graus", cat:"Referência", nome:"Graus de Feiticeiro",
    resumo:"Do Quarto Grau ao Grau Especial. É o crachá, não a ficha.",
    etiquetas:[["Ranques", String(F.GRAUS.length)]],
    corpo:[["A escada", F.GRAUS.join(" · ")],
           ["Como sobe","Por recomendação de feiticeiros de ranque superior. Pra Primeiro Grau, de dois ou mais."],
           ["Maldições","Espíritos usam uma escada parecida, mas não idêntica — a diferença entre segundo e primeiro grau é saber usar técnica amaldiçoada."]] });

  E.push({ id:"fm-concentracao", cat:"Referência", nome:"Concentração",
    resumo:"TR de Fortitude pra não perder o foco de uma habilidade.",
    corpo:[["Recebeu dano","CD igual a 10 ou metade do dano, o que for maior."],
           ["Foi movido à força","CD igual a 5 + a distância que você foi movido."],
           ["Empurrado ou agarrado","CD igual a 10 + o bônus de Atletismo de quem fez."],
           ["Provocado","CD igual a 10 + o bônus da perícia usada contra você."],
           ["Limite","Uma habilidade concentrada por vez, por padrão."]] });

  E.push({ id:"fm-creditos", cat:"Referência", nome:"Créditos",
    resumo:"Feiticeiros & Maldições é projeto de fã, gratuito, sem intenção de lucro.",
    corpo:[["Sistema","Setsugiri e Parker, com diagramação de Setsugiri e Jou, revisão de Jou, Kame e Parker."],
           ["Universo","Jujutsu Kaisen, de Gege Akutami. Todos os créditos da obra original são dele."],
           ["Artes originais","Konatsuu e Strabey."],
           ["Versão","Livro de Regras v2.5.2, mais a Enciclopédia Amaldiçoada v0.9."]] });

  return E;
}

function entradasDe(sistemaId){
  if (sistemaId === "ressonancia") return doRessonancia();
  if (sistemaId === "saa") return doSaa();
  if (sistemaId === "fm")  return doFm();
  return [];
}

/** As categorias que REALMENTE existem naquele sistema, com a contagem. */
function categoriasDe(entradas){
  const m = new Map();
  entradas.forEach(e => m.set(e.cat, (m.get(e.cat) || 0) + 1));
  return [...m.entries()].map(([nome, n]) => ({ nome, n }));
}

/** Pesquisa em nome, resumo, categoria, etiquetas e corpo. */
function filtrar(entradas, termo, cat){
  const t = (termo || "").trim().toLowerCase();
  return entradas.filter(e => {
    if (cat && cat !== "Todos" && e.cat !== cat) return false;
    if (!t) return true;
    const alvo = [e.nome, e.resumo, e.cat,
      ...(e.etiquetas || []).flat(),
      ...(e.corpo || []).flat()].join(" ").toLowerCase();
    return alvo.includes(t);
  });
}

window.RSS.Compendio = { entradasDe, categoriasDe, filtrar };
})();
