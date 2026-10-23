/* ═══ armazenar.js — persistência sem conta ═══
   A ficha mora no localStorage daquele navegador. O cookie guarda só QUAL
   ficha está aberta, porque é o que a Câmara precisa ler pra abrir a certa.
   Script clássico, igual regras.js. */
window.RSS = window.RSS || {};
(function(){
"use strict";
const CHAVE="ressonancia:fichas", COOKIE="ressonancia_ficha";

const temMemoria = () => { try{ localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; }catch{ return false; } };
const lerTudo  = () => { try{ return JSON.parse(localStorage.getItem(CHAVE)||"{}"); }catch{ return {}; } };
const gravar   = o  => { try{ localStorage.setItem(CHAVE, JSON.stringify(o)); return true; }catch{ return false; } };

const novoId = () => "f"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function marcarAtual(id){
  const exp = new Date(Date.now()+180*864e5).toUTCString();
  document.cookie = COOKIE+"="+encodeURIComponent(id)+"; expires="+exp+"; path=/; SameSite=Lax";
}
/* O ?id= da URL manda mais que o cookie: é assim que o hub abre uma ficha
   específica sem depender de "qual foi a última". O cookie continua sendo
   o atalho pra quem entra direto em ficha.html. */
function idDaUrl(){
  try{ return new URLSearchParams(location.search).get("id") || ""; }catch{ return ""; }
}
function idAtual(){
  const u = idDaUrl(); if(u) return u;
  const m = document.cookie.match(new RegExp("(?:^|; )"+COOKIE+"=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}
function salvar(f){
  const t = lerTudo(); f.atualizadoEm = Date.now(); t[f.id] = f;
  const ok = gravar(t); if (ok) marcarAtual(f.id); return ok;
}
const carregar = id => lerTudo()[id] || null;
const listar   = () => Object.values(lerTudo()).sort((a,b)=>(b.atualizadoEm||0)-(a.atualizadoEm||0));

function exportar(f){
  const nome = (f.nome||"ficha").normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase() || "ficha";
  const url = URL.createObjectURL(new Blob([JSON.stringify(f,null,2)],{type:"application/json"}));
  const a = document.createElement("a");
  a.href = url; a.download = nome+"-ressonancia.json";
  document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function importar(arq){
  return new Promise((ok,erro)=>{
    const fr = new FileReader();
    fr.onload = () => { try{
      const f = JSON.parse(fr.result);
      if (!f || typeof f!=="object" || !f.atributosBase) throw new Error("não parece uma ficha do Ressonância");
      f.id = f.id || novoId(); ok(f);
    }catch(e){ erro(e); } };
    fr.onerror = () => erro(new Error("não deu pra ler o arquivo"));
    fr.readAsText(arq);
  });
}
window.RSS.Arm = { temMemoria, salvar, carregar, listar, idDaUrl, apagar(id){const t=lerTudo();delete t[id];gravar(t);},
                   marcarAtual, idAtual, novoId, exportar, importar };
})();
