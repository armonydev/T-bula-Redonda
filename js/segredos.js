/* ═══════════════════════════════════════════════════════════════════
   segredos.js — o MOTOR. Lê eventos.config.js e monta a cena.

   Você não escreve animação: descreve o evento no config e o motor
   resolve aparição, câmera, luz, partículas, som, intrusão e saída.

   Regra de ouro do arquivo: "tudo pode reagir, nem tudo reage sempre."
   Raridade e cooldown são filtros ANTES de qualquer pixel se mexer.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
"use strict";
const R = window.RSS, { $, $$, rnd, REDUZ } = R;

const PESO = { normal:1, alternate:.55, special:.22, strange:.07, secret:.02 };
const palco = () => $("#palco-segredos");

/* ── o arquivo existe? E com QUAL extensão? ──
   O config escreve ".png" por costume, mas o que cai na pasta pode ser gif,
   webp ou jpg. Em vez de obrigar você a renomear, o motor tenta as outras
   extensões e usa a que existir. resolver() devolve o caminho que funcionou. */
const EXTS = [".png",".gif",".webp",".jpg",".jpeg",".apng",".avif"];
const cache = new Map();

function existe(caminho){
  return new Promise(ok => {
    const im = new Image();
    im.onload  = () => ok(true);
    im.onerror = () => ok(false);
    im.src = caminho;
  });
}

async function resolver(caminho){
  if (!caminho) return null;
  /* Segredos desligados = assets não existem = não sonda nada. Sem isto, o
     motor pedia cada imagem em várias extensões e o console virava uma
     parede de 404 num site que, de resto, funciona perfeitamente. */
  if (!(window.RSS.CONFIG && window.RSS.CONFIG.segredos)) return null;
  if (cache.has(caminho)) return cache.get(caminho);
  const p = (async () => {
    if (await existe(caminho)) return caminho;
    const semExt = caminho.replace(/\.[a-z0-9]+$/i, "");
    for (const e of EXTS){
      const tentativa = semExt + e;
      if (tentativa === caminho) continue;
      if (await existe(tentativa)) return tentativa;
    }
    return null;
  })();
  cache.set(caminho, p);
  return p;
}
R.resolverAsset = resolver;

