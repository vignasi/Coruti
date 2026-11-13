/* Figura 3D (bloque D1): un modelo de persona con huesos (modelos/persona_m.glb o persona_f.glb) movido con las mismas
   posturas de rutina.json que la figura dibujada (Figura.solve de figura.js, con pies, manos y vista ya resueltos).
   Añade el material (bandas grandes, mini banda, mancuernas, toalla, correas, sillas, sofá y pared) y, solo en grande,
   las etiquetas de figura.js (zona que trabaja, flecha, «AQUÍ ESTIRA», BANDA) pegadas al cuerpo 3D.

   const f3=await Figura3D.crear({modelo:'modelos/persona_m.glb', gender:'m'});
   f3.draw(canvas, ejercicio, t, clamp, {key, labels, text:D.marks, pt, dark});   // mismo uso que Figura.draw
   Necesita figura.js antes y un importmap con «three» y «three/addons/». */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const GD=103.2;                                   // suelo del dibujo (figura.js)
const COL={band:0xD98E1F,db:0x2F3A38,dbHandle:0x7D8A87,towel:0xA9B8C4,strap:0x3C4745};
// puntos del dibujo: [x, y] o [x, y, z] (z hacia la cámara, E3: posturas con giros fuera del plano, como la almeja)
const v3=a=>new THREE.Vector3(a[0],-a[1],a[2]||0);
const d2=(a,b)=>v3([b[0]-a[0],b[1]-a[1],(b[2]||0)-(a[2]||0)]).normalize();
function basis(d,s){const y=d.clone().normalize(),orto=v=>v.clone().sub(y.clone().multiplyScalar(v.dot(y)));let x=orto(s);
  // si el hueso va justo en la dirección de referencia (p. ej. la espinilla hacia la cámara en la vista de frente), otra referencia
  if(x.lengthSq()<.04)x=orto(new THREE.Vector3(1,0,0)).lengthSq()>.04?orto(new THREE.Vector3(1,0,0)):orto(new THREE.Vector3(0,1,0));x.normalize();
  const z=new THREE.Vector3().crossVectors(x,y);return new THREE.Matrix4().makeBasis(x,y,z);}
const supOf=ex=>pt=>{let y=GD;(ex.equip||[]).forEach(e=>{if(e.t!=='box')return;const [x,yy,w,h]=e.r;if(h<90&&pt[0]>=x-2&&pt[0]<=x+w+2&&yy>=pt[1]-1.5&&yy<y)y=yy;});return y;};

