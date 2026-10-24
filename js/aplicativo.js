/* ═══ aplicativo.js — a Tábula como aplicativo do celular ═══
   - registra o service worker (sw.js)
   - pergunta, de vez em quando, se a pessoa quer instalar como aplicativo
   - importa fichas que chegaram compartilhadas (WhatsApp → Compartilhar)
   - na hora de exportar, pergunta se quer MANDAR pra alguém ou SALVAR
   Script clássico, carregado com defer em todas as páginas. */
(function(){
"use strict";

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const ler = k => { try { return localStorage.getItem(k); } catch { return null; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const ehApp = () =>
  (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const ehCelular = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));

/* ───────── 1. service worker ───────── */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ───────── caixinha de escolha (usada no instalar e no exportar) ───────── */
function estilo(){
  if (document.getElementById("tabula-app-css")) return;
  const s = document.createElement("style"); s.id = "tabula-app-css";
  s.textContent = `
  .tb-app{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;width:min(440px,calc(100vw - 32px));
    background:#262150;color:#fff;border:2px solid #15112f;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.45);
    padding:14px 16px;font-family:Inter,system-ui,sans-serif;font-size:14.5px;line-height:1.45}
  .tb-app b{display:block;font-family:Fredoka,sans-serif;font-size:16px;margin-bottom:4px}
  .tb-app p{margin:0 0 12px;color:#cfc6f2}
  .tb-app .tb-bts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .tb-app button{font:600 14px Inter,system-ui,sans-serif;border-radius:10px;padding:9px 14px;cursor:pointer;border:2px solid #15112f}
  .tb-app .tb-sim{background:#bb8cff;color:#15112f}
  .tb-app .tb-nao{background:transparent;color:#cfc6f2;border-color:#3d3578}
  .tb-fundo{position:fixed;inset:0;background:rgba(10,6,20,.55);z-index:9998}`;
  document.head.append(s);
}
/* mostra a caixa e devolve qual botão foi apertado (ou null) */
function perguntar(titulo, texto, botoes, comFundo){
  estilo();
  return new Promise(ok => {
    const fundo = comFundo ? Object.assign(document.createElement("div"), { className: "tb-fundo" }) : null;
    const cx = document.createElement("div"); cx.className = "tb-app"; cx.setAttribute("role", "dialog");
    cx.innerHTML = `<b>${esc(titulo)}</b><p>${texto}</p><div class="tb-bts">${
      botoes.map((b, i) => `<button type="button" data-i="${i}" class="${b.principal ? "tb-sim" : "tb-nao"}">${esc(b.texto)}</button>`).join("")}</div>`;
    const fechar = v => { cx.remove(); fundo && fundo.remove(); ok(v); };
    cx.addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (b) fechar(botoes[+b.dataset.i].valor); });
    if (fundo) { fundo.addEventListener("click", () => fechar(null)); document.body.append(fundo); }
    document.body.append(cx);
  });
}

/* ───────── 2. perguntar se quer instalar ───────── */
const CHAVE_NAO = "tabula:app-agora-nao";
const DIAS_ATE_PERGUNTAR_DE_NOVO = 14;
let pedidoInstalar = null;

function podePerguntar(){
  if (ehApp()) return false;
  const quando = +ler(CHAVE_NAO) || 0;
  return Date.now() - quando > DIAS_ATE_PERGUNTAR_DE_NOVO * 864e5;
}
async function oferecer(){
  if (!podePerguntar()) return;
  if (pedidoInstalar) {
    const r = await perguntar("Usar a Tábula como aplicativo?",
      "Abre direto da tela inicial, funciona sem internet e <b>recebe fichas compartilhadas</b> do WhatsApp.",
      [{ texto: "Agora não", valor: "nao" }, { texto: "Instalar", valor: "sim", principal: true }]);
    if (r === "sim") { pedidoInstalar.prompt(); try { await pedidoInstalar.userChoice; } catch {} pedidoInstalar = null; }
    else guardar(CHAVE_NAO, String(Date.now()));
  } else if (ehIOS()) {
    const r = await perguntar("Usar a Tábula como aplicativo?",
      "No iPhone: toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>.",
      [{ texto: "Entendi", valor: "nao", principal: true }]);
    if (r) guardar(CHAVE_NAO, String(Date.now()));
  }
}
window.addEventListener("beforeinstallprompt", ev => {
  ev.preventDefault(); pedidoInstalar = ev;
  setTimeout(oferecer, 4000);
});
window.addEventListener("appinstalled", () => { pedidoInstalar = null; guardar(CHAVE_NAO, String(Date.now())); });
if (ehIOS()) setTimeout(oferecer, 6000);

/* ───────── 3. receber fichas compartilhadas ───────── */
async function importarTextos(lista){
  const Arm = window.RSS && window.RSS.Arm;
  if (!Arm) return;
  let ok = 0; const ruim = [];
  for (const item of lista) {
    try {
      const arq = new File([item.texto], item.nome || "ficha.json", { type: "application/json" });
      const f = await Arm.importar(arq); f.id = Arm.novoId(); Arm.salvar(f); ok++;
    } catch (e) { ruim.push((item.nome || "arquivo") + ": " + e.message); }
  }
  try { sessionStorage.setItem("tabula:importou", JSON.stringify({ ok, ruim })); } catch {}
  location.replace("fichas.html");
}
async function verRecebidos(){
  const p = new URLSearchParams(location.search);
  if (p.get("recebido") && "caches" in window) {
    try {
      const c = await caches.open("tabula-recebidos");
      const r = await c.match("./__recebidos");
      const lista = r ? await r.json() : [];
      await c.delete("./__recebidos");
      if (!lista.length) {
        try { sessionStorage.setItem("tabula:importou", JSON.stringify({ ok: 0, ruim: ["nada chegou — tente mandar o arquivo .json de novo"] })); } catch {}
        return location.replace("fichas.html");
      }
      return importarTextos(lista);
    } catch {}
  }
  /* computador: abrir um .json com o aplicativo instalado */
  if ("launchQueue" in window) {
    window.launchQueue.setConsumer(async params => {
      if (!params.files || !params.files.length) return;
      const lista = [];
      for (const h of params.files) { const f = await h.getFile(); lista.push({ nome: f.name, texto: await f.text() }); }
      importarTextos(lista);
    });
  }
  /* depois de importar: avisa o que entrou */
  let res = null; try { res = JSON.parse(sessionStorage.getItem("tabula:importou") || "null"); sessionStorage.removeItem("tabula:importou"); } catch {}
  if (res) {
    const txt = (res.ok ? `<b>${res.ok}</b> ficha${res.ok > 1 ? "s" : ""} importada${res.ok > 1 ? "s" : ""}.` : "Nenhuma ficha entrou.") +
      (res.ruim.length ? "<br>" + res.ruim.map(esc).join("<br>") : "");
    perguntar("Ficha recebida", txt, [{ texto: "Ok", valor: "ok", principal: true }]);
  }
}

/* ───────── 4. exportar: mandar ou salvar ───────── */
function nomeDoArquivo(f){
  const sis = f.sistema && f.sistema !== "ressonancia" ? f.sistema : "ressonancia";
  return ((f.nome || "ficha").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "ficha") + "-" + sis + ".json";
}
function baixar(arquivo){
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a"); a.href = url; a.download = arquivo.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
/* recebe uma ou várias fichas; no celular pergunta se manda ou salva */
async function entregar(fichas){
  const lista = (Array.isArray(fichas) ? fichas : [fichas]).filter(Boolean);
  if (!lista.length) return;
  const arquivos = lista.map(f => new File([JSON.stringify(f, null, 2)], nomeDoArquivo(f), { type: "application/json" }));
  const daPraMandar = !!(navigator.canShare && navigator.share) && (() => { try { return navigator.canShare({ files: arquivos }); } catch { return false; } })();
  if (daPraMandar && (ehCelular() || ehApp())) {
    const qual = lista.length > 1 ? `as ${lista.length} fichas` : `a ficha de <b>${esc(lista[0].nome || "sem nome")}</b>`;
    const r = await perguntar("Exportar", `Quer mandar ${qual} pra alguém (WhatsApp, Drive…) ou salvar no aparelho?`,
      [{ texto: "Salvar", valor: "salvar" }, { texto: "Mandar", valor: "mandar", principal: true }], true);
    if (r === "mandar") {
      try { await navigator.share({ files: arquivos, title: lista.length > 1 ? "Fichas da Tábula" : (lista[0].nome || "Ficha") }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    if (r === null) return;
  }
  arquivos.forEach((a, i) => setTimeout(() => baixar(a), i * 250));
}

window.TabulaApp = { ehApp, entregar, oferecerInstalar: oferecer };

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", verRecebidos);
else verRecebidos();
})();
