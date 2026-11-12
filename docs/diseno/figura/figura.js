/* Figura humana sobre las posturas de rutina.json (mismo esqueleto que la app:
   h cabeza, s hombros, c curva de la espalda, p pelvis, e codo, w muñeca, k rodilla, a tobillo; 1 = lado cercano, 2 = lejano).
   Prueba de estilo del rediseño (Fase 1c): todavía no se usa en la app.
   Figura.draw(canvas, ejercicio, t, clamp, {gender:"m"|"f", labels:true, text:D.marks}) */
(function(){
const SKIN={m:{base:"#D9A57E",far:"#B9845E",line:"#8E5F40"},f:{base:"#E4B593",far:"#C69273",line:"#9A6A4D"}};
const HAIR={m:"#33241D",f:"#4A2F22"};
const CLOTH={top:"#1E6B74",topFar:"#164F56",topLine:"#103A40",bottom:"#34413E",bottomFar:"#252F2D",bottomLine:"#0F1615",
  shoe:"#F4F6F5",shoeFar:"#C9D2CF",sole:"#6F7C79",lace:"#1E6B74",band:"#D98E1F",ground:"#CFD9D6"};
const BODY={ // medidas en unidades del dibujo (180 × 112)
  m:{sh:8.4,chest:2.2,waist:6.0,hip:6.3,glute:1.6,arm:[3.6,3.0,2.3],biceps:1.0,thigh:[5.6,4.0],quad:1.1,shin:[4.0,2.5],calf:1.1,neck:2.8},
  f:{sh:7.2,chest:2.6,waist:5.1,hip:7.0,glute:2.2,arm:[3.1,2.6,2.0],biceps:.6,thigh:[6.0,3.9],quad:.9,shin:[3.8,2.3],calf:1.0,neck:2.4}};

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
  return {pose,phase:cur,idx:i,n:ph.length};
}
/* Instante con la postura que trabaja (el final de la fase de esfuerzo): para las miniaturas */
function keyT(ex){const ph=ex.phases,w=ph.findIndex(x=>x.tone==="up"),k=w>=0?w:ph.length-1;
  let t=0;for(let i=0;i<k;i++)t+=ph[i].move+ph[i].hold;return t+ph[k].move;}

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k];
const len=a=>Math.hypot(a[0],a[1])||1e-6,nrm=a=>mul(a,1/len(a)),perp=a=>[-a[1],a[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const bump=(t,t0,t1)=>t<=t0||t>=t1?0:Math.sin(Math.PI*(t-t0)/(t1-t0));

/* Hacia dónde mira: las rodillas doblan hacia delante; con piernas rectas, las manos. Con todas las posturas. */
const FRONT=new WeakMap();
function frontSign(ex){
  if(FRONT.has(ex))return FRONT.get(ex);
  let kd=0,hd=0;
  ex.poses.map(withC).forEach(p=>{const n=perp(nrm(sub(p.s,p.p)));
    kd+=dot(sub(p.k1,lerp(p.p,p.a1,.5)),n)+dot(sub(p.k2,lerp(p.p,p.a2,.5)),n);
    hd+=dot(sub(lerp(p.w1,p.w2,.5),p.s),n);});
  const s=Math.abs(kd)>3?Math.sign(kd):(Math.sign(hd)||-1);FRONT.set(ex,s);return s;
}
/* Encuadre: caja de todas las posturas y el suelo, para que la persona llene el dibujo */
const BOX=new WeakMap();
function boxOf(ex){
  if(BOX.has(ex))return BOX.get(ex);
  let x0=1e9,y0=1e9,x1=-1e9,y1=104.5;
  ex.poses.map(withC).forEach(p=>{for(const k in p){const r=k==="h"?9:7;x0=Math.min(x0,p[k][0]-r);x1=Math.max(x1,p[k][0]+r);y0=Math.min(y0,p[k][1]-r);y1=Math.max(y1,p[k][1]+r);}});
  (ex.equip||[]).filter(q=>q.t==="box").forEach(q=>{const [x,y,w]=q.r;x0=Math.min(x0,x);x1=Math.max(x1,x+w);y0=Math.min(y0,y);});
  const pad=6,sc=Math.min(2.6,(180-2*pad)/(x1-x0),(112-2*pad)/(y1-y0));
  const b={sc,tx:90-sc*(x0+x1)/2,ty:112-pad-sc*y1};BOX.set(ex,b);return b;
}

/* Un trozo de cuerpo de a a b: grosor rf(t) por delante y rb(t) por detrás (músculos), con sombreado y contorno */
function part(ctx,a,b,rf,rb,front,col,shade=true,caps=true){
  const d=nrm(sub(b,a));let n=perp(d);if(dot(n,front)<0)n=mul(n,-1);
  const N=14,F=[],B=[];
  for(let i=0;i<=N;i++){const t=i/N,c=lerp(a,b,t);F.push(add(c,mul(n,rf(t))));B.push(add(c,mul(n,-rb(t))));}
  const capA=add(a,mul(n,(rf(0)-rb(0))/2)),rA=(rf(0)+rb(0))/2,capB=add(b,mul(n,(rf(1)-rb(1))/2)),rB=(rf(1)+rb(1))/2;
  const shape=()=>{ctx.beginPath();ctx.moveTo(...F[0]);F.forEach(q=>ctx.lineTo(...q));for(let i=N;i>=0;i--)ctx.lineTo(...B[i]);ctx.closePath();
    if(caps){ctx.moveTo(capA[0]+rA,capA[1]);ctx.arc(...capA,rA,0,7);ctx.moveTo(capB[0]+rB,capB[1]);ctx.arc(...capB,rB,0,7);}};
  const m=lerp(a,b,.5),gr=[add(m,mul(n,rf(.5))),add(m,mul(n,-rb(.5)))];
  Q.push({shape,col,shade,gr});
}
/* Cada zona del cuerpo (brazo, pierna, tronco…) se pinta en tres pasadas: todos los contornos, todos los rellenos y
   el sombreado. Así no se ven las juntas entre trozos (rodilla, cadera, hombro) y parece un cuerpo y no un maniquí. */
let Q=[];
function flush(ctx){
  Q.forEach(o=>{o.shape();ctx.strokeStyle=o.col.line;ctx.lineWidth=.9;ctx.stroke();});
  Q.forEach(o=>{o.shape();ctx.fillStyle=o.col.fill;ctx.fill();});
  Q.forEach(o=>{if(!o.shade)return;o.shape();const g=ctx.createLinearGradient(...o.gr[0],...o.gr[1]);
    g.addColorStop(0,"rgba(255,255,255,.2)");g.addColorStop(.45,"rgba(255,255,255,0)");g.addColorStop(1,"rgba(0,0,0,.2)");ctx.fillStyle=g;ctx.fill();});
  Q=[];
}
const lin=(r0,r1)=>t=>r0+(r1-r0)*t;
function arm(ctx,p,e,w,front,B,g,far){
  const sk=SKIN[g],col={fill:far?sk.far:sk.base,line:sk.line};
  const [r0,r1,r2]=B.arm;
  part(ctx,p.s,p[e],t=>lin(r0,r1)(t)+B.biceps*bump(t,.2,.85),t=>lin(r0,r1)(t)+.5*B.biceps*bump(t,.1,.7),front,col);
  part(ctx,p[e],p[w],t=>lin(r1,r2)(t)+.5*bump(t,0,.6),lin(r1,r2),front,col);
  if(g==="m")part(ctx,p.s,lerp(p.s,p[e],.42),t=>r0+.6,t=>r0+.5,front,{fill:far?CLOTH.topFar:CLOTH.top,line:CLOTH.topLine},true,false);
  flush(ctx);
  // mano
  const d=nrm(sub(p[w],p[e])),h=add(p[w],mul(d,1.6));
  ctx.fillStyle=col.fill;ctx.strokeStyle=col.line;ctx.lineWidth=.45;ctx.beginPath();ctx.ellipse(h[0],h[1],2.7,2.0,Math.atan2(d[1],d[0]),0,7);ctx.fill();ctx.stroke();
}
function leg(ctx,p,k,a,front,B,g,far){
  const sk=SKIN[g],skin={fill:far?sk.far:sk.base,line:sk.line},cloth={fill:far?CLOTH.bottomFar:CLOTH.bottom,line:CLOTH.bottomLine};
  const [t0,t1]=B.thigh,[s0,s1]=B.shin;
  const thighF=t=>lin(t0,t1)(t)+B.quad*bump(t,.15,.9),thighB=t=>lin(t0,t1)(t)+.4*B.quad*bump(t,0,.6);
  const shinF=lin(s0,s1),shinB=t=>lin(s0,s1)(t)+B.calf*bump(t,.05,.6);
  if(g==="f"){ // mallas largas
    part(ctx,p.p,p[k],thighF,thighB,front,cloth);part(ctx,p[k],p[a],shinF,shinB,front,cloth);
  }else{
    part(ctx,p.p,p[k],thighF,thighB,front,skin);part(ctx,p[k],p[a],shinF,shinB,front,skin);
    flush(ctx);
    part(ctx,p.p,lerp(p.p,p[k],.5),t=>thighF(t)+.5,t=>thighB(t)+.5,front,cloth,true,false); // pantalón corto
  }
  flush(ctx);
  // zapatilla hacia delante
  const sh=nrm(sub(p[a],p[k]));let toe=perp(sh);if(dot(toe,front)<0)toe=mul(toe,-1);
  const heel=add(p[a],add(mul(toe,-1.6),mul(sh,1.2))),tip=add(p[a],add(mul(toe,6.8),mul(sh,2.0)));
  part(ctx,heel,tip,t=>2.4-.3*t,t=>2.0-.2*t,mul(sh,-1),{fill:far?CLOTH.shoeFar:CLOTH.shoe,line:CLOTH.sole},false);flush(ctx);
  ctx.strokeStyle=CLOTH.sole;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(...add(heel,mul(sh,1.9)));ctx.lineTo(...add(tip,mul(sh,1.6)));ctx.stroke();
  ctx.strokeStyle=CLOTH.lace;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(...add(lerp(heel,tip,.45),mul(sh,-1.6)));ctx.lineTo(...add(lerp(heel,tip,.7),mul(sh,-1.2)));ctx.stroke();
}
function torso(ctx,p,front,B,g){
  const pts=[],N=18,q=[2*p.c[0]-(p.s[0]+p.p[0])/2,2*p.c[1]-(p.s[1]+p.p[1])/2];
  for(let i=0;i<=N;i++){const t=i/N,u=1-t;pts.push([u*u*p.s[0]+2*u*t*q[0]+t*t*p.p[0],u*u*p.s[1]+2*u*t*q[1]+t*t*p.p[1]]);}
  const base=t=>t<.3?B.sh-(B.sh-B.waist)*(t/.3)*.4:t<.65?B.sh*.88-(B.sh*.88-B.waist)*((t-.3)/.35):B.waist+(B.hip-B.waist)*((t-.65)/.35);
  const wf=t=>base(t)+B.chest*bump(t,.05,.5);          // pecho delante
  const wb=t=>base(t)+B.glute*bump(t,.7,1.15);          // glúteo detrás
  const side=(fn,s)=>pts.map((pt,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(N,i+1)];let n=perp(nrm(sub(b,a)));if(dot(n,front)<0)n=mul(n,-1);return add(pt,mul(n,s*fn(i/N)));});
  const F=side(wf,1),Bk=side(wb,-1);
  const poly=(i0,i1,col)=>{ctx.beginPath();for(let i=i0;i<=i1;i++)ctx[i===i0?"moveTo":"lineTo"](...F[i]);for(let i=i1;i>=i0;i--)ctx.lineTo(...Bk[i]);ctx.closePath();
    ctx.fillStyle=col.fill;ctx.fill();
    const m=Math.round((i0+i1)/2),g2=ctx.createLinearGradient(...F[m],...Bk[m]);g2.addColorStop(0,"rgba(255,255,255,.18)");g2.addColorStop(.5,"rgba(255,255,255,0)");g2.addColorStop(1,"rgba(0,0,0,.25)");
    ctx.fillStyle=g2;ctx.fill();ctx.strokeStyle=col.line;ctx.lineWidth=.45;ctx.stroke();};
  const top={fill:CLOTH.top,line:CLOTH.topLine},bottom={fill:CLOTH.bottom,line:CLOTH.bottomLine};
  const cut=g==="f"?Math.round(N*.72):Math.round(N*.8);
  if(g==="f"){ // top corto: se ve la cintura
    poly(0,N,{fill:SKIN.f.base,line:SKIN.f.line});poly(0,Math.round(N*.55),top);poly(cut,N,bottom);
  }else{poly(0,cut,top);poly(cut,N,bottom);}
  // hombro redondo encima
  ctx.fillStyle=g==="m"?CLOTH.top:SKIN[g].base;ctx.strokeStyle=g==="m"?CLOTH.topLine:SKIN[g].line;ctx.lineWidth=.45;
  ctx.beginPath();ctx.arc(...p.s,B.arm[0]+1.4,0,7);ctx.fill();ctx.stroke();
}
function head(ctx,p,front,B,g){
  const sk=SKIN[g],up=nrm(sub(p.h,p.s)),back=mul(front,-1);
  part(ctx,p.s,lerp(p.s,p.h,.62),()=>B.neck,()=>B.neck,front,{fill:sk.base,line:sk.line});flush(ctx);
  if(g==="f"){ // coleta detrás
    const tail=add(p.h,add(mul(back,6.5),mul(up,-1)));ctx.fillStyle=HAIR.f;ctx.beginPath();
    ctx.ellipse(tail[0],tail[1],2.4,4.6,Math.atan2(up[1],up[0])+Math.PI/2+.5*Math.sign(back[0]||1),0,7);ctx.fill();
  }
  ctx.fillStyle=sk.base;ctx.strokeStyle=sk.line;ctx.lineWidth=.45;
  ctx.beginPath();ctx.arc(...p.h,6.1,0,7);ctx.fill();ctx.stroke();
  // mandíbula y nariz hacia delante
  const jaw=add(p.h,add(mul(front,2.2),mul(up,-3.2)));ctx.beginPath();ctx.ellipse(jaw[0],jaw[1],3.4,2.6,0,0,7);ctx.fill();
  const nose=add(p.h,add(mul(front,6.0),mul(up,-.3)));ctx.beginPath();ctx.arc(nose[0],nose[1],1.15,0,7);ctx.fill();
  // pelo: casquete arriba y atrás
  ctx.save();ctx.beginPath();ctx.arc(...p.h,6.4,0,7);ctx.clip();
  const c=add(p.h,add(mul(up,g==="f"?1.4:2.0),mul(back,g==="f"?1.6:1.2)));
  ctx.fillStyle=HAIR[g];ctx.beginPath();ctx.arc(...c,g==="f"?6.0:5.4,0,7);ctx.fill();ctx.restore();
  // oreja
  const ear=add(p.h,add(mul(back,.6),mul(up,-.6)));ctx.fillStyle=sk.far;ctx.beginPath();ctx.ellipse(ear[0],ear[1],1.1,1.6,0,0,7);ctx.fill();
}
function equip(ctx,ex,p,which){
  (ex.equip||[]).forEach(q=>{
    if((q.t==="box")!==(which==="box"))return;
    if(q.t==="box"){const [x,y,w,h]=q.r;ctx.fillStyle="#DDE5E3";ctx.strokeStyle="#B9C6C2";ctx.lineWidth=.6;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}
    else if(q.t==="goma"){ctx.strokeStyle=CLOTH.band;ctx.lineWidth=1.9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(...p[q.at]);ctx.lineTo(...p[q.to]);ctx.stroke();}
    else if(q.t==="band"){const A=lerp(p.p,p[q.at],.82),B=lerp(p.p,p[q.to],.82),m=lerp(A,B,.5),L=Math.hypot(B[0]-A[0],B[1]-A[1]);
      ctx.strokeStyle=CLOTH.band;ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(m[0],m[1],L/2+6,5.5,L<1?Math.PI/2:Math.atan2(B[1]-A[1],B[0]-A[0]),0,7);ctx.stroke();}
    else if(q.t==="towel"){ctx.strokeStyle="#9AA9A5";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...p[q.at]);ctx.lineTo(...p[q.to]);ctx.stroke();}
    else if(q.t==="db"){const [x,y]=p[q.at];ctx.fillStyle="#3B4744";ctx.fillRect(x-6,y-1,12,2);ctx.fillRect(x-8,y-4,3,8);ctx.fillRect(x+5,y-4,3,8);}
  });
}
/* Etiquetas como en la app: punto ámbar que late en la zona, línea y el texto (solo en la vista grande) */
function labels(ctx,ex,ph,p,t,text,toScreen,sc){
  const items=[];
  (ph.sq||[]).forEach(k=>{const m=(ex.marks||{})[k];if(!m)return;
    const pts=m.at.map(j=>p[j]);const tgt=toScreen([pts.reduce((a,b)=>a+b[0],0)/pts.length+m.off[0],pts.reduce((a,b)=>a+b[1],0)/pts.length+m.off[1]]);
    items.push({tgt,lab:m.lab,txt:m.text||text[k]||k.toUpperCase()});});
  (ex.equip||[]).forEach(q=>{if(q.label&&(q.t==="goma"||q.t==="band")){const a=toScreen(q.t==="band"?lerp(p.p,p[q.at],.82):lerp(p[q.at],p[q.to],.5));items.push({tgt:a,lab:null,txt:q.label,equip:true});}});
  ctx.save();ctx.setTransform(sc,0,0,sc,0,0);
  const pulse=.5+.5*Math.sin(t*6);
  items.forEach((it,i)=>{
    const [x,y]=it.tgt;
    if(!it.equip){ctx.fillStyle="rgba(240,176,74,"+(.25+.25*pulse)+")";ctx.beginPath();ctx.arc(x,y,5+2*pulse,0,7);ctx.fill();
      ctx.fillStyle="#D98E1F";ctx.beginPath();ctx.arc(x,y,2.2,0,7);ctx.fill();}
    ctx.font="700 7px system-ui,Roboto,sans-serif";const w=ctx.measureText(it.txt).width+8;
    let lx,ly;if(it.lab){lx=it.lab[0];ly=it.lab[1];}else{lx=x+(x<90?24:-24);ly=y-14-i*12;}
    lx=Math.min(179-w/2,Math.max(1+w/2,lx));ly=Math.min(106,Math.max(6,ly));
    ctx.strokeStyle=it.equip?"#B76F0E":"#D98E1F";ctx.lineWidth=.8;ctx.setLineDash([2,1.5]);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=it.equip?"#FFFFFF":"#D98E1F";ctx.strokeStyle="#D98E1F";
    const rx=lx-w/2,ry=ly-5.5;ctx.beginPath();ctx.roundRect?ctx.roundRect(rx,ry,w,11,3):ctx.rect(rx,ry,w,11);ctx.fill();if(it.equip)ctx.stroke();
    ctx.fillStyle=it.equip?"#B76F0E":"#1D1406";ctx.textAlign="center";ctx.fillText(it.txt,lx,ly+2.5);});
  ctx.restore();
}
function draw(cv,ex,t,clamp,o={}){
  const g=o.gender==="f"?"f":"m",B=BODY[g];
  const d=devicePixelRatio||1,w=cv.clientWidth||300;
  if(cv.width!==Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(w*112/180*d);}
  const ctx=cv.getContext("2d"),sc=cv.width/180;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  const bx=boxOf(ex);ctx.setTransform(sc*bx.sc,0,0,sc*bx.sc,sc*bx.tx,sc*bx.ty);
  ctx.lineJoin="round";ctx.lineCap="round";
  const st=state(ex,t,clamp),p=st.pose,front=mul(perp(nrm(sub(p.s,p.p))),frontSign(ex));
  ctx.strokeStyle=CLOTH.ground;ctx.lineWidth=1.2/bx.sc;ctx.beginPath();ctx.moveTo(-bx.tx/bx.sc,104.5);ctx.lineTo((180-bx.tx)/bx.sc,104.5);ctx.stroke();
  equip(ctx,ex,p,"box");
  arm(ctx,p,"e2","w2",front,B,g,true);
  leg(ctx,p,"k2","a2",front,B,g,true);
  torso(ctx,p,front,B,g);
  leg(ctx,p,"k1","a1",front,B,g,false);
  head(ctx,p,front,B,g);
  arm(ctx,p,"e1","w1",front,B,g,false);
  equip(ctx,ex,p,"front");
  if(o.labels)labels(ctx,ex,st.phase,p,o.pt??t,o.text||{},q=>[bx.tx+bx.sc*q[0],bx.ty+bx.sc*q[1]],sc);
  return st;
}
window.Figura={draw,keyT,state};
})();