/* Cinta plana a lo largo de una curva: ancho w en la dirección side(i) */
function ribbon(P,side,w,mat,closed){
  const n=P.length,pos=[],idx=[];
  P.forEach((p,i)=>{const s=side(i).clone().multiplyScalar(w/2);pos.push(...p.clone().add(s).toArray(),...p.clone().sub(s).toArray());});
  const m=closed?n:n-1;for(let i=0;i<m;i++){const a=2*i,b=2*((i+1)%n);idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const me=new THREE.Mesh(g,mat);me.castShadow=true;return me;}
function tubeAlong(P,r,mat,closed){const c=new THREE.CatmullRomCurve3(P,closed,'catmullrom',.2);
  const me=new THREE.Mesh(new THREE.TubeGeometry(c,Math.max(16,P.length*8),r,8,closed),mat);me.castShadow=true;return me;}

export async function crear({modelo,gender='m',loader}){
  const gl=await (loader||new GLTFLoader()).loadAsync(modelo),root=gl.scene;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
  root.updateMatrixWorld(true);
  const B={};root.traverse(o=>{if(o.isBone)B[o.name.replace('mixamorig','').replace(':','')]=o;});
  const rest={};for(const n in B){const b=B[n];rest[n]={local:b.quaternion.clone(),world:b.getWorldQuaternion(new THREE.Quaternion()),pos:b.getWorldPosition(new THREE.Vector3())};}
  const pname=b=>b.parent.name.replace('mixamorig','').replace(':','');
  const restDir=(a,c)=>rest[c]?rest[c].pos.clone().sub(rest[a].pos).normalize():rest[a].pos.clone().sub(rest[pname(B[a])].pos).normalize();
  const thigh=rest.LeftLeg.pos.distanceTo(rest.LeftUpLeg.pos);
  const wp=n=>B[n].getWorldPosition(new THREE.Vector3());
  const vtx=new THREE.Vector3();
  // piel del tronco (cadera, espalda, hombros, brazos y muslos), uno de cada 4 vértices: para apoyar el tronco en el suelo por su
  // superficie y no por los huesos ("apoya":"tronco" en rutina.json, E3). Hombre y mujer tienen anchos distintos.
  // y piel de cada mano y cada pie (EXT), para que la palma o la suela apoyada toque de verdad su superficie
  const TRONCO=[],LADO=[],RODILLAS=[],ALTA=[],BAJA=[],CABEZA=[],EXT={};root.traverse(o=>{if(!o.isSkinnedMesh||[].concat(o.material)[0].name==='ojos')return;
    const si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;
    for(let i=0;i<o.geometry.attributes.position.count;i++){const q4=i%4===0;   // tronco, uno de cada 4; manos y pies, todos
      let b=0,w=-1;for(let j=0;j<4;j++){const x=sw.getComponent(i,j);if(x>w){w=x;b=si.getComponent(i,j);}}
      const bn=o.skeleton.bones[b].name.replace('mixamorig','').replace(':','');
      if(q4&&/(Hips|Spine|Shoulder|UpLeg|[^e]Arm)$/.test(bn.replace(/\d$/,'')))TRONCO.push([o,i]);
      if(q4&&/(Hips|Spine|Shoulder|UpLeg)$/.test(bn.replace(/\d$/,'')))LADO.push([o,i]);
      if(q4&&/(Spine2|Shoulder)$/.test(bn))ALTA.push([o,i]);if(q4&&bn==='Head')CABEZA.push([o,i]);if(q4&&/(Hips|UpLeg)$/.test(bn))BAJA.push([o,i]);
      if(q4&&/^(Left|Right)Leg$/.test(bn)){o.getVertexPosition(i,vtx);o.localToWorld(vtx);if(vtx.distanceTo(B[bn].getWorldPosition(new THREE.Vector3()))<.12)RODILLAS.push([o,i]);}
      const ex=bn.match(/^(Left|Right)(Foot|ToeBase|Hand)/);if(ex)(EXT[ex[1]+(ex[2]==='Hand'?'Hand':'Foot')]||=[]).push([o,i]);}});
  const pielMin=(L=TRONCO)=>{let y=1e9;for(const [o,i] of L){o.getVertexPosition(i,vtx);o.localToWorld(vtx);if(vtx.y<y)y=vtx.y;}return y;};
  const pielBajo=L=>{let y=1e9,x=0;for(const [o,i] of L){o.getVertexPosition(i,vtx);o.localToWorld(vtx);if(vtx.y<y){y=vtx.y;x=vtx.x;}}return [x,y];};

  // escena
  const scene=new THREE.Scene();scene.add(root);
  const hemi=new THREE.HemisphereLight(0xffffff,0x8a9a96,1.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-1.5,3,2.5);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-2.2,right:2.2,top:2.2,bottom:-2.2});scene.add(sun,sun.target);
  const rim=new THREE.DirectionalLight(0xcfe3e0,0);scene.add(rim,rim.target);   // luz de contorno, solo en oscuro: la ropa oscura no se pierde en el fondo
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.ShadowMaterial({opacity:.18}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const lineMat=new THREE.MeshBasicMaterial({color:0xC3CFCB});
  const line=new THREE.Mesh(new THREE.PlaneGeometry(20,.006),lineMat);line.position.set(0,0.003,0);scene.add(line);
  const props=new THREE.Group(),gear=new THREE.Group();scene.add(props,gear);
  const M={prop:new THREE.MeshStandardMaterial({color:0xDDE5E3,roughness:.9}),
    band:new THREE.MeshStandardMaterial({color:COL.band,roughness:.6,side:THREE.DoubleSide}),
    db:new THREE.MeshStandardMaterial({color:COL.db,roughness:.45,metalness:.3}),
    dbH:new THREE.MeshStandardMaterial({color:COL.dbHandle,roughness:.35,metalness:.6}),
    towel:new THREE.MeshStandardMaterial({color:COL.towel,roughness:1,side:THREE.DoubleSide}),
    strap:new THREE.MeshStandardMaterial({color:COL.strap,roughness:.8})};
  const cam=new THREE.PerspectiveCamera(24,180/112,.1,50);

  /* Gira el hueso «name» para que apunte hacia su hijo en dir; sec fija el giro alrededor (restSec en reposo) */
  function aim(name,child,dir,sec,restSec){
    const Br=basis(restDir(name,child),restSec),Bt=basis(dir,sec);const Rm=Bt.multiply(Br.transpose());
    const wq=new THREE.Quaternion().setFromRotationMatrix(Rm).multiply(rest[name].world);
    const b=B[name],pq=b.parent.getWorldQuaternion(new THREE.Quaternion());b.quaternion.copy(pq.invert().multiply(wq));b.updateMatrixWorld(true);}
  /* Gira un hueso en el mundo alrededor de axis (rotateOnWorldAxis de three.js no vale si el padre está girado) */
  function rotW(b,axis,ang){const q=new THREE.Quaternion().setFromAxisAngle(axis,ang).multiply(b.getWorldQuaternion(new THREE.Quaternion()));
    b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);}
  function ik(a,b,c,T,bend,secA,restA){const R=wp(a),L1=R.distanceTo(wp(b)),L2=wp(b).distanceTo(wp(c));   // largos de ahora (en reposo, el brazo de MakeHuman no da el mismo)
    T=T.clone();if(isNaN(T.z))T.z=R.z;   // z: la del dibujo si la tiene (manos juntas, piernas juntas); si no, en el plano del hombro o la cadera
    const d=Math.min(R.distanceTo(T),L1+L2-1e-4);const u=T.clone().sub(R).normalize();T=R.clone().add(u.clone().multiplyScalar(d));
    const x=(L1*L1-L2*L2+d*d)/(2*d),hh=Math.sqrt(Math.max(0,L1*L1-x*x));const orto=v=>v.clone().sub(u.clone().multiplyScalar(v.dot(u)));
    // hacia dónde se dobla: como en el dibujo; si allí está recto, hacia arriba (codo o rodilla lejos del apoyo)
    let n=orto(bend);if(n.lengthSq()<1e-6)n=orto(new THREE.Vector3(0,1,0));if(n.lengthSq()<1e-6)n=orto(new THREE.Vector3(1,0,0));n.normalize();
    const E=R.clone().add(u.multiplyScalar(x)).add(n.multiplyScalar(hh));aim(a,b,E.clone().sub(R).normalize(),secA,restA);aim(b,c,T.clone().sub(E).normalize(),secA,restA);}

  /* Postura: devuelve lo necesario para el material y las etiquetas */
  function pose(ex,k,t,clamp){
    const {st,gm}=Figura.solve(ex,t,clamp,{key:k,gender}),p=gm.p,frente=gm.view==='frente',sup=supOf(ex);
    for(const n in B)B[n].quaternion.copy(rest[n].local);root.position.set(0,0,0);root.quaternion.identity();root.updateMatrixWorld(true);
    const up=d2(p.p,p.s),F=frente?new THREE.Vector3(0,0,1):v3(gm.front).normalize(),left=new THREE.Vector3().crossVectors(up,F).normalize();
    const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
    // qué lado del cuerpo es el «1» (cercano en perfil)
    const left2=[left.x,-left.y],one=frente?(((gm.root.p1[0]-p.p[0])*left2[0]+(gm.root.p1[1]-p.p[1])*left2[1])>0?'Left':'Right'):(left.z>0?'Left':'Right');
    const other=one==='Left'?'Right':'Left',side={1:one,2:other};
    const latOf=S=>S==='Left'?left.clone():left.clone().negate();
    const axes=i=>{const S=side[i],lat=latOf(S);return {S,lat,secA:frente?F:lat,restA:frente?Z:Y,secL:frente?F:left,restL:frente?Z:X};};
    aim('Hips','Spine',up,left,X);
    // "retro": retroversión de la pelvis en grados (tumbado con la lumbar pegada al suelo): gira solo la pelvis; espalda y
    // piernas se colocan después en el mundo, así que no se mueven
    if(ex.retro)rotW(B.Hips,left,THREE.MathUtils.degToRad(ex.retro*(F.y>0?-1:1)));
    aim('Spine','Spine1',d2(p.p,p.c),left,X);aim('Spine1','Spine2',d2(p.c,p.s),left,X);aim('Spine2','Neck',d2(p.c,p.s),left,X);
    aim('Neck','Head',d2(p.s,p.h),left,X);aim('Head','HeadTop_End',d2(p.s,p.h),left,X);
    for(const i of ['1','2']){const {S,secA,restA,secL,restL}=axes(i);
      aim(S+'Arm',S+'ForeArm',d2(p.s,p['e'+i]),secA,restA);aim(S+'ForeArm',S+'Hand',d2(p['e'+i],p['w'+i]),secA,restA);
      aim(S+'UpLeg',S+'Leg',d2(gm.root['p'+i],p['k'+i]),secL,restL);aim(S+'Leg',S+'Foot',d2(p['k'+i],gm.feet[i].A),secL,restL);
      const ft=gm.feet[i];if(!ft.front){aim(S+'Foot',S+'ToeBase',v3(ft.f).normalize(),secL,restL);aim(S+'ToeBase',S+'Toe_End',v3(ft.f).normalize(),secL,restL);}}
    root.updateMatrixWorld(true);
    // escala del dibujo a metros por el muslo; luego apoyar lo más bajo en el suelo
    const p0=ex.poses[0],dt=Math.hypot(p0.k1[0]-p0.p[0],p0.k1[1]-p0.p[1],(p0.k1[2]||0)-(p0.p[2]||0))||30,kk=thigh/dt;
    const hp=wp('Hips');root.position.set((p.p[0]-90)*kk-hp.x,0,-hp.z);root.updateMatrixWorld(true);
    const skip=/Index|Middle|Ring|Pinky|Thumb|Eye/;
    const bb=()=>{const b=new THREE.Box3();for(const n in B){if(skip.test(n))continue;b.expandByPoint(wp(n));}
      const hd=wp('Head'),nk=wp('Neck');b.expandByPoint(hd.clone().add(hd.clone().sub(nk).normalize().multiplyScalar(.2)));return b;};
    let box=bb();root.position.y-=box.min.y-0.07;root.updateMatrixWorld(true);
    // "apoya": con qué toca el suelo el cuerpo (no lo dice el dibujo, que no tiene grosor): tronco (tumbado), rodillas
    // (de rodillas o a cuatro patas, por la piel de alrededor de la rodilla), lado (tumbado de lado sobre el antebrazo: tronco
    // y cadera, sin los brazos) o pies (de pie de frente, o de lado sobre los pies, plancha lateral)
    const PIES=[...(EXT.LeftFoot||[]),...(EXT.RightFoot||[])],AP={tronco:TRONCO,lado:LADO,rodillas:RODILLAS,pies:PIES};
    // Se puede poner en el ejercicio o en cada postura
    const ph=ex.phases,ap=j=>ex.poses[j].apoya||ex.apoya,a0=ap(ph[(st.idx-1+ph.length)%ph.length].pose),a1=ap(ph[st.idx].pose);
    const off=a=>AP[a]?pielMin(AP[a])+.004:0,apoyo=a0===a1?off(a1):Math.min(off(a0),off(a1));   // entre dos, que ninguno atraviese el suelo
    if(apoyo){root.position.y-=apoyo;root.updateMatrixWorld(true);}
    // tumbado de perfil con el tronco en el suelo (hombros y pelvis en el suelo en el dibujo): se inclina el cuerpo lo justo para
    // que apoyen a la vez la espalda alta y la pelvis (hombre y mujer tienen anchos distintos y el dibujo no tiene grosor)
    if(!frente&&a1==='tronco'&&a0==='tronco'&&p.s[1]>GD-10&&p.p[1]>GD-10){
      for(let it=0;it<3;it++){const [xu,yu]=pielBajo(ALTA),[xl,yl]=pielBajo(BAJA);if(Math.abs(xu-xl)<.1||Math.abs(yu-yl)<.002)break;
        const th=-Math.atan((yu-yl)/(xu-xl)),P=new THREE.Vector3(xl,yl,0),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),th);
        root.position.sub(P).applyQuaternion(q).add(P);root.quaternion.premultiply(q);root.updateMatrixWorld(true);}
      root.position.y-=pielMin([...ALTA,...BAJA])+.004;root.updateMatrixWorld(true);}
    // la cabeza, si en el dibujo está en el suelo, apoya: el cuello gira lo justo (como mucho 20°)
    if(!frente&&a1==='tronco'&&p.h[1]>GD-12){let tot=0;for(let it=0;it<4;it++){const [xh,yh]=pielBajo(CABEZA),nk=wp('Neck'),dx=xh-nk.x;if(Math.abs(yh)<.003||Math.abs(dx)<.03)break;
        let th=-Math.atan(yh/dx);th=Math.max(-.35-tot,Math.min(.35-tot,th));tot+=th;rotW(B.Neck,new THREE.Vector3(0,0,1),th);}}
    const apoyado=!!(a0&&AP[a0]||a1&&AP[a1]);
    // antebrazo apoyado (plancha sobre antebrazos): el cuerpo baja lo justo para que el codo llegue al suelo
    const fore={},recto={};let low=0,sube=0;
    for(const i of ['1','2']){const E=p['e'+i],W=p['w'+i];if(!(E[1]>sup(E)-4.5&&W[1]>sup(W)-4.5))continue;
      const S=side[i],sh=wp(S+'Arm'),L1=sh.distanceTo(wp(S+'ForeArm')),dx=(E[0]-p.s[0])*kk,ey=(GD-sup(E))*kk+.04;
      fore[i]={dx,ey,dir:Math.sign(W[0]-E[0])||1};if(Math.abs(dx)<L1&&!apoyado)low=Math.max(low,sh.y-(ey+Math.sqrt(L1*L1-dx*dx)));}
    // manos apoyadas en una silla que no alcanzan (fondos): el cuerpo cuelga de ellas y baja; las piernas se doblan después
    // brazo recto en el dibujo con la mano apoyada (flexiones arriba, a cuatro patas, fondos arriba)
    for(const i of ['1','2']){const W=p['w'+i],E=p['e'+i];if(fore[i]||!(W[1]>sup(W)-4.5))continue;
      const dw=[W[0]-p.s[0],W[1]-p.s[1]],de=[E[0]-p.s[0],E[1]-p.s[1]];if(Math.abs(dw[0]*de[1]-dw[1]*de[0])/(Math.hypot(...dw)*Math.hypot(...de)||1)<.17)recto[i]=1;}
    // (y en el suelo, si el cuerpo no se apoya en otra cosa: flexiones con los brazos estirados)
    for(const i of ['1','2']){const W=p['w'+i];if(fore[i]||!(W[1]>sup(W)-4.5))continue;
      const bx=(PX.get(k)||[]).find(b=>{const [x,,w]=b.e.r;return !b.wall&&W[0]>=x-2&&W[0]<=x+w+2;});
      if(!(bx&&sup(W)<GD)&&(sup(W)<GD||apoyado))continue;
      const S=side[i],sh=wp(S+'Arm'),L=sh.distanceTo(wp(S+'ForeArm'))+wp(S+'ForeArm').distanceTo(wp(S+'Hand'))-.01;
      const tx=bx&&sup(W)<GD?bx.cx+(W[0]-bx.xc)*kk:sh.x+(W[0]-p.s[0])*kk,ty=(GD-sup(W))*kk+.035,dx=Math.abs(tx-sh.x);
      if(dx<L&&Math.hypot(dx,sh.y-ty)>L)low=Math.max(low,sh.y-(ty+Math.sqrt(L*L-dx*dx)));
      // en el suelo con el brazo recto en el dibujo (flexiones arriba): el cuerpo sube hasta que el brazo queda estirado
      if(!bx&&recto[i]&&dx<L)sube=Math.max(sube,ty+Math.sqrt(L*L-dx*dx)-.01-sh.y);
      // fondos: manos en la silla junto a la cadera → la cadera, a la altura del dibujo respecto a la silla
      if(bx&&Math.abs(W[0]-p.p[0])<15&&p.p[1]>sup(W))low=Math.max(low,wp('Hips').y-(GD-p.p[1])*kk);}
    if(low>0){root.position.y-=low;root.updateMatrixWorld(true);}
    else if(sube>0){root.position.y+=sube;root.updateMatrixWorld(true);}
    // contacto: mano o pie apoyados (suelo, silla, sofá) → el brazo o la pierna se doblan lo justo para llegar
    const toW=(pt,lift,from,ref)=>new THREE.Vector3(wp(from).x+(pt[0]-ref[0])*kk,(GD-sup(pt))*kk+lift,pt.length>2?pt[2]*kk:NaN);
    const bendOf=(r,m,e)=>{const mid=[(r[0]+e[0])/2,(r[1]+e[1])/2,((r[2]||0)+(e[2]||0))/2];return v3([m[0]-mid[0],m[1]-mid[1],(m[2]||0)-mid[2]]);};   // con z: rodillas abiertas
    const cont=[];   // manos y pies apoyados: después se afinan para que la piel toque
    for(const i of ['1','2']){const {S,lat,secA,restA,secL,restL}=axes(i);
      const W=p['w'+i],E=p['e'+i],A=gm.feet[i].A,K=p['k'+i];
      if(fore[i]){const f=fore[i],sh=wp(S+'Arm'),L1=sh.distanceTo(wp(S+'ForeArm')),dy=sh.y-f.ey;
        // el codo sigue en el suelo: si el hombro está más bajo que en el dibujo, el brazo se abre (tumbado de lado)
        const hx=dy<L1?Math.max(Math.abs(f.dx),Math.sqrt(L1*L1-Math.max(0,dy)*Math.max(0,dy))):Math.abs(f.dx);
        const Ew=new THREE.Vector3(sh.x+(Math.sign(f.dx)||1)*hx,f.ey,sh.z);
        aim(S+'Arm',S+'ForeArm',Ew.clone().sub(sh).normalize(),secA,restA);
        aim(S+'ForeArm',S+'Hand',new THREE.Vector3(f.dir,-.04,0).normalize(),secA,restA);}
      else if(W[1]>sup(W)-4.5){const T=toW(W,.035,S+'Arm',p.s),bx=(PX.get(k)||[]).find(b=>{const [x,,w]=b.e.r;return !b.wall&&W[0]>=x-2&&W[0]<=x+w+2;});
        if(bx&&sup(W)<GD)T.x=bx.cx+(W[0]-bx.xc)*kk;     // la mano va a la silla, esté donde esté
        const bend=bendOf(p.s,E,W);ik(S+'Arm',S+'ForeArm',S+'Hand',T,bend,secA,restA);
        // codo del dibujo (0 = recto): con las dos manos apoyadas, el codo 3D se pone igual (flexiones, fondos)
        const ang=(()=>{const a=[E[0]-p.s[0],E[1]-p.s[1]],b=[W[0]-E[0],W[1]-E[1]];return Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b)||1))));})();
        cont.push({L:EXT[S+'Hand'],h:(GD-sup(W))*kk,T,S,recto:recto[i],ang,dos:['1','2'].every(j=>p['w'+j][1]>sup(p['w'+j])-4.5),redo:()=>{ik(S+'Arm',S+'ForeArm',S+'Hand',T,bend,secA,restA);aimHand();}});}
      const ft=gm.feet[i],aimFoot=()=>{if(!ft.front)aim(S+'Foot',S+'ToeBase',v3(ft.f).normalize(),secL,restL);};
      if(!frente&&A[1]>sup(A)-10){const T=toW(A,.075,S+'UpLeg',p.p),bend=bendOf(p.p,K,A).add(F.clone().multiplyScalar(.01));
        // pierna recta en el dibujo (plancha, flexiones): sigue recta; el objetivo se lleva a lo largo de la pierna
        const P0=gm.root['p'+i],dk=[K[0]-P0[0],K[1]-P0[1]],da=[A[0]-P0[0],A[1]-P0[1]],recta=Math.abs(dk[0]*da[1]-dk[1]*da[0])/(Math.hypot(...dk)*Math.hypot(...da)||1)<.1;
        const legIK=()=>{let D=T;if(recta){const R=wp(S+'UpLeg'),L=R.distanceTo(wp(S+'Leg'))+wp(S+'Leg').distanceTo(wp(S+'Foot'))-.002;
          D=T.clone();if(isNaN(D.z))D.z=R.z;D=R.clone().add(D.sub(R).normalize().multiplyScalar(L));}ik(S+'UpLeg',S+'Leg',S+'Foot',D,bend,secL,restL);};
        legIK();
        cont.push({L:EXT[S+'Foot'],h:(GD-sup(A))*kk,T,redo:()=>{legIK();aimFoot();}});}
      aimFoot();
      // mano: apoyada, plana con los dedos estirados; si sujeta algo, cerrada alrededor del asa
      const h=gm.hands[i],hd=v3(h.mode==='flat'?[h.dir[0],.12]:h.dir).normalize(),aimHand=()=>aim(S+'Hand',S+'HandMiddle1',hd,secA,restA);aimHand();
      if(h.mode==='flat')for(const f of ['Index','Middle','Ring','Pinky'])for(const j of [1,2,3]){const n=S+'Hand'+f+j,c=S+'Hand'+f+(j+1);if(B[n])aim(n,B[c]?c:n,hd,secA,restA);}
      if(h.mode==='fist'){const palm=frente?F.clone().negate():lat.clone().negate();
        for(const f of ['Index','Middle','Ring','Pinky'])[1,2,3].forEach((j,jj)=>{const n=S+'Hand'+f+j,c=S+'Hand'+f+(j+1);if(!B[n])return;
          const a=[.95,2.0,2.9][jj],d=hd.clone().multiplyScalar(Math.cos(a)).add(palm.clone().multiplyScalar(Math.sin(a))).normalize();aim(n,B[c]?c:n,d,secA,restA);});
        for(const j of [1,2]){const n=S+'HandThumb'+j,c=S+'HandThumb'+(j+1);if(B[n]&&B[c]){const d=hd.clone().multiplyScalar(.5).add(palm.clone().multiplyScalar(.85)).normalize();aim(n,c,d,secA,restA);}}}
    }
    root.updateMatrixWorld(true);
    // la palma o la suela (la piel, no el hueso) llega justo a su superficie: se sube o baja el objetivo y se repite
    const afina=()=>{for(const c of cont)for(let it=0;it<5;it++){const d=pielMin(c.L)-c.h;if(Math.abs(d)<.003)break;c.T.y-=d;c.redo();root.updateMatrixWorld(true);}};
    afina();
    // brazo recto en el dibujo (flexiones arriba): si al apoyar la palma se ha doblado, sube el cuerpo y se vuelve a apoyar todo
    // cuánto tiene que subir (o bajar) el hombro para que el codo quede como en el dibujo: recto, o con las dos manos
    // apoyadas (y el cuerpo sin otro apoyo) con el mismo ángulo
    const falta=()=>{let sb=0,n=0;for(const c of cont){const igual=c.dos&&!apoyado&&!frente;if(!c.recto&&!igual)continue;
      const sh=wp(c.S+'Arm'),L1=sh.distanceTo(wp(c.S+'ForeArm')),L2=wp(c.S+'ForeArm').distanceTo(wp(c.S+'Hand'));
      const L=c.recto?L1+L2-.003:Math.sqrt(L1*L1+L2*L2+2*L1*L2*Math.cos(c.ang));
      const dx=Math.hypot(c.T.x-sh.x,isNaN(c.T.z)?0:c.T.z-sh.z);if(dx<L){sb+=c.T.y+Math.sqrt(L*L-dx*dx)-sh.y;n++;}}return n?sb/n:0;};
    let sb=falta();
    // a cuatro patas: el cuerpo gira sobre las rodillas (sube o baja los hombros) hasta que los brazos rectos llegan al suelo
    if(a1==='rodillas'&&!frente&&Math.abs(sb)>.002){for(let it=0;it<3&&Math.abs(sb)>.002;it++){
      const [xk,yk]=pielBajo(RODILLAS),dx=wp('Spine2').x-xk;if(Math.abs(dx)<.1)break;
      const th=Math.atan(sb/dx),P=new THREE.Vector3(xk,yk,0),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),th);
      root.position.sub(P).applyQuaternion(q).add(P);root.quaternion.premultiply(q);root.updateMatrixWorld(true);
      for(const c of cont)c.redo();root.updateMatrixWorld(true);afina();sb=falta();}sb=0;}
    if(Math.abs(sb)>.002&&(sb>0||cont.some(c=>c.dos&&!c.recto))){root.position.y+=sb;root.updateMatrixWorld(true);for(const c of cont)c.redo();root.updateMatrixWorld(true);afina();}
    // de rodillas: los pies apoyados mueven la pierna y la rodilla puede bajar; se vuelve a apoyar en la rodilla
    if(a1==='rodillas'&&a0==='rodillas'){const d=pielMin(RODILLAS)+.004;if(Math.abs(d)>.003){root.position.y-=d;root.updateMatrixWorld(true);for(const c of cont)c.redo();root.updateMatrixWorld(true);afina();}}
    return {st,gm,kk,side,left,F,frente,sup};
  }

  /* Puntos del cuerpo 3D (agarre de la mano, suela, muslo) */
  function grip(S){const h=wp(S+'Hand'),m=wp(S+'HandMiddle1');return h.add(m.sub(h).multiplyScalar(1.15));}
  function sole(S){const f=wp(S+'Foot'),t=wp(S+'ToeBase');const c=f.clone().lerp(t,.55);c.y=Math.max(0.006,Math.min(f.y,t.y)-0.045);return c;}

  /* Material de mano y muebles, en la postura actual */
  function drawGear(ex,R){
    gear.clear();const {gm,side,left,F,frente}=R;
    (ex.equip||[]).forEach(q=>{
      if(q.t==='db'){const i=q.at[1],S=side[i],c=grip(S),fw=wp(S+'Hand').sub(wp(S+'ForeArm')).normalize();
        // asa perpendicular al antebrazo, en el plano del dibujo (como en la figura dibujada); mano con la palma hacia dentro
        const ax=new THREE.Vector3().crossVectors(fw,frente?F:left).normalize();
        const g=new THREE.Group();g.position.copy(c);g.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),ax);
        const h=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.15,12),M.dbH);g.add(h);
        for(const s of [-1,1]){const pl=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,.055,6),M.db);pl.position.y=s*.1;pl.castShadow=true;g.add(pl);}
        gear.add(g);}
      if(q.t==='goma'||q.t==='towel'){
        // banda grande: bucle cerrado y largo entre la mano y el pie (o por debajo de la espalda); toalla: tira ancha bajo el pie
        const S=side[q.at[1]],a=grip(S);let b;
        if(q.to[0]==='a')b=sole(side[q.to[1]]);
        else{b=wp('Spine2');b.y=0.012;b.z=a.z;}
        const lat=frente?F:left,d=b.clone().sub(a).normalize();
        // dos ramales del bucle (banda) o de la toalla retorcida, unidos alrededor de la mano y del pie
        const o=new THREE.Vector3().crossVectors(d,lat).normalize().multiplyScalar(q.t==='towel'?.022:.011),P=[];
        for(let k=0;k<=8;k++)P.push(a.clone().lerp(b,k/8).add(o));
        P.push(b.clone().add(d.clone().multiplyScalar(.014)));
        for(let k=8;k>=0;k--)P.push(a.clone().lerp(b,k/8).sub(o));
        P.push(a.clone().sub(d.clone().multiplyScalar(.014)));
        gear.add(tubeAlong(P,q.t==='towel'?.016:.0075,q.t==='towel'?M.towel:M.band,true));}
      if(q.t==='band'){
        // mini banda: anillo plano alrededor de los dos muslos, por encima de las rodillas
        const T=[1,2].map(i=>{const S=side[i];return wp(S+'UpLeg').lerp(wp(S+'Leg'),.8);});
        const td=[1,2].map(i=>{const S=side[i];return wp(S+'Leg').sub(wp(S+'UpLeg')).normalize();});
        const ax=td[0].clone().add(td[1]).normalize();let a=T[1].clone().sub(T[0]);a.sub(ax.clone().multiplyScalar(a.dot(ax)));
        if(a.length()<.02)a=frente?new THREE.Vector3(1,0,0):left.clone();a.normalize();const bq=new THREE.Vector3().crossVectors(ax,a).normalize();
        const r=.09,P=[];
        for(let k=0;k<=14;k++){const ang=-Math.PI/2+Math.PI*k/14;P.push(T[1].clone().add(a.clone().multiplyScalar(r*Math.cos(ang))).add(bq.clone().multiplyScalar(r*Math.sin(ang))));}
        for(let k=0;k<=14;k++){const ang=Math.PI/2+Math.PI*k/14;P.push(T[0].clone().add(a.clone().multiplyScalar(r*Math.cos(ang))).add(bq.clone().multiplyScalar(r*Math.sin(ang))));}
        gear.add(ribbon(P,()=>ax,.045,M.band,true));}
      if(q.t==='strap'){const S=side[q.at[1]],h=grip(S),top=toWorld(R,q.from);top.z=h.z;
        const d=top.clone().sub(h),L=d.length(),m=new THREE.Mesh(new THREE.BoxGeometry(.025,L,.004),M.strap);
        m.position.copy(h.clone().add(d.multiplyScalar(.5)));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),top.clone().sub(h).normalize());gear.add(m);
        const hd=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.13,10),M.strap);hd.position.copy(h);hd.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),frente?F:left);gear.add(hd);}
    });}
  /* Muebles: cada uno se coloca respecto a lo que se apoya en él (mano → hombro, pie → cadera), igual que el brazo o la
     pierna 3D que llega a él; si nada se apoya, respecto a la cadera. Se calcula una vez, en la primera postura. */
  const PX=new Map();
  function propsAt(ex,k){if(PX.has(k))return PX.get(k);
    const R=pose(ex,k,0,true),p=R.gm.p,kk=R.kk,sup=R.sup,out=[];
    (ex.equip||[]).forEach(e=>{if(e.t!=='box')return;const [x,y,w,h]=e.r,wall=h>=90;let ref=null;
      if(!wall)for(const i of ['1','2']){const W=p['w'+i],A=R.gm.feet[i].A;
        if(!ref&&W[1]>sup(W)-4.5&&W[0]>=x-2&&W[0]<=x+w+2)ref=[R.side[i]+'Arm',p.s,R.side[i]+'Hand'];
        if(!ref&&A[1]>sup(A)-6&&A[0]>=x-2&&A[0]<=x+w+2)ref=[R.side[i]+'UpLeg',p.p,R.side[i]+'Foot'];}
      if(!ref)ref=['Hips',p.p];
      // de fondo: centrado en la mano o el pie que se apoya (así no se mete en el otro brazo, por ejemplo la mancuerna del remo)
      const dos=!wall&&ref[2]&&/Hand/.test(ref[2])&&['1','2'].every(i=>{const W=p['w'+i];return W[1]>sup(W)-4.5&&W[0]>=x-2&&W[0]<=x+w+2;});
      const cz=dos?0:ref[2]?wp(ref[2]).z:0,H=(wall?Math.min(h,GD-y):GD-y)*kk,W=w*kk;let cx=wp(ref[0]).x+(x+w/2-ref[1][0])*kk;   // hasta el suelo, como en el dibujo
      // si la silla se mete en la cadera (fondos: las piernas 3D son más largas que las del dibujo), se aparta hacia atrás;
      // las manos van a buscarla donde quede
      if(!wall&&/Hand/.test(ref[2]||'')){let t=0;for(const ph of ex.phases){t+=ph.move;const hp=(pose(ex,k,t,true),wp('Hips'));t+=ph.hold;
        const sg=Math.sign(cx-hp.x)||1;if(H>hp.y-.2&&Math.abs(cx-hp.x)<W/2+.13)cx=hp.x+sg*(W/2+.13);}}
      // pared de frente (ángel): justo detrás de la espalda, para que se pueda apoyar en ella
      let wz=-.3;if(wall&&R.frente){let z=1e9;for(const [o,i] of TRONCO){o.getVertexPosition(i,vtx);o.localToWorld(vtx);if(vtx.z<z)z=vtx.z;}wz=z-.02;}
      // con las dos manos encima (fondos), centrado en el cuerpo y más ancho
      out.push({e,cx,cz:wall?wz:cz,D:dos?.55:ref[2]?.4:.5,H,W,wall,xc:x+w/2});});
    PX.set(k,out);return out;}
  function drawProps(ex,k){props.clear();
    propsAt(ex,k).forEach(({cx,cz,D,H,W,wall})=>{const m=new THREE.Mesh(new THREE.BoxGeometry(W,H,wall?.04:D),M.prop);
      m.position.set(cx,H/2,cz);m.receiveShadow=true;m.castShadow=true;props.add(m);});}

  /* Del dibujo al mundo: escala y desplazamiento ajustados a las articulaciones de esta postura (para flechas y correas) */
  function fitOf(R){const {gm,side}=R,p=gm.p,pairs=[];
    const J={h:['Head'],s:['LeftArm','RightArm'],p:['LeftUpLeg','RightUpLeg'],c:['Spine1']};
    for(const i of ['1','2']){J['e'+i]=[side[i]+'ForeArm'];J['w'+i]=[side[i]+'Hand'];J['k'+i]=[side[i]+'Leg'];}
    for(const j in J){if(!p[j])continue;const w=new THREE.Vector3();J[j].forEach(n=>w.add(wp(n)));w.multiplyScalar(1/J[j].length);pairs.push([p[j],w]);}
    const md=[0,0],mw=new THREE.Vector3();pairs.forEach(([d,w])=>{md[0]+=d[0];md[1]+=d[1];mw.add(w);});md[0]/=pairs.length;md[1]/=pairs.length;mw.multiplyScalar(1/pairs.length);
    let num=0,den=0;pairs.forEach(([d,w])=>{const dx=d[0]-md[0],dy=-(d[1]-md[1]);num+=dx*(w.x-mw.x)+dy*(w.y-mw.y);den+=dx*dx+dy*dy;});
    const s=num/(den||1);R.fit={s,md,mw,J};return R.fit;}
  function toWorld(R,pt){const f=R.fit||fitOf(R);return new THREE.Vector3(f.mw.x+(pt[0]-f.md[0])*f.s,f.mw.y-(pt[1]-f.md[1])*f.s,f.mw.z);}
  function fromWorld(R,w){const f=R.fit;return [f.md[0]+(w.x-f.mw.x)/f.s,f.md[1]-(w.y-f.mw.y)/f.s];}

  /* Encuadre fijo por ejercicio (todas las posturas y la mitad de cada movimiento): la cámara no salta al animar */
  const FR=new Map();
  function frameOf(ex,k,big){const key=k+'|'+(big?1:0);if(FR.has(key))return FR.get(key);
    propsAt(ex,k);const box=new THREE.Box3(),pts=[];let t=0;
    ex.phases.forEach((ph,i)=>{for(const tt of [t+ph.move/2,t+ph.move]){const R=pose(ex,k,tt,true);drawGear(ex,R);
      const b=new THREE.Box3();for(const n in B)if(!/Index|Middle|Ring|Pinky|Thumb|Eye|Hand$/.test(n))b.expandByPoint(wp(n));
      b.expandByScalar(.075);box.union(b);for(const S of ['Left','Right'])box.expandByPoint(grip(S).addScalar(0));
      gear.children.forEach(g=>box.expandByObject(g));
      if(big&&ph.arrow){fitOf(R);box.expandByPoint(toWorld(R,[ph.arrow[0],ph.arrow[1]]));box.expandByPoint(toWorld(R,[ph.arrow[2],ph.arrow[3]]));}}
      t+=ph.move+ph.hold;});
    drawProps(ex,k);props.children.forEach(m=>{const b=new THREE.Box3().setFromObject(m);if(b.max.y<1.5)box.union(b);else{box.max.y=Math.max(box.max.y,0);}});
    box.min.y=0;FR.set(key,box);return box;}
  function place(box,big){
    const b=box.clone().expandByScalar(big?.06:.03);b.min.y=Math.min(b.min.y,0);const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
    const th=Math.tan(THREE.MathUtils.degToRad(12));const dist=Math.max(s.x/(2*th*180/112),s.y/(2*th))*1.02+s.z*.5;
    cam.position.set(c.x,c.y+dist*.1,c.z+dist);cam.lookAt(c.x,c.y,c.z);cam.updateMatrixWorld(true);
    sun.position.set(c.x-1.5,3,c.z+2.5);sun.target.position.set(c.x,0,c.z);sun.target.updateMatrixWorld();
    rim.position.set(c.x+1.2,c.y+1.5,c.z-2.5);rim.target.position.copy(c);rim.target.updateMatrixWorld();}

  let R3=null;
  function renderer(){if(R3)return R3;R3=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    R3.shadowMap.enabled=true;R3.outputColorSpace=THREE.SRGBColorSpace;return R3;}

  /* Igual que Figura.draw: pinta el ejercicio en el lienzo 2D cv, en el instante t */
  function draw(cv,ex,t,clamp,o={}){
    const dpr=Math.min(o.maxDpr||Infinity,window.devicePixelRatio||1),cw=cv.clientWidth||300;   // maxDpr: el reproductor de C1 usa 2
    if(cv.width!==Math.round(cw*dpr)){cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*112/180*dpr);}
    const k=o.key,big=!!o.labels,dk=!!o.dark;
    const box=frameOf(ex,k,big);const R=pose(ex,k,t,clamp);drawProps(ex,k);drawGear(ex,R);place(box,big);
    M.prop.color.set(dk?0x2B3734:0xDDE5E3);lineMat.color.set(dk?0x3A4744:0xC3CFCB);floor.material.opacity=dk?.35:.18;
    hemi.intensity=dk?1.35:1.6;rim.intensity=dk?2.6:0;M.db.color.set(dk?0x8E9C99:COL.db);
    const r=renderer();if(r.getSize(new THREE.Vector2()).x!==cv.width){r.setPixelRatio(1);r.setSize(cv.width,cv.height,false);}
    r.render(scene,cam);
    const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(r.domElement,0,0,cv.width,cv.height);
    if(big){fitOf(R);
      // las etiquetas usan los puntos del cuerpo 3D (vueltos a unidades del dibujo), así quedan pegadas a él
      const gm={...R.gm,p:{...R.gm.p},hands:{...R.gm.hands},feet:{...R.gm.feet},root:{...R.gm.root}};
      for(const j in R.fit.J){if(!gm.p[j])continue;const w=new THREE.Vector3();R.fit.J[j].forEach(n=>w.add(wp(n)));gm.p[j]=fromWorld(R,w.multiplyScalar(1/R.fit.J[j].length));}
      for(const i of ['1','2']){const S=R.side[i];gm.hands[i]={...gm.hands[i],W:fromWorld(R,grip(S))};gm.feet[i]={...gm.feet[i],A:fromWorld(R,wp(S+'Foot'))};
        gm.root['p'+i]=fromWorld(R,wp(S+'UpLeg'));gm.p['k'+i]=fromWorld(R,wp(S+'Leg'));}
      const toScreen=pt=>{const w=toWorld(R,pt).project(cam);return [(w.x+1)/2*180,(1-w.y)/2*112];};
      Figura.labels(cv,ex,R.st,gm,o.pt??t,o,toScreen);}
    return R.st;
  }
  return {draw,pose,scene,camera:cam,bones:B,root,props:propsAt};   // root y props: para el comprobador 3D (ejercicios/)
}
window.Figura3D={crear};
