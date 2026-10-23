/* ═══ ficha.js — a ficha em si. Só lê REGRAS; não inventa número ═══ */
(() => {
"use strict";
const R = window.RSS, { $, $$, rnd, REGRAS, REDUZ } = R;

/* A ficha vem do criador (criar.html) quando existe uma salva neste
   navegador. Sem nenhuma salva, cai no Theodor, que é o boneco de teste
   desta câmara desde o começo. É o único lugar onde os dois se encontram. */
const THEODOR = { attrs:{FOR:7,DES:7,CON:4,INT:7,CARGA:4,CAR:8}, nivel:2, nome:"Theodor" };
function daMemoria(){
  try{
    const Arm = window.RSS && window.RSS.Arm; if(!Arm) return null;
    const f = Arm.carregar(Arm.idAtual()); if(!f || !f.atributosBase) return null;
    const R26 = window.RSS.R;
    const a = {...f.atributosBase}, o = R26.ORIGENS.find(x=>x.id===f.origemId), c = R26.CLASSES.find(x=>x.id===f.classeId);
    if(o && o.fixo) for(const [k,v] of Object.entries(o.fixo)) a[k]=(a[k]||0)+v;
    for(const [k,v] of Object.entries(f.escolhaOrigem||{})) a[k]=(a[k]||0)+v;
    if(c && c.bonusCarga) a.CARGA=(a.CARGA||0)+c.bonusCarga;
    return { attrs:a, nivel:f.nivel||1, nome:f.nome||"Sem nome", salva:f, classeId:f.classeId };
  }catch{ return null; }
}
const base = daMemoria() || THEODOR;
const ficha = R.ficha = { attrs:base.attrs, vida:0, carga:0, nivel:base.nivel, nome:base.nome,
                          classeId:base.classeId||null, salva:base.salva||null };
window.RSS.ficha = ficha;   // a ponte do REGRAS lê daqui
if (base.salva){
  const R26 = window.RSS.R, f0 = base.salva;
  const c = R26.CLASSES.find(x=>x.id===f0.classeId), o = R26.ORIGENS.find(x=>x.id===f0.origemId);
  const põe = (id,v) => { const e=document.getElementById(id); if(e&&v) e.textContent=v; };
  põe("rs-nome", f0.nome);
  põe("rs-epi", f0.descricao || f0.conceito);
  põe("rs-classe", c && c.nome);
  põe("rs-origem", o && o.nome);
  const nv = document.querySelector(".retrato .nivel"); if (nv) nv.textContent = f0.nivel;
  if (f0.retrato) {
    const cx = document.querySelector(".retrato");
    if (cx && !cx.querySelector("img.retrato-foto")) {
      const img = document.createElement("img");
      img.className = "retrato-foto"; img.alt = "";
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
      img.onerror = () => img.remove();
      img.src = f0.retrato;
      cx.prepend(img);
    }
  }

  /* O PODER. Sem isto o jogador montava "Ferrugem" no criador, abria a ficha
     e lia "Razão e Emoção" — o Eco do Theodor. Era a primeira coisa que ele
     ia notar, e a que mais faria parecer que o site está quebrado. */
  if (f0.conceito) {
    põe("rs-conceito", f0.conceito);
    põe("rs-conceito-sub", "conceito · " + (f0.aplicacoes||[]).length + " Aplicações");
    põe("rs-aba-eco", "Poder");
  }
  /* História: as anotações do jogador no lugar do passado do Theodor. */
  const hist = document.getElementById("rs-historia");
  if (hist) {
    const seg0 = s => String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    const partes = [];
    if (f0.descricao) partes.push(["Quem ele é", f0.descricao]);
    const t0 = R26.TRILHAS.find(x=>x.id===f0.trilhaId);
    if (t0) partes.push(["Trilha — " + t0.nome, t0.conceito]);
    (f0.lastro||[]).forEach(id => {
      const l = R26.LASTRO.find(x=>x.id===id);
      if (l) partes.push(["Lastro", l.nome]);
    });
    if (f0.anotacoes) partes.push(["Anotações", f0.anotacoes]);
    if (partes.length) hist.innerHTML = partes.map(([t,d]) =>
      `<div class="item"><b>${seg0(t)}</b><span>${seg0(d)}</span></div>`).join("");
  }

  const lista = document.getElementById("rs-aplicacoes");
  if (lista && (f0.aplicacoes||[]).length) {
    const seg = s => String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    const lim = R26.limitePorAcao(base.attrs);
    lista.innerHTML = f0.aplicacoes.map(ap => {
      const x = R26.aplicacaoPorId(ap.id); if (!x) return "";
      const cb = x.custoBaseTexto || x.custoBase;
      const linha = [];
      if (x.danoBase) linha.push("Dano Base " + x.danoBase);
      else if (x.danoBaseTexto) linha.push("Dano " + x.danoBaseTexto);
      linha.push("Custo Base " + cb);
      linha.push(x.duracao);
      const det = [];
      if (typeof x.custoBase === "number")
        det.push("Sobram " + (lim - x.custoBase) + " de Carga pra repartir entre Acerto e Dano.");
      if (ap.reforcos) det.push(ap.reforcos + " Reforço(s) comprado(s).");
      if ((ap.formas||1) > 1) det.push("Repertório de " + ap.formas + " formas, uma de cada vez.");
      if (ap.nota) det.push(ap.nota);
      return `<button class="item" aria-expanded="false" data-tilt><b>${seg(x.nome)}</b>` +
             `<span>${seg(linha.join(" · "))}</span>` +
             `<span class="detalhe"><em>${seg(det.join(" "))||seg(x.faz)}</em></span></button>`;
    }).join("");
  }
}
ficha.vida = REGRAS.vidaMaxima(ficha.attrs); ficha.carga = REGRAS.reserva(ficha.attrs);

const ATTRS = [
  ["FOR","Força","i-forca","var(--laranja)","p-forca"],
  ["DES","Destreza","i-destreza","var(--menta)","p-destreza"],
  ["CON","Constituição","i-constituicao","var(--vida)","p-constituicao"],
  ["INT","Inteligência","i-inteligencia","var(--lilas)","p-inteligencia"],
  ["CARGA","Carga","i-carga","var(--carga)","p-carga"],
  ["CAR","Carisma","i-carisma","var(--ouro)","p-carisma"],
];
const COR = Object.fromEntries(ATTRS.map(([k,,,c]) => [k,c]));
const RGB = { FOR:"255,144,87", DES:"125,220,150", CON:"255,90,122", INT:"187,140,255", CARGA:"86,214,234", CAR:"255,200,87" };
const GRAUS = [["destreinado",0],["treinado",2],["adepto",4],["especialista",6],["mestre",8]];
// ⚠ lista provisória — trocar pelas 15 oficiais do livro
const PERICIAS = [
  ["Luta","FOR",0,"i-forca"],["Atletismo","FOR",1,"i-forca"],["Pontaria","DES",2,"i-destreza"],
  ["Acrobacia","DES",1,"i-destreza"],["Furtividade","DES",0,"i-destreza"],["Fortitude","CON",1,"i-constituicao"],
  ["Investigação","INT",3,"i-busca"],["Ocultismo","INT",2,"i-carga"],["Tecnologia","INT",0,"i-limite"],
  ["Medicina","INT",0,"i-vida"],["Percepção","INT",2,"i-busca"],["Intuição","CAR",1,"i-carisma"],
  ["Persuasão","CAR",3,"i-carisma"],["Enganação","CAR",2,"i-carisma"],["Intimidação","CAR",1,"i-escudo"],
];
const ico = id => `<svg viewBox="0 0 24 24"><use href="#${id}"/></svg>`;

function derivados(animar){
  const a = ficha.attrs, vm = REGRAS.vidaMaxima(a), rm = REGRAS.reserva(a);
  $("#x-vida").textContent = vm; $("#x-res").textContent = rm;
  $("#x-lim").textContent = REGRAS.limite(a);
  $("#x-def").textContent = REGRAS.defesaPassiva(a);
  $("#x-peso").textContent = REGRAS.pesoMaximo(a);
  $("#x-alc").textContent = REGRAS.alcance(0)+"m";
  const nv = $("#n-vida"), nr = $("#n-res");
  if (animar){
    R.Anim.numero(nv, parseInt(nv.textContent)||0, ficha.vida, 560, v => v);
    R.Anim.numero(nr, parseInt(nr.textContent)||0, ficha.carga, 560, v => v);
  } else { nv.textContent = ficha.vida; nr.textContent = ficha.carga; }
  $("#m-vida").textContent = "/ " + vm; $("#m-res").textContent = "/ " + rm;
  $("#b-vida").style.width = (100*ficha.vida/vm)+"%";
  $("#b-res").style.width  = (100*ficha.carga/rm)+"%";
  if (!R.Estado.travado) R.Estado.set(ficha.carga === 0 ? "sobrecarga" : "normal");
}

function montarAttrs(){
  const box = $("#attrs"); box.innerHTML = "";
  for (const [k,nome,ic,cor,cl] of ATTRS){
    const b = document.createElement("button");
    b.type = "button"; b.className = "atr "+cl; b.style.setProperty("--cor",cor); b.dataset.attr = k;
    b.innerHTML = ico(ic)+`<span class="v">${ficha.attrs[k]}</span><span class="k">${nome}</span>`;
    b.addEventListener("click", () => abrir({titulo:nome, chave:k, grau:0, tipo:"teste de atributo"}));
    b.addEventListener("pointerenter", () => {
      R.Som.bip("hover");
      const r = b.getBoundingClientRect();
      if (k === "CARGA") R.Po.jorro("faisca", r.left+r.width/2, r.top+16, 7, RGB.CARGA);
      if (k === "INT"){
        const v = b.querySelector(".v"), real = ficha.attrs.INT; let i = 0;
        const t = setInterval(() => { v.textContent = Math.floor(rnd(1,20)); if (++i>4){ clearInterval(t); v.textContent = real; } }, 42);
      }
    }, { passive:true });
    box.append(b);
  }
}
function montarPericias(){
  const box = $("#pers"); box.innerHTML = "";
  for (const [nome,chave,g,ic] of PERICIAS){
    const b = document.createElement("button");
    b.type = "button"; b.className = "per";
    b.innerHTML = `<span class="bolinha" style="--cor:${COR[chave]}">${ico(ic)}</span>
      <span class="t"><b>${nome}</b><i>${GRAUS[g][0]}</i></span>
      <span class="b">+${ficha.attrs[chave]+GRAUS[g][1]}</span>`;
    b.addEventListener("click", () => abrir({titulo:nome, chave, grau:GRAUS[g][1], tipo:"teste de perícia"}));
    box.append(b);
  }
}

/*── diálogo ──*/
let pend = null;
function abrir(t){
  pend = t; R.Som.bip("clique");
  const lim = Math.min(REGRAS.limite(ficha.attrs), ficha.carga);
  $("#dlg-t").textContent = t.titulo; $("#dlg-tipo").textContent = t.tipo;
  $("#dlg-l").textContent = lim;
  const r = $("#dlg-r"); r.max = lim; r.value = 0;
  divisao(); $("#veu").classList.add("on"); $("#dlg-ok").focus();
}
const fechar = () => { $("#veu").classList.remove("on"); pend = null; };
function divisao(){
  const g = +$("#dlg-r").value; $("#dlg-g").textContent = g;
  const s = $("#dlg-s"); s.max = g; if (+s.value > g) s.value = g;
  $("#dlg-ac").textContent = +s.value; $("#dlg-dn").textContent = g - +s.value;
}

/*── rolagem ──*/
function rolar(t, noAcerto, noDano, dc){
  const atrib = ficha.attrs[t.chave];
  const dado = 1 + Math.floor(Math.random()*20);
  const soma = dado + atrib + t.grau + noAcerto;
  const face = $("#r-face"), lance = $("#lance");
  face.style.background = COR[t.chave];
  $("#r-q").textContent = t.titulo;
  const ps = ["1d20", t.chave.toLowerCase()];
  if (t.grau) ps.push("grau"); if (noAcerto) ps.push("carga");
  $("#r-d").textContent = ps.join(" + ");
  $("#r-tot").textContent = "—"; $("#r-cont").textContent = "";
  $("#r-fita").textContent = "rolando…"; $("#r-fita").className = "fita ok";
  $("#result").classList.add("on"); lance.classList.add("girando");

  let i = 0; const passos = REDUZ ? 1 : 17;
  (function girar(){
    face.textContent = 1 + Math.floor(Math.random()*20); i++;
    if (i < passos) return void setTimeout(girar, 26 + i*10);
    lance.classList.remove("girando");
    face.textContent = dado;
    const bom = soma >= dc;
    R.Anim.numero($("#r-tot"), 0, soma, 420);
    let c = `${dado} no dado + ${atrib} ${t.chave.toLowerCase()}`;
    if (t.grau)   c += ` + ${t.grau} grau`;
    if (noAcerto) c += ` + ${noAcerto} carga`;
    if (noDano)   c += ` · ${noDano} guardados no dano`;
    $("#r-cont").textContent = c;
    const f = $("#r-fita");
    f.className = "fita " + (dado===20||dado===1 ? "cri" : bom ? "ok" : "no");
    f.textContent = dado===20 ? `crítico! passou na DC ${dc}`
                  : dado===1  ? `falha crítica na DC ${dc}`
                  : `${bom?"passou":"falhou"} na DC ${dc}`;
    if (dado === 20){
      R.Som.bip("critico"); R.Camera.batida(1.4);
      const r = face.getBoundingClientRect();
      R.Po.jorro("faisca", r.left+r.width/2, r.top+r.height/2, 30, "255,200,87");
      const tt = $("#r-tot"); tt.classList.add("estourar"); setTimeout(() => tt.classList.remove("estourar"), 420);
    } else if (dado === 1){
      // nat 1: congela, corrompe, volta. Sem flash.
      R.Som.bip("erro");
      document.body.classList.add("congelado");
      setTimeout(() => document.body.classList.remove("congelado"), 170);
      R.Estado.pulso("corrompido", 1000);
      R.Corrupcao.set(4, 1200);
      R.Falha.disparar(3);
      R.Camera.aplicar({ tremor:.7, zoom:1.01, distorcao:.5, duracao:900 });
    } else R.Som.bip(bom ? "guia" : "erro");
    R.Segredos?.rolagem(dado);
  })();
}

/*── nível ──*/
function subirNivel(){
  ficha.nivel++;
  R.Anim.numero($("#nivel"), ficha.nivel-1, ficha.nivel, 400);
  ficha.attrs.CON++; ficha.attrs.CARGA++;
  const antes = ficha.vida;
  ficha.vida = REGRAS.vidaMaxima(ficha.attrs); ficha.carga = REGRAS.reserva(ficha.attrs);
  R.Estado.pulso("espetaculo", 2600);
  R.Som.bip("nivel");
  $("#palco-n").textContent = ficha.nivel;
  $("#cartaz").classList.add("on");
  R.Po.jorro("confete", innerWidth/2, innerHeight*.52, 70, "187,140,255");
  setTimeout(() => R.Po.jorro("confete", innerWidth*.3, innerHeight*.45, 40, "255,200,87"), 160);
  setTimeout(() => R.Po.jorro("confete", innerWidth*.7, innerHeight*.45, 40, "86,214,234"), 280);
  R.Camera.batida(.8);
  setTimeout(() => {
    $("#cartaz").classList.remove("on");
    for (const k of ["CON","CARGA"]){
      const card = $(`.atr[data-attr="${k}"]`); if (!card) continue;
      const v = card.querySelector(".v");
      R.Anim.numero(v, ficha.attrs[k]-1, ficha.attrs[k], 560);
      R.Anim.delta(v, 1);
      card.style.animation = "none"; void card.offsetWidth;
      card.style.animation = "p-impacto .5s cubic-bezier(.3,1.5,.4,1)";
      const r = card.getBoundingClientRect();
      R.Po.jorro("faisca", r.left+r.width/2, r.top+20, 10, RGB[k]);
    }
    $$(".atr").forEach((el,i) => { el.style.animation = "none"; void el.offsetWidth;
      el.style.animation = `entrar .4s ${i*.05}s both cubic-bezier(.2,1.3,.3,1)`; });
    montarPericias(); derivados(true);
    R.Anim.delta($("#n-vida"), ficha.vida - antes);
    R.Falha.registrar(".quem h2,.atr .v,.der .v,.per .t b,.guia,.logo h1");
  }, 2300);
}

R.Ficha = { montar(){
  montarAttrs(); montarPericias(); derivados(false);

  // régua de DC do livro — o Mestre escolhe, o código não decide
  const sel = $("#dlg-dc");
  REGRAS.DC.forEach(([nome,v]) => {
    const o = document.createElement("option");
    o.value = v; o.textContent = `${nome} · DC ${v}`;
    if (v === 15) o.selected = true;
    sel.append(o);
  });

  $("#dlg-r").addEventListener("input", divisao);
  $("#dlg-s").addEventListener("input", divisao);
  $("#dlg-x").addEventListener("click", fechar);
  $("#veu").addEventListener("click", e => { if (e.target.id === "veu") fechar(); });
  addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });

  $("#dlg-ok").addEventListener("click", () => {
    if (!pend) return;
    const t = pend, gasto = +$("#dlg-r").value, noAcerto = +$("#dlg-s").value, dc = +$("#dlg-dc").value;
    fechar();
    if (gasto){ ficha.carga = Math.max(0, ficha.carga-gasto); R.Anim.delta($("#n-res"), -gasto); }
    derivados(true);
    rolar(t, noAcerto, gasto-noAcerto, dc);
  });
  $("#r-x").addEventListener("click", () => $("#result").classList.remove("on"));

  $("#descansar").addEventListener("click", () => {
    const dv = REGRAS.vidaMaxima(ficha.attrs)-ficha.vida, dc = REGRAS.reserva(ficha.attrs)-ficha.carga;
    ficha.vida = REGRAS.vidaMaxima(ficha.attrs); ficha.carga = REGRAS.reserva(ficha.attrs);
    derivados(true);
    R.Estado.pulso("eco", 1800);
    ["#o-vida","#o-res"].forEach(s => { const e = $(s); e.classList.remove("on"); void e.offsetWidth; e.classList.add("on"); });
    R.Po.jorro("faisca", innerWidth/2, innerHeight*.35, 18, "125,220,150");
    R.Som.bip("guia");
    R.Anim.delta($("#n-vida"), dv); R.Anim.delta($("#n-res"), dc);
  });

  $("#nivel").addEventListener("click", e => { e.stopPropagation(); subirNivel(); });
}};
})();