const Segredos = R.Segredos = {
  lista: [], estado: new Map(), faltando: new Set(),

  init(defs){
    if (!(window.RSS.CONFIG && window.RSS.CONFIG.segredos)) { this.lista = []; return; }
    this.lista = defs || [];
    for (const s of this.lista){
      let desc = false;
      try { desc = localStorage.getItem("rss-seg-" + s.id) === "1"; } catch {}
      // -Infinity, não 0: performance.now() começa perto de zero, então "0" fazia
      // TODO segredo nascer em cooldown e não disparar nos primeiros minutos.
      this.estado.set(s.id, { ultimo: -Infinity, descoberto: desc, cliques: 0, t0: 0 });
    }
    this.ligarGatilhos();
    this.ligarMoradores();
  },

  /* ── pode rodar? cooldown, uma-vez-só e raridade ── */
  async permitido(s, ignorarRaridade){
    const e = this.estado.get(s.id);
    if (!e) return false;
    if (s.umaVezSo && e.descoberto) return false;
    if (performance.now() - e.ultimo < (s.cooldown || 60000)) return false;
    if (!ignorarRaridade && Math.random() > (PESO[s.raridade] ?? 1)) return false;
    return this.resolverCena(s);
  },

  marcar(s){
    const e = this.estado.get(s.id);
    e.ultimo = performance.now(); e.descoberto = true;
    try { localStorage.setItem("rss-seg-" + s.id, "1"); } catch {}
  },

  /* resolve a extensão de todo asset da cena. Roda SEMPRE, inclusive em
     forcar:true — era isso que deixava Bill, Caine e Blastoise invisíveis. */
  async resolverCena(s){
    const slots = [s.aparicao, s.aoClicar?.intrusao, s.aoClicar?.atras, s.aoClicar?.atravessar,
                   s.aoDisparar?.intrusao, s.aoDisparar?.atras, s.aoDisparar?.atravessar,
                   s.aoClicar?.roleta?.apresentador, s.aoDisparar?.roleta?.apresentador];
    let ok = true;
    for (const slot of slots){
      if (!slot?.asset || slot._resolvido) continue;
      const certo = await resolver(slot.asset);
      if (certo){ slot.asset = certo; slot._resolvido = true; }
      else { this.faltando.add(slot.asset); ok = false; }
    }
    return ok;
  },

  /* ── porta de entrada: tenta disparar um segredo pelo id ── */
  async tentar(id, { forcar = false } = {}){
    const s = this.lista.find(x => x.id === id);
    if (!s) return false;
    // morador não "dispara": ele já está lá. Chamar um só faz ele reagir.
    if (s.morador && !s.aparicao && !s.aoDisparar) return this.chamarMorador(id);
    if (!(await this.resolverCena(s))) return false;
    if (!forcar && !(await this.permitido(s))) return false;
    if (forcar){
      const e = this.estado.get(s.id);
      if (performance.now() - e.ultimo < 4000) return false;   // trava anti-spam
    }
    this.marcar(s);
    if (s.aparicao) this.aparecer(s);
    else this.executar(s, s.aoDisparar);
    return true;
  },

  /* ═══════ APARIÇÃO ═══════ o símbolo que fica esperando ser clicado */
  aparecer(s){
    const a = s.aparicao;
    const im = document.createElement("img");
    im.src = a.asset; im.alt = ""; im.className = "aparicao ent-" + (a.entrada || "surgir");
    im.dataset.onde = a.onde || "canto-superior-direito";
    const lado = Math.min(innerWidth, innerHeight) * (a.escala || .15);
    im.style.width = lado + "px";
    im.style.setProperty("--op", a.opacidade ?? .85);
    palco().append(im);
    R.Som.arquivo(a.som, .5);

    const sair = () => { im.classList.add("saindo"); setTimeout(() => im.remove(), 700); };
    const expira = setTimeout(sair, a.expiraEm || 14000);

    if (a.clicavel){
      im.classList.add("clicavel");
      im.addEventListener("click", () => {
        clearTimeout(expira);
        im.classList.add("acionado");
        this.executar(s, s.aoClicar, im);
        setTimeout(sair, (s.aoClicar?.intrusao?.duracao || 3000) + (s.aoClicar?.intrusao?.atraso || 0) - 600);
      }, { once:true });
    }
  },

  /* ═══════ EXECUÇÃO ═══════ monta a cena descrita no config */
  executar(s, cena, origemEl){
    if (!cena) return;
    const fim = [];

    if (cena.camera) R.Camera.aplicar(cena.camera);
    if (cena.luz){ R.Luz.acender(cena.luz); fim.push(() => R.Luz.apagar()); }
    if (cena.corrupcao) R.Corrupcao.set(cena.corrupcao, 3000);
    if (cena.som) R.Som.arquivo(cena.som, .7);

    if (cena.particulas){
      const { tipo="faisca", quantidade=30, cor="255,255,255", de="centro" } = cena.particulas;
      let x = innerWidth/2, y = innerHeight/2;
      if (de === "simbolo" && origemEl){
        const r = origemEl.getBoundingClientRect(); x = r.left + r.width/2; y = r.top + r.height/2;
      } else if (de === "canto-inferior-esquerdo"){ x = 60; y = innerHeight - 60; }
      R.Po?.jorro(tipo, x, y, quantidade, cor);
    }

    if (cena.roleta)     fim.push(this.roleta(cena.roleta));
    if (cena.atras)      fim.push(this.atras(cena.atras));
    if (cena.atravessar) fim.push(this.atravessar(cena.atravessar));
    if (cena.intrusao)   fim.push(this.intrusao(cena.intrusao));

    const dur = Math.max(
      cena.camera?.duracao || 0,
      (cena.intrusao?.duracao || 0) + (cena.intrusao?.atraso || 0),
      cena.atras?.duracao || 0,
      cena.roleta ? ((cena.roleta.entrada ?? 1300) + (cena.roleta.duracao ?? 6400)
                   + (cena.roleta.leitura ?? 2200) + 1000) : 0,
      1200);
    if (dur !== Infinity && !(cena.intrusao && cena.intrusao.duracao === 0))
      setTimeout(() => fim.forEach(f => f && f()), dur);
  },

  /* ═══════ INTRUSÃO ═══════ o personagem invadindo pela borda */
  intrusao(c){
    const cx = document.createElement("div");
    cx.className = `intrusao lado-${c.lado||"direita"} ent-${c.entrada||"deslizar"}`;
    const im = document.createElement("img");
    im.src = c.asset; im.alt = "";
    im.style.height = ((c.escala ?? .9) * 100) + "vh";
    cx.style.setProperty("--corte", ((c.corte ?? .25) * 100) + "%");
    cx.style.setProperty("--incl", (c.inclinacao || 0) + "deg");
    cx.style.setProperty("--descer", (c.descer || 0) + "vh");   // afunda e corta o que sobra
    cx.style.setProperty("--giro", (c.giroEntrada || 0) + "deg");
    if (c.entradaMs) cx.style.setProperty("--ent-dur", c.entradaMs + "ms");
    cx.append(im);

    if (c.legenda){
      const l = document.createElement("div");
      l.className = "legenda-intrusao"; l.textContent = c.legenda; cx.append(l);
    }
    palco().append(cx);
    requestAnimationFrame(() => setTimeout(() => {
      // se a roleta abriu uma sala, quem ia entrar depois dela desiste:
      // senão o Caine entraria atrás da cortina, pra ninguém.
      if (c.soSe === "naoAbriuSala" && Segredos._salaAbrindo){ cx.remove(); return; }
      cx.classList.add("dentro");
    }, c.atraso || 0));

    const fechar = () => {
      cx.classList.remove("dentro");
      cx.classList.add("sai-" + (c.saida || "desvanecer"));
      R.Camera.soltar();
      setTimeout(() => cx.remove(), 900);
    };

    if (c.botaoFechar){
      const b = document.createElement("button");
      b.className = "botao-recolher"; b.textContent = c.botaoFechar;
      b.addEventListener("click", () => { b.remove(); fechar(); }, { once:true });
      setTimeout(() => palco().append(b), (c.atraso || 0) + 700);
      return null;                       // não fecha sozinho
    }
    return fechar;
  },

  /* ═══════ ATRÁS ═══════ ele já estava lá; a UI fica translúcida */
  atras(c){
    const im = document.createElement("img");
    im.src = c.asset; im.alt = ""; im.className = "atras-da-ui";
    im.style.height = ((c.escala ?? .7) * 100) + "vh";
    im.style.setProperty("--giro-lento", (c.girar || 0) + "deg");
    $("#fundo-segredos").append(im);
    document.documentElement.style.setProperty("--ui-alpha", c.transparenciaDaUI ?? .35);
    requestAnimationFrame(() => im.classList.add("dentro"));
    return () => {
      im.classList.remove("dentro");
      document.documentElement.style.setProperty("--ui-alpha", 1);
      setTimeout(() => im.remove(), 900);
    };
  },

  /* ═══════ ATRAVESSAR ═══════ micro-evento: só passa andando */
  atravessar(c){
    const im = document.createElement("img");
    im.src = c.asset; im.alt = ""; im.className = "atravessando";
    im.style.height = ((c.altura ?? .2) * 100) + "vh";
    im.style.top = ((c.y ?? .85) * 100) + "vh";
    im.style.setProperty("--dur", (c.duracao || 9000) + "ms");
    im.style.setProperty("--dir", c.de === "direita" ? "-1" : "1");
    palco().append(im);
    setTimeout(() => im.remove(), (c.duracao || 9000) + 200);
    return null;
  },

  /* ═══════ MORADORES ═══════
     Personagem que NÃO invade: ele mora numa aba. Não tem raridade, não tem
     cooldown, não entra nem sai. Você abre a aba dele e ele está lá — como se
     sempre tivesse estado. É pra personagem de pose parada, que não combina
     com entrada deslizando.

     Quem manda na visibilidade é a própria aba: um MutationObserver no
     atributo `hidden` da folha. Assim não existe jeito de dessincronizar,
     e nada no app.js precisa saber que moradores existem. ═══════ */
  moradores: new Map(),

  async ligarMoradores(){
    const CANTOS = {
      "baixo-esquerda": ["left","bottom"],  "baixo-direita": ["right","bottom"],
      "cima-esquerda":  ["left","top"],     "cima-direita":  ["right","top"],
    };
    for (const s of this.lista){
      const m = s.morador;
      if (!m) continue;
      const folha  = document.getElementById(m.tela);
      const cartao = folha?.closest(".cartao");
      if (!cartao){ console.warn("[câmara] morador sem tela:", s.id, "→", m.tela); continue; }

      const certo = await resolver(m.asset);
      if (!certo){ this.faltando.add(m.asset); continue; }

      const cx = document.createElement("div");
      cx.className = "morador" + (m.atras ? " atras" : "") + (m.respirar === false ? "" : " respira");
      // o canto escolhe QUAIS bordas ancoram; x e y são os valores delas.
      // Negativo = pra FORA do cartão (ele fica encostado, meio pra fora).
      const [eixoX, eixoY] = CANTOS[m.canto] || CANTOS["baixo-direita"];
      // fora = encostado DO LADO DE FORA do cartão, nunca por cima dele.
      // A borda oposta ancora em 100%, então ele começa exatamente onde o
      // cartão acaba, e `x`/`y` viram a FOLGA (positivo afasta).
      //   fora:"lado"  → ao lado, no vão da coluna
      //   fora:"baixo" → embaixo, no chão. Cabe sempre, não importa a largura.
      if (m.fora){
        cx.classList.add("fora");
        if (m.fora === "baixo"){
          cx.style[eixoY === "bottom" ? "top" : "bottom"] = `calc(100% + ${m.y ?? 6}px)`;
          cx.style[eixoX] = (m.x ?? 16) + "px";
        } else {
          cx.style[eixoX === "right" ? "left" : "right"] = `calc(100% + ${m.x ?? 8}px)`;
          cx.style[eixoY] = (m.y ?? -14) + "px";
        }
      } else {
        cx.style[eixoX] = (m.x ?? -28) + "px";
        cx.style[eixoY] = (m.y ?? -14) + "px";
      }
      cx.style.height = ((m.altura ?? .3) * 100) + "vh";
      cx.style.setProperty("--incl", (m.inclinacao || 0) + "deg");
      cx.style.setProperty("--esp", m.espelhar ? -1 : 1);
      cx.style.setProperty("--op", m.opacidade ?? 1);

      const im = document.createElement("img");
      im.src = certo; im.alt = "";
      cx.append(im);
      cartao.append(cx);

      this.moradores.set(s.id, { el:cx, folha, def:m });
      const sincronizar = () => cx.classList.toggle("aqui", !folha.hidden);
      new MutationObserver(sincronizar).observe(folha, { attributes:true, attributeFilter:["hidden"] });
      requestAnimationFrame(sincronizar);
    }
  },

  /* chamar um morador abre a aba dele e ele REAGE no lugar — sem entrar em cena */
  chamarMorador(id){
    const m = this.moradores.get(id);
    if (!m) return false;
    const guia = document.querySelector(`.guia[data-folha="${m.def.tela}"]`);
    if (guia && guia.getAttribute("aria-selected") !== "true") guia.click();

    const r = m.def.reagir || {};
    m.el.classList.remove("reagindo"); void m.el.offsetWidth;   // reinicia a animação
    m.el.classList.add("reagindo");
    setTimeout(() => m.el.classList.remove("reagindo"), 1300);

    if (r.particulas){
      const b = m.el.getBoundingClientRect();
      const { tipo="faisca", quantidade=30, cor="255,255,255" } = r.particulas;
      R.Po?.jorro(tipo, b.left + b.width/2, b.top + b.height*.3, quantidade, cor);
    }
    if (r.camera) R.Camera.aplicar(r.camera);
    if (r.luz){ R.Luz.acender(r.luz); setTimeout(() => R.Luz.apagar(), 1500); }
    if (r.som) R.Som.arquivo(r.som, .7);
    return true;
  },

  /* ═══════ ROLETA ═══════ é um NÚMERO DE PALCO, não um widget.

     A roda surge de lado, virando em 3D até encarar a tela. O apresentador
     sobe pela direita com os holofotes. A roda sai voando — cima, baixo,
     lados — girando o tempo todo, volta pro lugar, desacelera, CLACK, dá o
     resultado, e os dois vão embora. SÓ ENTÃO a consequência acontece.

     O giro inteiro é UMA transição só, do zero até o ângulo final, com uma
     curva que começa rápida e termina arrastando. O voo acontece por cima,
     num elemento separado — por isso um não atropela o outro. */
  roleta(c){
    const n = c.setores.length, fatia = 360/n;
    const T = {
      entrada: c.entrada ?? 1300,          // a roda virando pra tela
      voo:     c.voo     ?? 3400,          // o passeio dela pela tela
      giro:    c.duracao ?? 6400,          // do primeiro giro até parar
      leitura: c.leitura ?? 2200,          // o resultado na tela
    };

    const cx = document.createElement("div");
    cx.className = "roleta-cena";

    const holofotes = document.createElement("div"); holofotes.className = "holofotes";
    const voo   = document.createElement("div"); voo.className = "roda-voo";
    const roda  = document.createElement("div"); roda.className = "roda";
    const aro   = document.createElement("div"); aro.className = "aro";
    const disco = document.createElement("div"); disco.className = "disco";
    const eixo  = document.createElement("div"); eixo.className = "eixo";
    const agulha= document.createElement("div"); agulha.className = "agulha";

    const cores = ["var(--lilas)","var(--painel3)","var(--ouro)","var(--painel2)",
                   "var(--carga)","var(--laranja)","var(--menta)","var(--vida)"];
    disco.style.background = "conic-gradient(" + c.setores.map((_,i) =>
      `${cores[i%cores.length]} ${i*fatia}deg ${(i+1)*fatia}deg`).join(",") + ")";
    c.setores.forEach((txt,i) => {
      const s = document.createElement("span");
      s.className = "rotulo-setor";
      s.style.setProperty("--a", (i*fatia + fatia/2) + "deg");
      s.textContent = txt;
      disco.append(s);
    });
    // lâmpadas do aro, igual roda de parque
    for (let i = 0; i < 16; i++){
      const b = document.createElement("i");
      b.className = "lampada";
      b.style.setProperty("--a", (i * 22.5) + "deg");
      b.style.animationDelay = (i * 60) + "ms";
      aro.append(b);
    }

    roda.append(aro, disco, eixo);
    voo.append(roda, agulha);
    const saida = document.createElement("div"); saida.className = "roleta-saida";
    cx.append(holofotes, voo, saida);

    // o apresentador: sobe pela direita e fica apresentando
    let apre = null;
    if (c.apresentador?.asset && c.apresentador._resolvido){
      apre = document.createElement("img");
      apre.className = "apresentador"; apre.src = c.apresentador.asset; apre.alt = "";
      apre.style.height = ((c.apresentador.altura ?? .6) * 100) + "vh";
      apre.draggable = false;
      cx.append(apre);
      if (c.apresentador.legenda){
        const l = document.createElement("div");
        l.className = "legenda-apresentador"; l.textContent = c.apresentador.legenda;
        cx.append(l);
      }
    }

    palco().append(cx);
    requestAnimationFrame(() => cx.classList.add("dentro"));

    /* ── o giro: uma transição só, começando depois que ela encara a tela ── */
    const sorteado = Math.floor(Math.random()*n);
    const alvo = (c.giros||6)*360 + (360 - fatia*sorteado) - fatia/2;
    setTimeout(() => {
      disco.style.transition = `transform ${T.giro}ms cubic-bezier(.06,.68,.06,1)`;
      disco.style.transform  = `rotate(${alvo}deg)`;
      voo.classList.add("voando");
      voo.style.setProperty("--voo-dur", T.voo + "ms");
    }, T.entrada);

    // os cliques desaceleram junto com ela
    if (!REDUZ) setTimeout(() => {
      let t = 0, passo = 38;
      const tic = () => { if (t > T.giro) return; R.Som.bip("clack"); t += passo; passo *= 1.085; setTimeout(tic, passo); };
      tic();
    }, T.entrada);

    /* ── o resultado ── */
    const caiu = c.setores[sorteado];
    const fimDoGiro = T.entrada + T.giro;
    setTimeout(() => {
      R.Som.arquivo(c.som, .8) || R.Som.bip("critico");
      saida.textContent = caiu;
      saida.classList.add("dentro");
      cx.classList.add("acertou");
      R.Camera.batida(1.5);
      R.Po?.jorro("confete", innerWidth/2, innerHeight*.42, 50, "255,200,87");
    }, fimDoGiro);

    /* ── saem de cena, e SÓ ENTÃO a consequência ── */
    const efeito = c.seCair?.[caiu];
    if (efeito?.cenario) this._salaAbrindo = true;
    setTimeout(() => {
      cx.classList.remove("dentro");
      cx.classList.add("saindo");
      setTimeout(() => cx.remove(), 1000);
      if (efeito?.cenario) setTimeout(() => {
        this._salaAbrindo = false;
        R.Cenario?.abrir(efeito.cenario);
      }, 800);
    }, fimDoGiro + T.leitura);

    return () => {};   // o número cuida da própria saída
  },

  /* ═══════ GATILHOS ═══════ */
  ligarGatilhos(){
    const porCliques = this.lista.filter(s => s.gatilho?.tipo === "cliques");
    if (porCliques.length){
      document.addEventListener("click", e => {
        for (const s of porCliques){
          const g = s.gatilho;
          if (!e.target.closest(g.alvo)) continue;
          const st = this.estado.get(s.id), agora = performance.now();
          if (agora - st.t0 > (g.janela || 10000)){ st.cliques = 0; st.t0 = agora; }
          st.cliques++;
          if (st.cliques >= g.vezes){ st.cliques = 0; this.tentar(s.id); }
        }
      });
    }

    const porTeclas = this.lista.filter(s => s.gatilho?.tipo === "teclas");
    if (porTeclas.length){
      let buf = "";
      addEventListener("keydown", e => {
        if (e.target.matches("input,textarea")) return;
        if (e.key.length !== 1) return;
        buf = (buf + e.key.toLowerCase()).slice(-24);
        for (const s of porTeclas)
          if (buf.endsWith(s.gatilho.sequencia.toLowerCase())){ buf = ""; this.tentar(s.id, { forcar:true }); }
      });
    }

    // chegou no fim da página — discreto, ligado a uma ação de verdade
    const porFundo = this.lista.filter(s => s.gatilho?.tipo === "fim-da-pagina");
    if (porFundo.length){
      let armado = true;
      addEventListener("scroll", () => {
        const fim = innerHeight + scrollY >= document.body.scrollHeight - 40;
        if (!fim){ armado = true; return; }
        if (!armado) return;
        armado = false;
        for (const s of porFundo) this.tentar(s.id);
      }, { passive:true });
    }

    /* segurar apertado. Um anel de ouro enche em volta do alvo enquanto
       você mantém; soltar antes da hora cancela e o anel esvazia. */
    for (const s of this.lista.filter(x => x.gatilho?.tipo === "segurar")){
      const alvo = document.querySelector(s.gatilho.alvo);
      if (!alvo) continue;
      const ms = s.gatilho.ms || 1200;
      let t0 = 0, raf = 0, timer = 0;
      const parar = () => {
        clearTimeout(timer); cancelAnimationFrame(raf);
        alvo.classList.remove("segurando");
        alvo.style.setProperty("--carregado", "0deg");
      };
      const quadro = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        alvo.style.setProperty("--carregado", (k * 360).toFixed(1) + "deg");
        if (k < 1) raf = requestAnimationFrame(quadro);
      };
      alvo.addEventListener("pointerdown", () => {
        t0 = performance.now();
        alvo.classList.add("segurando");
        raf = requestAnimationFrame(quadro);
        timer = setTimeout(() => { parar(); this.tentar(s.id, { forcar:true }); }, ms);
      });
      ["pointerup","pointerleave","pointercancel"].forEach(ev =>
        alvo.addEventListener(ev, parar));
    }

    const porAcaso = this.lista.filter(s => s.gatilho?.tipo === "aleatorio");
    if (porAcaso.length){
      document.addEventListener("click", () => {
        for (const s of porAcaso)
          if (Math.random() < (s.gatilho.chance || .01)) this.tentar(s.id);
      });
    }
  },

  /* chamado pela ficha quando sai um valor específico no dado */
  rolagem(valor){
    for (const s of this.lista)
      if (s.gatilho?.tipo === "rolagem" && s.gatilho.valor === valor) this.tentar(s.id);
  },

  /* ═══════ CORTINAS ═══════ genéricas, desenhadas em CSS.
     O pano leva 1,1s pra atravessar. Antes isto mandava abrir aos 900ms,
     ou seja ANTES de ter fechado — por isso nunca fechava toda. Agora o
     tempo de travessia é uma constante e a pausa começa DEPOIS dela. */
  FECHO: 1150,
  cortinas(opcoes = {}, legadoAoAbrir){
    // aceita cortinas(ms, fn) antigo e cortinas({pausa, aoTrocar, aoAbrir}) novo
    const o = typeof opcoes === "number" ? { pausa: 600, aoAbrir: legadoAoAbrir } : opcoes;
    const c = $("#cortinas");
    c.classList.remove("fechando","abrindo","glitchando");
    void c.offsetWidth;
    c.classList.toggle("glitchando", !!o.glitch);
    c.classList.add("fechando");
    R.Som.bip("nivel");

    setTimeout(() => o.aoTrocar?.(), this.FECHO);                 // tela toda coberta
    setTimeout(() => { c.classList.add("abrindo"); o.aoAbrir?.(); },
               this.FECHO + (o.pausa ?? 600));
    setTimeout(() => c.classList.remove("fechando","abrindo","glitchando"),
               this.FECHO * 2 + (o.pausa ?? 600) + 120);
  },
};
})();
