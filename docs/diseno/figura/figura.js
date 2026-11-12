/* Figura del ejercicio (bloque D1 del rediseño). Todavía no se usa en la app.
   Dibuja las posturas de rutina.json (mismo esqueleto que la app: h cabeza, s hombros, c curva de la espalda,
   p pelvis, e codo, w muñeca, k rodilla, a tobillo; 1 = lado cercano, 2 = lejano) en tres estilos:
     "palos"   muñeco de palos (el de la app, mejorado: pies, manos, cuello y separación entre brazos y piernas)
     "redondo" muñeco redondeado (formas llenas, sin cara ni ropa)
     "persona" persona con volumen, ropa de deporte y zapatillas; hombre o mujer
   Figura.draw(canvas, ejercicio, t, clamp, {style, gender:"m"|"f", key, labels:true, text:D.marks, pt, dark, bg})
   Capas: 1) geometría común (vista de frente o de perfil, pies y manos apoyados donde toca),
          2) un pintor por estilo. Las piezas de un mismo color se pintan juntas (todos los contornos y luego
          todos los rellenos), así no se ven juntas en rodillas, codos, hombros ni cadera. */
(function(){
"use strict";
const GROUND=103.2;                                 // línea del suelo (en rutina.json, lo apoyado está en y≈100)

/* ---------- Tiempo y postura (igual que la app) ---------- */
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
  return {pose,phase:cur,idx:i,n:ph.length,f,tt};
}
/* Instante al final del movimiento de la fase i, y el de la postura que trabaja (para las miniaturas) */
function phaseT(ex,i){let t=0;for(let j=0;j<i;j++)t+=ex.phases[j].move+ex.phases[j].hold;return t+ex.phases[i].move;}
function keyT(ex){const w=ex.phases.findIndex(x=>x.tone==="up");return phaseT(ex,w>=0?w:ex.phases.length-1);}

/* ---------- Vectores ---------- */
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k];
const len=a=>Math.hypot(a[0],a[1]),nrm=a=>{const l=len(a)||1e-6;return [a[0]/l,a[1]/l];},perp=a=>[-a[1],a[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const bump=(t,t0,t1)=>t<=t0||t>=t1?0:Math.sin(Math.PI*(t-t0)/(t1-t0));
const side=(n,ref)=>dot(n,ref)<0?mul(n,-1):n;      // la normal n, girada hacia ref
const memo=(fn)=>{const M=new WeakMap();return ex=>{if(!M.has(ex))M.set(ex,fn(ex));return M.get(ex);};};

/* ---------- Vista de cada ejercicio ----------
   Casi todos se ven de perfil. De frente: de pie con las piernas abiertas o los brazos en cruz, y tumbados de lado
   (plancha lateral, almeja): ahí la cámara ve el pecho y la cara, y las dos piernas quedan una encima de la otra.
   Va aquí hasta que rutina.json tenga "view":"frente" en cada ejercicio (ver NOTAS.md). */
const VIEW={paso_lateral:"frente",angel:"frente",plancha_lat:"frente",plancha_lat_k:"frente",almeja:"frente"};
const viewOf=(ex,key)=>ex.view||VIEW[key]||"perfil";

/* Hacia dónde mira (perfil): las rodillas doblan hacia delante; con piernas rectas, las manos */
const frontSign=memo(ex=>{
  let kd=0,hd=0;
  ex.poses.map(withC).forEach(p=>{const n=perp(nrm(sub(p.s,p.p)));
    kd+=dot(sub(p.k1,lerp(p.p,p.a1,.5)),n)+dot(sub(p.k2,lerp(p.p,p.a2,.5)),n);
    hd+=dot(sub(lerp(p.w1,p.w2,.5),p.s),n);});
  return Math.abs(kd)>3?Math.sign(kd):(Math.sign(hd)||-1);
});
/* De frente: a qué lado del cuerpo va cada brazo y cada pierna (el 1 hacia +lat o hacia −lat), mirando todas las posturas */
const sidesOf=memo(ex=>{
  let arm=0,leg=0;
  ex.poses.map(withC).forEach(p=>{const lat=perp(nrm(sub(p.p,p.s)));
    arm+=dot(sub(p.e1,p.e2),lat)+dot(sub(p.w1,p.w2),lat);leg+=dot(sub(p.k1,p.k2),lat)+dot(sub(p.a1,p.a2),lat);});
  return {arm:arm>=0?1:-1,leg:leg>=0?1:-1};
});
/* Superficies donde se apoya algo: el suelo y la parte de arriba de sillas y sofás (no la pared) */
function supportY(ex,pt){
  let y=GROUND;
  (ex.equip||[]).forEach(q=>{if(q.t!=="box")return;const [x,yy,w,h]=q.r;
    if(h<90&&pt[0]>=x-2&&pt[0]<=x+w+2&&yy>=pt[1]-1.5&&yy<y)y=yy;});
  return y;
}

/* ---------- Geometría común: raíces de brazos y piernas, pies y manos ---------- */
const FOOT=[[-2.5,-1.4],[-2.9,1.2],[-2.6,3.3],[8.1,3.3],[9.3,2.5],[8.6,1.0],[4.6,-.4],[1.6,-1.8]]; // zapatilla de perfil: x hacia la punta, y hacia la suela
function footSolve(A,d,n,sup,tucked){
  if(tucked)return 0;
  const near=A[1]>sup-9;let best=0,bc=1e9;
  for(let al=-40;al<=95;al+=2.5){
    const r=al*Math.PI/180,f=add(mul(n,Math.cos(r)),mul(d,Math.sin(r))),s=sub(mul(d,Math.cos(r)),mul(n,Math.sin(r)));
    const P=FOOT.map(([x,y])=>add(A,add(mul(f,x),mul(s,y))));
    const low=Math.max(...P.map(q=>q[1])),heel=P[2][1],toe=P[3][1];
    let c=Math.abs(al)*(al<0?1.4:1);
    if(low>sup+.25)c+=1000+200*(low-sup);
    if(near&&A[1]>sup-6){c+=8*Math.abs(low-sup)+10*Math.abs(heel-toe);}
    if(c<bc){bc=c;best=al;}
  }
  return best;
}
function geom(ex,p0,o){
  const view=viewOf(ex,o.key),B=o.B;
  const p={};for(const k in p0)p[k]=p0[k].slice();
  const u=nrm(sub(p.p,p.s));                          // de hombros a pelvis
  const front=view==="frente"?[0,0]:mul(perp(mul(u,-1)),frontSign(ex)); // mismo criterio que frontSign: normal de p→s
  const lat=perp(u),sd=view==="frente"?sidesOf(ex):null;
  const root={s1:p.s,s2:p.s,p1:p.p,p2:p.p};
  if(sd){root.s1=add(add(p.s,mul(lat,sd.arm*(B.shF-2.6))),mul(u,1.6));root.s2=add(add(p.s,mul(lat,-sd.arm*(B.shF-2.6))),mul(u,1.6));
    root.p1=add(p.p,mul(lat,sd.leg*B.hipF));root.p2=add(p.p,mul(lat,-sd.leg*B.hipF));}
  const feet={},hands={};
  for(const i of ["1","2"]){
    const P=root["p"+i],K=p["k"+i];let A=p["a"+i];
    if(view==="frente"){const d=nrm(sub(A,K));feet[i]={A,d,front:true,out:sd.leg*(i==="1"?1:-1)};continue;}
    // rodilla: hacia dónde dobla (si está recta, hacia delante del cuerpo)
    let kb=sub(K,lerp(P,A,.5));const bent=len(kb)>2.5;
    let d=nrm(sub(A,K)),n=side(perp(d),bent?kb:front);
    let sup=supportY(ex,A);
    // boca abajo con las piernas rectas (plancha, flexiones): de puntillas; se sube el tobillo para que la punta toque el suelo
    const tucked=!bent&&front[1]>.5&&A[1]>sup-7;
    if(tucked){for(let it=0;it<3;it++){d=nrm(sub(A,K));n=side(perp(d),front);const toe=add(A,add(mul(n,7.8),mul(d,3.1)));A=[A[0],A[1]-(toe[1]-sup)];}
      p["a"+i]=A;d=nrm(sub(A,K));n=side(perp(d),front);}
    const al=footSolve(A,d,n,sup,tucked)*Math.PI/180;
    feet[i]={A,f:add(mul(n,Math.cos(al)),mul(d,Math.sin(al))),s:sub(mul(d,Math.cos(al)),mul(n,Math.sin(al))),kn:bent?kb:front};
  }
  const grip={};(ex.equip||[]).forEach(q=>{if(q.at&&q.at[0]==="w")grip[q.at[1]]=q.t;});
  for(const i of ["1","2"]){
    const E=p["e"+i],W=p["w"+i],dir=nrm(sub(W,E)),sup=supportY(ex,W);
    const onSup=W[1]>sup-4.5&&E[1]<sup-5;          // muñeca apoyada y antebrazo levantado: mano plana
    let hx=Math.abs(p.h[0]-p.p[0])>8?Math.sign(p.h[0]-p.p[0]):Math.sign(front[0]||-1);
    hands[i]=grip[i]?{W,dir,mode:"fist",eq:grip[i]}:onSup?{W,dir:[hx,0],mode:"flat",sup}:{W,dir,mode:"open"};
  }
  return {p,view,front,u,lat,root,feet,hands};
}

/* ---------- Encuadre: la persona llena el dibujo (todas las posturas, el material y, en grande, las flechas) ---------- */
const BOXC=new WeakMap();
function boxOf(ex,big){
  const m=BOXC.get(ex)||{};BOXC.set(ex,m);if(m[big])return m[big];
  let x0=1e9,y0=1e9,x1=-1e9,y1=GROUND+1;
  const take=(x,y,r)=>{x0=Math.min(x0,x-r);x1=Math.max(x1,x+r);y0=Math.min(y0,y-r);y1=Math.max(y1,y+r);};
  ex.poses.map(withC).forEach(p=>{for(const k in p)take(p[k][0],p[k][1],k==="h"?8:k[0]==="a"?10:6);});
  (ex.equip||[]).forEach(q=>{if(q.t==="box"){const [x,y,w,h]=q.r;if(h<90){take(x,y,0);take(x+w,y,0);}else{x0=Math.min(x0,Math.max(x,x0-8));x1=Math.max(x1,Math.min(x+w,x1+8));}}});
  if(big)ex.phases.forEach(ph=>{if(ph.arrow){take(ph.arrow[0],ph.arrow[1],4);take(ph.arrow[2],ph.arrow[3],4);}});
  const pad=big?8:5,max=big?2.1:2.7,sc=Math.min(max,(180-2*pad)/(x1-x0),(112-2*pad)/(y1-y0));
  return m[big]={sc,tx:90-sc*(x0+x1)/2,ty:112-pad*.6-sc*y1};
}

/* ---------- Pintar piezas sin juntas ---------- */
function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const q=P[i],r=P[(i+1)%P.length];a+=q[0]*r[1]-r[0]*q[1];}return a;}
function toPath(P){if(polyArea(P)<0)P=P.slice().reverse();const pa=new Path2D();pa.moveTo(...P[0]);for(let i=1;i<P.length;i++)pa.lineTo(...P[i]);pa.closePath();return pa;}
const circ=(c,r)=>{const pa=new Path2D();pa.arc(c[0],c[1],r,0,Math.PI*2);return pa;};
const ell=(c,rx,ry,rot)=>{const pa=new Path2D();pa.ellipse(c[0],c[1],rx,ry,rot,0,Math.PI*2);return pa;};
/* Tubo por una línea central C: grosor rf(t) hacia ref y rb(t) hacia el otro lado. Extremos redondos o planos (dobladillo) */
function tube(C,rf,rb,ref,capA=true,capB=true){
  const N=C.length-1,F=[],Bk=[],nn=[];
  // el lado «delante» se decide una vez (en el centro) y luego cada normal sigue a la anterior: sin zigzag si ref es casi paralelo
  const mid=Math.floor(N/2),n0=side(perp(nrm(sub(C[Math.min(N,mid+1)],C[Math.max(0,mid-1)]))),ref);let prev=null;
  for(let i=0;i<=N;i++){const a=C[Math.max(0,i-1)],b=C[Math.min(N,i+1)];const n=side(perp(nrm(sub(b,a))),prev||n0);prev=n;nn.push(n);
    F.push(add(C[i],mul(n,rf(i/N))));Bk.push(add(C[i],mul(n,-rb(i/N))));}
  const cap=(i,from,to)=>{const n=nn[i],c=add(C[i],mul(n,(rf(i/N)-rb(i/N))/2)),r=(rf(i/N)+rb(i/N))/2,o=[];
    const a0=Math.atan2(from[1]-c[1],from[0]-c[0]);let a1=Math.atan2(to[1]-c[1],to[0]-c[0]);
    const tdir=i===0?sub(C[0],C[1]):sub(C[N],C[N-1]);   // el arco sale hacia fuera del tubo
    let da=a1-a0;while(da<=-Math.PI)da+=2*Math.PI;while(da>Math.PI)da-=2*Math.PI;
    const mid=[Math.cos(a0+da/2),Math.sin(a0+da/2)];if(dot(mid,tdir)<0)da=da>0?da-2*Math.PI:da+2*Math.PI;
    for(let k=1;k<10;k++){const a=a0+da*k/10;o.push([c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)]);}return o;};
  const P=[...F,...(capB?cap(N,F[N],Bk[N]):[]),...Bk.slice().reverse(),...(capA?cap(0,Bk[0],F[0]):[])];
  return {path:toPath(P),C,nn,rf,rb};
}
const seg=(a,b,n=12)=>{const C=[];for(let i=0;i<=n;i++)C.push(lerp(a,b,i/n));return C;};
const quad=(a,c,b,n=18)=>{const q=[2*c[0]-(a[0]+b[0])/2,2*c[1]-(a[1]+b[1])/2],C=[];
  for(let i=0;i<=n;i++){const t=i/n,v=1-t;C.push([v*v*a[0]+2*v*t*q[0]+t*t*b[0],v*v*a[1]+2*v*t*q[1]+t*t*b[1]]);}return C;};
