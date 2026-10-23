/* ═══ criador-fm.js — o montador de ficha de Feiticeiros & Maldições ═══
   Sistema do Projeto Onigiri (Setsugiri e Parker), v2.5.2.
   Os números todos saem de fm.js; esta tela só pergunta e mostra.
   Compartilha armazenamento, retrato e tema com os outros montadores. */
(function(){
"use strict";
const F = window.FM, Arm = window.RSS.Arm;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico = id => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
const ICONE = { FOR:"i-forca", DES:"i-destreza", CON:"i-constituicao",
                INT:"i-inteligencia", SAB:"i-carga", PRE:"i-carisma" };
const sinal = n => (n>=0?"+":"") + n;

const nova = () => ({
  id:Arm.novoId(), versao:1, sistema:"fm", edicao:"2.5.2",
  nome:"", retrato:"", descricao:"", nivel:1, grau:"Quarto Grau",
  metodo:"compra",
  base:{FOR:10,DES:10,CON:10,INT:10,SAB:10,PRE:10},
  origemId:"", claId:"", bonusOrigem:{},
  especId:"", chave:"", atrTecnica:"INT",
  pericias:{},            // nome -> "treinado" | "mestre"
  resistencias:{},        // nome -> "treinado" | "mestre"
  tecnica:{ nome:"", descricao:"", feiticos:[] },
  aspectos:{ tracos:"", ideais:"", ligacoes:"", complicacoes:"", dominio:"" },
  anotacoes:"",
});
let f = null, etapa = 0;

/* ── contas de apoio ──────────────────────────────────────────────── */
function atributos(){
  const a = {...f.base};
  for(const [k,v] of Object.entries(f.bonusOrigem||{})) a[k] = (a[k]||10) + (v||0);
  return a;
}
const org  = () => F.origemPorId(f.origemId);
const espc = () => F.espPorId(f.especId);
const pontosGastos = () => F.gastoTotal(f.base);
const pontosSobra  = () => F.PONTOS_COMPRA - pontosGastos();
/* quantos pontos a Origem ainda tem pra distribuir */
function bonusPrevisto(){
  const o = org(); if(!o) return 0;
  const b = o.bonus;
  if(b.tipo === "2e1")     return 3;
  if(b.tipo === "livre")   return b.pontos;
  if(b.tipo === "fisicos") return b.extra;
  return 0;   /* clã: vem pronto do clã, não se distribui aqui */
}
const bonusGasto = () => Object.values(f.bonusOrigem||{}).reduce((s,v)=>s+(v||0),0)
  - (org() && org().bonus.tipo==="fisicos" ? 3 : 0);   /* o +1/+1/+1 fixo não conta */

function periciasPermitidas(){
  const e = espc(); return e ? e.pericias.n : 0;
}
const periciasEscolhidas = () => Object.keys(f.pericias||{}).length;

/* ── o que falta, etapa por etapa ─────────────────────────────────── */
const NOMES = ["Identidade","Atributos","Origem","Especialização","Perícias","Técnica","Revisão"];
const FALTA = [
  () => !f.nome.trim() ? "Dê um nome ao personagem." : null,
  () => pontosSobra() !== 0 ? `Você ainda tem ${pontosSobra()} ponto(s) de compra por gastar.` : null,
  () => !f.origemId ? "Escolha uma Origem." : null,
  () => !f.especId ? "Escolha uma Especialização." : (!f.chave ? "Escolha o atributo-chave." : null),
  () => periciasEscolhidas() < periciasPermitidas()
        ? `Faltam ${periciasPermitidas()-periciasEscolhidas()} perícia(s) treinada(s).` : null,
  () => null,
  () => null,
];
/* Checagem global: trocar de Origem ou de Especialização depois de gastar
   vira erro silencioso se cada etapa só olhar pra si mesma. */
function problemas(){
  const p = [], o = org(), e = espc();
  /* O que cada etapa exige entra aqui também. Sem isso, uma ficha vazia
     chegava na Revisão dizendo "ficha fechada" — ela não checava o que
     ainda nem tinha sido escolhido, só o que estava contraditório. */
  FALTA.forEach((f,i) => { const t = f(); if(t) p.push({etapa:i, txt:t}); });
  if(pontosSobra() < 0) p.push({etapa:1, txt:`Você passou ${-pontosSobra()} ponto(s) de compra.`});
  const teto = Object.entries(f.base).find(([,v]) => v > 15 || v < 8);
  if(teto) p.push({etapa:1, txt:`${teto[0]} está em ${teto[1]}; a compra por pontos vai de 8 a 15.`});
  if(bonusGasto() > bonusPrevisto())
    p.push({etapa:2, txt:`A Origem dá ${bonusPrevisto()} ponto(s) de bônus e você distribuiu ${bonusGasto()}.`});
  if(o && o.bonus.tetoPorAtributo){
    const d = Object.entries(f.bonusOrigem||{}).find(([,v]) => v > o.bonus.tetoPorAtributo);
    if(d) p.push({etapa:2, txt:`${o.nome} permite no máximo +${o.bonus.tetoPorAtributo} no mesmo atributo.`});
  }
  if(o && e && o.prendeEspec && f.especId !== o.prendeEspec)
    p.push({etapa:3, txt:`A origem ${o.nome} obriga a especialização ${F.espPorId(o.prendeEspec).nome}.`});
  if(o && e && e.exigeOrigem && f.origemId !== e.exigeOrigem)
    p.push({etapa:3, txt:`A especialização ${e.nome} só existe para a origem ${F.origemPorId(e.exigeOrigem).nome}.`});
  if(o && e && (o.proibeEspec||[]).indexOf(f.especId) !== -1)
    p.push({etapa:3, txt:`Um ${o.nome} não pode ser ${e.nome}.`});
  if(e && f.chave && e.chave.indexOf(f.chave) === -1)
    p.push({etapa:3, txt:`${e.nome} não usa ${f.chave} como atributo-chave.`});
  if(periciasEscolhidas() > periciasPermitidas())
    p.push({etapa:4, txt:`Você treinou ${periciasEscolhidas()} perícias e a Especialização dá ${periciasPermitidas()}.`});
  if(e && e.pericias.proibidas)
    for(const pr of e.pericias.proibidas)
      if(f.pericias[pr]) p.push({etapa:4, txt:`${e.nome} não pode treinar ${pr}.`});
  if(o && o.semTecnica && (f.tecnica.nome || (f.tecnica.feiticos||[]).length))
    p.push({etapa:5, txt:`Um ${o.nome} não tem técnica nem Feitiços.`});
  return p;
}

/* ── retrato ──────────────────────────────────────────────────────── */
function retratoWidget(){
  return `<div class="retrato-cx">
    <div class="moldura">${f.retrato ? `<img src="${esc(f.retrato)}" alt="">` : ico("i-carga")}</div>
    <div>
      <label class="bt calado" for="f-foto" style="cursor:pointer">Escolher do aparelho
        <input id="f-foto" type="file" accept="image/*" hidden></label>
      ${f.retrato ? `<button class="bt calado" type="button" id="b-tira-foto">Tirar</button>` : ""}
      <p class="explica" style="margin-top:8px">A imagem é reduzida e guardada dentro da ficha, então ela viaja no JSON.</p>
    </div></div>`;
}

/* ── telas ────────────────────────────────────────────────────────── */
const T = {
0(){ return `<section class="cartao">
  <h2>Quem é</h2>
  <p class="explica">Nome, Nível e Grau. O Grau é só o que o Colégio Jujutsu escreveu no seu crachá — não muda número nenhum.</p>
  <div class="linha-campos">
    <label class="campo"><span>Nome</span><input id="f-nome" type="text" value="${esc(f.nome)}" placeholder="Kento Nanami" autocomplete="off"></label>
    <label class="campo"><span>Nível (1 a ${F.NIVEL_MAX})</span><input id="f-nivel" type="number" min="1" max="${F.NIVEL_MAX}" value="${f.nivel}"></label>
    <label class="campo"><span>Grau</span><select id="f-grau">${F.GRAUS.map(g =>
      `<option value="${esc(g)}" ${g===f.grau?"selected":""}>${esc(g)}</option>`).join("")}</select></label>
  </div>
  <label class="campo" style="margin-top:12px"><span>Em uma linha, quem ele é</span>
    <input id="f-desc" type="text" value="${esc(f.descricao)}" placeholder="Salaryman que largou o banco e voltou pro jujutsu" autocomplete="off"></label>
  <div class="campo" style="margin-top:14px"><span>Retrato</span>${retratoWidget()}</div>
</section>

<section class="cartao">
  <h2>Aspectos pessoais</h2>
  <p class="explica">Não dão número. Dão a Inspiração e o que o Narrador usa contra você — o que é melhor.</p>
  ${[["tracos","Traços de personalidade","Obediente a quem respeita, rebelde a quem despreza"],
     ["ideais","Ideais","Eu sou uma engrenagem para os feiticeiros continuarem exorcizando"],
     ["ligacoes","Ligações","A aliança que minha amiga de infância me deu"],
     ["complicacoes","Complicações","Não posso sair como derrotado, então aceito qualquer desafio"],
     ["dominio","Domínio inato","Qual seria o lugar que define o seu personagem?"]].map(([k,r,p]) =>
    `<label class="campo" style="margin-top:10px"><span>${r}</span>
      <input type="text" data-asp="${k}" value="${esc(f.aspectos[k]||"")}" placeholder="${esc(p)}" autocomplete="off"></label>`).join("")}
</section>`; },

1(){ const a = f.base;
  return `<section class="cartao">
  <h2>Compra por pontos</h2>
  <p class="explica">Todos começam em <b>10</b> e você tem <b>${F.PONTOS_COMPRA} pontos</b>, com teto de 15 em um mesmo atributo.
    Baixar para 9 ou 8 <b>devolve</b> ponto. É o método do livro, p.18.</p>
  <div class="grade-attr">${F.ATRIBUTOS.map(([id,nome,texto]) => {
    const v = a[id], m = F.mod(v), prox = F.custoDe(v+1) - F.custoDe(v);
    return `<div class="bloco-attr" title="${esc(texto)}">
      ${ico(ICONE[id])}<div class="v">${v}</div><span class="k">${esc(nome)}</span>
      <span class="mais">mod ${sinal(m)}${v<15?` · +1 custa ${prox}`:""}</span>
      <div class="pm">
        <button type="button" data-attr="${id}" data-d="-1" ${v<=8?"disabled":""} aria-label="Menos ${esc(nome)}">−</button>
        <button type="button" data-attr="${id}" data-d="1" ${v>=15||pontosSobra()<prox?"disabled":""} aria-label="Mais ${esc(nome)}">+</button>
      </div></div>`;}).join("")}</div>
  <p class="dizer ${pontosSobra()===0?"ok":pontosSobra()<0?"ruim":""}" style="margin-top:14px">
    ${pontosSobra()===0 ? "Os 17 pontos estão gastos." : pontosSobra()>0
      ? `Sobram ${pontosSobra()} ponto(s).` : `Você passou ${-pontosSobra()} ponto(s).`}</p>
  <p class="explica">Os bônus da Origem entram na próxima etapa, por cima destes valores.</p>
</section>`; },

2(){ const o = org();
  return `<section class="cartao">
  <h2>Origem</h2>
  <p class="explica">De onde veio a sua energia amaldiçoada. É a escolha que mais muda o personagem fora do combate.</p>
  <div class="escolhas">${F.ORIGENS.map(x => `
    <button class="escolha" type="button" data-origem="${x.id}" aria-pressed="${x.id===f.origemId}">
      <b>${esc(x.nome)}</b><i>${esc(x.resumo)}</i>
      <span class="ex">como ${esc(x.exemplos)}</span></button>`).join("")}</div>
</section>
${o ? `<section class="cartao">
  <h2>${esc(o.nome)}</h2>
  <dl class="lista-tracos">${o.tracos.map(([t,d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>
  ${o.pedeCla ? `<div class="campo" style="margin-top:12px"><span>Clã</span>
    <select id="f-cla"><option value="">— escolha —</option>${F.CLAS.map(c =>
      `<option value="${c.id}" ${c.id===f.claId?"selected":""}>${esc(c.nome)} — ${esc(c.resumo)}</option>`).join("")}</select></div>
    <p class="explica">Os bônus de atributo e os treinamentos do clã saem do livro, no capítulo Heranças de Clãs (p.29).
      Anote-os à mão em Revisão: eles variam demais pra caber num formulário.</p>`
  : bonusPrevisto() ? `
    <p class="explica" style="margin-top:12px">${o.bonus.tipo==="2e1"
      ? "Aumente <b>um</b> atributo em 2 e <b>outro</b> em 1."
      : o.bonus.tipo==="fisicos"
        ? "Força, Destreza e Constituição já receberam +1 cada. Distribua os <b>2 pontos</b> restantes entre eles."
        : `Distribua <b>${o.bonus.pontos} ponto(s)</b>${o.bonus.tetoPorAtributo?`, no máximo +${o.bonus.tetoPorAtributo} no mesmo atributo`:""}.`}</p>
    <div class="grade-attr">${F.ATRIBUTOS.map(([id,nome]) => {
      const lim = o.bonus.tipo==="fisicos" ? (o.bonus.extraEm.indexOf(id)!==-1) : true;
      const b = (f.bonusOrigem||{})[id] || 0;
      const teto = o.bonus.tipo==="2e1" ? 2 : (o.bonus.tetoPorAtributo || o.bonus.pontos || o.bonus.extra || 0);
      return `<div class="bloco-attr" style="${lim?"":"opacity:.35"}">
        ${ico(ICONE[id])}<div class="v">${f.base[id] + b}</div><span class="k">${esc(nome)}</span>
        <span class="mais">${b?`+${b} da Origem`:"sem bônus"}</span>
        <div class="pm">
          <button type="button" data-bon="${id}" data-d="-1" ${!lim||b<=0?"disabled":""}>−</button>
          <button type="button" data-bon="${id}" data-d="1" ${!lim||b>=teto||bonusGasto()>=bonusPrevisto()?"disabled":""}>+</button>
        </div></div>`;}).join("")}</div>
    <p class="dizer ${bonusGasto()===bonusPrevisto()?"ok":""}">${bonusGasto()} de ${bonusPrevisto()} ponto(s) de Origem distribuído(s).</p>`
  : ""}
</section>` : ""}`; },

3(){ const e = espc(), o = org();
  const liberada = x => !(o && o.proibeEspec && o.proibeEspec.indexOf(x.id) !== -1)
                     && !(x.exigeOrigem && (!o || o.id !== x.exigeOrigem));
  return `<section class="cartao">
  <h2>Especialização</h2>
  <p class="explica">É a classe. Define Pontos de Vida, Pontos de Energia, treinamentos e as habilidades base.</p>
  <div class="escolhas">${F.ESPECIALIZACOES.map(x => `
    <button class="escolha" type="button" data-espec="${x.id}" aria-pressed="${x.id===f.especId}"
      ${liberada(x)?"":"disabled title=\"indisponível para a sua Origem\""} style="${liberada(x)?"":"opacity:.4"}">
      <b>${esc(x.nome)}</b><i>${esc(x.resumo)}</i>
      <span class="ex">PV ${x.pv}+CON · ${x.semEnergia?"sem PE (usa Estamina)":`PE ${x.pe}/nível`} · ${x.dadoVida}</span></button>`).join("")}</div>
</section>
${e ? `<section class="cartao">
  <h2>${esc(e.nome)}</h2>
  <p class="explica">${esc(e.base)}</p>
  <dl class="lista-tracos">
    <dt>Pontos de Vida</dt><dd>${e.pv} + mod. de Constituição no 1° nível; depois ${e.dadoVida} (ou ${e.pvNivel} fixo) + mod. de Constituição por nível.</dd>
    <dt>Pontos de Energia</dt><dd>${e.semEnergia ? "Nenhum. Um Restringido usa Pontos de Estamina."
      : `${e.pe} por nível${e.peAtributo?", somando uma única vez o modificador do atributo de técnica":""}.`}</dd>
    <dt>Treinamentos</dt><dd>${esc(e.treinos)}</dd>
    <dt>Multiclasse</dt><dd>${esc(e.multiclasse)}</dd>
  </dl>
  <div class="campo" style="margin-top:12px"><span>Atributo-chave (a CD de Especialização sai dele)</span>
    <div class="fileira-bt">${e.chave.map(k =>
      `<button class="escolha mini" type="button" data-chave="${k}" aria-pressed="${k===f.chave}">${k}</button>`).join("")}</div></div>
  ${e.semEnergia ? "" : `<div class="campo" style="margin-top:12px"><span>Atributo da técnica (a CD de Técnica sai dele)</span>
    <div class="fileira-bt">${F.ATRIBUTOS.map(([k]) =>
      `<button class="escolha mini" type="button" data-atec="${k}" aria-pressed="${k===f.atrTecnica}">${k}</button>`).join("")}</div></div>`}
</section>` : ""}`; },

4(){ const e = espc(), a = atributos();
  if(!e) return `<section class="cartao"><h2>Perícias</h2>
    <p class="explica">Escolha a Especialização antes: é ela que diz quantas perícias você treina.</p></section>`;
  const sobra = periciasPermitidas() - periciasEscolhidas();
  return `<section class="cartao">
  <h2>Perícias</h2>
  <p class="explica">${esc(e.treinos)}<br>
    <b>Treinado</b> soma o bônus de maestria (${F.treinamento(f.nivel)}); <b>mestre</b> soma uma vez e meia.
    Todo mundo soma metade do nível (${F.metadeNivel(f.nivel)}) e o modificador do atributo, treinado ou não.</p>
  <p class="dizer ${sobra===0?"ok":sobra<0?"ruim":""}">${sobra===0?"Todas as perícias escolhidas."
    : sobra>0?`Faltam ${sobra}.`:`${-sobra} a mais do que a Especialização dá.`}</p>
  <div class="tabela-per">${F.PERICIAS.map(([nome,at]) => {
    const g = f.pericias[nome] || "", proibida = (e.pericias.proibidas||[]).indexOf(nome) !== -1;
    return `<div class="linha-per${proibida?" proibida":""}">
      <b>${esc(nome)}</b><span class="at">${at}</span>
      <span class="val">${sinal(F.bonusPericia(a, at, f.nivel, g))}</span>
      <span class="gr">
        <button type="button" data-per="${esc(nome)}" data-g="" aria-pressed="${g===""}" ${proibida?"disabled":""}>—</button>
        <button type="button" data-per="${esc(nome)}" data-g="treinado" aria-pressed="${g==="treinado"}" ${proibida?"disabled":""}>treino</button>
        <button type="button" data-per="${esc(nome)}" data-g="mestre" aria-pressed="${g==="mestre"}" ${proibida?"disabled":""}>mestre</button>
      </span></div>`;}).join("")}</div>
</section>

<section class="cartao">
  <h2>Testes de resistência</h2>
  <p class="explica">A sua Especialização concede um (o Restringido, dois). Marque o que ela deu.</p>
  <div class="tabela-per">${F.RESISTENCIAS.map(([nome,at,txt]) => {
    const g = f.resistencias[nome] || "";
    return `<div class="linha-per" title="${esc(txt)}">
      <b>${esc(nome)}</b><span class="at">${at}</span>
      <span class="val">${sinal(F.bonusPericia(a, at, f.nivel, g))}</span>
      <span class="gr">
        <button type="button" data-res="${esc(nome)}" data-g="" aria-pressed="${g===""}">—</button>
        <button type="button" data-res="${esc(nome)}" data-g="treinado" aria-pressed="${g==="treinado"}">treino</button>
        <button type="button" data-res="${esc(nome)}" data-g="mestre" aria-pressed="${g==="mestre"}">mestre</button>
      </span></div>`;}).join("")}</div>
</section>`; },

5(){ const o = org();
  if(o && o.semTecnica) return `<section class="cartao">
    <h2>Técnica</h2>
    <p class="explica">Um <b>${esc(o.nome)}</b> não tem técnica amaldiçoada nem acesso a Feitiços — é o preço da origem,
      e a compensação vem em perícia, talento e ferramenta. Nada a preencher aqui.</p></section>`;
  const fs = f.tecnica.feiticos || [];
  return `<section class="cartao">
  <h2>Técnica amaldiçoada</h2>
  <p class="explica">Todo personagem começa com <b>dois Feitiços</b>. Um Inato ganha um terceiro, com custo reduzido em 1 PE.
    O capítulo de Criação de Técnica (p.196) é onde os feitiços são montados de verdade; aqui você só os registra.</p>
  <label class="campo"><span>Nome da técnica</span>
    <input id="f-tec-nome" type="text" value="${esc(f.tecnica.nome)}" placeholder="Proporções" autocomplete="off"></label>
  <label class="campo" style="margin-top:10px"><span>Funcionamento básico</span>
    <textarea id="f-tec-desc" rows="3" placeholder="O que a técnica faz, em uma frase que caiba na mesa.">${esc(f.tecnica.descricao)}</textarea></label>
</section>

<section class="cartao">
  <h2>Feitiços <span class="conta">${fs.length}</span></h2>
  ${fs.length ? `<div class="lista-feiticos">${fs.map((x,i) => `
    <div class="feitico">
      <input type="text" data-fnome="${i}" value="${esc(x.nome)}" placeholder="Nome do feitiço" autocomplete="off">
      <label class="mini-campo"><span>Nível</span>
        <input type="number" data-fniv="${i}" min="0" max="5" value="${x.nivel||0}"></label>
      <label class="mini-campo"><span>Custo PE</span>
        <input type="number" data-fcusto="${i}" min="0" max="20" value="${x.custo||0}"></label>
      <button class="bt perigo" type="button" data-tira-f="${i}">Tirar</button>
      <textarea data-fdesc="${i}" rows="2" placeholder="O que acontece quando você usa.">${esc(x.descricao||"")}</textarea>
    </div>`).join("")}</div>` : `<p class="explica">Nenhum feitiço ainda.</p>`}
  <button class="bt" type="button" id="b-add-f" style="margin-top:12px">Adicionar feitiço</button>
</section>`; },

6(){ const a = atributos(), e = espc(), o = org();
  const pr = problemas();
  const nums = e ? [
    ["Pontos de Vida", F.pvMaximo(a, f.especId, f.nivel), `${e.pv} + CON, ${e.pvNivel}+CON por nível`],
    ["Pontos de Energia", e.semEnergia ? "—" : F.peMaximo(a, f.especId, f.nivel, f.atrTecnica), e.semEnergia?"Restringido usa Estamina":`${e.pe}/nível${e.peAtributo?" + mod. de técnica":""}`],
    ["Integridade da Alma", F.integridade(a, f.especId, f.nivel), "igual ao PV máximo"],
    ["Defesa", F.defesa(a, f.nivel), "10 + DES + metade do nível"],
    ["Iniciativa", sinal(F.iniciativa(a)), "mod. de Destreza"],
    ["Atenção", F.atencao(a, f.nivel, f.pericias["Percepção"]||""), "10 + Percepção"],
    ["Deslocamento", F.deslocamento(f.origemId) + " m", o && o.id==="restringido" ? "9 + 3 do Físico Abençoado" : "padrão"],
    ["Maestria", sinal(F.treinamento(f.nivel)), "1 + nível ÷ 4, pra cima"],
    ["CD de Especialização", f.chave ? F.cdDe(a, f.chave, f.nivel) : "—", f.chave?`10 + ${f.chave} + maestria + metade do nível`:"escolha o atributo-chave"],
    ["CD de Técnica", (o&&o.semTecnica) ? "—" : F.cdDe(a, f.atrTecnica, f.nivel), (o&&o.semTecnica)?"sem técnica":`10 + ${f.atrTecnica} + maestria + metade do nível`],
    ["Dado de Vida", `${f.nivel}${e.dadoVida}`, "um por nível"],
    ["Carga", F.limiteCarga(a) + " espaços", "mod. de Força × 2 + 8"],
  ] : [];
  return `<section class="cartao">
  <h2>${esc(f.nome)||"Sem nome"}</h2>
  <p class="explica">${esc(o?o.nome:"sem Origem")} · ${esc(e?e.nome:"sem Especialização")} · nível ${f.nivel} · ${esc(f.grau)}</p>
  ${pr.length ? `<div class="alerta"><b>Falta acertar:</b><ul>${pr.map(x =>
    `<li><button type="button" data-ir="${x.etapa}">${esc(NOMES[x.etapa])}</button> — ${esc(x.txt)}</li>`).join("")}</ul></div>`
    : `<p class="dizer ok">Ficha fechada. Os números abaixo já valem na mesa.</p>`}
  ${e ? `<div class="grade-nums">${nums.map(([k,v,d]) =>
    `<div class="num"><span class="k">${esc(k)}</span><b>${esc(String(v))}</b><i>${esc(d)}</i></div>`).join("")}</div>` : ""}
</section>

<section class="cartao">
  <h2>Anotações</h2>
  <p class="explica">Herança de clã, talentos, estilo de combate, dádivas, núcleos — o que o formulário não cabe.</p>
  <textarea id="f-anot" rows="5" placeholder="Estilo do Duelista. Talento: Incremento de Atributo (Força 18)…">${esc(f.anotacoes)}</textarea>
  <div class="fileira-bt" style="margin-top:14px">
    <button class="bt calado" type="button" id="b-exportar">Exportar JSON</button>
    <a class="bt calado" href="fichas.html">Minhas fichas</a>
  </div>
</section>`; },
};

/* ── painel lateral ───────────────────────────────────────────────── */
function painel(){
  const a = atributos(), e = espc();
  return `<div class="cartao vivo">
    <h3>A ficha, agora</h3>
    <div class="mini-attrs">${F.ATRIBUTOS.map(([id,nome]) =>
      `<div><b>${a[id]}</b><span>${id}</span><i>${sinal(F.mod(a[id]))}</i></div>`).join("")}</div>
    ${e ? `<div class="grade-nums peq">
      <div class="num"><span class="k">Vida</span><b>${F.pvMaximo(a,f.especId,f.nivel)}</b></div>
      <div class="num"><span class="k">Energia</span><b>${e.semEnergia?"—":F.peMaximo(a,f.especId,f.nivel,f.atrTecnica)}</b></div>
      <div class="num"><span class="k">Defesa</span><b>${F.defesa(a,f.nivel)}</b></div>
      <div class="num"><span class="k">Maestria</span><b>${sinal(F.treinamento(f.nivel))}</b></div>
    </div>` : `<p class="explica">Escolha a Especialização pra ver Vida e Energia.</p>`}
  </div>`;
}

/* ── pintura ──────────────────────────────────────────────────────── */
function pintar(){
  /* Mesmas classes do criador do Saa e do Ressonância — .etapa e .n — pra
     usar o visual que já existe em criador.css em vez de inventar outro. */
  const pr0 = problemas();
  $("#etapas").innerHTML = NOMES.map((n,i) => {
    const erro = pr0.some(x => x.etapa === i), inc = FALTA[i]();
    return `<button class="etapa ${i===etapa?"":erro?"erro":inc?"":"ok"}" type="button" data-ir="${i}"
      ${i===etapa?'aria-current="step"':""}><span class="n">${erro&&i!==etapa?"!":i+1}</span>${esc(n)}</button>`;
  }).join("");
  $("#palco").innerHTML = T[etapa]();
  $("#painel").innerHTML = painel();
  const d = $("#dizer"), falta = FALTA[etapa](), pr = problemas();
  d.className = "dizer" + (pr.length ? " ruim" : falta ? "" : " ok");
  d.textContent = pr.length ? pr[0].txt : (falta || (etapa === NOMES.length-1 ? "Pronto." : "Pode seguir."));
  $("#b-voltar").disabled = etapa === 0;
  $("#b-seguir").textContent = etapa === NOMES.length-1 ? "Salvar" : "Seguir";
}
const mexeu = () => { Arm.salvar(f); pintar(); };

/* ── eventos ──────────────────────────────────────────────────────── */
document.addEventListener("click", ev => {
  const q = s => ev.target.closest(s); let el;
  if((el = q(".ctrl button[data-pele]"))){
    document.documentElement.dataset.pele = el.dataset.pele;
    document.querySelectorAll(".ctrl button[data-pele]").forEach(b => b.setAttribute("aria-pressed", b === el));
    try{ localStorage.setItem("ressonancia:pele", el.dataset.pele); }catch{}
    return;
  }
  if((el = q("[data-ir]"))){ etapa = +el.dataset.ir; return pintar(); }
  if((el = q("[data-attr]"))){
    const k = el.dataset.attr, d = +el.dataset.d, v = f.base[k] + d;
    if(v < 8 || v > 15) return;
    if(d > 0 && F.custoDe(v) - F.custoDe(f.base[k]) > pontosSobra()) return;
    f.base[k] = v; return mexeu();
  }
  if((el = q("[data-bon]"))){
    const k = el.dataset.bon, d = +el.dataset.d;
    f.bonusOrigem = f.bonusOrigem || {};
    const v = (f.bonusOrigem[k] || 0) + d;
    if(v < 0) return;
    if(d > 0 && bonusGasto() >= bonusPrevisto()) return;
    if(v === 0) delete f.bonusOrigem[k]; else f.bonusOrigem[k] = v;
    return mexeu();
  }
  if((el = q("[data-origem]"))){
    if(f.origemId !== el.dataset.origem){ f.origemId = el.dataset.origem; f.bonusOrigem = {}; f.claId = ""; }
    const o = org();
    if(o && o.bonus.tipo === "fisicos") f.bonusOrigem = {FOR:1,DES:1,CON:1};
    if(o && o.prendeEspec) f.especId = o.prendeEspec;
    return mexeu();
  }
  if((el = q("[data-espec]"))){
    if(f.especId !== el.dataset.espec){ f.especId = el.dataset.espec; f.chave = ""; f.pericias = {}; }
    return mexeu();
  }
  if((el = q("[data-chave]"))){ f.chave = el.dataset.chave; return mexeu(); }
  if((el = q("[data-atec]"))){ f.atrTecnica = el.dataset.atec; return mexeu(); }
  if((el = q("[data-per]"))){
    const n = el.dataset.per, g = el.dataset.g;
    if(!g) delete f.pericias[n]; else f.pericias[n] = g;
    return mexeu();
  }
  if((el = q("[data-res]"))){
    const n = el.dataset.res, g = el.dataset.g;
    if(!g) delete f.resistencias[n]; else f.resistencias[n] = g;
    return mexeu();
  }
  if(q("#b-add-f")){ f.tecnica.feiticos = f.tecnica.feiticos || [];
    f.tecnica.feiticos.push({nome:"", nivel:0, custo:0, descricao:""}); return mexeu(); }
  if((el = q("[data-tira-f]"))){ f.tecnica.feiticos.splice(+el.dataset.tiraF, 1); return mexeu(); }
  if(q("#b-tira-foto")){ f.retrato = ""; return mexeu(); }
  if(q("#b-exportar")) return Arm.exportar(f);
  if(q("#b-nova")){ if(!confirm("Começar uma ficha nova? A atual continua salva.")) return;
    f = nova(); etapa = 0; return mexeu(); }
});

document.addEventListener("input", ev => {
  const t = ev.target, id = t.id;
  if(id === "f-nome"){ f.nome = t.value; Arm.salvar(f); const h = document.querySelector("#palco h2"); return; }
  if(id === "f-desc"){ f.descricao = t.value; return void Arm.salvar(f); }
  if(id === "f-anot"){ f.anotacoes = t.value; return void Arm.salvar(f); }
  if(id === "f-tec-nome"){ f.tecnica.nome = t.value; return void Arm.salvar(f); }
  if(id === "f-tec-desc"){ f.tecnica.descricao = t.value; return void Arm.salvar(f); }
  if(id === "f-nivel"){
    const n = Math.max(1, Math.min(F.NIVEL_MAX, +t.value || 1));
    f.nivel = n; return mexeu();
  }
  if(t.dataset.asp !== undefined){ f.aspectos[t.dataset.asp] = t.value; return void Arm.salvar(f); }
  if(t.dataset.fnome !== undefined){ f.tecnica.feiticos[+t.dataset.fnome].nome = t.value; return void Arm.salvar(f); }
  if(t.dataset.fdesc !== undefined){ f.tecnica.feiticos[+t.dataset.fdesc].descricao = t.value; return void Arm.salvar(f); }
  if(t.dataset.fniv !== undefined){ f.tecnica.feiticos[+t.dataset.fniv].nivel = +t.value || 0; return void Arm.salvar(f); }
  if(t.dataset.fcusto !== undefined){ f.tecnica.feiticos[+t.dataset.fcusto].custo = +t.value || 0; return void Arm.salvar(f); }
});

document.addEventListener("change", async ev => {
  const t = ev.target;
  if(t.id === "f-grau"){ f.grau = t.value; return mexeu(); }
  if(t.id === "f-cla"){ f.claId = t.value; return mexeu(); }
  if(t.id === "f-foto"){
    const arq = t.files && t.files[0]; t.value = ""; if(!arq) return;
    try{ f.retrato = await window.RSS.Retrato.doArquivo(arq);
      if(!Arm.salvar(f)){ f.retrato = ""; alert("A imagem não coube no armazenamento deste navegador."); }
    }catch(e){ alert("Não deu pra usar essa imagem: " + e.message); }
    return pintar();
  }
  if(t.id === "f-importar"){
    const arq = t.files && t.files[0]; t.value = ""; if(!arq) return;
    try{ const j = await Arm.importar(arq);
      if(j.sistema !== "fm"){ alert("Essa ficha não é de Feiticeiros & Maldições."); return; }
      f = j; etapa = NOMES.length - 1; mexeu();
    }catch(e){ alert("Não deu pra importar: " + e.message); }
  }
});

$("#b-voltar").addEventListener("click", () => { if(etapa > 0){ etapa--; pintar(); } });
$("#b-seguir").addEventListener("click", () => {
  if(etapa < NOMES.length - 1){ etapa++; pintar(); }
  else { Arm.salvar(f); const d = $("#dizer"); d.className = "dizer";
    d.textContent = "Ficha salva. Exporte o JSON pra não depender deste navegador."; }
});

(function(){
  const Tm = window.TabulaTema;
  const slot = $("#troca-tema"); if(slot && Tm) slot.innerHTML = Tm.botao();
  if(Tm) Tm.aplicar(Tm.escolhido() || (window.RSS.CONFIG && window.RSS.CONFIG.temaPadrao) || "escuro", false);
  if(!Arm.temMemoria()){ const m = $("#sem-memoria"); if(m) m.hidden = false; }
  const salva = Arm.carregar(Arm.idAtual());
  f = (salva && salva.sistema === "fm") ? salva : nova();
  const base = nova();
  for(const k of Object.keys(base)) if(f[k] === undefined) f[k] = base[k];
  pintar();
})();
})();
