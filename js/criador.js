/* ═══ criador.js — o fluxo de criação ═══
   Nenhum número mora aqui. Tudo vem de window.RSS.R (regras.js), que é o
   MESMO arquivo que a Câmara de Eco lê. */
(function(){
"use strict";
const R = window.RSS.R, Arm = window.RSS.Arm;
const $ = (s,r=document)=>r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico = id => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
const ICONE = { FOR:"i-forca", DES:"i-destreza", CON:"i-constituicao", INT:"i-inteligencia", CARGA:"i-carga", CAR:"i-carisma" };

const fichaNova = () => ({
  id:Arm.novoId(), versao:3, edicao:R.EDICAO,
  nome:"", nivel:1, retrato:"", conceito:"", descricao:"",
  atributosBase:Object.fromEntries(R.ATRIBUTOS.map(a=>[a.id,R.ATRIBUTO_MIN])),
  escolhaOrigem:{}, origemId:null, classeId:null,
  pericias:{}, aplicacoes:[], trilhaId:null, lastro:[], anotacoes:"", vezesEstourado:0,
});

let ficha=null, etapa=0;

/* ── contas ── */
const origem = () => R.ORIGENS.find(o=>o.id===ficha.origemId)||null;
const classe = () => R.CLASSES.find(c=>c.id===ficha.classeId)||null;
const trilha = () => R.TRILHAS.find(t=>t.id===ficha.trilhaId)||null;

function atributos(){
  const a={...ficha.atributosBase}, o=origem(), c=classe();
  if(o&&o.fixo) for(const[k,v]of Object.entries(o.fixo)) a[k]=(a[k]||0)+v;
  for(const[k,v]of Object.entries(ficha.escolhaOrigem)) a[k]=(a[k]||0)+v;
  if(c&&c.bonusCarga) a.CARGA=(a.CARGA||0)+c.bonusCarga;
  return a;
}
/* Os três orçamentos crescem com o Nível (livro p.15): +2 de atributo,
   +1 de Perícia e +1 de Concepção por nível acima do 1°. Atributo e
   Perícia estavam travados no valor do Nível 1 — uma ficha de Nível 5
   mostrava "34 pontos" como se fosse recém-criada. */
const attrTotal = () => R.pontosDeAtributo(ficha.nivel);
const attrGasto = () => R.somaAtributos(ficha.atributosBase);
const attrSobra = () => attrTotal() - attrGasto();
function bonusOrigemTotal(){
  const o=origem(); if(!o) return 0;
  return (o.escolheAtributo||0)+(o.escolheEntre?(o.escolheQuanto||0):0);
}
function bonusOrigemFalta(){
  return bonusOrigemTotal() - Object.values(ficha.escolhaOrigem).reduce((s,v)=>s+v,0);
}
const perTotal  = () => R.pontosDePericia(ficha.nivel, classe()?classe().pontosPericia:0);
const perGasto  = () => Object.values(ficha.pericias).reduce((s,g)=>s+R.GRAUS[g].custo,0);
const perSobra  = () => perTotal()-perGasto();
const conTotal  = () => R.pontosDeConcepcao(ficha.nivel)+R.pontosDeLastro(ficha.lastro);
function conGasto(){
  let g=0;
  for(const ap of ficha.aplicacoes){
    g += R.CUSTO_CONCEPCAO_APLICACAO + (ap.reforcos||0)*R.CUSTO_CONCEPCAO_REFORCO;
    if((ap.formas||1)>1) g += R.custoDeRepertorio(ap.formas);
  }
  const t=trilha();
  if(t){ g += R.custoDeTrilhaForaDaClasse(t,ficha.classeId,ficha.nivel);
         g += R.checarCargaDeTrilha(t,atributos().CARGA).custoExtra||0; }
  return g;
}
const conSobra = () => conTotal()-conGasto();

/* ── CHECAGEM GLOBAL ──────────────────────────────────────────────────
   Orçamento é invariante do personagem inteiro, não de uma tela.
   Trocar de Classe depois de gastar Perícia, baixar o Nível com grau alto
   ou tirar um Lastro já gasto estourava a conta numa etapa que o jogador
   não ia revisitar — e o trilho mostrava verde. Agora toda etapa é
   revalidada a cada render, e estouro bloqueia de qualquer lugar. */
function problemas(){
  const p=[];
  const sA=attrSobra();
  if(sA<0) p.push({etapa:1, txt:`Você passou ${-sA} ponto(s) de atributo.`});
  const teto=R.tetoAtributo(ficha.vezesEstourado);
  const alto=R.ATRIBUTOS.find(a=>ficha.atributosBase[a.id]>teto);
  if(alto) p.push({etapa:1, txt:`${alto.nome} passou do teto de ${teto}.`});
  if(ficha.origemId && bonusOrigemFalta()<0)
    p.push({etapa:2, txt:`Você colocou ${-bonusOrigemFalta()} ponto(s) a mais do que a Origem dá.`});
  if(perSobra()<0)
    p.push({etapa:4, txt:`Você passou ${-perSobra()} Ponto(s) de Perícia — a Classe mudou e o orçamento encolheu.`});
  const tG=R.grauMaximoPorNivel(ficha.nivel);
  const acima=Object.entries(ficha.pericias).find(([,g])=>g>tG);
  if(acima){ const pe=R.PERICIAS.find(x=>x.id===acima[0]);
    p.push({etapa:4, txt:`${pe.nome} está em ${R.GRAUS[acima[1]].nome}, acima do teto do Nível ${ficha.nivel} (${R.GRAUS[tG].nome}).`}); }
  if(conSobra()<0)
    p.push({etapa:5, txt:`Você passou ${-conSobra()} Ponto(s) de Concepção.`});
  const a=atributos();
  const morta=ficha.aplicacoes.map(x=>R.aplicacaoPorId(x.id)).find(x=>x&&!R.aplicacaoLiga(x,a));
  if(morta) p.push({etapa:5, txt:`${morta.nome} custa ${morta.custoBase} pra ligar e o seu Limite por Ação é ${R.limitePorAcao(a)} — ela não liga.`});
  const t=trilha();
  if(t){ const chk=R.checarCargaDeTrilha(t,a.CARGA); if(!chk.ok) p.push({etapa:6, txt:chk.erro}); }
  return p;
}

/* ── o que falta pra ETAPA estar completa (diferente de estar errada) ── */
const FALTA = [
  () => !ficha.nome.trim() ? "Dê um nome ao personagem." : null,
  () => attrSobra()>0 ? `Ainda sobram ${attrSobra()} ponto(s) de atributo.` : null,
  () => !ficha.origemId ? "Escolha uma Origem."
      : bonusOrigemFalta()>0 ? `Falta colocar ${bonusOrigemFalta()} ponto(s) do bônus da Origem.` : null,
  () => !ficha.classeId ? "Escolha uma Classe." : null,
  () => perSobra()>0 ? `Sobram ${perSobra()} Ponto(s) de Perícia — dá pra seguir, mas é desperdício.` : null,
  () => !ficha.conceito.trim() ? "Escreva o Conceito."
      : ficha.aplicacoes.length<R.APLICACOES_MIN ? `Faltam Aplicações: o mínimo é ${R.APLICACOES_MIN}, você tem ${ficha.aplicacoes.length}.`
      : ficha.aplicacoes.length>R.APLICACOES_MAX ? `O teto é ${R.APLICACOES_MAX}.` : null,
  () => !ficha.trilhaId ? "Escolha uma Trilha." : null,
  () => null,
];
const NOMES = ["Identidade","Atributos","Origem","Classe","Perícias","Poder","Trilha e Lastro","Revisão"];
/* etapa 4 (Perícias) sobrando ponto é só recado; estouro vem de problemas() */
const SO_RECADO = new Set([4]);

/* ── telas ── */
const T = {
0(){ return `<section class="cartao">
  <h2>Quem é</h2><p class="explica">O nome e o Nível. O resto do mundo vem depois.</p>
  <div class="linha-campos">
    <label class="campo"><span>Nome</span><input id="f-nome" type="text" value="${esc(ficha.nome)}" placeholder="Nira" autocomplete="off"></label>
    <label class="campo"><span>Nível (1 a 20)</span><input id="f-nivel" type="number" min="1" max="20" value="${ficha.nivel}"></label>
      <div class="campo"><span>Retrato</span>${retratoWidget()}</div>
  </div>
  <label class="campo" style="margin-top:13px"><span>Em uma linha, quem ele é</span>
    <input id="f-desc" type="text" value="${esc(ficha.descricao)}" placeholder="Mecânica que começou a ouvir o metal responder" autocomplete="off"></label>
</section>`; },

1(){ const teto=R.tetoAtributo(ficha.vezesEstourado), fin=atributos();
  return `<section class="cartao">
  <h2>Os ${attrTotal()} pontos</h2>
  <p class="explica">Mínimo ${R.ATRIBUTO_MIN}, teto ${teto}. São ${R.PONTOS_ATRIBUTO_CRIACAO} no Nível 1 e <b>+2 por Nível</b> depois disso —
    no Nível ${ficha.nivel} dá ${attrTotal()}. Bônus de Origem e Classe entram <b>por cima</b> destes pontos
    e aparecem na pílula escura; é o próprio livro que manda distribuir os pontos primeiro
    e só depois aplicar os bônus, pra você não gastar comprando o que ia ganhar de graça.</p>
  ${bonusOrigemFalta()>0 ? `<p class="dizer">A sua Origem ainda tem <b>${bonusOrigemFalta()}</b> ponto(s) de bônus pra colocar, na etapa Origem.</p>` : ""}
  <div class="grade-attr">${R.ATRIBUTOS.map(a=>{
    const base=ficha.atributosBase[a.id], extra=(fin[a.id]||0)-base;
    return `<div class="bloco-attr" style="--cor:${a.cor}">
      ${ico(ICONE[a.id])}<div class="v">${base}</div><span class="k">${a.nome}</span>
      ${extra?`<span class="mais">${extra>0?"+":""}${extra} → ${fin[a.id]}</span>`:""}
      <div class="pm">
        <button type="button" data-attr="${a.id}" data-d="-1" ${base<=R.ATRIBUTO_MIN?"disabled":""} aria-label="Menos ${a.nome}">−</button>
        <button type="button" data-attr="${a.id}" data-d="1" ${(base>=teto||attrSobra()<=0)?"disabled":""} aria-label="Mais ${a.nome}">+</button>
      </div></div>`;}).join("")}</div>
</section>`; },

2(){ const o=origem();
  return `<section class="cartao">
  <h2>De onde vem o poder</h2>
  <p class="explica">Toda Origem dá ${R.PONTOS_PERICIA_DA_ORIGEM} Pontos de Perícia, um bônus inicial e uma Marca no Nível 5.</p>
  <div class="escolhas">${R.ORIGENS.map((x,i)=>`
    <div class="op" role="radio" aria-checked="${ficha.origemId===x.id}" data-aberta="${ficha.origemId===x.id||(!ficha.origemId&&i===0)?1:0}" data-op="origem-${x.id}">
      <button class="cab" type="button" data-abrir><span class="seta">▸</span><span class="t"><b>${esc(x.nome)}</b><i>${esc(x.quando)}</i></span></button>
      <div class="miolo"><dl><dt>Bônus inicial</dt><dd>${esc(x.bonus)}</dd>
        ${x.obrigacao?`<dt>Obrigação</dt><dd>${esc(x.obrigacao)}</dd>`:""}
        <dt>Marca de Origem</dt><dd>${esc(x.marca)}</dd></dl>
        <button class="bt ${ficha.origemId===x.id?"feito":""}" type="button" data-origem="${x.id}">${ficha.origemId===x.id?"Escolhida":"Escolher"}</button>
      </div></div>`).join("")}</div>
  ${o&&(o.escolheAtributo||o.escolheEntre)?bonusOrigem(o):""}
</section>`; },

3(){ return `<section class="cartao">
  <h2>O que ele faz numa cena de ação</h2>
  <p class="explica">Classe não depende de Origem nem de Trilha.</p>
  <div class="escolhas">${R.CLASSES.map((c,i)=>`
    <div class="op" role="radio" aria-checked="${ficha.classeId===c.id}" data-aberta="${ficha.classeId===c.id||(!ficha.classeId&&i===0)?1:0}">
      <button class="cab" type="button" data-abrir><span class="seta">▸</span><span class="t"><b>${esc(c.nome)}</b><i>${esc(c.pergunta)}</i></span></button>
      <div class="miolo"><dl><dt>Foco</dt><dd>${esc(c.foco)}</dd>
        <dt>Bônus inicial</dt><dd>${esc(c.bonus)}</dd>
        <dt>Pontos de Perícia</dt><dd>${c.pontosPericia}</dd>
        <dt>Nível 1</dt><dd>${esc(c.nivel1)}</dd><dt>Nível 5</dt><dd>${esc(c.nivel5)}</dd></dl>
        <button class="bt ${ficha.classeId===c.id?"feito":""}" type="button" data-classe="${c.id}">${ficha.classeId===c.id?"Escolhida":"Escolher"}</button>
      </div></div>`).join("")}</div>
</section>`; },

4(){ const a=atributos(), teto=R.grauMaximoPorNivel(ficha.nivel);
  return `<section class="cartao">
  <h2>Perícias <small>teto ${R.GRAUS[teto].nome} no Nível ${ficha.nivel}</small></h2>
  <p class="explica">O bônus vem do <b>grau daquela perícia</b>, nunca do Nível. O custo é acumulado: subir paga só a diferença.</p>
  <div class="lista-per">${R.PERICIAS.map(p=>{
    const g=ficha.pericias[p.id]||0;
    return `<div class="per"><div class="nome"><b>${esc(p.nome)}</b><i>${p.attr} · ${esc(p.cobre)}</i></div>
      <div class="graus">${R.GRAUS.map((gr,i)=>{
        const custo=R.custoDoGrau(g,i), caro=i>g&&custo>perSobra();
        return `<button class="pip" type="button" data-per="${p.id}" data-grau="${i}" aria-pressed="${g===i}"
          ${(i>teto||caro)?"disabled":""} title="${esc(gr.nome)} · +${gr.bonus} · acumulado ${gr.custo}">${gr.custo}</button>`;}).join("")}</div>
      <div class="bon"><b>+${R.bonusDePericia(a,p,g)}</b><i>no teste</i></div></div>`;}).join("")}</div>
  <p class="explica" style="margin-top:12px">Os números dentro das bolinhas são o <b>custo acumulado</b> de cada grau
    (Destreinado 0 · Treinado 1 · Adepto 3 · Especialista 6 · Mestre 10). O número verde à direita é o que você
    <b>soma no d20</b> quando rolar essa perícia: o atributo dela mais o bônus do grau.</p>
</section>`; },

5(){ const a=atributos(), lim=R.limitePorAcao(a), tem=new Set(ficha.aplicacoes.map(x=>x.id));
  return `<section class="cartao">
  <h2>O Conceito</h2><p class="explica">O Conceito é o tema — o que o poder <b>é</b>. As Aplicações são o que ele <b>faz</b>.</p>
  <label class="campo"><span>Conceito, em uma linha</span>
    <input id="f-conceito" type="text" value="${esc(ficha.conceito)}" placeholder="Ferrugem — tudo que ele toca envelhece" autocomplete="off"></label>
</section>
<section class="cartao">
  <h2>Aplicações <small>${ficha.aplicacoes.length} de ${R.APLICACOES_MAX}</small></h2>
  <p class="explica">1 Ponto de Concepção cada. O <b>Custo Base</b> é a Carga pra ligar, e sai de dentro do seu Limite por Ação, que hoje é <b>${lim}</b>.</p>
  <div style="display:grid;gap:11px">${R.APLICACOES.map(x=>{
    const marcada=tem.has(x.id), minha=ficha.aplicacoes.find(y=>y.id===x.id);
    const morta=!R.aplicacaoLiga(x,a), cheio=!marcada&&ficha.aplicacoes.length>=R.APLICACOES_MAX;
    const rep=R.APLICACOES_COM_REPERTORIO.includes(x.id);
    return `<div class="apl" aria-checked="${marcada}">
      <div class="alto"><div class="t"><b>${esc(x.nome)}</b><div class="faz">${esc(x.faz)}</div>
        <div class="marcas">
          <span class="marca-n ${morta?"ruim":""}">Custo Base ${x.custoBaseTexto?esc(x.custoBaseTexto):x.custoBase}</span>
          ${x.danoBase?`<span class="marca-n">Dano Base ${x.danoBase}</span>`:x.danoBaseTexto?`<span class="marca-n">Dano ${esc(x.danoBaseTexto)}</span>`:""}
          <span class="marca-n">${esc(x.duracao)}</span>
          ${morta?`<span class="marca-n ruim">não liga com Limite ${lim}</span>`:""}
        </div></div>
        <button class="bt ${marcada?"feito":"calado"}" type="button" data-apl="${x.id}" ${cheio?"disabled":""}>${marcada?"Tirar":"Pegar"}</button>
      </div>
      <div class="extras">
        <div class="campo"><span>Reforços</span><div class="contador">
          <button class="pip" type="button" data-ref="${x.id}" data-d="-1" ${!(minha&&minha.reforcos)?"disabled":""}>−</button>
          <span class="v">${(minha&&minha.reforcos)||0}</span>
          <button class="pip" type="button" data-ref="${x.id}" data-d="1" ${conSobra()<=0?"disabled":""}>+</button></div></div>
        ${rep?`<div class="campo"><span>Formas no Repertório</span><div class="contador">
          <button class="pip" type="button" data-forma="${x.id}" data-d="-1" ${((minha&&minha.formas)||1)<=1?"disabled":""}>−</button>
          <span class="v">${(minha&&minha.formas)||1}</span>
          <button class="pip" type="button" data-forma="${x.id}" data-d="1">+</button>
          <span class="marca-n">custa ${R.custoDeRepertorio((minha&&minha.formas)||1)}</span></div></div>`:""}
        <label class="campo" style="flex:1;min-width:200px"><span>Como ela é, na ficção</span>
          <input type="text" data-nota="${x.id}" value="${esc((minha&&minha.nota)||"")}" placeholder="a ferrugem sobe pelo braço de quem ele encosta" autocomplete="off"></label>
      </div></div>`;}).join("")}</div>
</section>`; },

6(){ const a=atributos(), rank=R.rankDeTrilhaPorNivel(ficha.nivel);
  return `<section class="cartao">
  <h2>Trilha <small>Rank ${rank} no Nível ${ficha.nivel}</small></h2>
  <p class="explica">Ninguém carrega duas. Trilha de outra Classe custa 2 Pontos a partir do Nível 6, e cada uma pede uma Carga mínima.</p>
  <div class="escolhas">${R.TRILHAS.map((t,i)=>{
    const chk=R.checarCargaDeTrilha(t,a.CARGA), fora=R.custoDeTrilhaForaDaClasse(t,ficha.classeId,ficha.nivel);
    return `<div class="op" role="radio" aria-checked="${ficha.trilhaId===t.id}" data-aberta="${ficha.trilhaId===t.id||(!ficha.trilhaId&&i===0)?1:0}">
      <button class="cab" type="button" data-abrir><span class="seta">▸</span><span class="t"><b>${esc(t.nome)}</b>
        <i>${t.cargaMin?`Carga mínima ${t.cargaMin}`:"sem Carga mínima"}${fora?" · fora da sua Classe: +2 Pontos":""}</i></span></button>
      <div class="miolo"><dl><dt>Conceito</dt><dd>${esc(t.conceito)}</dd></dl>
        ${!chk.ok?`<p class="trava">${esc(chk.erro)}</p>`:chk.aviso?`<p class="trava morno">${esc(chk.aviso)}</p>`:""}
        <button class="bt ${ficha.trilhaId===t.id?"feito":""}" type="button" data-trilha="${t.id}" ${!chk.ok?"disabled":""}>${ficha.trilhaId===t.id?"Escolhida":"Escolher"}</button>
      </div></div>`;}).join("")}</div>
</section>
<section class="cartao">
  <h2>Lastro <small>opcional · teto ${R.tetoDeLastro(rank)}</small></h2>
  <p class="explica">Desvantagem permanente que compra Ponto de Concepção. O de meio ponto <b>só conta em par</b>.</p>
  <div class="escolhas">${R.LASTRO.map(l=>`
    <div class="op" role="checkbox" aria-checked="${ficha.lastro.includes(l.id)}">
      <button class="cab" type="button" data-lastro="${l.id}"><span class="seta" style="transform:none">${ficha.lastro.includes(l.id)?"✦":"▫"}</span>
        <span class="t"><b>${esc(l.nome)}</b><i>vale ${l.pontos} Ponto${l.pontos===1?"":"s"}</i></span></button>
    </div>`).join("")}</div>
  <p class="explica" style="margin:13px 0 0">Rende agora: <b>${R.pontosDeLastro(ficha.lastro)}</b> Ponto(s) de Concepção.</p>
</section>`; },

7(){ const a=atributos(), c=classe(), o=origem(), t=trilha();
  const li=(k,v)=>`<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`;
  const tre=Object.entries(ficha.pericias).filter(([,g])=>g>0);
  return `<section class="cartao">
  <h2>${esc(ficha.nome)||"Sem nome"} <small>Nível ${ficha.nivel}</small></h2>
  <p class="explica">${esc(ficha.descricao)||"Confira, salve, e abra na Câmara."}</p>
  <div class="resumo">
    <div class="caixa"><h4>Atributos</h4><ul>${R.ATRIBUTOS.map(x=>li(x.nome,a[x.id])).join("")}</ul></div>
    <div class="caixa"><h4>Derivados</h4><ul>
      ${li("Vida Máxima",R.vidaMaxima(a,ficha.classeId,ficha.nivel))}${li("Reserva de Carga",R.reservaMaxima(a,ficha.classeId))}
      ${li("Limite por Ação",R.limitePorAcao(a))}${li("Estouro máximo","+"+R.estouroMaximo(a))}
      ${li("Defesa Passiva",R.defesaPassiva(a))}${li("Redução",R.reducaoDeDano(a))}
      ${li("Iniciativa",R.iniciativa(a))}${li("Peso Máximo",R.pesoMaximo(a))}</ul></div>
    <div class="caixa"><h4>Quem é</h4><ul>${li("Classe",c?c.nome:"—")}${li("Origem",o?o.nome:"—")}${li("Trilha",t?t.nome:"—")}${li("Rank",R.rankDeTrilhaPorNivel(ficha.nivel))}</ul></div>
    <div class="caixa"><h4>Perícias treinadas</h4>${tre.length?`<ul>${tre.map(([id,g])=>{
      const p=R.PERICIAS.find(x=>x.id===id); return li(p.nome,`${R.GRAUS[g].nome} · +${R.bonusDePericia(a,p,g)}`);}).join("")}</ul>`:`<p class="nada">Nenhuma.</p>`}</div>
    <div class="caixa" style="grid-column:1/-1"><h4>Poder — ${esc(ficha.conceito)||"sem Conceito"}</h4>
      ${ficha.aplicacoes.length?`<ul>${ficha.aplicacoes.map(ap=>{
        const x=R.aplicacaoPorId(ap.id), partes=[`Custo Base ${x.custoBaseTexto||x.custoBase}`];
        if(x.danoBase)partes.push(`Dano Base ${x.danoBase}`);
        if(ap.reforcos)partes.push(`${ap.reforcos} Reforço(s)`);
        if((ap.formas||1)>1)partes.push(`${ap.formas} formas`);
        return `<li><span>${esc(x.nome)}${ap.nota?` — ${esc(ap.nota)}`:""}</span><b>${esc(partes.join(" · "))}</b></li>`;}).join("")}</ul>`:`<p class="nada">Nenhuma.</p>`}</div>
    ${ficha.lastro.length?`<div class="caixa" style="grid-column:1/-1"><h4>Lastro</h4><ul>${
      /* .filter(Boolean): um JSON escrito à mão (ou de uma versão antiga)
         pode trazer um Lastro que não existe mais na lista. Sem isto, um
         id desconhecido derrubava a Revisão INTEIRA com um TypeError —
         a tela mais importante do criador morria por causa de um item. */
      ficha.lastro.map(id=>R.LASTRO.find(x=>x.id===id)).filter(Boolean)
        .map(l=>li(l.nome,`${l.pontos} Ponto(s)`)).join("")}</ul></div>`:""}
  </div>
  <label class="campo" style="margin-top:16px"><span>Anotações, história, dívidas, promessas</span>
    <textarea id="f-anot" placeholder="O que ficou ecoando.">${esc(ficha.anotacoes)}</textarea></label>
  <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:16px">
    <button class="bt feito" type="button" id="b-camara">Jogar com esta ficha</button>
    <button class="bt calado" type="button" id="b-exportar">Exportar JSON</button>
    <button class="bt calado" type="button" onclick="window.print()">Imprimir</button>
  </div>
  <p class="explica" style="margin-top:13px">A ficha fica salva <b>neste navegador</b>. Trocou de aparelho ou limpou os dados do site e ela não está lá — exporte o JSON e guarde.</p>
</section>`; },
};

function retratoWidget(){
  const Rt = window.RSS.Retrato;
  const tem = !!ficha.retrato;
  const guardada = Rt && Rt.eGuardada(ficha.retrato);
  const peso = guardada ? Rt.pesoKB(ficha.retrato) : 0;
  return `<div class="retrato-campo">
    <div class="retrato-previa">${tem
      ? `<img src="${esc(ficha.retrato)}" alt="Retrato do personagem">`
      : `<svg viewBox="0 0 24 24"><use href="#i-carisma"/></svg>`}</div>
    <div class="retrato-acoes">
      <label class="bt calado" for="f-foto">Escolher do aparelho
        <input id="f-foto" type="file" accept="image/*" hidden></label>
      ${tem ? `<button class="bt perigo" type="button" id="b-tira-foto">Tirar</button>` : ""}
      <p class="retrato-nota">${
        guardada ? `Guardada na ficha · ${peso} KB · vai junto no JSON`
        : tem     ? `Link externo — some se o site de origem sair do ar`
        : `A imagem é reduzida pra 512px e guardada dentro da ficha, então ela viaja no JSON e não depende de link nenhum.`}</p>
      <details class="retrato-link"><summary>ou usar um link</summary>
        <input id="f-retrato" type="text" value="${guardada ? "" : esc(ficha.retrato)}" placeholder="https://..." autocomplete="off"></details>
    </div>
  </div>`;
}

function bonusOrigem(o){
  const alvos=o.escolheEntre?o.escolheEntre:R.ATRIBUTOS.map(x=>x.id), falta=bonusOrigemFalta();
  return `<div style="margin-top:18px;padding-top:18px;border-top:3px solid var(--traco)">
    <h3>Onde vai o bônus da Origem</h3>
    <p class="explica">${esc(o.bonus)} — falta colocar <b>${falta}</b>.</p>
    <div class="grade-attr">${alvos.map(id=>{
      const at=R.ATRIBUTOS.find(x=>x.id===id), posto=ficha.escolhaOrigem[id]||0;
      return `<div class="bloco-attr" style="--cor:${at.cor}">${ico(ICONE[id])}
        <div class="v">${posto>0?"+"+posto:"0"}</div><span class="k">${at.nome}</span>
        <div class="pm"><button type="button" data-bonus="${id}" data-d="-1" ${posto<=0?"disabled":""}>−</button>
        <button type="button" data-bonus="${id}" data-d="1" ${falta<=0?"disabled":""}>+</button></div></div>`;}).join("")}</div></div>`;
}

/* ── painel vivo ── */
function medidor(rot,gasto,total){
  const pct=total>0?Math.min(100,Math.max(0,gasto/total*100)):0;
  return `<div class="medidor ${gasto>total?"estourou":""}">
    <div class="topo-m"><span>${esc(rot)}</span><b>${gasto} / ${total}</b></div>
    <div class="cano" style="--c:${gasto>total?"var(--vida)":"var(--carga)"}"><span class="liq" style="width:${pct}%"></span></div></div>`;
}
function pintarPainel(){
  const a=atributos();
  const d=(r,v,f)=>`<div class="der"><span class="r">${esc(r)}</span><b>${esc(v)}</b><span class="f">${esc(f||"")}</span></div>`;
  $("#painel").innerHTML = `
    <section class="cartao"><h3>Orçamentos</h3>
      ${medidor("Pontos de atributo",attrGasto(),attrTotal())}
      ${origem()&&bonusOrigemTotal()>0?medidor("Bônus da Origem",bonusOrigemTotal()-bonusOrigemFalta(),bonusOrigemTotal()):""}
      ${medidor("Pontos de Perícia",perGasto(),perTotal())}
      ${medidor("Pontos de Concepção",conGasto(),conTotal())}</section>
    <section class="cartao"><h3>A ficha, agora</h3><div class="derivados">
      ${d("Limite / ação",R.limitePorAcao(a),"= atributo Carga")}
      ${d("Vida máxima",R.vidaMaxima(a,ficha.classeId,ficha.nivel),"10 + CON × 4")}
      ${d("Reserva",R.reservaMaxima(a,ficha.classeId),"(INT + Carga) × 2")}
      ${d("Estouro","+"+R.estouroMaximo(a),"metade da Carga")}
      ${d("Defesa",R.defesaPassiva(a),"10 + CON")}
      ${d("Redução",R.reducaoDeDano(a),"CON ÷ 2")}
      ${d("Iniciativa",R.iniciativa(a),"1d20 + DES")}
      ${d("Peso máximo",R.pesoMaximo(a),"Força × 2")}
    </div></section>`;
}

/* ── render ── */
function pintar(){
  $("#palco").innerHTML = T[etapa]();
  const probs = problemas();
  $("#etapas").innerHTML = NOMES.map((n,i)=>{
    const temErro = probs.some(p=>p.etapa===i);
    const incompleto = FALTA[i]() && !SO_RECADO.has(i);
    const cls = i===etapa ? "" : temErro ? "erro" : incompleto ? "" : "ok";
    return `<button class="etapa ${cls}" type="button" data-ir="${i}" ${i===etapa?'aria-current="step"':""}>
      <span class="n">${temErro&&i!==etapa?"!":i+1}</span>${esc(n)}</button>`;}).join("");
  pintarPainel();
  recado(probs);
  $("#b-voltar").disabled = etapa===0;
  $("#b-seguir").textContent = etapa===NOMES.length-1 ? "Salvar" : "Seguir";
  window.scrollTo({top:0,behavior:"smooth"});
}
const mexeu = () => { Arm.salvar(ficha); pintar(); };

/* O recado do rodapé e o estado do botão Seguir. Fica separado porque o
   pintar() e o leve() precisam dos dois, e quando só o leve() mexia no
   botão o aviso sumia: mudar o Nível travava o Seguir sem dizer por quê. */
function recado(probs){
  const daqui = probs.filter(p=>p.etapa===etapa), outro = probs.find(p=>p.etapa!==etapa);
  const falta = FALTA[etapa]();
  let txt="", ruim=false;
  if(daqui.length){ txt=daqui[0].txt; ruim=true; }
  else if(outro){ txt=`${outro.txt} (etapa ${outro.etapa+1} — ${NOMES[outro.etapa]})`; ruim=true; }
  else if(falta){ txt=falta; ruim=!SO_RECADO.has(etapa); }
  const d=$("#dizer"); d.textContent=txt; d.className="dizer"+(ruim?" ruim":"");
  $("#b-seguir").disabled = probs.length>0 || (!!falta && !SO_RECADO.has(etapa));
}

function leve(){ const p=problemas();
  recado(p);
  pintarPainel();
  $("#etapas").innerHTML = NOMES.map((n,i)=>{
    const e=p.some(x=>x.etapa===i), inc=FALTA[i]()&&!SO_RECADO.has(i);
    return `<button class="etapa ${i===etapa?"":e?"erro":inc?"":"ok"}" type="button" data-ir="${i}" ${i===etapa?'aria-current="step"':""}>
      <span class="n">${e&&i!==etapa?"!":i+1}</span>${esc(n)}</button>`;}).join("");
}

/* ── eventos ── */
document.addEventListener("click", ev=>{
  const q = s => ev.target.closest(s); let el;
  // ⚠ tem que ser ".ctrl button[data-pele]", nunca "[data-pele]" solto:
  // o <html> carrega data-pele, e como closest() sobe até ele, um seletor
  // solto casava em TODO clique da página e matava o criador inteiro.
  if((el=q(".ctrl button[data-pele]"))){
    document.documentElement.dataset.pele = el.dataset.pele;
    document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b===el));
    try{ localStorage.setItem("ressonancia:pele", el.dataset.pele); }catch{}
    return;
  }
  if((el=q("[data-ir]"))){ etapa=+el.dataset.ir; return pintar(); }
  if((el=q("[data-abrir]"))){ const c=el.closest(".op"); c.dataset.aberta = c.dataset.aberta==="1"?"0":"1"; return; }
  if((el=q("[data-attr]"))){
    const k=el.dataset.attr, d=+el.dataset.d, teto=R.tetoAtributo(ficha.vezesEstourado), n=ficha.atributosBase[k]+d;
    if(n<R.ATRIBUTO_MIN||n>teto) return; if(d>0&&attrSobra()<=0) return;
    ficha.atributosBase[k]=n; return mexeu(); }
  if((el=q("[data-origem]"))){ ficha.origemId=el.dataset.origem; ficha.escolhaOrigem={}; return mexeu(); }
  if((el=q("[data-bonus]"))){
    const k=el.dataset.bonus, d=+el.dataset.d, at=ficha.escolhaOrigem[k]||0;
    if(d>0&&bonusOrigemFalta()<=0) return; if(at+d<0) return;
    ficha.escolhaOrigem[k]=at+d; if(!ficha.escolhaOrigem[k]) delete ficha.escolhaOrigem[k]; return mexeu(); }
  if((el=q("[data-classe]"))){ ficha.classeId=el.dataset.classe; return mexeu(); }
  if((el=q("[data-per]"))){
    const id=el.dataset.per, novo=+el.dataset.grau, at=ficha.pericias[id]||0;
    if(R.custoDoGrau(at,novo)>perSobra()) return;
    if(novo===0) delete ficha.pericias[id]; else ficha.pericias[id]=novo; return mexeu(); }
  if((el=q("[data-apl]"))){
    const id=el.dataset.apl, i=ficha.aplicacoes.findIndex(x=>x.id===id);
    if(i>=0) ficha.aplicacoes.splice(i,1);
    else { if(ficha.aplicacoes.length>=R.APLICACOES_MAX) return;
           ficha.aplicacoes.push({id,reforcos:0,formas:1,nota:""}); }
    return mexeu(); }
  if((el=q("[data-ref]"))){
    const ap=ficha.aplicacoes.find(x=>x.id===el.dataset.ref); if(!ap) return;
    const d=+el.dataset.d; if(d>0&&conSobra()<=0) return;
    ap.reforcos=Math.max(0,(ap.reforcos||0)+d); return mexeu(); }
  if((el=q("[data-forma]"))){
    const ap=ficha.aplicacoes.find(x=>x.id===el.dataset.forma); if(!ap) return;
    const novo=Math.max(1,(ap.formas||1)+(+el.dataset.d));
    if(R.custoDeRepertorio(novo)-R.custoDeRepertorio(ap.formas||1)>conSobra()) return;
    ap.formas=novo; return mexeu(); }
  if((el=q("[data-trilha]"))){ ficha.trilhaId=el.dataset.trilha; return mexeu(); }
  if((el=q("[data-lastro]"))){
    const id=el.dataset.lastro, i=ficha.lastro.indexOf(id);
    if(i>=0) ficha.lastro.splice(i,1); else ficha.lastro.push(id);
    return mexeu(); }
  if(q("#b-tira-foto")){ ficha.retrato=""; return mexeu(); }
  if(q("#b-exportar")) return Arm.exportar(ficha);
  if(q("#b-camara")){ Arm.salvar(ficha); location.href="ficha.html?id="+encodeURIComponent(ficha.id); return; }
  if(q("#b-nova")){ if(!confirm("Começar uma ficha nova? A atual continua salva na estante.")) return;
    ficha=fichaNova(); etapa=0; history.replaceState(null,"","criar.html"); return mexeu(); }
  if(q("#b-estante")){ Arm.salvar(ficha); location.href="fichas.html"; return; }
});

