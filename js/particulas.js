/* ═══ particulas.js — um canvas, pool com teto, pausa fora de foco ═══ */
(() => {
"use strict";
const R = window.RSS, { rnd, REDUZ } = R;
R.Po = {
  cv:null, ctx:null, p:[], MAX:300, w:0, h:0, ativo:true,
  init(){
    this.cv = R.$("#po"); this.ctx = this.cv.getContext("2d");
    this.medir(); addEventListener("resize", () => this.medir(), { passive:true });
    document.addEventListener("visibilitychange", () => this.ativo = !document.hidden);
    if (!REDUZ){ for (let i=0;i<70;i++) this.p.push(this.nova("poeira")); this.laco(); }
  },
  medir(){ const d = Math.min(devicePixelRatio||1,2);
    this.w = innerWidth; this.h = innerHeight;
    this.cv.width = this.w*d; this.cv.height = this.h*d; this.ctx.setTransform(d,0,0,d,0,0); },
  nova(tipo,x,y,cor){
    const b = { tipo, x:x??rnd(0,this.w), y:y??rnd(0,this.h), cor:cor||"255,255,255" };
    if (tipo==="poeira")  return {...b, vx:rnd(-.08,.08), vy:rnd(-.16,-.04), r:rnd(.6,1.9), a:rnd(.05,.2), decai:0};
    if (tipo==="faisca")  return {...b, vx:rnd(-2.8,2.8), vy:rnd(-3.4,.6), r:rnd(1.2,3), a:.95, decai:.021, g:.08};
    if (tipo==="confete") return {...b, vx:rnd(-3.2,3.2), vy:rnd(-7.5,-2.5), r:rnd(2.5,5.5), a:1, decai:.009, g:.17, rot:rnd(0,6.3), vr:rnd(-.22,.22)};
    return b;
  },
  jorro(tipo,x,y,n,cor){ if (REDUZ) return;
    for (let i=0;i<n && this.p.length<this.MAX;i++) this.p.push(this.nova(tipo,x,y,cor)); },
  laco(){
    const quadro = () => {
      requestAnimationFrame(quadro);
      if (!this.ativo) return;
      const c = this.ctx; c.clearRect(0,0,this.w,this.h);
      const dens = R.Estado.cfg().po;
      for (let i=this.p.length-1;i>=0;i--){
        const o = this.p[i];
        o.x += o.vx; o.y += o.vy;
        if (o.g) o.vy += o.g;
        if (o.vr != null) o.rot += o.vr;
        if (o.decai){ o.a -= o.decai; if (o.a<=0){ this.p.splice(i,1); continue; } }
        else { if (o.y<-10){ o.y=this.h+10; o.x=rnd(0,this.w); }
               if (o.x<-10) o.x=this.w+10; if (o.x>this.w+10) o.x=-10; }
        c.globalAlpha = Math.max(0,o.a) * (o.decai ? 1 : Math.min(dens,2));
        c.fillStyle = `rgb(${o.cor})`;
        if (o.tipo==="confete"){ c.save(); c.translate(o.x,o.y); c.rotate(o.rot);
          c.fillRect(-o.r,-o.r*.45,o.r*2,o.r*.9); c.restore(); }
        else { c.beginPath(); c.arc(o.x,o.y,o.r,0,6.283); c.fill(); }
      }
      c.globalAlpha = 1;
    };
    requestAnimationFrame(quadro);
  },
};
})();
