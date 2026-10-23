/* ═══════════════════════════════════════════════════════════════════════
   itens.js — o inventário da ficha, e o código que se manda pro jogador
   colar.

   A ideia é a que o Kainã pediu: um item é um pedacinho de JSON pequeno o
   bastante pra caber numa mensagem. Sem imagem, sem link, sem servidor —
   o jogador copia o texto, cola na aba Itens e o item entra na ficha dele.

   O formato é propositalmente curto. Só "nome" é obrigatório; tudo o mais
   tem padrão. Um item simples cabe em 40 caracteres:
       {"nome":"Corda de cânhamo","peso":1}
   ═══════════════════════════════════════════════════════════════════════ */
window.RSS = window.RSS || {};
(function(){
"use strict";

/* Os bônus que a ficha SABE aplicar sozinha. Qualquer outro efeito vai em
   "efeito", como texto, e quem aplica é o Mestre — é melhor assim do que
   inventar um campo pra cada regra do livro. */
const BONUS = [
  ["vida",      "Vida máxima"],
  ["reserva",   "Reserva máxima"],
  ["defesa",    "Defesa"],
  ["reducao",   "Redução"],
  ["peso",      "Peso máximo"],
  ["iniciativa","Iniciativa"],
];
const CHAVES_BONUS = BONUS.map(b => b[0]);

/* Os três tipos. Não mudam fórmula nenhuma — mudam o que a pessoa vê e o
   que ela pode fazer com o item. É de propósito: Bênção e Maldição vêm do
   MUNDO, não do orçamento de ficha, então elas não entram na conta de
   Pontos de Concepção. Quem dá é o Mestre. */
const TIPOS = {
  comum:    { rotulo:"Item",     cor:"var(--suave)" },
  bencao:   { rotulo:"Bênção",   cor:"var(--ouro)"  },
  maldicao: { rotulo:"Maldição", cor:"var(--vida)"  },
};
const num = v => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : 0; };
const txt = (v, max) => String(v == null ? "" : v).slice(0, max || 200);

/** Põe um objeto qualquer no feitio de item. Nunca devolve lixo. */
function normalizar(bruto){
  if(!bruto || typeof bruto !== "object") return null;
  const nome = txt(bruto.nome || bruto.name, 60).trim();
  if(!nome) return null;
  const b = {};
  const fonte = bruto.bonus || bruto.bonus || {};
  for(const k of CHAVES_BONUS){
    const v = num(fonte[k]);
    if(v) b[k] = v;
  }
  const tipo = TIPOS[bruto.tipo] ? bruto.tipo : "comum";
  return {
    nome,
    tipo,
    peso: Math.max(0, num(bruto.peso)),
    efeito: txt(bruto.efeito || bruto.desc || bruto.descricao, 400).trim(),
    bonus: b,
    /* Item preso não sai pela ficha. É o que separa uma Maldição de um
       item ruim: item ruim você larga. Tirar um preso é cena de mesa —
       ritual, troca, alguém pagando por você — não clique de botão. */
    preso: !!bruto.preso,
    /* Só item equipado empurra número. Um item no fundo da mochila não
       aumenta a sua Defesa, e essa é a diferença entre carregar e usar. */
    equipado: bruto.preso ? true
      : bruto.equipado === undefined ? (Object.keys(b).length > 0) : !!bruto.equipado,
  };
}

/** Aceita um item, uma lista de itens, ou um JSON com {itens:[...]}. */
function lerTexto(texto){
  const cru = String(texto || "").trim();
  if(!cru) return { itens:[], erro:"Cole o código do item aqui." };
  let dado;
  try{ dado = JSON.parse(cru); }
  catch(e){
    /* Erro de JSON é ilegível ("Unexpected token } in JSON at position
       73"). Traduzir pro que a pessoa provavelmente fez vale mais. */
    let dica = "O código não é um JSON válido.";
    if(/[“”‘’]/.test(cru)) dica += " Tem aspas curvas — o WhatsApp troca as aspas retas por curvas. Digite as aspas de novo.";
    else if(!/^[\[{]/.test(cru)) dica += " Ele precisa começar com { ou [.";
    else if(/,\s*[}\]]/.test(cru)) dica += " Tem uma vírgula sobrando antes de fechar.";
    return { itens:[], erro:dica };
  }
  const lista = Array.isArray(dado) ? dado : Array.isArray(dado.itens) ? dado.itens : [dado];
  const itens = lista.map(normalizar).filter(Boolean);
  if(!itens.length) return { itens:[], erro:"Não achei nenhum item com nome aí dentro." };
  return { itens, erro:"" };
}

/** O código que se manda pro jogador. Enxuto: campo vazio não vai junto. */
function paraTexto(itens, bonito){
  const limpos = (Array.isArray(itens) ? itens : [itens]).map(i => {
    const o = { nome:i.nome };
    if(i.tipo && i.tipo !== "comum") o.tipo = i.tipo;
    if(i.peso)   o.peso = i.peso;
    if(i.efeito) o.efeito = i.efeito;
    if(i.bonus && Object.keys(i.bonus).length) o.bonus = i.bonus;
    if(i.preso)    o.preso = true;
    if(i.equipado && !i.preso) o.equipado = true;
    return o;
  });
  const alvo = limpos.length === 1 ? limpos[0] : limpos;
  return JSON.stringify(alvo, null, bonito ? 2 : 0);
}

/** Soma os bônus de tudo que está equipado. */
function somaBonus(itens){
  const t = Object.fromEntries(CHAVES_BONUS.map(k => [k, 0]));
  for(const i of (itens || [])){
    if(!i || !i.equipado || !i.bonus) continue;
    for(const k of CHAVES_BONUS) t[k] += num(i.bonus[k]);
  }
  return t;
}
const pesoTotal = itens => (itens || []).reduce((s,i) => s + Math.max(0, num(i && i.peso)), 0);

window.RSS.Itens = { BONUS, CHAVES_BONUS, TIPOS, normalizar, lerTexto, paraTexto, somaBonus, pesoTotal };
})();