document.addEventListener("input", ev=>{
  const t=ev.target, id=t.id;
  if(id==="f-nome"){ ficha.nome=t.value; Arm.salvar(ficha); return leve(); }
  if(id==="f-desc"){ ficha.descricao=t.value; return void Arm.salvar(ficha); }
  if(id==="f-retrato"){ ficha.retrato=t.value; return void Arm.salvar(ficha); }
  if(id==="f-conceito"){ ficha.conceito=t.value; Arm.salvar(ficha); return leve(); }
  if(id==="f-anot"){ ficha.anotacoes=t.value; return void Arm.salvar(ficha); }
  if(id==="f-nivel"){ ficha.nivel=Math.min(20,Math.max(1,parseInt(t.value)||1)); Arm.salvar(ficha); return leve(); }
  if(t.dataset.nota!==undefined){ const ap=ficha.aplicacoes.find(x=>x.id===t.dataset.nota);
    if(ap){ ap.nota=t.value; Arm.salvar(ficha); } }
});

document.addEventListener("change", async ev=>{
  if(ev.target.id==="f-foto"){
    const arq = ev.target.files && ev.target.files[0]; ev.target.value="";
    if(!arq) return;
    const nota = document.querySelector(".retrato-nota");
    if(nota) nota.textContent = "Reduzindo a imagem…";
    try{
      ficha.retrato = await window.RSS.Retrato.doArquivo(arq);
      if(!Arm.salvar(ficha)){
        ficha.retrato = "";
        alert("A imagem não coube no armazenamento deste navegador.\n\nApague alguma ficha antiga na estante e tente de novo, ou use um link em vez do arquivo.");
      }
    }catch(e){ alert("Não deu pra usar essa imagem: "+e.message); }
    return pintar();
  }
  if(ev.target.id!=="f-importar") return;
  const arq=ev.target.files&&ev.target.files[0]; if(!arq) return;
  try{ ficha=await Arm.importar(arq); etapa=NOMES.length-1; mexeu(); }
  catch(e){ alert("Não deu pra importar: "+e.message); }
  ev.target.value="";
});

