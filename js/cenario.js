/* ═══════════════════════════════════════════════════════════════════
   cenario.js — SALAS. A ficha vira fundo e você entra em outro lugar.

   Um cenário é uma imagem de fundo + atores soltos em cima dela. A
   sensação de profundidade vem do TAMANHO: cada ator tem uma `altura`
   (fração da altura da sala) e um `z` (0 longe → 1 perto). O z não mexe
   no tamanho, só no parallax e em quem fica na frente de quem — assim
   "longe" e "pequeno" continuam sendo a mesma coisa, que é o que o olho
   espera.

   Ator pode ter PONTOS clicáveis dentro dele: uma caixa em % da própria
   imagem. É assim que se clica no mouse que o cinza está espancando sem
   o mouse precisar ser um arquivo separado.

   Clicar num ponto roda um ROTEIRO: uma lista de passos declarativos.
   Nenhuma animação é escrita à mão no config.

   O que o roteiro muda pode ser LEMBRADO. Da próxima vez que você entrar,
   a sala já começa mudada. É isso que faz parecer que aconteceu de verdade.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
"use strict";
const R = window.RSS, { $ } = R;

const Cenario = R.Cenario = {
  atual: null, atores: new Map(), caixa: null, memoria: new Set(), _parallax: null,

  init(){
    try { this.memoria = new Set(JSON.parse(localStorage.getItem("rss-cenario") || "[]")); } catch {}
  },
  lembrar(marca){
    this.memoria.add(marca);
    try { localStorage.setItem("rss-cenario", JSON.stringify([...this.memoria])); } catch {}
  },
  esquecer(){ this.memoria.clear(); try { localStorage.removeItem("rss-cenario"); } catch {} },

  /* ═══ ABRIR ═══ cada sala escolhe COMO se chega nela.
     A transição é só uma função que recebe "troque agora" e chama quando
     a tela estiver coberta. Sala nova = transição nova, sem mexer no resto. */
  async abrir(nome){
    const def = (window.CENARIOS || {})[nome];
    if (!def || this.atual) return false;
    this.atual = nome;
    const e = def.entrada || { tipo: "cortina" };
    const fazer = (this.TRANSICOES[e.tipo] || this.TRANSICOES.cortina).bind(this);
    fazer(() => this.montar(def), e);
    return true;
  },

  TRANSICOES: {
    /* ── a cortina de teatro ── */
    cortina(trocar, e){
      R.Segredos.cortinas({ pausa: e.pausa ?? 900, aoTrocar: trocar });
    },

    /* ── TREMOR ── alguém sobe na frente da ficha, tudo começa a tremer e a
       brilhar, e aí a sala simplesmente JÁ É outra. O desvanecer é curto de
       propósito: você sabe que piscou, mas não vê o corte. ── */
    async tremor(trocar, e){
      const dur = e.duracao ?? 3400;
      const sobe = document.createElement("img");
      const certo = await R.resolverAsset(e.quemSobe);
      if (certo){
        sobe.className = "subindo"; sobe.src = certo; sobe.alt = ""; sobe.draggable = false;
        sobe.style.height = ((e.altura ?? .5) * 100) + "vh";
        document.body.append(sobe);
        requestAnimationFrame(() => sobe.classList.add("dentro"));
      }
      const flash = document.createElement("div");
      flash.className = "clarao-tremor";
      flash.style.setProperty("--brilho", e.brilho ?? .8);
      document.body.append(flash);

      // o tremor cresce: começa quase nada e termina insuportável
      const t0 = performance.now();
      const passo = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        R.Camera.aplicar({ tremor: .3 + k*k*3.4, zoom: 1 + k*.05,
                           distorcao: k*1.6, duracao: 240 });
        flash.style.opacity = (k*k*.9).toFixed(3);
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
      if (!R.REDUZ) setTimeout(() => R.Falha.disparar(3), dur*.6);

      setTimeout(() => {
        flash.classList.add("corte");          // 140ms de branco e acabou
        trocar();
        sobe.remove();
        R.Camera.soltar();
        setTimeout(() => flash.remove(), 420);
      }, dur);
    },

    /* ── CIRCO ── o Caine entra na diagonal do canto de baixo com o nome
       saindo de trás dele, a cortina fecha GLITCHANDO, os olhos tomam a
       tela, e só então ela abre pro outro lado. ── */
    async circo(trocar, e){
      const cx = document.createElement("div");
      cx.className = "passagem-circo";
      document.body.append(cx);

      const caine = await R.resolverAsset(e.caine);
      if (caine){
        const im = document.createElement("img");
        im.className = "caine-diagonal"; im.src = caine; im.alt = ""; im.draggable = false;
        im.style.height = ((e.altura ?? .72) * 100) + "vh";
        const nome = document.createElement("div");
        nome.className = "nome-caine"; nome.textContent = e.nome || "";
        cx.append(nome, im);                       // o nome ATRÁS dele
        requestAnimationFrame(() => cx.classList.add("entrando"));
      }

      const tEntrada = e.entradaMs ?? 2200;
      setTimeout(() => {
        cx.classList.remove("entrando"); cx.classList.add("saindo");
        R.Segredos.cortinas({
          glitch: true,
          pausa: e.pausaOlhos ?? 3600,
          aoTrocar: async () => {
            cx.remove();
            trocar();
            await this.olhos(e);                   // acontece com a tela coberta
          },
        });
      }, tEntrada);
    },
  },

  /* os olhos: a tela inteira vira olhos, um bicho cheio deles cresce no meio */
  async olhos(e){
    const cx = document.createElement("div");
    cx.className = "cena-olhos";
    const fundo = await R.resolverAsset(e.olhos);
    if (fundo) cx.style.backgroundImage = `url("${fundo}")`;
    const bicho = await R.resolverAsset(e.olhudo);
    if (bicho){
      const im = document.createElement("img");
      im.className = "bicho-olhos"; im.src = bicho; im.alt = ""; im.draggable = false;
      cx.append(im);
    }
    document.body.append(cx);
    requestAnimationFrame(() => cx.classList.add("dentro"));
    R.Som.bip("falha");
    setTimeout(() => { cx.classList.remove("dentro");
                       setTimeout(() => cx.remove(), 700); }, e.olhosMs ?? 2600);
  },

  async montar(def){
    const cx = this.caixa = document.createElement("div");
    cx.className = "cenario";
    cx.setAttribute("role", "img");
    cx.setAttribute("aria-label", def.descricao || "cenário");

    const fundo = await R.resolverAsset(def.fundo);
    if (fundo) cx.style.backgroundImage = `url("${fundo}")`;
    else cx.classList.add("sem-fundo");

    const veu = document.createElement("div"); veu.className = "cenario-clarao";
    const palco = document.createElement("div"); palco.className = "cenario-palco";
    cx.append(palco, veu);
    this.palco = palco; this.veu = veu;

    for (const a of def.atores || []) await this.ator(a);

    // estado já lembrado: aplica na hora, sem animação nenhuma
    for (const [marca, passos] of Object.entries(def.seLembrado || {}))
      if (this.memoria.has(marca)) await this.rodar(passos, true);

    const sair = document.createElement("button");
    sair.className = "cenario-sair"; sair.textContent = "voltar";
    sair.addEventListener("click", () => this.fechar());
    cx.append(sair);

    document.body.append(cx);
    // a sala toma a tela inteira: a página atrás não pode continuar rolando,
    // nem deixar a barra de rolagem na borda. Guarda onde estava e volta depois.
    // sobe pro topo ANTES de travar — travado o scrollTo não tem mais efeito,
    // e a página ficaria presa no meio dela mesma atrás da sala.
    this._scroll = scrollY;
    scrollTo(0, 0);
    document.documentElement.classList.add("em-cena");
    requestAnimationFrame(() => cx.classList.add("dentro"));
    this.ligarParallax();
    addEventListener("keydown", this._esc = e => { if (e.key === "Escape") this.fechar(); });
  },

  /* ═══ ATOR ═══ */
  async ator(a){
    const el = document.createElement("div");
    el.className = "ator";
    el.style.left   = a.x + "%";
    el.style.top    = a.y + "%";
    el.style.height = ((a.altura ?? .3) * 100) + "%";
    el.style.zIndex = Math.round((a.z ?? .5) * 100);
    el.style.setProperty("--z", a.z ?? .5);
    el.style.setProperty("--esp", a.espelhar ? -1 : 1);

    const im = document.createElement("img");
    const certo = await R.resolverAsset(a.asset);
    if (!certo){ R.Segredos.faltando.add(a.asset); return; }
    im.src = certo; im.alt = "";
    im.draggable = false;              // senão o navegador oferece arrastar a imagem
    if (a.pixelado) im.style.imageRendering = "pixelated";
    el.append(im);
    // direto, SEM rAF: o seLembrado roda logo depois e precisa poder esconder
    // quem já foi embora. Com rAF o "visivel" voltava depois e desfazia tudo.
    if (!a.oculto) el.classList.add("visivel");

    for (const p of a.pontos || []){
      const b = document.createElement("button");
      b.className = "ponto" + (p.mostrar ? " visivel" : "");
      const [x,y,w,h] = p.caixa;
      b.style.cssText += `left:${x}%;top:${y}%;width:${w}%;height:${h}%`;
      if (p.dica) b.title = p.dica;
      b.setAttribute("aria-label", p.dica || "interagir");
      // classe no ator em vez de seletor CSS: o botão é irmão POSTERIOR do
      // <img>, então "~ img" nunca casaria, e :has() não existe em tudo.
      b.addEventListener("pointerenter", () => el.classList.add("aceso"));
      b.addEventListener("pointerleave", () => el.classList.remove("aceso"));
      b.addEventListener("focus", () => el.classList.add("aceso"));
      b.addEventListener("blur",  () => el.classList.remove("aceso"));
      if (p.aguentar){
        /* clicar abre um pouco e fecha sozinho. Clicar DE NOVO antes de fechar
           segura aberto — e é exatamente isso que acorda o que está dentro. */
        const g = p.aguentar;
        const fechado = im.getAttribute("src");
        let n = 0, t0 = 0, timer = 0;
        b.addEventListener("click", async () => {
          const agora = performance.now();
          if (agora - t0 > (g.janela ?? 4000)){ n = 0; t0 = agora; }
          n++;
          const aberto = await R.resolverAsset(g.abre);
          if (aberto) im.src = aberto;
          el.classList.add("mexendo");
          clearTimeout(timer);
          timer = setTimeout(() => { im.src = fechado; el.classList.remove("mexendo"); },
                             g.volta ?? 900);
          R.Som.bip("clique");
          if (n >= (g.cliques ?? 5)){
            n = 0; clearTimeout(timer);
            im.src = fechado; el.classList.remove("mexendo");
            this.jumpscare(g.jumpscare);
          }
        });
      } else {
        b.addEventListener("click", () => {
          if (b.dataset.usado) return;
          b.dataset.usado = "1";
          this.rodar((window.CENARIOS[this.atual].roteiro || {})[p.roteiro] || []);
        });
      }
      el.append(b);
    }

    this.palco.append(el);
    this.atores.set(a.id, { el, img: im, def: a });
  },

  /* ═══ PARALLAX ═══ o que está perto se mexe mais. É só isso. ═══ */
  ligarParallax(){
    if (R.REDUZ) return;
    this._parallax = e => {
      const dx = (e.clientX / innerWidth - .5), dy = (e.clientY / innerHeight - .5);
      for (const { el, def } of this.atores.values()){
        const z = def.z ?? .5;
        el.style.setProperty("--px", (-dx * 46 * z).toFixed(1) + "px");
        el.style.setProperty("--py", (-dy * 22 * z).toFixed(1) + "px");
      }
    };
    addEventListener("pointermove", this._parallax, { passive:true });
  },

  /* ═══ ROTEIRO ═══ passos em sequência. `jaFoi` aplica tudo instantâneo ═══ */
  async rodar(passos, jaFoi = false){
    for (const passo of passos){
      if (passo.esperar != null){ if (!jaFoi) await espera(passo.esperar); continue; }

      if (passo.luz){
        const { tremer = 0, cor, duracao = 1400 } = passo.luz;
        if (!jaFoi){
          this.caixa.classList.toggle("piscando", tremer > 0);
          this.caixa.style.setProperty("--tremor", tremer);
          if (cor) this.caixa.style.setProperty("--luz-sala", cor);
          setTimeout(() => this.caixa?.classList.remove("piscando"), duracao);
        }
      }

      if (passo.clarear){
        const { ate = 1, duracao = 3000 } = passo.clarear;
        this.veu.style.transition = jaFoi ? "none" : `opacity ${duracao}ms ease`;
        requestAnimationFrame(() => this.veu.style.opacity = ate);
      }

      if (passo.descer){
        const d = passo.descer, a = this.atores.get(d.ator);
        if (a){
          a.el.classList.add("visivel");
          if (jaFoi){ a.el.style.top = d.ate + "%"; }
          else {
            a.el.style.transition = "none";
            a.el.style.top = d.de + "%";
            a.el.style.setProperty("--giro", "0deg");
            void a.el.offsetWidth;
            a.el.style.transition = `opacity .6s ease, top ${d.duracao||4000}ms linear`;
            a.el.style.setProperty("--giro-dur", (d.duracao||4000) + "ms");
            a.el.style.setProperty("--giro-fim", ((d.giros||2) * 360) + "deg");
            a.el.classList.add("girando");
            requestAnimationFrame(() => a.el.style.top = d.ate + "%");
          }
        }
      }

      if (passo.sumir) for (const id of [].concat(passo.sumir)){
        const a = this.atores.get(id);
        if (!a) continue;
        a.el.classList.remove("visivel");
        a.el.classList.add("foi");
        if (jaFoi) a.el.style.display = "none";
        else setTimeout(() => a.el.style.display = "none", 900);
      }

      if (passo.trocar) for (const [id, novo] of Object.entries(passo.trocar)){
        const a = this.atores.get(id);
        if (!a) continue;
        const certo = await R.resolverAsset(novo);
        if (certo) a.img.src = certo;
      }

      if (passo.surgir) for (const [id, cfg] of Object.entries(passo.surgir)){
        const a = this.atores.get(id);
        if (!a) continue;
        a.el.style.display = "";
        a.el.classList.remove("foi");
        if (cfg.x != null) a.el.style.left = cfg.x + "%";
        if (cfg.y != null) a.el.style.top  = cfg.y + "%";
        if (cfg.altura != null) a.el.style.height = (cfg.altura * 100) + "%";
        requestAnimationFrame(() => a.el.classList.add("visivel"));
      }

      if (passo.camera && !jaFoi) R.Camera.aplicar(passo.camera);
      if (passo.som && !jaFoi) R.Som.arquivo(passo.som, .7);
      if (passo.sussurro && !jaFoi) R.sussurrar?.(passo.sussurro, 3600);
      if (passo.lembrar) this.lembrar(passo.lembrar);
    }
  },

  /* ═══ JUMPSCARE ═══ tela inteira, de uma vez. A sacudida é da SALA, não da
     câmera da ficha — a ficha está atrás de um elemento fixed e não tremeria. */
  async jumpscare(j){
    if (!j) return;
    const certo = await R.resolverAsset(j.asset);
    if (!certo){ R.Segredos.faltando.add(j.asset); return; }
    const im = document.createElement("img");
    im.className = "jumpscare"; im.src = certo; im.alt = ""; im.draggable = false;
    this.caixa.append(im);
    this.caixa.classList.add("sacudindo");
    R.Som.arquivo(j.som, 1) || R.Som.bip("erro");
    R.Falha.disparar(3);
    const dur = j.duracao ?? 1100;
    setTimeout(() => {
      this.caixa?.classList.remove("sacudindo");
      im.classList.add("foi");
      setTimeout(() => im.remove(), 420);
    }, dur);
  },

  fechar(){
    if (!this.caixa) return;
    removeEventListener("keydown", this._esc);
    if (this._parallax) removeEventListener("pointermove", this._parallax);
    R.Segredos.cortinas({ pausa: 700, aoTrocar: () => {
      this.caixa?.remove();
      this.caixa = null; this.atual = null; this.atores.clear();
      document.documentElement.classList.remove("em-cena");
      scrollTo(0, this._scroll || 0);
    }});
  },
};

const espera = ms => new Promise(r => setTimeout(r, ms));
})();