const slice=(C,t0,t1)=>{const N=C.length-1,o=[];for(let i=0;i<=12;i++){const x=(t0+(t1-t0)*i/12)*N,j=Math.min(N-1,Math.floor(x));o.push(lerp(C[j],C[j+1],x-j));}return o;};
const lin=(r0,r1)=>t=>r0+(r1-r0)*t;
const rng=(f,t0,t1)=>t=>f(t0+(t1-t0)*t);

/* Un grupo = piezas del mismo color: contornos de todas, luego rellenos de todas, luego luz y sombra recortadas a la unión */
function paint(ctx,groups,ow){
  groups.forEach(g=>{
    if(!g.items.length)return;
    const U=new Path2D();g.items.forEach(it=>U.addPath(it.path||it));
    if(g.line&&ow>0){ctx.lineWidth=2*ow;ctx.strokeStyle=g.line;ctx.stroke(U);}
    ctx.fillStyle=g.fill;ctx.fill(U);
    if(g.shade){
      const dk=new Path2D(),lt=new Path2D();let wd=0,wl=0,n=0;
      g.items.forEach(it=>{if(!it.C||it.noShade)return;const N=it.C.length-1;
        for(let i=0;i<=N;i++){const t=i/N,c=it.C[i],q=add(c,mul(it.nn[i],-it.rb(t)*.62)),r=add(c,mul(it.nn[i],it.rf(t)*.5));
          i?dk.lineTo(...q):dk.moveTo(...q);i?lt.lineTo(...r):lt.moveTo(...r);}
        wd+=it.rb(.5);wl+=it.rf(.5);n++;});
      if(n){ctx.save();ctx.clip(U);ctx.lineCap="round";ctx.lineJoin="round";
        ctx.lineWidth=wd/n*.95;ctx.strokeStyle="rgba(0,0,0,.15)";ctx.stroke(dk);
        ctx.lineWidth=wl/n*.42;ctx.strokeStyle="rgba(255,255,255,.17)";ctx.stroke(lt);ctx.restore();}
    }
  });
}
const holes=rs=>{const h=new Path2D();h.rect(-400,-400,1000,1000);rs.forEach(([c,r])=>{h.moveTo(c[0]+r,c[1]);h.arc(c[0],c[1],r,0,Math.PI*2);});return h;};
const G=(fill,line,shade=false)=>({fill,line,shade,items:[]});

