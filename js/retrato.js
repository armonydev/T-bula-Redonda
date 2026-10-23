/* ═══ retrato.js — a foto do personagem ═══
   O jogador escolhe um arquivo do PC e a imagem vira um data URL guardado
   junto da ficha. Assim ela sobrevive sem imgur, sem servidor, e viaja
   dentro do JSON exportado.

   O PORQUÊ DO REDIMENSIONAMENTO: o localStorage de um navegador costuma
   ter ~5MB NO TOTAL, pra todas as fichas juntas. Uma foto de celular tem
   3 a 8MB sozinha — uma só já estoura a cota e o salvamento começa a
   falhar silenciosamente. Então toda imagem é reduzida antes de guardar:
   quadrada, no máximo 512px, JPEG de qualidade 0.82. Dá uns 40-90KB, que
   é retrato de sobra e cabe em dezenas de fichas. */
window.RSS = window.RSS || {};
(function(){
"use strict";

const LADO = 512;
const QUALIDADE = 0.82;
const LIMITE_ENTRADA = 25 * 1024 * 1024;   // recusa arquivo absurdo antes de ler

/** Lê um File e devolve um data URL já reduzido e cortado em quadrado. */
function doArquivo(arq){
  return new Promise((ok, erro) => {
    if (!arq) return erro(new Error("nenhum arquivo"));
    if (!/^image\//.test(arq.type)) return erro(new Error("isso não é uma imagem"));
    if (arq.size > LIMITE_ENTRADA)  return erro(new Error("imagem grande demais (acima de 25MB)"));

    const fr = new FileReader();
    fr.onerror = () => erro(new Error("não deu pra ler o arquivo"));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => erro(new Error("não deu pra abrir a imagem"));
      im.onload = () => {
        try {
          // corte quadrado pelo centro, que é como o retrato aparece na ficha
          const lado = Math.min(im.width, im.height);
          const sx = (im.width  - lado) / 2;
          const sy = (im.height - lado) / 2;
          const alvo = Math.min(LADO, lado);

          const c = document.createElement("canvas");
          c.width = c.height = alvo;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(im, sx, sy, lado, lado, 0, 0, alvo, alvo);

          ok(c.toDataURL("image/jpeg", QUALIDADE));
        } catch (e) { erro(new Error("não deu pra processar a imagem")); }
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(arq);
  });
}

/** Quanto um data URL ocupa, em KB, pra poder avisar o jogador. */
const pesoKB = dataUrl => dataUrl ? Math.round(dataUrl.length * 0.75 / 1024) : 0;

/** É data URL (foto guardada) ou link externo (depende da internet)? */
const eGuardada = v => typeof v === "string" && v.startsWith("data:");

window.RSS.Retrato = { doArquivo, pesoKB, eGuardada, LADO };
})();
