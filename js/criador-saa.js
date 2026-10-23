/* ═══ criador-saa.js — o montador de ficha do Saa ═══
   Ficha própria, não o formulário do Ressonância remendado: o Saa tem três
   atributos, nenhuma DC e nenhuma rolagem de dano, então a tela é outra.
   Compartilha o armazenamento, o retrato e os temas; os números vêm do saa.js. */
(function(){
"use strict";
const S = window.SAA, Arm = window.RSS.Arm;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico = id => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
const ICONE = { CORPO:"i-forca", MENTE:"i-inteligencia", ESPIRITO:"i-carga" };

const nova = () => ({
  id:Arm.novoId(), versao:1, sistema:"saa", edicao:S.EDICAO,
  nome:"", retrato:"", descricao:"",
  atributos:{ CORPO:0, MENTE:0, ESPIRITO:0 },
  estudos:[], tecnicas:[], itens:[], anotacoes:"",
});
let f = null, etapa = 0;

const gasto  = () => S.ATRIBUTOS.reduce((s,a)=>s+(f.atributos[a.id]||0), 0);
const sobra  = () => S.PONTOS_INICIAIS - gasto();
const conhec = () => S.conhecimentoMaximo(f.atributos);

const NOMES = ["Identidade","Atributos","Estudos","Técnicas","Itens","Revisão"];
const FALTA = [
  () => !f.nome.trim() ? "Dê um nome ao personagem." : null,
  () => sobra()>0 ? `Ainda sobram ${sobra()} ponto(s) de atributo.` : null,
  () => !f.estudos.length ? "Todo Saaísta precisa de ao menos um Estudo." : null,
  () => null,
  () => null,
  () => null,
];
/* Estouro é erro em qualquer etapa; falta de Técnica e de Item, não. */
function problemas(){
  const p = [];
  if(sobra()<0) p.push({etapa:1, txt:`Você passou ${-sobra()} ponto(s) de atributo.`});
  if(f.estudos.length > S.maxEstudos(f.atributos))
    p.push({etapa:2, txt:`Você tem ${f.estudos.length} Estudos e o Conhecimento só permite ${S.maxEstudos(f.atributos)}.`});
  if(f.tecnicas.length > S.maxTecnicas(f.atributos))
    p.push({etapa:3, txt:`Você tem ${f.tecnicas.length} Técnicas e o Conhecimento só permite ${S.maxTecnicas(f.atributos)}.`});
  const ruim = f.tecnicas.find(t => (t.estudos||[]).filter(Boolean).length !== S.ESTUDOS_POR_TECNICA);
  if(ruim) p.push({etapa:3, txt:`A Técnica “${ruim.nome || "sem nome"}” precisa de exatamente ${S.ESTUDOS_POR_TECNICA} Estudos diferentes.`});
  return p;
}

const T = {
0(){ return `<section class="cartao">
  <h2>Quem é</h2><p class="explica">O Saa não tem Nível: o personagem cresce pelos Estudos.</p>
  <div class="linha-campos">
    <label class="campo"><span>Nome</span><input id="f-nome" type="text" value="${esc(f.nome)}" placeholder="Yun" autocomplete="off"></label>
    <label class="campo"><span>Em uma linha, quem ele é</span><input id="f-desc" type="text" value="${esc(f.descricao)}" placeholder="Andarilho que aprendeu a ouvir a montanha" autocomplete="off"></label>
  </div>
  <div class="campo" style="margin-top:14px"><span>Retrato</span>${retratoWidget()}</div>
</section>`; },

1(){ const a=f.atributos;
  return `<section class="cartao">
  <h2>Os ${S.PONTOS_INICIAIS} pontos</h2>
  <p class="explica">Três atributos, e cada <b>2 pontos</b> viram <b>+1 de modificador</b>.
    O modificador de cada um <b>é</b> o recurso dele: Corpo vira Sangue, Mente vira Conhecimento, Espírito vira Saa.</p>
  <div class="grade-attr" style="grid-template-columns:repeat(3,1fr)">${S.ATRIBUTOS.map(x => {
    const n = a[x.id]||0;
    return `<div class="bloco-attr" style="--cor:${x.cor}">
      ${ico(ICONE[x.id])}<div class="v">${n}</div><span class="k">${x.nome}</span>
      <span class="mais">mod +${S.modificador(n)} → ${S.modificador(n)} de ${x.recurso}</span>
      <div class="pm">
        <button type="button" data-attr="${x.id}" data-d="-1" ${n<=0?"disabled":""} aria-label="Menos ${x.nome}">−</button>
        <button type="button" data-attr="${x.id}" data-d="1" ${sobra()<=0?"disabled":""} aria-label="Mais ${x.nome}">+</button>
      </div></div>`;}).join("")}</div>
  <p class="explica" style="margin:16px 0 0">${S.ATRIBUTOS.map(x =>
    `<b>${x.nome}</b> — ${esc(x.cobre)}`).join("<br>")}</p>
</section>`; },

2(){ const max=S.maxEstudos(f.atributos);
  return `<section class="cartao">
  <h2>Estudos <small>${f.estudos.length} de ${max}</small></h2>
  <p class="explica">Qualquer coisa serve: artes marciais, medicina, meditação, malabarismo.
    <b>Os Elementos também são Estudos.</b> Todo Estudo novo entra com ${S.ESTUDO_INICIAL} ponto, e não há teto de pontos.
    Usar um Estudo soma os pontos dele ao modificador do atributo da ação.</p>
  ${f.estudos.length >= max ? `<p class="trava">Você está no teto do seu Conhecimento (${max}). Suba Mente pra ter mais.</p>` : ""}
  <div class="lista-per">${f.estudos.map((e,i) => `
    <div class="per" style="grid-template-columns:1fr auto auto auto">
      <label class="campo" style="gap:3px"><span>Estudo</span>
        <input type="text" data-estudo="${i}" value="${esc(e.nome)}" placeholder="Artes Marciais" autocomplete="off"></label>
      <div class="contador">
        <button class="pip" type="button" data-ept="${i}" data-d="-1" ${e.pontos<=1?"disabled":""}>−</button>
        <span class="v">${e.pontos}</span>
        <button class="pip" type="button" data-ept="${i}" data-d="1">+</button>
      </div>
      <span class="marca-n">${S.dadosDe(e.pontos)}</span>
      <button class="bt perigo" type="button" data-tira-estudo="${i}">Tirar</button>
    </div>`).join("")}</div>
  <button class="bt" type="button" id="b-add-estudo" style="margin-top:12px" ${f.estudos.length>=max?"disabled":""}>Acrescentar Estudo</button>
</section>`; },

3(){ const max=S.maxTecnicas(f.atributos), nomes=f.estudos.map(e=>e.nome).filter(Boolean);
  return `<section class="cartao">
  <h2>Técnicas <small>${f.tecnicas.length} de ${max}</small></h2>
  <p class="explica">Unir <b>${S.ESTUDOS_POR_TECNICA} Estudos diferentes</b> cria uma Técnica. Ela soma os pontos dos três
    <b>mais</b> os seus próprios, e começa com ${S.TECNICA_INICIAL} ponto. Evoluir a Técnica não evolui os Estudos dela.
    Usando uma Técnica, você não usa nenhum Estudo de fora dela.</p>
  ${nomes.length < S.ESTUDOS_POR_TECNICA
    ? `<p class="trava">Você precisa de ao menos ${S.ESTUDOS_POR_TECNICA} Estudos com nome antes de montar uma Técnica.</p>` : ""}
  <div class="lista-per">${f.tecnicas.map((t,i) => {
    const soma = (t.estudos||[]).reduce((s,n)=>{ const e=f.estudos.find(x=>x.nome===n); return s+(e?e.pontos:0); },0);
    return `<div class="apl" aria-checked="true">
      <div class="alto"><div class="t">
        <label class="campo"><span>Nome da Técnica</span>
          <input type="text" data-tec="${i}" value="${esc(t.nome)}" placeholder="Passo da Garça" autocomplete="off"></label>
        <div class="marcas" style="margin-top:10px">
          <span class="marca-n">Estudos somam ${soma}</span>
          <span class="marca-n">Técnica ${t.pontos}</span>
          <span class="marca-n">total ${soma + t.pontos} + mod</span>
        </div></div>
        <button class="bt perigo" type="button" data-tira-tec="${i}">Tirar</button></div>
      <div class="extras" style="display:flex">
        ${[0,1,2].map(k => `<label class="campo" style="min-width:150px"><span>Estudo ${k+1}</span>
          <select data-tec-est="${i}" data-slot="${k}" class="sel-est">
            <option value="">—</option>
            ${nomes.map(n => `<option value="${esc(n)}" ${t.estudos && t.estudos[k]===n?"selected":""}>${esc(n)}</option>`).join("")}
          </select></label>`).join("")}
        <div class="campo"><span>Pontos da Técnica</span><div class="contador">
          <button class="pip" type="button" data-tpt="${i}" data-d="-1" ${t.pontos<=1?"disabled":""}>−</button>
          <span class="v">${t.pontos}</span>
          <button class="pip" type="button" data-tpt="${i}" data-d="1">+</button></div></div>
      </div></div>`;}).join("")}</div>
  <button class="bt" type="button" id="b-add-tec" style="margin-top:12px"
    ${(f.tecnicas.length>=max || nomes.length<S.ESTUDOS_POR_TECNICA)?"disabled":""}>Acrescentar Técnica</button>
</section>`; },

4(){ return `<section class="cartao">
  <h2>Itens</h2>
  <p class="explica">Cinco tipos. ${S.TIPOS_ITEM.map(t=>`<b>${t.nome}</b> — ${esc(t.nota)}`).join("<br>")}</p>
  <div class="lista-per">${f.itens.map((it,i) => `
    <div class="per" style="grid-template-columns:1fr auto auto auto">
      <label class="campo" style="gap:3px"><span>Item</span>
        <input type="text" data-item="${i}" value="${esc(it.nome)}" placeholder="Faca de cozinha" autocomplete="off"></label>
      <label class="campo" style="gap:3px"><span>Tipo</span>
        <select data-item-tipo="${i}" class="sel-est">${S.TIPOS_ITEM.map(t =>
          `<option value="${t.id}" ${it.tipo===t.id?"selected":""}>${t.nome}</option>`).join("")}</select></label>
      <div class="contador">
        <button class="pip" type="button" data-ipt="${i}" data-d="-1" ${it.pontos<=0?"disabled":""}>−</button>
        <span class="v">${it.pontos}</span>
        <button class="pip" type="button" data-ipt="${i}" data-d="1">+</button>
      </div>
      <button class="bt perigo" type="button" data-tira-item="${i}">Tirar</button>
    </div>`).join("")}</div>
  <button class="bt" type="button" id="b-add-item" style="margin-top:12px">Acrescentar Item</button>
</section>`; },

5(){ const a=f.atributos;
  const li=(k,v)=>`<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`;
  return `<section class="cartao">
  <h2>${esc(f.nome)||"Sem nome"}</h2>
  <p class="explica">${esc(f.descricao)||"Confira, salve e exporte o JSON."}</p>
  <div class="resumo">
    <div class="caixa"><h4>Atributos</h4><ul>${S.ATRIBUTOS.map(x =>
      li(x.nome, `${a[x.id]||0} (mod +${S.modificador(a[x.id]||0)})`)).join("")}</ul></div>
    <div class="caixa"><h4>Recursos</h4><ul>
      ${li("Sangue", S.sangueMaximo(a))}${li("Conhecimento", S.conhecimentoMaximo(a))}${li("Saa", S.saaMaximo(a))}
    </ul></div>
    <div class="caixa"><h4>Estudos</h4>${f.estudos.length
      ? `<ul>${f.estudos.map(e => li(e.nome||"sem nome", `${e.pontos} · ${S.dadosDe(e.pontos)}`)).join("")}</ul>`
      : `<p class="nada">Nenhum.</p>`}</div>
    <div class="caixa"><h4>Técnicas</h4>${f.tecnicas.length
      ? `<ul>${f.tecnicas.map(t => li(t.nome||"sem nome", (t.estudos||[]).filter(Boolean).join(" + ")||"incompleta")).join("")}</ul>`
      : `<p class="nada">Nenhuma.</p>`}</div>
    ${f.itens.length ? `<div class="caixa" style="grid-column:1/-1"><h4>Itens</h4><ul>${
      f.itens.map(it => { const t=S.TIPOS_ITEM.find(x=>x.id===it.tipo);
        return li(it.nome||"sem nome", `${t?t.nome:""} · ${it.pontos} ponto(s)`);}).join("")}</ul></div>` : ""}
  </div>
  <label class="campo" style="margin-top:16px"><span>Anotações</span>
    <textarea id="f-anot" placeholder="História, promessas, o que ficou pendente.">${esc(f.anotacoes)}</textarea></label>
  <div style="display:flex;gap:11px;flex-wrap:wrap;margin-top:16px">
    <button class="bt calado" type="button" id="b-exportar">Exportar JSON</button>
    <button class="bt calado" type="button" onclick="window.print()">Imprimir</button>
  </div>
  <p class="explica" style="margin-top:13px">A ficha fica salva <b>neste navegador</b>. Exporte o JSON e guarde.</p>
</section>`; },
};

function retratoWidget(){
  const Rt = window.RSS.Retrato, tem = !!f.retrato, guardada = Rt && Rt.eGuardada(f.retrato);
  return `<div class="retrato-campo">
    <div class="retrato-previa">${tem ? `<img src="${esc(f.retrato)}" alt="">` : ico("i-carisma")}</div>
    <div class="retrato-acoes">
      <label class="bt calado" for="f-foto">Escolher do aparelho<input id="f-foto" type="file" accept="image/*" hidden></label>
      ${tem ? `<button class="bt perigo" type="button" id="b-tira-foto">Tirar</button>` : ""}
      <p class="retrato-nota">${guardada ? `Guardada na ficha · ${Rt.pesoKB(f.retrato)} KB · vai junto no JSON`
        : "A imagem é reduzida pra 512px e guardada dentro da ficha."}</p>
    </div></div>`;
}

function medidor(rot,g,t){
  const pct = t>0 ? Math.min(100, Math.max(0, g/t*100)) : 0;
  return `<div class="medidor ${g>t?"estourou":""}"><div class="topo-m"><span>${esc(rot)}</span><b>${g} / ${t}</b></div>
    <div class="cano" style="--c:${g>t?"var(--vida)":"var(--carga)"}"><span class="liq" style="width:${pct}%"></span></div></div>`;
}
function painel(){
  const a=f.atributos;
  const d=(r,v,fz)=>`<div class="der"><span class="r">${esc(r)}</span><b>${esc(v)}</b><span class="f">${esc(fz||"")}</span></div>`;
  $("#painel").innerHTML = `
    <section class="cartao"><h3>Orçamentos</h3>
      ${medidor("Pontos de atributo", gasto(), S.PONTOS_INICIAIS)}
      ${medidor("Estudos", f.estudos.length, S.maxEstudos(a))}
      ${medidor("Técnicas", f.tecnicas.length, S.maxTecnicas(a))}</section>
    <section class="cartao"><h3>A ficha, agora</h3><div class="derivados">
      ${d("Sangue", S.sangueMaximo(a), "mod. de Corpo")}
      ${d("Conhecimento", S.conhecimentoMaximo(a), "mod. de Mente")}
      ${d("Saa", S.saaMaximo(a), "mod. de Espírito")}
      ${d("Elemento", "1+1", "1 Sangue e 1 Saa")}
    </div></section>`;
}

function recado(p){
  const daqui=p.filter(x=>x.etapa===etapa), outro=p.find(x=>x.etapa!==etapa), falta=FALTA[etapa]();
  let txt="", ruim=false;
  if(daqui.length){ txt=daqui[0].txt; ruim=true; }
  else if(outro){ txt=`${outro.txt} (etapa ${outro.etapa+1} — ${NOMES[outro.etapa]})`; ruim=true; }
  else if(falta){ txt=falta; ruim=true; }
  const d=$("#dizer"); d.textContent=txt; d.className="dizer"+(ruim?" ruim":"");
  $("#b-seguir").disabled = p.length>0 || !!falta;
}
function trilho(p){
  $("#etapas").innerHTML = NOMES.map((n,i)=>{
    const e=p.some(x=>x.etapa===i), inc=FALTA[i]();
    return `<button class="etapa ${i===etapa?"":e?"erro":inc?"":"ok"}" type="button" data-ir="${i}" ${i===etapa?'aria-current="step"':""}>
      <span class="n">${e&&i!==etapa?"!":i+1}</span>${esc(n)}</button>`;}).join("");
}
function pintar(){
  $("#palco").innerHTML = T[etapa]();
  const p = problemas(); trilho(p); painel(); recado(p);
  $("#b-voltar").disabled = etapa===0;
  $("#b-seguir").textContent = etapa===NOMES.length-1 ? "Salvar" : "Seguir";
  window.scrollTo({top:0,behavior:"smooth"});
}
const mexeu = () => { Arm.salvar(f); pintar(); };
const leve  = () => { const p=problemas(); trilho(p); painel(); recado(p); };

document.addEventListener("click", ev=>{
  const q=s=>ev.target.closest(s); let el;
  if((el=q("[data-ir]"))){ etapa=+el.dataset.ir; return pintar(); }
  if((el=q("[data-attr]"))){
    const k=el.dataset.attr, d=+el.dataset.d, n=(f.atributos[k]||0)+d;
    if(n<0) return; if(d>0 && sobra()<=0) return;
    f.atributos[k]=n; return mexeu(); }
  if(q("#b-add-estudo")){ f.estudos.push({nome:"",pontos:S.ESTUDO_INICIAL}); return mexeu(); }
  if((el=q("[data-tira-estudo]"))){ const n=f.estudos[+el.dataset.tiraEstudo].nome;
    f.estudos.splice(+el.dataset.tiraEstudo,1);
    f.tecnicas.forEach(t=>t.estudos=(t.estudos||[]).map(x=>x===n?"":x)); return mexeu(); }
  if((el=q("[data-ept]"))){ const e=f.estudos[+el.dataset.ept];
    e.pontos=Math.max(1,e.pontos+(+el.dataset.d)); return mexeu(); }
  if(q("#b-add-tec")){ f.tecnicas.push({nome:"",pontos:S.TECNICA_INICIAL,estudos:["","",""]}); return mexeu(); }
  if((el=q("[data-tira-tec]"))){ f.tecnicas.splice(+el.dataset.tiraTec,1); return mexeu(); }
  if((el=q("[data-tpt]"))){ const t=f.tecnicas[+el.dataset.tpt];
    t.pontos=Math.max(1,t.pontos+(+el.dataset.d)); return mexeu(); }
  if(q("#b-add-item")){ f.itens.push({nome:"",tipo:"arma",pontos:1}); return mexeu(); }
  if((el=q("[data-tira-item]"))){ f.itens.splice(+el.dataset.tiraItem,1); return mexeu(); }
  if((el=q("[data-ipt]"))){ const it=f.itens[+el.dataset.ipt];
    it.pontos=Math.max(0,it.pontos+(+el.dataset.d)); return mexeu(); }
  if(q("#b-tira-foto")){ f.retrato=""; return mexeu(); }
  if(q("#b-exportar")) return Arm.exportar(f);
  if(q("#b-nova")){ if(!confirm("Começar uma ficha nova? A atual continua salva.")) return;
    f=nova(); etapa=0; return mexeu(); }
});
document.addEventListener("input", ev=>{
  const t=ev.target, id=t.id;
  if(id==="f-nome"){ f.nome=t.value; Arm.salvar(f); return leve(); }
  if(id==="f-desc"){ f.descricao=t.value; return void Arm.salvar(f); }
  if(id==="f-anot"){ f.anotacoes=t.value; return void Arm.salvar(f); }
  if(t.dataset.estudo!==undefined){ f.estudos[+t.dataset.estudo].nome=t.value; Arm.salvar(f); return leve(); }
  if(t.dataset.tec!==undefined){ f.tecnicas[+t.dataset.tec].nome=t.value; return void Arm.salvar(f); }
  if(t.dataset.item!==undefined){ f.itens[+t.dataset.item].nome=t.value; return void Arm.salvar(f); }
});
document.addEventListener("change", async ev=>{
  const t=ev.target;
  if(t.dataset.tecEst!==undefined){
    const tec=f.tecnicas[+t.dataset.tecEst], k=+t.dataset.slot;
    tec.estudos=tec.estudos||["","",""];
    if(t.value && tec.estudos.indexOf(t.value)!==-1 && tec.estudos[k]!==t.value){
      alert("Uma Técnica une 3 Estudos DIFERENTES."); t.value=tec.estudos[k]||""; return; }
    tec.estudos[k]=t.value; return mexeu(); }
  if(t.dataset.itemTipo!==undefined){ f.itens[+t.dataset.itemTipo].tipo=t.value; return mexeu(); }
  if(t.id==="f-foto"){
    const arq=t.files&&t.files[0]; t.value=""; if(!arq) return;
    try{ f.retrato=await window.RSS.Retrato.doArquivo(arq);
      if(!Arm.salvar(f)){ f.retrato=""; alert("A imagem não coube no armazenamento deste navegador."); }
    }catch(e){ alert("Não deu pra usar essa imagem: "+e.message); }
    return pintar(); }
  if(t.id==="f-importar"){
    const arq=t.files&&t.files[0]; t.value=""; if(!arq) return;
    try{ const j=await Arm.importar(arq);
      if(j.sistema!=="saa"){ alert("Essa ficha não é do Saa."); return; }
      f=j; etapa=NOMES.length-1; mexeu(); }catch(e){ alert("Não deu pra importar: "+e.message); } }
});
$("#b-voltar").addEventListener("click",()=>{ if(etapa>0){etapa--;pintar();} });
$("#b-seguir").addEventListener("click",()=>{
  if(etapa<NOMES.length-1){ etapa++; pintar(); }
  else { Arm.salvar(f); const d=$("#dizer"); d.className="dizer";
    d.textContent="Ficha salva. Exporte o JSON pra não depender deste navegador."; }
});

(function(){
  const Tm = window.TabulaTema;
  const slot=$("#troca-tema"); if(slot&&Tm) slot.innerHTML=Tm.botao();
  if(Tm) Tm.aplicar(Tm.escolhido()||(window.RSS.CONFIG&&window.RSS.CONFIG.temaPadrao)||"cartoon", false);
  if(!Arm.temMemoria()) { const m=$("#sem-memoria"); if(m) m.hidden=false; }
  const salva = Arm.carregar(Arm.idAtual());
  f = (salva && salva.sistema==="saa") ? salva : nova();
  const base = nova();
  for(const k of Object.keys(base)) if(f[k]===undefined) f[k]=base[k];
  pintar();
})();
})();