/* ---------- Material ---------- */
const BAND="#D98E1F";
function soleMid(ft){return ft.front?add(ft.A,mul(ft.d,4.4)):add(ft.A,add(mul(ft.f,3.4),mul(ft.s,3.3)));}
function anchor(gm,j){if(j[0]==="a")return soleMid(gm.feet[j[1]]);if(j[0]==="w"){const h=gm.hands[j[1]];return add(h.W,mul(h.dir,1.8));}return j==="s"?add(gm.p.s,mul(gm.u,3)):gm.p[j];}
function drawBox(ctx,q,C){const [x,y,w,h]=q.r;ctx.fillStyle=C.prop;ctx.strokeStyle=C.propLine;ctx.lineWidth=.7;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,Math.max(0,GROUND-y),1.5):ctx.rect(x,y,w,GROUND-y);ctx.fill();ctx.stroke();}
function drawGear(ctx,ex,gm,C,ow,which){
  (ex.equip||[]).forEach(q=>{
    if(q.t==="strap"&&which==="back"){const h=anchor(gm,q.at);ctx.strokeStyle=C.strap;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(...q.from);ctx.lineTo(...h);ctx.stroke();
      const d=nrm(sub(h,q.from));ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(...add(h,mul(perp(d),-2.4)));ctx.lineTo(...add(h,mul(perp(d),2.4)));ctx.stroke();}
    if(q.t==="goma"&&which==="front"){const a=anchor(gm,q.at),b=anchor(gm,q.to);ctx.strokeStyle=BAND;ctx.lineWidth=1.7;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    if(q.t==="towel"&&which==="front"){const a=anchor(gm,q.at),b=anchor(gm,q.to);ctx.strokeStyle=C.towel;ctx.lineWidth=3.2;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
    if(q.t==="db"&&which==="front"){const h=gm.hands[q.at[1]],c=add(h.W,mul(h.dir,1.8)),ax=perp(h.dir);
      ctx.strokeStyle=C.db;ctx.lineCap="butt";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(...add(c,mul(ax,-5.5)));ctx.lineTo(...add(c,mul(ax,5.5)));ctx.stroke();
      ctx.lineWidth=3.2;[-4.6,4.6].forEach(k=>{ctx.beginPath();ctx.moveTo(...add(add(c,mul(ax,k)),mul(h.dir,-3.6)));ctx.lineTo(...add(add(c,mul(ax,k)),mul(h.dir,3.6)));ctx.stroke();});ctx.lineCap="round";}
    if(q.t==="band"){ // mini banda: anillo alrededor de los muslos sobre las rodillas; la mitad de atrás va detrás de las piernas
      const A=lerp(gm.root["p"+q.at[1]],gm.p[q.at],.8),Bq=lerp(gm.root["p"+q.to[1]],gm.p[q.to],.8),m=lerp(A,Bq,.5),L=len(sub(Bq,A));
      const th=nrm(sub(gm.p[q.at],gm.root["p"+q.at[1]])),ax=L>3?nrm(sub(Bq,A)):perp(th),rx=L>3?L/2+5.2:5.6,ry=L>3?2.4:1.6,rot=Math.atan2(ax[1],ax[0]);
      ctx.strokeStyle=BAND;ctx.lineWidth=1.8;ctx.beginPath();
      if(which==="band-back")ctx.ellipse(m[0],m[1],rx,ry,rot,Math.PI,2*Math.PI);else if(which==="front")ctx.ellipse(m[0],m[1],rx,ry,rot,0,Math.PI);
      ctx.stroke();}
  });
}

/* ---------- Medidas y colores ---------- */
const BODY={ // unidades del dibujo (180 × 112)
  m:{sh:8.4,chest:2.2,waist:6.0,hip:6.3,glute:1.6,arm:[3.5,2.9,2.2],biceps:1.0,thigh:[5.6,4.0],quad:1.1,shin:[4.0,2.5],calf:1.1,neck:2.8,shF:9.6,waistF:6.8,hipF:4.6,hipFw:8.6,head:6.1},
  f:{sh:7.2,chest:2.6,waist:5.1,hip:7.0,glute:2.2,arm:[3.0,2.5,1.9],biceps:.5,thigh:[6.0,3.9],quad:.8,shin:[3.8,2.3],calf:1.0,neck:2.4,shF:8.4,waistF:5.6,hipF:4.6,hipFw:9.6,head:5.8}};
const SKIN={m:{fill:"#D9A57E",far:"#BE8A63",line:"#7E5236"},f:{fill:"#E6B898",far:"#C99878",line:"#8C5E42"}};
const HAIR={m:"#2E211B",f:"#4A2C1F"};
const CLOTH={top:"#1E6B74",topFar:"#17545B",topLine:"#0E3237",bottom:"#323E3B",bottomFar:"#242E2C",bottomLine:"#0D1413",
  shoe:"#F5F7F6",shoeFar:"#D3DBD8",shoeLine:"#5E6B68",sole:"#8C9996",lace:"#1E6B74"};
function colorsFor(o){const dk=!!o.dark;return {
  ink:dk?"#E4EBE8":"#1F2A28",far:dk?"#7D8E8A":"#8D9A97",bg:o.bg||(dk?"#171F1D":"#FFFFFF"),ground:dk?"#3A4744":"#C3CFCB",
  rNear:dk?"#D3E3E0":"#2F5A5F",rFar:dk?"#6D8682":"#93AEAE",
  prop:dk?"#24302D":"#DDE5E3",propLine:dk?"#3A4744":"#B9C6C2",strap:dk?"#9AA9A5":"#55625F",towel:dk?"#B8C4C1":"#8E9C99",db:dk?"#C9D3D0":"#2F3A38",
  hl:dk?"#F0B04A":"#D98E1F",hlInk:"#1D1406",accent:dk?"#62B8C1":"#1E6B74",surface:o.bg||(dk?"#171F1D":"#FFFFFF")};}

/* ---------- Estilo «persona» ---------- */
function shoePath(ft,far,g,detail){
  if(ft.front){ // de frente: la punta mira a la cámara
    const e=perp(ft.d),c=add(add(ft.A,mul(ft.d,2.3)),mul(e,.6*(ft.out||0)));
    return {up:ell(c,3.0,2.7,Math.atan2(e[1],e[0])),sole:[add(add(c,mul(ft.d,2.3)),mul(e,-2.5)),add(add(c,mul(ft.d,2.3)),mul(e,2.5))]};}
  const W=([x,y])=>add(ft.A,add(mul(ft.f,x),mul(ft.s,y)));
  return {up:toPath(FOOT.map(W)),sole:[W([-2.5,3.0]),W([8.3,3.0])],lace:detail?[W([2.2,-1.0]),W([5.4,.2])]:null};
}
function handPath(h,B){
  if(h.mode==="fist")return circ(add(h.W,mul(h.dir,1.6)),B.arm[2]+.5);
  if(h.mode==="flat"){const T=[h.W[0]+h.dir[0]*6.6,h.sup-1.25];return tube(seg(h.W,T,6),lin(1.9,1.25),lin(1.9,1.25),[0,-1]);}
  const T=add(h.W,mul(h.dir,5.4));return tube(seg(h.W,T,6),t=>1.9-.5*t+.25*bump(t,.2,.8),t=>1.8-.6*t,perp(h.dir));
}
function persona(ctx,ex,gm,o,C,ow,detail){
  const g=o.gender==="f"?"f":"m",B=BODY[g],sk=SKIN[g],p=gm.p,fr=gm.front,frente=gm.view==="frente";
  const skin=far=>G(far?sk.far:sk.fill,sk.line,true),top=far=>G(far?CLOTH.topFar:CLOTH.top,CLOTH.topLine,true),
        bot=far=>G(far?CLOTH.bottomFar:CLOTH.bottom,CLOTH.bottomLine,true),shoe=far=>G(far?CLOTH.shoeFar:CLOTH.shoe,CLOTH.shoeLine,false);
  const armAnt=i=>{const S=gm.root["s"+i],E=p["e"+i],W=p["w"+i],d=nrm(sub(E,S)),bend=sub(W,lerp(S,W,0));
    const v=sub(W,E);return len(sub(lerp(S,W,.5),E))>2.5?side(perp(d),v):(frente?side(perp(d),gm.lat):side(perp(d),fr));};
  const legAnt=i=>{const P=gm.root["p"+i],K=p["k"+i],A=p["a"+i],kb=sub(K,lerp(P,A,.5));return len(kb)>2.5?kb:(frente?[0,0]:fr);};
  function arm(i,far){
    const S=gm.root["s"+i],E=p["e"+i],W=p["w"+i],ref=armAnt(i),[r0,r1,r2]=B.arm,sg=skin(far);
    sg.items.push(tube(seg(S,E),t=>lin(r0,r1)(t)+B.biceps*bump(t,.2,.85),t=>lin(r0,r1)(t)+.45*B.biceps*bump(t,.1,.7),ref));
    sg.items.push(tube(seg(E,W),t=>lin(r1,r2)(t)+.5*bump(t,0,.6),lin(r1,r2),ref));
    sg.items.push(handPath(gm.hands[i],B));
    const out=[sg];
    if(g==="m"){const tg=top(far);tg.items.push(tube(seg(S,lerp(S,E,.42),6),t=>r0+.7,t=>r0+.6,ref,true,false));out.push(tg);}
    return out;
  }
  function leg(i,far){
    const P=gm.root["p"+i],K=p["k"+i],ft=gm.feet[i],A=ft.A,ref=legAnt(i),kref=frente?gm.lat:ref,[t0,t1]=B.thigh,[s0,s1]=B.shin;
    const thF=t=>lin(t0,t1)(t)+B.quad*bump(t,.15,.9),thB=t=>lin(t0,t1)(t)+.4*B.quad*bump(t,0,.6);
    const shinRef=frente?gm.lat:(ft.f?mul(ft.f,1):ref);
    const shF=lin(s0,s1),shB=t=>lin(s0,s1)(t)+B.calf*bump(t,.05,.6);
    const thigh=frente?tube(seg(P,K),t=>lin(t0,t1)(t)*.86,t=>lin(t0,t1)(t)*.86,gm.lat):tube(seg(P,K),thF,thB,ref),shin=tube(seg(K,A),shF,shB,shinRef);
    const out=[];
    if(g==="f"){const bg=bot(far);bg.items.push(thigh,shin);out.push(bg);}
    else{const sg=skin(far);sg.items.push(thigh,shin);const bg=bot(far);bg.items.push(tube(slice(seg(P,K),0,.5),t=>thF(t*.5)+.55,t=>thB(t*.5)+.55,frente?gm.lat:ref,true,false));out.push(sg,bg);}
    const sh=shoePath(ft,far,g,detail),sgp=shoe(far);sgp.items.push(sh.up);out.push(sgp);
    return {groups:out,sole:sh};
  }
  function soleLines(s){ctx.lineCap="round";ctx.strokeStyle=CLOTH.sole;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(...s.sole[0]);ctx.lineTo(...s.sole[1]);ctx.stroke();
    if(s.lace){ctx.strokeStyle=CLOTH.lace;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(...s.lace[0]);ctx.lineTo(...s.lace[1]);ctx.stroke();}}
  // tronco
  const TC=frente?quad(add(p.s,mul(gm.u,1.2)),p.c,p.p):quad(p.s,p.c,p.p); // de frente, hombros rectos (sin cúpula alrededor del cuello)
  let wf,wb,ref;
  if(frente){const w=t=>t<.25?B.shF-(B.shF-B.shF*.86)*(t/.25):t<.62?B.shF*.86-(B.shF*.86-B.waistF)*((t-.25)/.37):B.waistF+(B.hipFw-B.waistF)*((t-.62)/.38);
    wf=w;wb=w;ref=gm.lat;}
  else{const base=t=>t<.3?B.sh-(B.sh-B.waist)*(t/.3)*.4:t<.65?B.sh*.88-(B.sh*.88-B.waist)*((t-.3)/.35):B.waist+(B.hip-B.waist)*((t-.65)/.35);
    wf=t=>base(t)+B.chest*bump(t,.05,.5)+(g==="f"?.6*bump(t,.12,.42):0);wb=t=>base(t)+B.glute*bump(t,.7,1.15);ref=fr;}
  const cut=g==="f"?.74:.8,topEnd=g==="f"?.56:cut;
  const torsoTop=tube(slice(TC,0,topEnd),rng(wf,0,topEnd),rng(wb,0,topEnd),ref,!frente,false);
  const torsoBot=tube(slice(TC,cut,1),t=>rng(wf,cut,1)(t)+.25,t=>rng(wb,cut,1)(t)+.25,ref,false,true);
  const torsoSkin=tube(TC,wf,wb,ref,!frente,true);
  const near=frente?null:"1";
  // capas: brazo lejano, pierna lejana, tronco y cabeza, pierna cercana, brazo cercano (de frente: piernas, tronco, cabeza, brazos)
  drawGear(ctx,ex,gm,C,ow,"back");
  const legs={1:leg("1",!frente&&false),2:leg("2",!frente)};
  if(frente){paint(ctx,[...legs[1].groups,...legs[2].groups],ow);soleLines(legs[1].sole);soleLines(legs[2].sole);}
  else{paint(ctx,arm("2",true),ow);paint(ctx,legs[2].groups,ow);soleLines(legs[2].sole);}
  drawGear(ctx,ex,gm,C,ow,"band-back");
  const neck=tube(seg(p.s,lerp(p.s,p.h,.62),6),()=>B.neck,()=>B.neck,frente?gm.lat:fr);
  const s0=skin(false);s0.items.push(neck);if(g==="f")s0.items.push(torsoSkin);
  const tg=top(false);tg.items.push(torsoTop);
  if(g==="m"&&!frente)tg.items.push(circ(add(p.s,mul(fr,-.4)),B.arm[0]+1.5));
  const bg=bot(false);bg.items.push(torsoBot);
  paint(ctx,[s0,tg,bg],ow);
  head(ctx,gm,B,g,sk,ow,detail);
  if(!frente){
    const L=legs[1],bgn=bot(false);bgn.items.push(torsoBot);
    paint(ctx,[...L.groups,bgn],ow);soleLines(L.sole);
    drawGear(ctx,ex,gm,C,ow,"front");
    paint(ctx,arm("1",false),ow);
  }else{drawGear(ctx,ex,gm,C,ow,"front");paint(ctx,[...arm("1",false),...arm("2",false)],ow);}
}
function head(ctx,gm,B,g,sk,ow,detail){
  const p=gm.p,up=nrm(sub(p.h,p.s)),R=B.head;
  if(gm.view==="frente"){
    const lat=perp(up),s=skin2(sk);
    s.items.push(circ(p.h,R),ell(add(p.h,mul(up,-2.3)),R*.78,R*.66,Math.atan2(lat[1],lat[0])),
      ell(add(p.h,mul(lat,R*.98)),1.2,1.7,Math.atan2(up[1],up[0])),ell(add(p.h,mul(lat,-R*.98)),1.2,1.7,Math.atan2(up[1],up[0])),
      tube(seg(lerp(p.s,p.h,.3),p.h,4),()=>B.neck,()=>B.neck,lat));
    paint(ctx,[s],ow);
    ctx.save();ctx.clip(circ(p.h,R+.2));ctx.fillStyle=HAIR[g];ctx.beginPath();const c=add(p.h,mul(up,g==="f"?3.6:4.4));
    ctx.ellipse(c[0],c[1],R*1.08,R*(g==="f"?.78:.62),Math.atan2(lat[1],lat[0]),0,Math.PI*2);ctx.fill();ctx.restore();
    if(g==="f"){ctx.fillStyle=HAIR.f;const t=add(p.h,mul(up,R*.95));ctx.beginPath();ctx.arc(t[0],t[1],2.3,0,7);ctx.fill();}
    // de frente la cara siempre lleva ojos y boca: sin ellos parece que la persona está de espaldas
    ctx.fillStyle="#2B1D17";[-1,1].forEach(k=>{const e=add(add(p.h,mul(up,-.7)),mul(lat,2.2*k));ctx.beginPath();ctx.ellipse(e[0],e[1],.6,.75,0,0,7);ctx.fill();});
    ctx.strokeStyle=sk.line;ctx.lineWidth=.55;ctx.beginPath();const m0=add(p.h,mul(up,-3.7));ctx.moveTo(...add(m0,mul(lat,-1.2)));ctx.quadraticCurveTo(...add(m0,mul(up,-.5)),...add(m0,mul(lat,1.2)));ctx.stroke();
    return;
  }
  const fr=gm.front,back=mul(fr,-1);
  if(g==="f"){const tail=add(p.h,add(mul(back,R+1.4),mul(up,.4))),d=nrm(add(back,mul(up,-1.1)));
    ctx.fillStyle=HAIR.f;ctx.beginPath();ctx.ellipse(...add(tail,mul(d,2.6)),2.1,4.6,Math.atan2(d[1],d[0])+Math.PI/2,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(tail[0],tail[1],1.6,0,7);ctx.fill();}
  const s=skin2(sk);
  s.items.push(circ(p.h,R),ell(add(p.h,add(mul(fr,2.3),mul(up,-3.0))),R*.58,R*.44,Math.atan2(fr[1],fr[0])),circ(add(p.h,add(mul(fr,R-.1),mul(up,-.4))),1.15),
    tube(seg(lerp(p.s,p.h,.3),add(p.h,mul(up,-1)),4),()=>B.neck,()=>B.neck,fr));
  paint(ctx,[s],ow);
  // pelo: arriba y detrás, con la línea de la frente y la nuca (coordenadas de la cabeza: x hacia la cara, y hacia arriba)
  const H=([x,y])=>add(p.h,add(mul(fr,x*R),mul(up,y*R)));
  const hair=g==="f"?[[.62,.42],[.9,1.4],[-1.5,1.5],[-1.5,-.95],[-.55,-.62],[-.2,.02],[.25,.3]]:[[.6,.5],[.9,1.4],[-1.5,1.5],[-1.5,-.62],[-.58,-.42],[-.25,.08],[.22,.34]];
  ctx.save();ctx.clip(circ(p.h,R+.25));ctx.fillStyle=HAIR[g];ctx.beginPath();hair.map(H).forEach((q,i)=>ctx[i?"lineTo":"moveTo"](...q));ctx.closePath();ctx.fill();ctx.restore();
  const ear=add(p.h,add(mul(back,.5),mul(up,-.7)));ctx.fillStyle=sk.far;ctx.beginPath();ctx.ellipse(ear[0],ear[1],1.1,1.6,Math.atan2(up[1],up[0]),0,7);ctx.fill();
  if(detail){const e=add(p.h,add(mul(fr,R*.55),mul(up,.2)));ctx.fillStyle="#2B1D17";ctx.beginPath();ctx.ellipse(e[0],e[1],.5,.65,0,0,7);ctx.fill();}
}
const skin2=sk=>G(sk.fill,sk.line,false);

/* ---------- Estilos «palos» y «redondo»: la misma geometría, sin ropa ---------- */
function simple(ctx,ex,gm,o,C,ow,round){
  const p=gm.p,B=BODY[o.gender==="f"?"f":"m"],frente=gm.view==="frente";
  const S=i=>round?gm.root["s"+i]:p.s,P=i=>round?gm.root["p"+i]:p.p;
  const lineLimb=(pts,w,col)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...pts[0]);pts.slice(1).forEach(q=>ctx.lineTo(...q));ctx.stroke();};
  const foot=ft=>ft.front?[ft.A,add(ft.A,mul(ft.d,3.2))]:[add(ft.A,add(mul(ft.f,-1.6),mul(ft.s,2.2))),add(ft.A,add(mul(ft.f,7.2),mul(ft.s,2.2)))];
  const hand=h=>h.mode==="flat"?[h.W,[h.W[0]+h.dir[0]*5.4,h.sup-1.4]]:[h.W,add(h.W,mul(h.dir,h.mode==="fist"?1.6:3.6))];
  // palos: cada parte es una polilínea; un halo del color del fondo separa lo que va delante de lo que va detrás
  const parts={
    arm:i=>[S(i),p["e"+i],p["w"+i],...hand(gm.hands[i]).slice(1)],
    leg:i=>[P(i),p["k"+i],gm.feet[i].A],
    foot:i=>foot(gm.feet[i]),
  };
  if(!round){
    const W={arm:4.2,leg:5,foot:3.6,torso:6.6,neck:4};
    // halo del color del fondo para separar lo de delante de lo de detrás, salvo junto a la raíz (hombro, cadera): ahí sería una junta
    const layer=(items,halo,col=C.ink,roots=[])=>{ctx.lineCap="round";ctx.lineJoin="round";
      if(halo){ctx.save();if(roots.length)ctx.clip(holes(roots),"evenodd");items.forEach(([pts,w])=>lineLimb(pts,w+2,C.bg));ctx.restore();}
      items.forEach(([pts,w])=>lineLimb(pts,w,col));};
    const torso=[quad(p.s,p.c,p.p,10),W.torso],neck=[[p.s,p.h],W.neck];
    const headC=()=>{ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(...p.h,B.head,0,7);ctx.fill();};
    drawGear(ctx,ex,gm,C,ow,"back");
    if(frente){layer([[parts.leg("1"),W.leg],[parts.foot("1"),W.foot],[parts.leg("2"),W.leg],[parts.foot("2"),W.foot]],false);
      drawGear(ctx,ex,gm,C,ow,"band-back");layer([torso,neck],false);headC();drawGear(ctx,ex,gm,C,ow,"front");
      layer([[parts.arm("1"),W.arm],[parts.arm("2"),W.arm]],true,C.ink,[[p.s,8]]);return;}
    layer([[parts.arm("2"),W.arm],[parts.leg("2"),W.leg],[parts.foot("2"),W.foot]],false,C.far);
    drawGear(ctx,ex,gm,C,ow,"band-back");
    layer([torso,neck,[parts.leg("1"),W.leg],[parts.foot("1"),W.foot]],true,C.ink,[[p.s,7],[p.p,9]]);headC();
    drawGear(ctx,ex,gm,C,ow,"front");
    layer([[parts.arm("1"),W.arm]],true,C.ink,[[p.s,8]]);return;
  }
  // redondo: formas llenas en dos tonos (lo de detrás más claro), sin contorno; halo del fondo entre capas
  const fr=gm.front,ref=frente?gm.lat:fr,[a0,a1,a2]=B.arm.map(x=>x*.92),[t0,t1]=B.thigh.map(x=>x*.9),[s0,s1]=B.shin.map(x=>x*.92);
  const armT=i=>[tube(seg(S(i),p["e"+i]),lin(a0,a1),lin(a0,a1),ref),tube(seg(p["e"+i],p["w"+i]),lin(a1,a2),lin(a1,a2),ref),handR(gm.hands[i])];
  const handR=h=>h.mode==="fist"?circ(add(h.W,mul(h.dir,1.5)),2.5):h.mode==="flat"?tube(seg(h.W,[h.W[0]+h.dir[0]*5.8,h.sup-1.6],4),lin(2,1.6),lin(2,1.6),[0,-1]):tube(seg(h.W,add(h.W,mul(h.dir,4.2)),4),lin(2,1.6),lin(2,1.6),[0,-1]);
  const footR=ft=>ft.front?ell(add(ft.A,mul(ft.d,2.2)),2.8,2.6,0):tube(seg(add(ft.A,mul(ft.s,1.4)),add(ft.A,add(mul(ft.f,7),mul(ft.s,1.6))),4),lin(2.4,1.8),lin(2.4,1.8),mul(ft.s,-1));
  const legT=i=>[tube(seg(P(i),p["k"+i]),lin(t0,t1),lin(t0,t1),ref),tube(seg(p["k"+i],gm.feet[i].A),lin(s0,s1),lin(s0,s1),ref),footR(gm.feet[i])];
  const w=frente?(t=>t<.6?B.shF*.95-(B.shF*.95-B.waistF*.95)*(t/.6):B.waistF*.95+(B.hipFw*.92-B.waistF*.95)*((t-.6)/.4)):(t=>B.sh*.85-(B.sh*.85-B.waist*.95)*t+1.2*bump(t,.6,1.1));
  const torsoT=tube(quad(p.s,p.c,p.p),w,w,ref),neckT=tube(seg(p.s,p.h,4),()=>B.neck,()=>B.neck,ref),headT=circ(p.h,B.head+.3);
  const halo=(items,roots)=>{ctx.save();if(roots)ctx.clip(holes(roots),"evenodd");ctx.strokeStyle=C.bg;ctx.lineWidth=2.4;ctx.lineJoin="round";const U=new Path2D();items.forEach(it=>U.addPath(it.path||it));ctx.stroke(U);ctx.restore();};
  const fill=(items,col,roots,noHalo)=>{if(!noHalo)halo(items,roots);paint(ctx,[{fill:col,line:null,shade:false,items}],0);};
  drawGear(ctx,ex,gm,C,ow,"back");
  if(frente){drawGear(ctx,ex,gm,C,ow,"band-back");fill([...legT("1"),...legT("2"),torsoT,neckT,headT],C.rNear,null,true);
    drawGear(ctx,ex,gm,C,ow,"front");fill(armT("2"),C.rNear,[[gm.root.s2,6]]);fill(armT("1"),C.rNear,[[gm.root.s1,6]]);return;}
  fill(armT("2"),C.rFar,null,true);fill(legT("2"),C.rFar,null,true);drawGear(ctx,ex,gm,C,ow,"band-back");
  fill([torsoT,neckT,headT,...legT("1")],C.rNear,[[p.p,9]]);drawGear(ctx,ex,gm,C,ow,"front");fill(armT("1"),C.rNear,[[p.s,7]]);
}

/* ---------- Etiquetas (solo en grande), como en la app: zona que trabaja, flecha del movimiento, «AQUÍ ESTIRA», banda ---------- */
function labels(ctx,ex,st,gm,t,text,toScreen,sc,C,bx){
  const ph=st.phase,p=gm.p,pulse=.5+.5*Math.sin(t*7),items=[];
  const at=(lab,tgt)=>lab?toScreen(lab):[tgt[0]+(tgt[0]<90?28:-28),tgt[1]-16];
  (ph.sq||[]).forEach(k=>{const m=(ex.marks||{})[k];if(!m)return;
    const pts=m.at.map(j=>p[j]),tgt=toScreen([pts.reduce((a,b)=>a+b[0],0)/pts.length+m.off[0],pts.reduce((a,b)=>a+b[1],0)/pts.length+m.off[1]]);
    items.push({tgt,l:at(m.lab,tgt),txt:m.text||text[k]||k.toUpperCase(),kind:"zone"});});
  if(ph.stretch&&ex.stretch){const sgm=ex.stretch.segs[0],tgt=toScreen(lerp(p[sgm[0]],p[sgm[1]],.5));items.push({tgt,l:at(ex.stretch.lab,tgt),txt:"AQUÍ ESTIRA",kind:"zone",seg:sgm});}
  (ex.equip||[]).forEach(q=>{if(!q.label||!(q.t==="goma"||q.t==="band"))return;
    const tgt=toScreen(q.t==="band"?lerp(gm.root["p"+q.at[1]],p[q.at],.8):lerp(anchor(gm,q.at),anchor(gm,q.to),.55));
    const cx=toScreen(lerp(p.s,p.p,.5))[0],dx=tgt[0]<cx-4?-36:36;   // hacia fuera del cuerpo, no encima
    items.push({tgt,l:[tgt[0]+dx,tgt[1]+(tgt[1]>50?-18:16)],txt:q.label,kind:"equip"});});
  ctx.save();ctx.setTransform(sc,0,0,sc,0,0);
  // flecha del movimiento (en el encuadre de la figura)
  if(ph.arrow){const a=ph.arrow,A=toScreen([a[0],a[1]]),Bp=toScreen([a[2],a[3]]),pr=Math.min(1,st.tt/Math.max(.3,ph.move)),X=lerp(A,Bp,pr),ang=Math.atan2(Bp[1]-A[1],Bp[0]-A[0]);
    ctx.strokeStyle=C.accent;ctx.fillStyle=C.accent;ctx.lineWidth=2.4;ctx.lineCap="round";ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...X);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(...X);ctx.lineTo(X[0]-7*Math.cos(ang-.5),X[1]-7*Math.sin(ang-.5));ctx.lineTo(X[0]-7*Math.cos(ang+.5),X[1]-7*Math.sin(ang+.5));ctx.closePath();ctx.fill();}
  ctx.font="700 7px system-ui,Roboto,sans-serif";
  const boxes=[];
  items.forEach(it=>{
    const w=ctx.measureText(it.txt).width+9;let [lx,ly]=it.l;
    lx=Math.min(179-w/2,Math.max(1+w/2,lx));ly=Math.min(105,Math.max(7,ly));
    // no tapar otra etiqueta ni el punto de otra zona (la etiqueta del material cede primero: va la última)
    const hit=()=>boxes.some(b=>Math.abs(b[0]-lx)<(b[2]+w)/2+2&&Math.abs(b[1]-ly)<13)||items.some(o=>o!==it&&Math.abs(o.tgt[0]-lx)<w/2+6&&Math.abs(o.tgt[1]-ly)<12);
    for(let k=0;k<8&&hit();k++){if(k%2===0)ly+=ly>56?-13:13;else lx=Math.min(179-w/2,Math.max(1+w/2,lx+(lx>90?-22:22)));}
    boxes.push([lx,ly,w]);it.L=[lx,ly,w];});
  items.forEach(it=>{const [x,y]=it.tgt;
    if(it.kind==="zone"){ctx.fillStyle="rgba(240,176,74,"+(.22+.25*pulse)+")";ctx.beginPath();ctx.arc(x,y,5+2.2*pulse,0,7);ctx.fill();
      ctx.fillStyle=C.hl;ctx.beginPath();ctx.arc(x,y,2.1,0,7);ctx.fill();}
    const [lx,ly,w]=it.L;
    ctx.strokeStyle=C.hl;ctx.lineWidth=.9;ctx.setLineDash([2,1.6]);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.roundRect?ctx.roundRect(lx-w/2,ly-5.6,w,11.2,3.5):ctx.rect(lx-w/2,ly-5.6,w,11.2);
    if(it.kind==="equip"){ctx.fillStyle=C.surface;ctx.fill();ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=C.hl;}
    else{ctx.fillStyle=C.hl;ctx.fill();ctx.fillStyle=C.hlInk;}
    ctx.textAlign="center";ctx.fillText(it.txt,lx,ly+2.5);});
  ctx.restore();
}

