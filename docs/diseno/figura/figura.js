/* Figura humana con volumen sobre las posturas de rutina.json (mismo esqueleto que la app:
   h cabeza, s hombros, c curva de la espalda, p pelvis, e codo, w muñeca, k rodilla, a tobillo; 1 = lado cercano, 2 = lejano).
   Prueba de estilo del rediseño (Fase 1c): todavía no se usa en la app. */
(function(){
const C={skin:"#E2B38D",skinFar:"#C4916B",hair:"#3B2B23",shirt:"#1E6B74",shirtFar:"#154F57",
  shorts:"#2C3735",shortsFar:"#1F2826",shoe:"#F3F5F4",shoeFar:"#C7D0CD",sole:"#7D8A87",band:"#D98E1F",ground:"#CFD9D6",glow:"#F0B04A"};
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const withC=p=>p.c?p:{...p,c:[(p.s[0]+p.p[0])/2,(p.s[1]+p.p[1])/2]};
const cycleOf=ex=>ex.phases.reduce((a,b)=>a+b.move+b.hold,0);
function state(ex,t,clamp){
  const ph=ex.phases,total=cycleOf(ex);
  let tt=(clamp&&t>=total)?total-1e-4:((t%total)+total)%total,i=0;
  while(i<ph.length-1&&tt>=ph[i].move+ph[i].hold){tt-=ph[i].move+ph[i].hold;i++;}
  const cur=ph[i],prev=ph[(i-1+ph.length)%ph.length];
  const a=withC(ex.poses[prev.pose]),b=withC(ex.poses[cur.pose]);
  const f=tt<cur.move?ease(tt/cur.move):1,pose={};
  for(const k in b)pose[k]=[a[k][0]+(b[k][0]-a[k][0])*f,a[k][1]+(b[k][1]-a[k][1])*f];
  return {pose,phase:cur};
}
/* Instante con la postura que trabaja (última fase ya colocada): sirve para las miniaturas */
function keyT(ex){
  const ph=ex.phases,want=ph.findIndex(x=>x.tone==="up");const k=want>=0?want:ph.length-1;
  let t=0;for(let i=0;i<k;i++)t+=ph[i].move+ph[i].hold;return t+ph[k].move;}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k];
const len=a=>Math.hypot(a[0],a[1])||1e-6,nrm=a=>mul(a,1/len(a)),perp=a=>[-a[1],a[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

/* Segmento con grosor que cambia de ra a rb, con los extremos redondeados */
function capsule(ctx,a,b,ra,rb,col){
  const d=nrm(sub(b,a)),n=perp(d);
  ctx.fillStyle=col;ctx.beginPath();
  ctx.moveTo(...add(a,mul(n,ra)));ctx.lineTo(...add(b,mul(n,rb)));
  ctx.arc(b[0],b[1],rb,Math.atan2(n[1],n[0]),Math.atan2(-n[1],-n[0]),true);
  ctx.lineTo(...add(a,mul(n,-ra)));
  ctx.arc(a[0],a[1],ra,Math.atan2(-n[1],-n[0]),Math.atan2(n[1],n[0]),true);
  ctx.closePath();ctx.fill();
}
/* Hacia dónde mira el cuerpo: las rodillas siempre doblan hacia delante; si las piernas están rectas, las manos */
/* Se decide con todas las posturas del ejercicio (en una sola postura con las piernas y los brazos rectos no se sabe),
   como un signo respecto al tronco, y se aplica a la postura de cada instante */
const FRONT=new WeakMap();
function frontSign(ex){
  if(FRONT.has(ex))return FRONT.get(ex);
  let kd=0,hd=0;
  ex.poses.map(withC).forEach(p=>{const n=perp(nrm(sub(p.s,p.p)));
    kd+=dot(sub(p.k1,lerp(p.p,p.a1,.5)),n)+dot(sub(p.k2,lerp(p.p,p.a2,.5)),n);
    hd+=dot(sub(lerp(p.w1,p.w2,.5),p.s),n);});
  const sgn=Math.abs(kd)>3?Math.sign(kd):(Math.sign(hd)||-1);
  FRONT.set(ex,sgn);return sgn;
}
function frontOf(ex,p){return mul(perp(nrm(sub(p.s,p.p))),frontSign(ex));}
/* Encuadre: la caja de todas las posturas del ejercicio (y el suelo), para que la persona llene el dibujo */
const BOX=new WeakMap();
function boxOf(ex){
  if(BOX.has(ex))return BOX.get(ex);
  let x0=1e9,y0=1e9,x1=-1e9,y1=104.5;
  ex.poses.map(withC).forEach(p=>{for(const k in p){const r=k==="h"?8:6;x0=Math.min(x0,p[k][0]-r);x1=Math.max(x1,p[k][0]+r);y0=Math.min(y0,p[k][1]-r);y1=Math.max(y1,p[k][1]+r);}});
  (ex.equip||[]).filter(q=>q.t==="box").forEach(q=>{const [x,y,w,h]=q.r;x0=Math.min(x0,x);x1=Math.max(x1,x+w);y0=Math.min(y0,y);});
  const pad=6,sc=Math.min(2.6,(180-2*pad)/(x1-x0),(112-2*pad)/(y1-y0));
  const b={sc,tx:90-sc*(x0+x1)/2,ty:112-pad-sc*y1};
  BOX.set(ex,b);return b;
}
function leg(ctx,p,k,a,front,far){
  const thighTop=lerp(p.p,p[k],.0),mid=lerp(p.p,p[k],.5);
  capsule(ctx,thighTop,p[k],5.2,3.9,far?C.skinFar:C.skin);
  capsule(ctx,p[k],p[a],3.8,2.5,far?C.skinFar:C.skin);
  capsule(ctx,p.p,mid,5.6,4.9,far?C.shortsFar:C.shorts);  // pantalón corto
  // zapatilla: perpendicular a la espinilla, hacia delante
  const sh=nrm(sub(p[a],p[k]));let toe=perp(sh);if(dot(toe,front)<0)toe=mul(toe,-1);
  const heel=add(p[a],mul(toe,-1.2)),tip=add(add(p[a],mul(toe,6.5)),mul(sh,1.4));
  capsule(ctx,heel,tip,2.6,2.1,far?C.shoeFar:C.shoe);
  ctx.strokeStyle=C.sole;ctx.lineWidth=.9;ctx.beginPath();
  ctx.moveTo(...add(heel,mul(sh,2.4)));ctx.lineTo(...add(tip,mul(sh,1.9)));ctx.stroke();
}
function arm(ctx,p,e,w,far){
  capsule(ctx,p.s,p[e],3.5,2.9,far?C.skinFar:C.skin);
  capsule(ctx,p[e],p[w],2.9,2.2,far?C.skinFar:C.skin);
  capsule(ctx,p.s,lerp(p.s,p[e],.45),3.9,3.4,far?C.shirtFar:C.shirt); // manga corta
  ctx.fillStyle=far?C.skinFar:C.skin;ctx.beginPath();ctx.arc(...p[w],2.6,0,7);ctx.fill();
}
function torso(ctx,p){
  const pts=[],N=14;
  for(let i=0;i<=N;i++){const t=i/N,u=1-t;
    const pt=[u*u*p.s[0]+2*u*t*(2*p.c[0]-(p.s[0]+p.p[0])/2)+t*t*p.p[0],u*u*p.s[1]+2*u*t*(2*p.c[1]-(p.s[1]+p.p[1])/2)+t*t*p.p[1]];
    pts.push(pt);}
  const w=t=>t<.25?7.6:t<.7?7.6-2.2*(t-.25)/.45:5.4+1.2*(t-.7)/.3; // pecho, cintura, cadera
  const side=s=>pts.map((pt,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(N,i+1)];return add(pt,mul(perp(nrm(sub(b,a))),s*w(i/N)));});
  const L=side(1),R=side(-1);
  const poly=(from,to,col)=>{ctx.fillStyle=col;ctx.beginPath();
    for(let i=from;i<=to;i++)ctx[i===from?"moveTo":"lineTo"](...L[i]);
    for(let i=to;i>=from;i--)ctx.lineTo(...R[i]);ctx.closePath();ctx.fill();};
  poly(0,N,C.shirt);poly(Math.round(N*.82),N,C.shorts);
  ctx.fillStyle=C.shirt;ctx.beginPath();ctx.arc(...p.s,7.2,0,7);ctx.fill();   // hombros redondos
  ctx.fillStyle=C.shorts;ctx.beginPath();ctx.arc(...p.p,6.2,0,7);ctx.fill();
}
function head(ctx,p,front){
  const up=nrm(sub(p.h,p.s));
  capsule(ctx,p.s,lerp(p.s,p.h,.6),2.6,2.4,C.skin);       // cuello
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(...p.h,6.3,0,7);ctx.fill();
  // pelo: casquete en la parte de arriba y de atrás
  const back=mul(front,-1),c=add(p.h,add(mul(up,1.2),mul(back,1.1)));
  ctx.save();ctx.beginPath();ctx.arc(...p.h,6.5,0,7);ctx.clip();
  ctx.fillStyle=C.hair;ctx.beginPath();ctx.arc(...c,5.6,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(...add(p.h,mul(front,5.4)),1.3,0,7);ctx.fill(); // nariz
}
function equip(ctx,ex,p,front){
  (ex.equip||[]).forEach(q=>{
    if(q.t==="box"){const [x,y,w,h]=q.r;ctx.fillStyle="#DDE5E3";ctx.fillRect(x,y,w,h);}
    else if(q.t==="goma"){ctx.strokeStyle=C.band;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(...p[q.at]);ctx.lineTo(...p[q.to]);ctx.stroke();}
    else if(q.t==="band"){const A=lerp(p.p,p[q.at],.82),B=lerp(p.p,p[q.to],.82),m=lerp(A,B,.5),L=Math.hypot(B[0]-A[0],B[1]-A[1]);
      ctx.strokeStyle=C.band;ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(m[0],m[1],L/2+5.5,5,L<1?Math.PI/2:Math.atan2(B[1]-A[1],B[0]-A[0]),0,7);ctx.stroke();}
    else if(q.t==="towel"){ctx.strokeStyle="#9AA9A5";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...p[q.at]);ctx.lineTo(...p[q.to]);ctx.stroke();}
    else if(q.t==="db"){const [x,y]=p[q.at];ctx.fillStyle="#3B4744";ctx.fillRect(x-6,y-1,12,2);ctx.fillRect(x-8,y-4,3,8);ctx.fillRect(x+5,y-4,3,8);}
  });
}
/* Lo que trabaja: un brillo ámbar suave sobre el músculo */
function glow(ctx,ex,ph,p,t){
  (ph.sq||[]).forEach(k=>{const m=(ex.marks||{})[k];if(!m)return;
    const pts=m.at.map(j=>p[j]),x=pts.reduce((a,b)=>a+b[0],0)/pts.length+m.off[0],y=pts.reduce((a,b)=>a+b[1],0)/pts.length+m.off[1];
    const r=9+1.5*Math.sin(t*6),g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(240,176,74,.75)");g.addColorStop(1,"rgba(240,176,74,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();});
}
function draw(cv,ex,t,clamp){
  const d=devicePixelRatio||1,w=cv.clientWidth||300;
  if(cv.width!==Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(w*112/180*d);}
  const ctx=cv.getContext("2d"),sc=cv.width/180;
  ctx.setTransform(sc,0,0,sc,0,0);ctx.clearRect(0,0,180,112);
  const bx=boxOf(ex);ctx.setTransform(sc*bx.sc,0,0,sc*bx.sc,sc*bx.tx,sc*bx.ty);
  const {pose:p,phase}=state(ex,t,clamp),front=frontOf(ex,p);
  ctx.strokeStyle=C.ground;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-bx.tx/bx.sc,104.5);ctx.lineTo((180-bx.tx)/bx.sc,104.5);ctx.stroke();
  (ex.equip||[]).filter(q=>q.t==="box").forEach(q=>equip(ctx,{equip:[q]},p,front));
  arm(ctx,p,"e2","w2",true);
  leg(ctx,p,"k2","a2",front,true);
  torso(ctx,p);
  leg(ctx,p,"k1","a1",front,false);
  head(ctx,p,front);
  arm(ctx,p,"e1","w1",false);
  equip(ctx,{equip:(ex.equip||[]).filter(q=>q.t!=="box")},p,front);
  glow(ctx,ex,phase,p,t);
  return phase;
}
window.Figura={draw,keyT,state};
})();