$("#b-voltar").addEventListener("click",()=>{ if(etapa>0){etapa--;pintar();} });
$("#b-seguir").addEventListener("click",()=>{
  if(etapa<NOMES.length-1){ etapa++; pintar(); }
  else { Arm.salvar(ficha); const d=$("#dizer"); d.className="dizer";
         d.textContent="Ficha salva. Exporte o JSON pra não depender deste navegador."; }
});

/* ── início ── */
(function(){
  const T = window.TabulaTema;
  const slot = $("#troca-tema"); if(slot && T) slot.innerHTML = T.botao();
  if(T) T.aplicar(T.escolhido() || (window.RSS.CONFIG&&window.RSS.CONFIG.temaPadrao) || "cartoon", false);
  if(!Arm.temMemoria()) $("#sem-memoria").hidden=false;
  try{ const p=localStorage.getItem("ressonancia:pele");
    if(p){ document.documentElement.dataset.pele=p;
      document.querySelectorAll(".ctrl button[data-pele]").forEach(b=>b.setAttribute("aria-pressed", b.dataset.pele===p)); } }catch{}
  ficha = Arm.carregar(Arm.idAtual()) || fichaNova();
  const base = fichaNova();
  for(const k of Object.keys(base)) if(ficha[k]===undefined) ficha[k]=base[k];
  pintar();
})();
})();