/* ---------- Dibujar ---------- */
function draw(cv,ex,t,clamp,o={}){
  const style=o.style||"persona",g=o.gender==="f"?"f":"m",B=BODY[g],C=colorsFor(o);
  const dpr=window.devicePixelRatio||1,cw=cv.clientWidth||300;
  if(cv.width!==Math.round(cw*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*112/180*dpr);}
  const ctx=cv.getContext("2d"),sc=cv.width/180,big=!!o.labels,bx=boxOf(ex,big);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  ctx.setTransform(sc*bx.sc,0,0,sc*bx.sc,sc*bx.tx,sc*bx.ty);ctx.lineJoin="round";ctx.lineCap="round";
  const st=state(ex,t,clamp),gm=geom(ex,st.pose,{key:o.key,B});
  const pxu=cw/180*bx.sc,ow=Math.max(.42,.75/pxu),detail=pxu>=2.4;
  (ex.equip||[]).filter(q=>q.t==="box").forEach(q=>drawBox(ctx,q,C));
  // lo que se apoya se aplasta contra el suelo (no lo atraviesa)
  ctx.save();ctx.beginPath();ctx.rect(-200,-200,600,200+GROUND);ctx.clip();
  if(style==="persona")persona(ctx,ex,gm,o,C,ow,detail);else simple(ctx,ex,gm,o,C,ow,style==="redondo");
  ctx.restore();
  ctx.strokeStyle=C.ground;ctx.lineWidth=1.3/bx.sc;ctx.beginPath();ctx.moveTo(-bx.tx/bx.sc,GROUND);ctx.lineTo((180-bx.tx)/bx.sc,GROUND);ctx.stroke();
  if(o.labels)labels(ctx,ex,st,gm,o.pt??t,o.text||{},q=>[bx.tx+bx.sc*q[0],bx.ty+bx.sc*q[1]],sc,C,bx);
  return st;
}
window.Figura={draw,keyT,phaseT,state,styles:["palos","redondo","persona"]};
})();
