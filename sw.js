/* ═══ sw.js — o que faz a Tábula virar aplicativo ═══
   Três trabalhos, e só três:
   1. Receber fichas compartilhadas de outro app (WhatsApp → Compartilhar →
      Tábula). O celular manda um POST pra ./receber; aqui a gente guarda os
      arquivos e abre a estante, que importa.
   2. Funcionar sem internet: tudo que já foi aberto uma vez fica guardado.
   3. Nunca mostrar versão velha quando tem internet: primeiro a rede, depois
      a cópia guardada. Atualizar o site no GitHub chega no app na hora. */
const VERSAO = "tabula-v1";
const RECEBIDOS = "tabula-recebidos";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k !== VERSAO && k !== RECEBIDOS) await caches.delete(k);
    await self.clients.claim();
  })());
});

const ehRecebimento = url => url.pathname.endsWith("/receber");

self.addEventListener("fetch", ev => {
  const req = ev.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* 1. ficha chegando de outro app */
  if (ehRecebimento(url)) {
    if (req.method !== "POST") { ev.respondWith(Response.redirect("./fichas.html", 303)); return; }
    ev.respondWith((async () => {
      const lista = [];
      try {
        const fd = await req.formData();
        for (const f of fd.getAll("fichas"))
          if (f && typeof f.text === "function") lista.push({ nome: f.name || "ficha.json", texto: await f.text() });
        /* às vezes o WhatsApp manda o conteúdo como texto, não como arquivo */
        const txt = fd.get("texto");
        if (typeof txt === "string" && txt.trim().startsWith("{")) lista.push({ nome: "texto.json", texto: txt });
      } catch (e) { /* segue com lista vazia: a estante avisa */ }
      const c = await caches.open(RECEBIDOS);
      await c.put("./__recebidos", new Response(JSON.stringify(lista), { headers: { "Content-Type": "application/json" } }));
      return Response.redirect("./fichas.html?recebido=1", 303);
    })());
    return;
  }

  if (req.method !== "GET") return;
  /* os PDFs dos livros são grandes demais pra guardar */
  if (url.pathname.includes("/livros/")) return;

  /* 2 e 3. rede primeiro, cópia guardada se não tiver internet */
  ev.respondWith((async () => {
    try {
      const resp = await fetch(req);
      if (resp && resp.ok && resp.type === "basic") {
        const c = await caches.open(VERSAO); c.put(req, resp.clone());
      }
      return resp;
    } catch (e) {
      const c = await caches.open(VERSAO);
      return (await c.match(req, { ignoreSearch: req.mode === "navigate" }))
          || (req.mode === "navigate" ? await c.match("./fichas.html", { ignoreSearch: true }) : undefined)
          || new Response("Sem internet, e esta página ainda não tinha sido aberta.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
