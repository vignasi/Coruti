// Rutina core · prototipo navegable (D2). Sin dependencias. Los datos de ejercicios vienen de datos.js.
// Todo lo que sale aquí (personas, pesos, fechas, sesiones) son ejemplos.

/* ---------- Iconos (trazo 2, 24×24) ---------- */
const I = {
  entrenar: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  ejercicios: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  historial: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h3M8 17h6"/>',
  tu: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  atras: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pausa: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/>',
  saltar: '<path d="M5 5l10 7-10 7z" fill="currentColor"/><path d="M18 5v14"/>',
  parar: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
  estrella: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  estrellaLlena: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  racha: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 2.5 0-3 .5-5.5 1-8z"/>',
  corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  chispa: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  objetivo: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  subir: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  bajar: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  aviso: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  reintentar: '<path d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5"/>',
  doble: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  reloj2: '<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2.5l1.5 1"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  banda: '<ellipse cx="12" cy="12" rx="8" ry="4.5"/><ellipse cx="12" cy="12" rx="5" ry="2"/>',
  sonido: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  figura: '<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M8 10.5l4-1.5 4 1.5M9 21l3-7 3 7"/>',
  widget: '<rect x="4" y="4" width="16" height="9" rx="2"/><rect x="4" y="15" width="7" height="5" rx="1.5"/><rect x="13" y="15" width="7" height="5" rx="1.5"/>',
  nube: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z"/>',
  conexion: '<path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5"/>',
  peso: '<path d="M6 7h12l2 13H4z"/><circle cx="12" cy="7" r="2.5"/><path d="M12 11v3"/>',
  personas: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c1-3.5 3.3-5 6-5s5 1.5 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.5 0 4.2 1.3 5 4"/>',
  calendario: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  rodillo: '<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M8 9v6M13 9v6"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  mancuerna: '<path d="M6 8v8M9 6v12M15 6v12M18 8v8M9 12h6"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  salir: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  mapa: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  correr: '<circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v5M6 11l3-3h4l2 4 3 1"/>',
  descanso: '<path d="M18 15A7 7 0 0 1 9 6a7 7 0 1 0 9 9z"/>',
  luna: '<path d="M18 15A7 7 0 0 1 9 6a7 7 0 1 0 9 9z"/>',
};
const ico = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Datos de ejemplo ---------- */
const MATERIAL = { '': 'Sin material', gomas: 'Bandas grandes', banda: 'Mini banda', rodillo: 'Rodillo', mancuernas: 'Mancuernas' };
const ZONAS = ['Core', 'Glúteo', 'Espalda', 'Pecho', 'Brazos', 'Movilidad', 'Calentar y recuperar'];
// El rodillo aún no está en rutina.json: dos ejemplos para dejar sitio a la zona.
EJ.push(
  { id: 'rod_espalda', name: 'Rodillo en la espalda alta', zone: 'Calentar y recuperar', needs: 'rodillo', secs: 60, info: '60 s · rueda despacio entre los omóplatos', cues: ['Manos detrás de la cabeza, codos juntos', 'Culo en el suelo; solo sube el pecho', 'Para 2 respiraciones donde notes un punto duro'] },
  { id: 'rod_gemelo', name: 'Rodillo en los gemelos', zone: 'Calentar y recuperar', needs: 'rodillo', secs: 45, sides: true, info: '45 s cada pierna', cues: ['Una pierna encima de la otra para cargar más', 'Gira el pie hacia dentro y hacia fuera'] },
);
const ej = id => EJ.find(e => e.id === id) || EJ[0];
const dosis = e => e.reps ? `${e.reps} reps${e.sides ? ' por lado' : ''}` : `${e.secs} s${e.sides ? ' por lado' : ''}`;

const BANDAS = [
  { n: 'Verde', d: 'Suave', c: '#3E8E5B' }, { n: 'Roja', d: 'Media', c: '#C0392B' }, { n: 'Negra', d: 'Dura', c: '#1D1D1D' },
];
const SESION_HOY = {
  titulo: 'Fuerza de tren superior', origen: 'claude', cambio: 'Cambiada por Claude hoy a las 8:12',
  rondas: 3, descanso: 60,
  ej: [
    { id: 'remo_incl_banda', reps: 12, banda: 'Roja' },
    { id: 'press_goma', reps: 12, banda: 'Negra' },
    { id: 'curl_goma', reps: 12, banda: 'Verde' },
    { id: 'flex', reps: 10 },
    { id: 'plancha', secs: 30 },
    { id: 'deadbug', reps: 16 },
  ],
  claves: { remo_incl_banda: 'Codos pegados al cuerpo, hasta el ombligo', press_goma: 'Banda por la espalda, bajo las axilas', curl_goma: 'Codos quietos a los lados', flex: 'Manos debajo de los hombros', plancha: 'Culo apretado, coxis hacia abajo', deadbug: 'Lumbar pegada al suelo' },
  nota: 'Hoy subo 2 reps el remo: el lunes lo marcaste como «fácil». Plancha y dead bug para cerrar.',
};
const SEMANA = [
  { d: 'L', n: 'Lun 9', tipo: 'Fuerza de cuerpo entero', o: 'claude', est: 'hecho' },
  { d: 'M', n: 'Mar 10', tipo: 'Carrera suave · 8 km', o: 'claude', est: 'hecho', carrera: true },
  { d: 'X', n: 'Mié 11', tipo: 'Remo + curl con banda', o: 'tu', est: 'hecho' },
  { d: 'J', n: 'Jue 12', tipo: 'Fuerza de tren superior', o: 'claude', est: 'hoy' },
  { d: 'V', n: 'Vie 13', tipo: 'Core y rodillo', o: 'claude', est: 'luego' },
  { d: 'S', n: 'Sáb 14', tipo: 'Carrera larga · 14 km', o: 'claude', est: 'luego', carrera: true },
  { d: 'D', n: 'Dom 15', tipo: 'Descanso', o: 'claude', est: 'descanso' },
];
const ORIGEN = { claude: ['chispa', 'Plan de Claude'], plan: ['objetivo', 'Plan por objetivo'], tu: ['lapiz', 'Hecha por ti'], fav: ['estrella', 'Favorita'] };
let FAVORITAS = [
  { id: 'f1', t: 'Remo + curl con banda', m: '4 rondas · alternados · 18 min', widget: true },
  { id: 'core', t: 'Rutina de core', m: 'Hoy toca el día B · 24 min' },
  { id: 'f3', t: 'Glúteo con mini banda', m: '3 rondas · 12 min' },
];
const HISTORIAL = [
  { dia: 'Miércoles 11 nov', s: [{ t: 'Remo + curl con banda', m: '18 min · 8 series', pulso: 118, strava: 'subida', id: 'h1' }] },
  { dia: 'Martes 10 nov', s: [{ t: 'Carrera · 8,2 km', m: '46 min · traída de Strava', pulso: 142, strava: 'de-strava', carrera: true, id: 'h2' }] },
  { dia: 'Lunes 9 nov', s: [{ t: 'Fuerza de cuerpo entero', m: '41 min · 18 series', pulso: 121, strava: 'pendiente', id: 'h3' }] },
  { dia: 'Domingo 8 nov', s: [{ t: 'Rutina de core · día A', m: '11 min · 5 de 9 series', incompleta: true, strava: 'error', id: 'h4' }] },
  { dia: 'Sábado 7 nov', s: [{ t: 'Glúteo con mini banda', m: '12 min · 6 series', pulso: 109, strava: 'duplicado', id: 'h5' }] },
];
const STRAVA = {
  subida: ['bien', 'check', 'En Strava'], pendiente: ['aviso', 'reloj', 'Pendiente'], error: ['error', 'aviso', 'No se pudo subir'],
  duplicado: ['aviso', 'doble', 'Ya estaba en Strava'], 'de-strava': ['neutro', 'bajar', 'De Strava'], no: ['neutro', 'nube', 'Sin enviar'],
};
const PESO = [79.6, 79.4, 79.5, 79.1, 78.9, 79.0, 78.6, 78.4];
const PERSONAS = [{ n: 'Àlex', i: 'À', yo: true }, { n: 'Marta', i: 'M' }];

/* ---------- Estado del prototipo ---------- */
const S = {
  ex: 'remo_incl_banda', zona: null, mat: null, elegir: ['remo_incl_banda', 'curl_goma'],
  nueva: { rondas: 4, desc: 75, alternar: true, rodAntes: false, rodDespues: true, reps: { remo_incl_banda: 12, curl_goma: 12 } },
  core: { dia: 'B', rondas: 2, mod: { abdomen: [false, 'Normal'], pecho: [false, 'Normal'], espalda: [true, 'Normal'], brazos: [true, 'Suave'], gluteo: [true, 'Fuerte'] } },
  obj: { meta: 'Fuerza', semanas: 6, dias: ['L', 'X', 'V'] },
  fig: { sexo: 'hombre' }, figPrev: 'puente', look: { complexion: 0, musculo: 0, piel: '', pelo: '', top: '' }, widget: 'fav',
  mat2: { gomas: true, banda: true, rodillo: true, mancuernas: false },
  sonido: { tonos: true, voz: true, mitad: true, bajar: false },
  pulsoOn: true, conectado: { claude: true, strava: true, polar: false }, cuenta: true, enviado: false,
  final: { mods: {}, esfuerzo: 7, sentir: 'Bien', strava: true },
  hoja: null, toast: null,
};

/* ---------- Piezas ---------- */
const cab = (titulo, atras) => `<header class="cabecera"><button class="icono-btn" data-go="${atras}" aria-label="Atrás">${ico('atras')}</button><h1>${titulo}</h1></header>`;
const origen = o => `<span class="origen">${ico(ORIGEN[o][0])}${ORIGEN[o][1]}</span>`;
/* Figura 3D real (D1): figura-proto.js dibuja en el lienzo. modo: mini (quieta, postura clave), grande (en bucle, con etiquetas),
   libre (reproductor, a toda pantalla), sig (siguiente ejercicio, sin etiquetas). g fuerza hombre (m) o mujer (f). */
const fig = (e, modo = 'mini', g = '') => `<div class="fig fig-${modo}" role="img" aria-label="${modo === 'mini' ? 'Figura' : 'Movimiento'} de ${esc(e.name)}"><canvas data-fig="${e.id}" data-modo="${modo}" ${g ? `data-g="${g}"` : ''} width="180" height="112"></canvas><span class="fig-txt">Cargando la figura…</span><span class="fig-falta">${esc(e.name)}<br>(figura pendiente: no está en rutina.json)</span></div>`;
window.FIG_GENERO = () => (S.fig.sexo === 'mujer' ? 'f' : 'm');
const paso = (id, val, uni = '', etiqueta = '') => `<div class="paso" role="group" aria-label="${etiqueta}"><button data-act="menos" data-k="${id}" aria-label="Menos">${ico('menos')}</button><output aria-live="polite">${val}${uni}</output><button data-act="mas" data-k="${id}" aria-label="Más">${ico('mas')}</button></div>`;
const inter = (id, on, etiqueta) => `<input type="checkbox" role="switch" class="interruptor" id="${id}" data-act="sw" data-k="${id}" ${on ? 'checked' : ''} aria-label="${etiqueta}">`;
const seg = (k, ops, val, etiqueta) => `<div class="segmentos" role="group" aria-label="${etiqueta}">${ops.map(o => `<button data-act="seg" data-k="${k}" data-v="${o}" aria-pressed="${o === val}">${o}</button>`).join('')}</div>`;
const item = (o) => `<button class="item" ${o.go ? `data-go="${o.go}"` : ''} ${o.act ? `data-act="${o.act}"` : ''}>${o.icono ? `<span class="item-icono">${ico(o.icono)}</span>` : ''}<span class="crece"><span class="nombre">${o.t}</span>${o.m ? `<span class="meta">${o.m}</span>` : ''}</span>${o.der || ico('chev', 'chev')}</button>`;
const estado = k => { const [c, i, t] = STRAVA[k]; return `<span class="estado ${c}">${ico(i)}${t}</span>`; };
const minutos = s => { const tot = s.ej.reduce((a, x) => a + (x.secs || x.reps * 3) + 20, 0) * s.rondas + s.descanso * (s.rondas - 1); return Math.round(tot / 60); };

/* ---------- Pantallas ---------- */
const P = {};

P.mapa = { proto: true, render: () => `
  <div class="pantalla">
    <div class="pila"><h1 class="titulo-pantalla">Rutina core · prototipo</h1>
    <p class="meta">Todas las pantallas del diseño nuevo, también las que se construyen más tarde. Los datos son de ejemplo. La figura es la 3D de D1 (hombre o mujer, en Tú → Figura). La primera vez tarda unos segundos en cargar.</p></div>
    ${[
      ['Entrenar', [['entrenar', 'Hoy, semana y favoritas'], ['vacio', 'Primer día, sin plan ni favoritas'], ['semana', 'Plan de la semana'], ['sesion', 'Sesión creada por Claude'], ['core', 'Rutina de core'], ['nueva', 'Sesión nueva de ejercicios sueltos'], ['elegir', 'Elegir ejercicios'], ['objetivo', 'Plan por objetivo']]],
      ['Durante y después', [['reproductor', 'Reproductor a pantalla completa'], ['final', 'Final de sesión']]],
      ['Ejercicios', [['ejercicios', 'Cuadrícula con filtros'], ['ficha', 'Ficha de un ejercicio']]],
      ['Historial', [['historial', 'Sesiones por días, Strava y pulso'], ['historial-vacio', 'Sin sesiones todavía'], ['detalle', 'Detalle de una sesión'], ['marcas', 'Por ejercicio: última y mejor']]],
      ['Tú', [['tu', 'Perfil y ajustes'], ['entrar', 'Entrar con email'], ['peso', 'Peso y medidas'], ['material', 'Material'], ['bandas', 'Mis bandas'], ['sonido', 'Sonido y voz'], ['figura', 'Hombre o mujer'], ['personalizar', 'Más adelante'], ['widget-conf', 'Qué hace el widget'], ['copia', 'Copia de seguridad']]],
      ['Conexiones', [['conexiones', 'Claude, Strava y Polar'], ['claude', 'Conectar Claude'], ['strava', 'Strava'], ['polar', 'Polar y pulso'], ['pulso', 'Probar pulso']]],
      ['Fuera de la app', [['widgets', 'Widget grande y pequeño'], ['widget-fondo', 'Fondo: dos opciones con las imágenes reales']]],
      ['Referencia', [['sistema', 'Sistema de diseño']]],
    ].map(([g, l]) => `<section class="mapa-grupo"><h2 class="etiqueta">${g}</h2><div class="lista">${l.map(([id, t]) => item({ t: P[id].titulo || t, m: P[id].titulo ? t : '', go: id })).join('')}</div></section>`).join('')}
  </div>` };

P.entrenar = { tab: 'entrenar', render: () => `
  <div class="pantalla">
    <div class="fila-titulo"><h1 class="titulo-pantalla">Jueves 12</h1><span class="origen meta">${ico('racha')}Racha: 6 días</span></div>
    <section class="hoy" aria-labelledby="hoy-t">
      <div class="fila-titulo"><span class="etiqueta">Hoy</span>${origen('claude')}</div>
      <h2 id="hoy-t">${SESION_HOY.titulo}</h2>
      <p class="meta">${SESION_HOY.ej.length} ejercicios · ${SESION_HOY.rondas} rondas · ${minutos(SESION_HOY)} min</p>
      <div class="fila"><button class="btn btn-grande crece" data-go="reproductor">${ico('play')}Empezar</button></div>
      <button class="btn btn-texto hoy-ver" data-go="sesion">Ver la sesión ${ico('chev')}</button>
    </section>
    <section class="seccion" aria-labelledby="sem-t">
      <div class="fila-titulo"><h2 id="sem-t">Esta semana</h2><button class="btn btn-texto" data-go="semana">Ver plan</button></div>
      <div class="semana">${SEMANA.map(d => `<button class="dia ${d.est === 'hecho' ? 'hecho' : ''} ${d.est === 'hoy' ? 'hoy-d' : ''} ${d.est === 'descanso' ? 'descanso' : ''}" data-go="semana" aria-label="${d.n}: ${d.tipo}${d.est === 'hecho' ? ', hecho' : ''}${d.est === 'hoy' ? ', hoy' : ''}"><span class="letra">${d.d}</span><span class="marca">${d.est === 'hecho' ? ico('check') : d.carrera ? ico('correr') : ''}</span></button>`).join('')}</div>
    </section>
    <section class="seccion" aria-labelledby="fav-t">
      <h2 id="fav-t">Favoritas</h2>
      <div class="lista">${FAVORITAS.map(f => `<div class="item" style="cursor:default"><button class="icono-btn ${f.widget ? 'activo' : ''}" data-act="widgetfav" data-id="${f.id}" aria-pressed="${!!f.widget}" aria-label="${f.widget ? 'En el widget' : 'Poner en el widget'}">${ico(f.widget ? 'estrellaLlena' : 'estrella')}</button><button class="crece" style="border:0;background:none;text-align:left;cursor:pointer;padding:0" data-go="${f.id === 'core' ? 'core' : 'nueva'}"><span class="nombre">${f.t}</span><span class="meta">${f.m}${f.widget ? ' · en el widget' : ''}</span></button><button class="icono-btn activo" data-go="reproductor" aria-label="Empezar ${f.t}">${ico('play')}</button></div>`).join('')}</div>
    </section>
    <section class="seccion">
      <h2 class="h2">Otra sesión</h2>
      <div class="lista">
        ${item({ t: 'Sesión nueva', m: 'Elige ejercicios, repeticiones y rondas', go: 'nueva', icono: 'mas' })}
        ${item({ t: 'Rutina de core', m: 'Base de core y módulos de fuerza', go: 'core', icono: 'entrenar' })}
        ${item({ t: 'Plan por objetivo', m: 'Para entrenar sin Claude', go: 'objetivo', icono: 'objetivo' })}
      </div>
    </section>
  </div>` };

P.vacio = { tab: 'entrenar', titulo: 'Entrenar el primer día', render: () => `
  <div class="pantalla">
    <h1 class="titulo-pantalla">Jueves 12</h1>
    <section class="tarjeta"><span class="etiqueta">Hoy</span><h2 class="h2">Aún no tienes plan</h2><p>Empieza con la rutina de core o arma una sesión con tus ejercicios. Si quieres un plan para varias semanas, créalo por objetivo o conecta Claude.</p>
      <button class="btn btn-principal btn-grande" data-go="core">${ico('play')}Rutina de core · 14 min</button>
      <button class="btn btn-secundario" data-go="nueva">${ico('mas')}Sesión nueva</button></section>
    <div class="lista">${item({ t: 'Plan por objetivo', m: 'Fuerza, músculo, cardio o movilidad', go: 'objetivo', icono: 'objetivo' })}${item({ t: 'Conectar Claude', m: 'Te crea las sesiones y el plan de la semana', go: 'claude', icono: 'chispa' })}</div>
    <section class="seccion"><h2>Favoritas</h2><p class="meta">Cuando guardes una sesión como favorita, sale aquí y la empiezas con un toque.</p></section>
  </div>` };
P['historial-vacio'] = { tab: 'historial', titulo: 'Historial vacío', render: () => `
  <div class="pantalla"><h1 class="titulo-pantalla">Historial</h1>
    <div class="tarjeta"><h2 class="h2">Aquí saldrán tus sesiones</h2><p>Cada sesión que termines, desde la app o el widget, se guarda con sus series, kilos, bandas y pulso.</p><button class="btn btn-secundario" data-go="copia">${ico('subir')}Importar una copia</button></div>
  </div>` };
P.semana = { titulo: 'Plan de la semana', render: () => `${cab('Plan de la semana', 'entrenar')}
  <div class="pantalla">
    <div class="pila"><p class="meta">9 – 15 de noviembre</p>${origen('claude')}<p class="meta">Claude lo cambió hoy a las 8:12. Puedes cambiar cualquier día.</p></div>
    <div class="lista">${SEMANA.map(d => `<button class="item" ${d.est === 'hoy' ? 'data-go="sesion"' : d.est === 'hecho' && !d.carrera ? 'data-act="det" data-id="h3"' : `data-act="dia" data-v="${d.n}"`}>
      <span class="item-icono" style="${d.est === 'hecho' ? 'background:var(--accion);color:var(--sobre-accion)' : ''}">${d.est === 'hecho' ? ico('check') : d.carrera ? ico('correr') : d.est === 'descanso' ? ico('luna') : ico('entrenar')}</span>
      <span class="crece"><span class="meta">${d.n}${d.est === 'hoy' ? ' · <strong style="color:var(--accion)">hoy</strong>' : ''}</span><span class="nombre">${d.tipo}</span><span class="meta">${d.est === 'hecho' ? 'Hecho' : d.carrera ? 'Con el reloj; llega desde Strava' : d.est === 'descanso' ? 'Descanso' : ORIGEN[d.o][1]}</span></span>${ico('chev', 'chev')}</button>`).join('')}</div>
    <button class="btn btn-secundario" data-go="objetivo">${ico('objetivo')}Cambiar a un plan por objetivo</button>
  </div>` };

P.sesion = { titulo: 'Fuerza de tren superior', render: () => `${cab('Sesión de hoy', 'entrenar')}
  <div class="pantalla">
    <div class="pila"><h1 class="titulo-pantalla">${SESION_HOY.titulo}</h1>${origen('claude')}<p class="meta">${SESION_HOY.cambio}</p></div>
    <div class="tarjeta"><span class="etiqueta">Nota de Claude</span><p>${SESION_HOY.nota}</p></div>
    <div class="fila envuelve meta"><span>${SESION_HOY.rondas} rondas</span>·<span>${SESION_HOY.descanso} s de descanso</span>·<span>${minutos(SESION_HOY)} min</span></div>
    <div class="lista">${SESION_HOY.ej.map(x => { const e = ej(x.id); return `<button class="item" data-act="ficha" data-id="${e.id}"><span style="width:88px;flex:none">${fig(e)}</span><span class="crece"><span class="nombre">${e.name}</span><span class="meta">${x.reps ? x.reps + ' reps' : x.secs + ' s'}${x.banda ? ' · banda ' + x.banda.toLowerCase() : ''}</span></span>${ico('chev', 'chev')}</button>`; }).join('')}</div>
    <button class="btn btn-principal btn-grande" data-go="reproductor">${ico('play')}Empezar</button>
    <button class="btn btn-texto" data-act="toast" data-msg="Guardada en favoritas">${ico('estrella')}Guardar como favorita</button>
  </div>` };

const MODS = [['abdomen', 'Abdomen', 'A'], ['pecho', 'Pecho', 'A'], ['espalda', 'Espalda', 'B'], ['brazos', 'Brazos', 'B'], ['gluteo', 'Glúteo', 'B']];
P.core = { titulo: 'Rutina de core', render: () => {
  const c = S.core; const n = MODS.filter(m => c.mod[m[0]][0]).length; const min = 9 + n * 5 * c.rondas;
  return `${cab('Rutina de core', 'entrenar')}
  <div class="pantalla">
    <div class="pila"><p class="meta">Siempre incluye psoas, puente, dead bug, plancha y gato-camello.</p></div>
    <div class="seccion"><h2>Día</h2>${seg('core.dia', ['A', 'B'], c.dia, 'Día')}<p class="meta">Hoy toca el B. Se alterna solo cada vez que la terminas.</p></div>
    <div class="seccion"><h2>Módulos de fuerza</h2>
      <div class="lista">${MODS.map(([k, t, d]) => `<div style="padding:var(--e3) var(--e4);display:flex;flex-direction:column;gap:var(--e2)"><label class="fila" for="mod-${k}"><span class="crece"><span class="nombre" style="font-weight:700">${t}</span> <span class="meta">· día ${d}</span></span>${inter('mod-' + k, c.mod[k][0], t)}</label>${c.mod[k][0] ? seg('nivel.' + k, ['Suave', 'Normal', 'Fuerte'], c.mod[k][1], 'Nivel de ' + t) : ''}</div>`).join('')}</div>
    </div>
    <div class="fila"><span class="crece"><span class="h2">Rondas</span></span>${paso('core.rondas', c.rondas, '', 'Rondas')}</div>
    <button class="btn btn-principal btn-grande" data-go="reproductor">${ico('play')}Empezar · ${min} min</button>
    <button class="btn btn-texto" data-act="toast" data-msg="La rutina de core está en favoritas">${ico('estrella')}Guardar como favorita</button>
  </div>`; } };

P.nueva = { titulo: 'Sesión nueva', render: () => {
  const n = S.nueva; const lista = S.elegir.map(ej);
  const min = Math.round((lista.reduce((a, e) => a + (e.secs || (n.reps[e.id] || e.reps) * 3), 0) * n.rondas + n.desc * (n.rondas - 1) + (n.rodAntes ? 180 : 0) + (n.rodDespues ? 180 : 0)) / 60);
  return `${cab('Sesión nueva', 'entrenar')}
  <div class="pantalla">
    <div class="seccion"><div class="fila-titulo"><h2>Ejercicios</h2><span class="meta">${lista.length}</span></div>
      <div class="lista">${lista.map(e => `<div class="item" style="cursor:default"><span class="crece"><span class="nombre">${e.name}</span><span class="meta">${e.reps ? 'repeticiones' : 'segundos'}${e.sides ? ' por lado' : ''}</span></span>${paso('reps.' + e.id, e.reps ? (n.reps[e.id] || e.reps) : e.secs, e.reps ? '' : ' s', 'Repeticiones de ' + e.name)}</div>`).join('')}</div>
      <button class="btn btn-secundario" data-go="elegir">${ico('mas')}Añadir ejercicios</button>
    </div>
    <div class="lista">
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Rondas</span></span>${paso('n.rondas', n.rondas, '', 'Rondas')}</div>
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Descanso</span></span>${paso('n.desc', n.desc, ' s', 'Descanso')}</div>
      <label class="item" for="alt"><span class="crece"><span class="nombre">Alternados</span><span class="meta">${lista.length > 1 ? 'A, B, descanso' : 'Con uno solo, series normales'}</span></span>${inter('alt', n.alternar && lista.length > 1, 'Alternados')}</label>
      <label class="item" for="rodA"><span class="crece"><span class="nombre">Rodillo antes</span><span class="meta">3 min para calentar</span></span>${inter('rodA', n.rodAntes, 'Rodillo antes')}</label>
      <label class="item" for="rodD"><span class="crece"><span class="nombre">Rodillo después</span><span class="meta">3 min para recuperar</span></span>${inter('rodD', n.rodDespues, 'Rodillo después')}</label>
    </div>
    <button class="btn btn-principal btn-grande" data-go="reproductor">${ico('play')}Empezar · ${min} min</button>
    <button class="btn btn-texto" data-act="toast" data-msg="Guardada en favoritas">${ico('estrella')}Guardar como favorita</button>
  </div>`; } };

const filtros = () => `
  <div class="chips" role="group" aria-label="Zona">${ZONAS.map(z => `<button class="chip" data-act="zona" data-v="${z}" aria-pressed="${S.zona === z}">${z}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Material">${Object.entries(MATERIAL).map(([k, v]) => `<button class="chip" data-act="mat" data-v="${k}" aria-pressed="${S.mat === k}">${v}</button>`).join('')}</div>`;
const filtrar = () => EJ.filter(e => (!S.zona || e.zone === S.zona) && (S.mat === null || e.needs === S.mat));

P.ejercicios = { tab: 'ejercicios', render: () => { const l = filtrar(); return `
  <div class="pantalla">
    <h1 class="titulo-pantalla">Ejercicios</h1>
    <div class="pila">${filtros()}</div>
    <p class="meta" aria-live="polite">${l.length} ejercicios</p>
    <div class="rejilla">${l.map(e => `<button class="miniatura" data-act="ficha" data-id="${e.id}">${fig(e)}<span class="nombre">${e.name}</span><span class="meta">${dosis(e)}</span></button>`).join('') || '<p class="meta">Ninguno con estos filtros. Quita alguno.</p>'}</div>
  </div>`; } };

P.elegir = { titulo: 'Elegir ejercicios', render: () => { const l = filtrar(); return `${cab('Elegir ejercicios', 'nueva')}
  <div class="pantalla">
    <div class="pila">${filtros()}</div>
    <div class="rejilla">${l.map(e => { const on = S.elegir.includes(e.id); return `<button class="miniatura" data-act="elegir" data-id="${e.id}" aria-pressed="${on}">${fig(e)}<span class="check">${on ? ico('check') : ''}</span><span class="nombre">${e.name}</span><span class="meta">${MATERIAL[e.needs]}</span></button>`; }).join('')}</div>
  </div>
  <div style="padding:var(--e3) var(--e4);border-top:1px solid var(--linea);background:var(--capa)"><button class="btn btn-principal btn-grande" data-go="nueva">Añadir ${S.elegir.length} a la sesión</button></div>`; } };

P.ficha = { titulo: 'Ficha de un ejercicio', render: () => { const e = ej(S.ex); return `${cab(e.name, 'ejercicios')}
  <div class="pantalla">
    ${fig(e, 'grande')}
    <div class="fila envuelve"><span class="estado neutro">${e.zone}</span><span class="estado neutro">${MATERIAL[e.needs]}</span></div>
    <div class="pila"><span class="etiqueta">Dosis orientativa</span><p class="h2">${e.info || dosis(e)}</p></div>
    <section class="seccion"><h2>Claves</h2><ol class="pila" style="margin:0;padding-left:1.4em">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol></section>
    <section class="seccion"><h2>Tus marcas</h2>
      <div class="lista"><div class="item" style="cursor:default"><span class="crece"><span class="meta">Última vez · 11 nov</span><span class="nombre">${e.reps ? e.reps + ' reps' : e.secs + ' s'}${e.needs === 'gomas' ? ' · banda roja' : ''}</span></span></div>
      <div class="item" style="cursor:default"><span class="crece"><span class="meta">Mejor · 28 oct</span><span class="nombre">${e.reps ? e.reps + 3 + ' reps' : e.secs + 15 + ' s'}${e.needs === 'gomas' ? ' · banda negra' : ''}</span></span></div></div>
    </section>
    <a class="btn btn-texto" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.vid || e.name)}" target="_blank" rel="noopener">${ico('externo')}Ver vídeos en YouTube</a>
    <button class="btn btn-principal btn-grande" data-act="anadir" data-id="${e.id}">${ico('mas')}Añadir a una sesión</button>
  </div>`; } };

/* Reproductor
   La figura ocupa la pantalla; abajo, donde no se pisa: clave, nombre, cantidad, siguiente y rayas de progreso.
   Ejercicios de repeticiones: no pasan solos. Se marca el ritmo como guía y, al acabar, tocas la pantalla.
   Ejercicios de segundos y descansos: cuenta atrás y pasan solos (tocar adelanta).
   Tocar la pantalla = siguiente · deslizar a la derecha = anterior · botón de pausa = seguir, anterior o parar. */
const rLista = SESION_HOY.ej;
const PASOS = [];
for (let r = 1; r <= SESION_HOY.rondas; r++) {
  rLista.forEach((x, k) => PASOS.push({ tipo: 'ej', r, k }));
  if (r < SESION_HOY.rondas) PASOS.push({ tipo: 'desc', r });
}
const R = { pos: 0, fase: 'serie', t: 0, pausa: false, swipe: null, ignorarClic: false, visto: false };
function rEmpezar(pos) {
  R.pos = lim(pos, 0, PASOS.length - 1); const p = PASOS[R.pos];
  if (p.tipo === 'desc') { R.fase = 'descanso'; R.t = SESION_HOY.descanso; }
  else if (rLista[p.k].secs) { R.fase = 'prepara'; R.t = 5; }
  else { R.fase = 'serie'; R.t = 0; }
}
function rReiniciar() { R.pausa = false; R.visto = false; rEmpezar(0); }
function rTick() {
  if (R.pausa || S.hoja || location.hash.slice(1) !== 'reproductor') return;
  const x = PASOS[R.pos].tipo === 'ej' ? rLista[PASOS[R.pos].k] : null;
  if (R.fase === 'serie' && x && x.reps) { R.t++; return pintar(false); } // repeticiones: cuenta hacia arriba y espera al toque
  R.t--;
  if (R.t > 0) return pintar(false);
  if (R.fase === 'prepara') { R.fase = 'serie'; R.t = x.secs; return pintar(false); }
  rSiguiente();
}
function rSiguiente() { R.visto = true; if (R.pos >= PASOS.length - 1) { location.hash = 'final'; return; } rEmpezar(R.pos + 1); pintar(false); }
function rAnterior() { if (R.pos === 0) return; let p = R.pos - 1; rEmpezar(p); pintar(false); }
const mm = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function rayas() {
  const grupos = [];
  PASOS.forEach((p, i) => { if (!grupos[p.r - 1]) grupos[p.r - 1] = []; grupos[p.r - 1].push({ ...p, i }); });
  return `<div class="rayas" aria-hidden="true">${grupos.map(g => `<span class="grupo" style="--n:${g.length}">${g.map(p => `<i class="${p.i < R.pos ? 'hecho' : p.i === R.pos ? 'ahora' : ''} ${p.tipo === 'desc' ? 'desc' : ''}"></i>`).join('')}</span>`).join('')}</div>`;
}
P.reproductor = { sinPestanas: true, titulo: 'Reproductor', render: () => {
  const p = PASOS[R.pos], ronda = p.r, desc = p.tipo === 'desc';
  const sigPaso = PASOS[R.pos + 1], sig = sigPaso ? (sigPaso.tipo === 'desc' ? null : ej(rLista[sigPaso.k].id)) : null;
  const x = desc ? rLista[0] : rLista[p.k], e = ej(desc ? PASOS[R.pos + 1] && rLista[PASOS[R.pos + 1].k].id : x.id);
  const guia = x.reps && !desc ? Math.min(x.reps, Math.floor(R.t / 3) + 1) : 0;
  const pos = `Ronda ${ronda} de ${SESION_HOY.rondas}${desc ? '' : ` · ejercicio ${p.k + 1} de ${rLista.length}`}`;
  const pulso = S.pulsoOn ? (S.sinSenal ? `<button class="pulso apagado" data-act="pulsopill">${ico('corazon')}Sin señal</button>` : `<button class="pulso" data-act="pulsopill" aria-label="Pulso 128, zona 3">${ico('corazon')}128 <span class="zona">Z3</span></button>`) : '';
  let cantidad, abajo;
  if (desc) { cantidad = `<span class="repro-cantidad acc">${mm(R.t)}</span>`; abajo = `<span class="repro-reloj">Toca para seguir ya</span>`; }
  else if (R.fase === 'prepara') { cantidad = `<span class="repro-cantidad acc">${R.t}</span>`; abajo = `<span class="repro-reloj">Prepárate · ${x.secs} s</span>`; }
  else if (x.reps) { cantidad = `<span class="repro-cantidad">${x.reps}<small>reps</small></span>`; abajo = `<span class="repro-reloj">${guia < x.reps ? `Ritmo ${guia} de ${x.reps}` : 'Toca al acabar'} · ${mm(R.t)}</span>`; }
  else { cantidad = `<span class="repro-cantidad">${mm(R.t)}</span>`; abajo = `<span class="repro-reloj">de ${mm(x.secs)}${x.sides ? ' por lado' : ''}</span>`; }
  return `<div class="repro ${R.fase}" data-act="tap">
    <button class="oculto-visual" data-act="tap">${desc ? 'Terminar el descanso' : 'Hecho: pasar al siguiente'}</button>
    <div class="repro-figura">
      ${desc ? fig(e, 'sig').replace('class="fig fig-sig"', 'class="fig fig-sig libre pequena"') : fig(e, 'libre').replace('class="fig fig-libre"', 'class="fig fig-libre libre"')}
      <div class="repro-arriba"><button class="icono-btn redondo" data-act="pausa" aria-label="Pausa">${ico('pausa')}</button><span class="repro-pos">${pos}</span>${pulso}</div>
    </div>
    <div class="repro-info">
      ${desc ? `<span class="aviso-fase" aria-live="assertive">Descanso</span>` : `<p class="repro-clave">${esc(SESION_HOY.claves[x.id] || e.cues[0] || '')}</p>`}
      <div class="repro-linea"><h1 class="repro-nombre">${desc ? 'Respira' : e.name}</h1>${cantidad}</div>
      <div class="repro-linea">${abajo}${!desc && x.banda ? `<button class="chip" data-act="hoja" data-v="banda">${ico('banda')}Banda ${x.banda.toLowerCase()}</button>` : ''}</div>
      ${rayas()}
      <p class="repro-luego">${sig ? `${desc ? 'Empiezas con' : 'Luego'}: <strong>${sig.name}</strong>` : sigPaso ? `Luego: <strong>descanso de ${SESION_HOY.descanso} s</strong>` : 'Es el último'}</p>
      ${!R.visto ? `<p class="repro-pista">Toca la pantalla al acabar · desliza a la derecha para volver</p>` : ''}
    </div>
  </div>`; } };

P.final = { sinPestanas: true, titulo: 'Final de sesión', render: () => { const f = S.final; return `
  <div class="pantalla">
    <div class="pila" style="align-items:flex-start;gap:var(--e3)">
      <span class="item-icono" style="width:56px;height:56px;background:var(--accion);color:var(--sobre-accion);border-radius:50%">${ico('check')}</span>
      <h1 class="titulo-pantalla">Sesión hecha</h1>
      <p class="h2" style="font-weight:400">${ico('racha', '').replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-3px"')} Racha: 7 días</p>
      <p class="meta">Fuerza de tren superior · ${minutos(SESION_HOY)} min · 18 series · pulso medio 124</p>
    </div>
    <section class="seccion"><h2>¿Cómo te ha ido?</h2><p class="meta">La próxima vez se ajusta la carga de cada uno.</p>
      ${['Remo inclinado con banda', 'Press de suelo con banda', 'Curl de bíceps con banda'].map((t, k) => `<div class="pila"><span>${t}</span>${seg('mod' + k, ['Fácil', 'Justo', 'Demasiado'], f.mods['mod' + k] || 'Justo', 'Cómo te ha ido ' + t)}</div>`).join('')}
    </section>
    <section class="seccion"><h2>Esfuerzo</h2>
      <div class="fila"><span class="crece meta">De 1 (muy fácil) a 10 (máximo)</span>${paso('esfuerzo', f.esfuerzo, ' / 10', 'Esfuerzo')}</div>
      <h2>¿Cómo te has sentido?</h2>${seg('sentir', ['Mal', 'Regular', 'Bien', 'Muy bien'], f.sentir, 'Cómo te has sentido')}
    </section>
    <div class="lista">
      <label class="item" for="fin-strava"><span class="item-icono">${ico('subir')}</span><span class="crece"><span class="nombre">Enviar a Strava</span><span class="meta">Con ejercicios, pulso, esfuerzo y sensación</span></span>${inter('fin-strava', f.strava, 'Enviar a Strava')}</label>
      <div class="item" style="cursor:default"><span class="item-icono">${ico('reloj2')}</span><span class="crece"><span class="nombre">En el reloj Polar</span><span class="meta">Guarda la grabación como «Entrenamiento en circuito»</span></span></div>
    </div>
    <button class="btn btn-principal btn-grande" data-act="guardarfin">Guardar y volver</button>
    <button class="btn btn-texto" data-act="repetir">${ico('reintentar')}Repetir la sesión</button>
  </div>`; } };

P.objetivo = { titulo: 'Plan por objetivo', render: () => { const o = S.obj; return `${cab('Plan por objetivo', 'entrenar')}
  <div class="pantalla">
    <p class="meta">La app te prepara cada sesión y la ajusta con lo que vas marcando como fácil, justo o demasiado. Cada vez que repites, una sesión distinta.</p>
    <section class="seccion"><h2>Objetivo</h2>${seg('obj.meta', ['Fuerza', 'Músculo', 'Cardio', 'Movilidad'], o.meta, 'Objetivo')}</section>
    <section class="seccion"><h2>Semanas</h2>${seg('obj.semanas', ['4', '6', '8'], String(o.semanas), 'Semanas')}</section>
    <section class="seccion"><h2>Qué días</h2><div class="semana" role="group" aria-label="Días">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<button class="dia ${o.dias.includes(d) ? 'hecho' : ''}" data-act="objdia" data-v="${d}" aria-pressed="${o.dias.includes(d)}"><span class="marca">${d}</span></button>`).join('')}</div><p class="meta">${o.dias.length} días por semana · unos 35 min cada uno</p></section>
    <div class="tarjeta"><span class="etiqueta">Con tu material</span><p>Bandas grandes, mini banda y rodillo. Se cambia en Tú → Material.</p></div>
    <button class="btn btn-principal btn-grande" data-act="toast" data-msg="Plan creado: empieza el lunes 16">Crear plan</button>
    <p class="meta">Si tienes un plan de Claude, este lo sustituye. Puedes volver al de Claude cuando quieras.</p>
  </div>`; } };

/* Historial */
P.historial = { tab: 'historial', render: () => `
  <div class="pantalla">
    <div class="fila-titulo"><h1 class="titulo-pantalla">Historial</h1><button class="btn btn-texto" data-go="marcas">Por ejercicio</button></div>
    ${HISTORIAL.map(g => `<section class="seccion"><h2 class="etiqueta">${g.dia}</h2><div class="lista">${g.s.map(s => `<${s.carrera ? 'a href="https://www.strava.com" target="_blank" rel="noopener"' : `button data-act="det" data-id="${s.id}"`} class="item" style="color:inherit;text-decoration:none">
      <span class="item-icono">${ico(s.carrera ? 'correr' : 'entrenar')}</span>
      <span class="crece"><span class="nombre">${s.t}</span><span class="meta">${s.m}${s.pulso ? ` · ♥ ${s.pulso}` : ''}</span>
      <span class="fila envuelve" style="gap:var(--e2);margin-top:2px">${s.incompleta ? '<span class="estado neutro">Incompleta</span>' : ''}${estado(s.strava)}</span></span>${ico(s.carrera ? 'externo' : 'chev', 'chev')}</${s.carrera ? 'a' : 'button'}>`).join('')}</div></section>`).join('')}
  </div>` };

const TXT_STRAVA = {
  subida: 'Subida con las series, los kilos y el pulso.',
  pendiente: 'Aún no se ha enviado. Se envía sola cuando haya conexión.',
  error: 'Strava no respondió. Se volverá a intentar sola en 1 hora, o envíala ahora.',
  duplicado: 'Strava ya tenía una actividad a esa hora (la del reloj). No se ha subido otra.',
};
P.detalle = { titulo: 'Detalle de una sesión', render: () => {
  const h = HISTORIAL.flatMap(g => g.s.map(s => ({ ...s, dia: g.dia }))).find(s => s.id === S.det) || HISTORIAL[2].s[0];
  const est = S.enviado === h.id ? 'subida' : h.strava;
  return `${cab(h.dia, 'historial')}
  <div class="pantalla">
    <div class="pila"><h1 class="titulo-pantalla">${h.t}</h1><p class="meta">18:05 – 18:46 · ${h.m}</p>${h.incompleta ? '<span class="estado neutro" style="align-self:flex-start">Incompleta · no cuenta para la racha</span>' : ''}</div>
    <div class="tarjeta">
      <div class="fila"><span class="crece"><span class="etiqueta">Strava</span></span>${estado(est)}</div>
      <p>${TXT_STRAVA[est]}</p>
      ${est === 'subida' ? '<a class="btn btn-texto" style="align-self:flex-start;padding:0" href="https://www.strava.com" target="_blank" rel="noopener">' + ico('externo') + 'Abrir en Strava</a>'
        : est === 'duplicado' ? `<button class="btn btn-secundario" data-act="enviar" data-id="${h.id}">Subirla igualmente</button>`
        : `<button class="btn btn-principal" data-act="enviar" data-id="${h.id}">${ico(est === 'error' ? 'reintentar' : 'subir')}${est === 'error' ? 'Reintentar' : 'Enviar a Strava'}</button>`}
    </div>
    <div class="fila" style="gap:var(--e5)"><div><span class="etiqueta">Pulso medio</span><p class="cifra">121<small>ppm</small></p></div><div><span class="etiqueta">Máximo</span><p class="cifra">158<small>ppm</small></p></div><div><span class="etiqueta">Esfuerzo</span><p class="cifra">7<small>/10</small></p></div></div>
    ${[['Remo inclinado con banda', [['18:07', '1', '12', 'Roja', 118, 131], ['18:15', '2', '12', 'Roja', 124, 138], ['18:23', '3', '10', 'Roja', 127, 142]]],
       ['Puente de glúteo con banda', [['18:09', '1', '15', 'Mini banda', 112, 124], ['18:17', '2', '15', 'Mini banda', 116, 129], ['18:25', '3', '15', 'Mini banda', 119, 131]]]]
      .map(([n, rows]) => `<section class="seccion"><h2>${n}</h2><div style="overflow-x:auto"><table class="tabla"><thead><tr><th>Hora</th><th>Ronda</th><th class="n">Reps</th><th>Banda</th><th class="n">♥ medio</th><th class="n">Máx.</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, k) => `<td class="${k === 2 || k > 3 ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`).join('')}
    <p class="meta">Y 4 ejercicios más (en el prototipo solo se ven dos).</p>
  </div>`; } };

P.marcas = { titulo: 'Por ejercicio', render: () => `${cab('Por ejercicio', 'historial')}
  <div class="pantalla"><div class="lista">${['remo_incl_banda', 'curl_goma', 'press_goma', 'puente_banda', 'plancha', 'deadbug'].map(id => { const e = ej(id); return `<button class="item" data-act="ficha" data-id="${id}"><span class="crece"><span class="nombre">${e.name}</span><span class="meta">Última: ${e.reps ? e.reps + ' reps' : e.secs + ' s'} · 11 nov</span><span class="meta">Mejor: ${e.reps ? e.reps + 3 + ' reps' : e.secs + 15 + ' s'}${e.needs === 'gomas' ? ' · banda negra' : ''}</span></span>${ico('chev', 'chev')}</button>`; }).join('')}</div></div>` };

/* Tú */
P.tu = { tab: 'tu', render: () => `
  <div class="pantalla">
    <div class="fila"><span class="item-icono" style="width:56px;height:56px;border-radius:50%;font-size:var(--t3);font-weight:700">À</span>
      <div class="crece pila" style="gap:0"><h1 class="titulo-pantalla">Àlex</h1><span class="meta">Objetivo: ganar fuerza sin dolor de espalda</span></div>
      <button class="btn btn-texto" data-act="hoja" data-v="personas">Cambiar</button></div>
    <button class="tarjeta" data-go="peso" style="border:0;text-align:left;cursor:pointer;color:inherit">
      <div class="fila-titulo"><span class="etiqueta">Peso</span><span class="meta">hoy · báscula</span></div>
      <div class="fila"><p class="cifra crece">78,4<small>kg</small></p><span class="meta">−1,2 kg en 8 semanas</span></div>
      ${grafica(true)}
    </button>
    <section class="seccion"><h2 class="etiqueta">Ajustes</h2><div class="lista">
      ${item({ t: 'Material', m: 'Bandas grandes, mini banda, rodillo', go: 'material', icono: 'mancuerna' })}
      ${item({ t: 'Mis bandas', m: 'Verde, roja y negra', go: 'bandas', icono: 'banda' })}
      ${item({ t: 'Sonido y voz', m: 'Tonos y cuenta en voz alta', go: 'sonido', icono: 'sonido' })}
      ${item({ t: 'Figura', m: S.fig.sexo === 'mujer' ? 'Mujer' : 'Hombre', go: 'figura', icono: 'figura' })}
      ${item({ t: 'Widget', m: 'Favorita: Remo + curl con banda', go: 'widget-conf', icono: 'widget' })}
    </div></section>
    <section class="seccion"><h2 class="etiqueta">Conexiones y datos</h2><div class="lista">
      ${item({ t: 'Conexiones', m: 'Claude y Strava conectados · Polar no', go: 'conexiones', icono: 'conexion' })}
      ${item({ t: 'Copia de seguridad', m: 'En la nube · también a un archivo', go: 'copia', icono: 'nube' })}
    </div></section>
    <section class="seccion"><h2 class="etiqueta">Cuenta</h2><div class="lista">
      ${S.cuenta ? item({ t: 'alex@ejemplo.com', m: 'Tus datos se guardan en la nube', icono: 'correo', der: ' ' }) + item({ t: 'Salir', act: 'salir', icono: 'salir', der: ' ' }) : item({ t: 'Entrar', m: 'Para no perder nada y usarla en otro móvil', go: 'entrar', icono: 'correo' })}
    </div></section>
  </div>` };

function grafica(mini) {
  const W = 320, H = mini ? 64 : 160, pl = mini ? 0 : 40, pr = 8, pt = 10, pb = mini ? 6 : 26, lo = 78, hi = 80;
  const x = i => pl + i * (W - pl - pr) / (PESO.length - 1), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const pts = PESO.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${pl},${H - pb} ${pts} ${x(PESO.length - 1)},${H - pb}`;
  const ejes = mini ? '' : [78, 79, 80].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--linea)" stroke-width="1"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--tinta-2)">${v}</text>`).join('')
    + ['21 sep', '19 oct', '12 nov'].map((t, k) => `<text x="${x([0, 4, 7][k])}" y="${H - 6}" text-anchor="${k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}" font-size="12" fill="var(--tinta-2)">${t}</text>`).join('');
  return `<div class="grafica"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Peso de 79,6 a 78,4 kg en 8 semanas">${ejes}<polygon points="${area}" fill="var(--accion-suave)"/><polyline points="${pts}" fill="none" stroke="var(--accion)" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x(PESO.length - 1)}" cy="${y(PESO[PESO.length - 1])}" r="5" fill="var(--accion)"/></svg></div>`;
}

P.peso = { titulo: 'Peso y medidas', render: () => `${cab('Peso y medidas', 'tu')}
  <div class="pantalla">
    <div class="fila"><p class="cifra crece">78,4<small>kg</small></p><span class="meta">−1,2 kg en 8 semanas</span></div>
    ${grafica(false)}
    ${seg('rango', ['1 mes', '3 meses', '1 año'], '3 meses', 'Periodo')}
    <section class="seccion"><h2>Medidas</h2><div class="lista">
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Cintura</span><span class="meta">8 nov · a mano</span></span><span class="cifra" style="font-size:var(--t3)">86 cm</span></div>
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Grasa corporal</span><span class="meta">hoy · báscula</span></span><span class="cifra" style="font-size:var(--t3)">18,9 %</span></div>
    </div></section>
    <section class="seccion"><h2>Últimos registros</h2><div class="lista">
      ${[['Hoy', '78,4 kg', 'Báscula, vía Claude'], ['5 nov', '78,6 kg', 'Báscula, vía Claude'], ['29 oct', '79,0 kg', 'A mano']].map(([d, v, o]) => `<div class="item" style="cursor:default"><span class="crece"><span class="nombre">${v}</span><span class="meta">${d} · ${o}</span></span></div>`).join('')}
    </div></section>
    <button class="btn btn-principal btn-grande" data-act="hoja" data-v="peso">${ico('mas')}Apuntar peso o medida</button>
    <button class="btn btn-secundario" data-act="toast" data-msg="Importados 12 registros de la báscula">${ico('bajar')}Importar archivo de la báscula</button>
  </div>` };

P.entrar = { sinPestanas: true, titulo: 'Entrar', render: () => `${cab('Entrar', 'tu')}
  <div class="pantalla">
    <div class="pila" style="gap:var(--e3)"><h1 class="titulo-pantalla">Rutina core</h1><p>Entra con tu email para guardar tus sesiones en la nube y usarlas en otro móvil.</p></div>
    ${S.hoja === 'enviado' ? `<form class="pila" style="gap:var(--e4)" data-form="codigo">
      <p>Código enviado a <strong>alex@ejemplo.com</strong>. Si no llega en 2 minutos, mira en spam.</p>
      <div class="campo"><label for="codigo">Código de 6 cifras</label><input id="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" value="482915" required style="font-size:var(--t4);letter-spacing:.3em;text-align:center"></div>
      <button class="btn btn-principal btn-grande" type="submit">Entrar</button>
      <button class="btn btn-texto" type="button" data-act="reenviar">Enviar otro código</button>
    </form>` : `
    <form class="pila" style="gap:var(--e4)" data-form="entrar">
      <div class="campo"><label for="email">Email</label><input id="email" type="email" autocomplete="email" inputmode="email" value="alex@ejemplo.com" required></div>
      <button class="btn btn-principal btn-grande" type="submit">Enviarme un código</button>
    </form>`}
    <button class="btn btn-texto" data-go="entrenar">Seguir sin cuenta</button>
    <p class="meta">Sin cuenta, todo se queda solo en este móvil. Puedes entrar más tarde desde Tú.</p>
  </div>` };

P.material = { titulo: 'Material', render: () => `${cab('Material', 'tu')}
  <div class="pantalla"><p class="meta">Cada ejercicio sale en la versión para el material que tienes.</p>
  <div class="lista">${[['gomas', 'Bandas grandes', 'Bucles largos y cerrados'], ['banda', 'Mini banda', 'Para los muslos'], ['rodillo', 'Rodillo de espuma', 'Para calentar y recuperar'], ['mancuernas', 'Mancuernas', '']].map(([k, t, m]) => `<label class="item" for="m-${k}"><span class="crece"><span class="nombre">${t}</span>${m ? `<span class="meta">${m}</span>` : ''}</span>${inter('m-' + k, S.mat2[k], t)}</label>`).join('')}</div></div>` };

P.bandas = { titulo: 'Mis bandas', render: () => `${cab('Mis bandas', 'tu')}
  <div class="pantalla"><p class="meta">Ponles el nombre que las distinga. La app recuerda cuál usas en cada ejercicio.</p>
  <div class="lista">${BANDAS.map(b => `<div class="item" style="cursor:default"><span style="width:28px;height:28px;border-radius:50%;background:${b.c};flex:none;border:2px solid var(--linea)" aria-hidden="true"></span><span class="crece"><span class="nombre">${b.n}</span><span class="meta">${b.d}</span></span><button class="icono-btn" aria-label="Cambiar ${b.n}">${ico('lapiz')}</button></div>`).join('')}</div>
  <button class="btn btn-secundario" data-act="toast" data-msg="Banda añadida">${ico('mas')}Añadir banda</button></div>` };

P.sonido = { titulo: 'Sonido y voz', render: () => `${cab('Sonido y voz', 'tu')}
  <div class="pantalla"><div class="lista">${[['tonos', 'Tonos en cada repetición', 'Agudo al subir, grave al bajar'], ['voz', 'Contar en voz alta', ''], ['mitad', 'Avisar a la mitad', 'En los ejercicios de mantener'], ['bajar', 'Bajar el volumen cada ronda', '']].map(([k, t, m]) => `<label class="item" for="s-${k}"><span class="crece"><span class="nombre">${t}</span>${m ? `<span class="meta">${m}</span>` : ''}</span>${inter('s-' + k, S.sonido[k], t)}</label>`).join('')}</div>
  <p class="meta">La pantalla no se apaga durante la sesión.</p></div>` };

P.figura = { titulo: 'Figura: hombre o mujer', render: () => `${cab('Figura', 'tu')}
  <div class="pantalla">
    <section class="seccion"><h2>Quién hace los ejercicios</h2>
      <div class="rejilla">${[['m', 'Hombre', 'hombre'], ['f', 'Mujer', 'mujer']].map(([g, t, v]) => `<button class="miniatura" data-act="figsexo" data-v="${v}" aria-pressed="${S.fig.sexo === v}">${fig(ej('remo_incl_banda'), 'mini', g)}<span class="check">${S.fig.sexo === v ? ico('check') : ''}</span><span class="nombre">${t}</span></button>`).join('')}</div>
      <p class="meta">Es la misma figura en toda la app y en el widget. Cada persona de la cuenta elige la suya.</p></section>
    <section class="seccion"><h2>Vista previa</h2>${fig(ej(S.figPrev), 'grande')}
      <div class="chips" role="group" aria-label="Ejercicio de la vista previa">${['puente', 'plancha', 'remo_incl_banda', 'almeja'].map(k => `<button class="chip" data-act="figprev" data-v="${k}" aria-pressed="${S.figPrev === k}">${esc(ej(k).name)}</button>`).join('')}</div>
      <p class="meta">En grande salen la zona que trabaja (punto ámbar), la flecha del movimiento y la banda. En las miniaturas, solo la postura.</p></section>
    <div class="lista">${item({ t: 'Personalizar la figura', m: 'Complexión, músculo, piel, pelo y ropa · más adelante', go: 'personalizar', icono: 'lapiz' })}</div>
  </div>` };

const PIEL = [['', 'De serie'], ['#F1C7A5', 'Clara'], ['#C98F68', 'Media'], ['#8D5524', 'Morena'], ['#5A3A22', 'Oscura']];
const PELO = [['', 'De serie'], ['#111111', 'Negro'], ['#6B4226', 'Castaño'], ['#C9A15A', 'Rubio'], ['#9A9A9A', 'Canoso']];
const ROPA = [['', 'Verde azulado (marca)'], ['#D9634C', 'Coral'], ['#3B4A6B', 'Azul marino'], ['#E8ECEB', 'Gris claro']];
const muestras = (k, ops) => `<div class="muestras" role="group" aria-label="${k}">${ops.map(([c, t]) => `<button class="muestra-c" data-act="look" data-k="${k}" data-v="${c}" aria-pressed="${S.look[k] === c}" aria-label="${t}" title="${t}" style="--c:${c || 'transparent'}">${c ? '' : 'De serie'}</button>`).join('')}</div>`;
const rango = (k, t, a, b) => `<div class="campo"><label for="r-${k}">${t}</label><div class="fila"><span class="meta">${a}</span><input class="rango crece" id="r-${k}" type="range" min="-1" max="1" step="0.25" value="${S.look[k]}" data-act="rango" data-k="${k}"><span class="meta">${b}</span></div></div>`;
P.personalizar = { titulo: 'Personalizar la figura (más adelante)', render: () => `${cab('Personalizar', 'figura')}
  <div class="pantalla">
    <div class="tarjeta"><span class="etiqueta">Más adelante</span><p>No entra en la primera versión. Ya funciona aquí sobre el modelo real para ver si merece la pena.</p></div>
    <div style="position:sticky;top:calc(-1 * var(--e4));z-index:1;background:var(--fondo);padding-block:var(--e2)">${fig(ej('remo_incl_banda'), 'grande')}</div>
    <section class="seccion"><h2>Cuerpo</h2>${rango('complexion', 'Complexión', 'Menos', 'Más')}${rango('musculo', 'Músculo', 'Menos', 'Más')}
      <p class="meta">Opcional y sin juicio: no se liga a tu peso real salvo que lo pidas.</p></section>
    <section class="seccion"><h2>Piel</h2>${muestras('piel', PIEL)}</section>
    <section class="seccion"><h2>Pelo</h2>${muestras('pelo', PELO)}</section>
    <section class="seccion"><h2>Camiseta</h2>${muestras('top', ROPA)}</section>
    <button class="btn btn-secundario" data-act="lookcero">${ico('reintentar')}Volver a la de serie</button>
    <p class="meta">El widget usa imágenes hechas antes: si cambias la figura, el móvil las rehace (unos segundos).</p>
  </div>` };

P['widget-conf'] = { titulo: 'Qué hace el widget', render: () => `${cab('Widget', 'tu')}
  <div class="pantalla"><p class="meta">Lo que empieza el widget al tocar Empezar. También se cambia desde el propio widget.</p>
  <div class="lista">${[['hoy', 'La sesión de hoy', 'Del plan de Claude o del plan por objetivo'], ['core', 'Rutina de core', ''], ['fav', 'Una favorita', 'Remo + curl con banda']].map(([k, t, m]) => `<button class="item" data-act="wconf" data-v="${k}" role="radio" aria-checked="${S.widget === k}"><span class="crece"><span class="nombre">${t}</span>${m ? `<span class="meta">${m}</span>` : ''}</span>${S.widget === k ? ico('check', 'chev') : '<span style="width:20px"></span>'}</button>`).join('')}</div>
  <button class="btn btn-secundario" data-go="widgets">Ver los widgets</button></div>` };

P.copia = { titulo: 'Copia de seguridad', render: () => `${cab('Copia de seguridad', 'tu')}
  <div class="pantalla">
    <div class="tarjeta"><div class="fila"><span class="item-icono">${ico('nube')}</span><span class="crece"><span class="nombre" style="font-weight:700">En la nube</span><span class="meta" style="display:block">Guardado hace 2 min</span></span></div><p class="meta">Con tu cuenta, cada sesión se guarda al terminar.</p></div>
    <section class="seccion"><h2>A un archivo</h2><p class="meta">Historial, favoritas, bandas, pesos, ajustes y racha en un archivo JSON. Importar lo combina con lo que ya hay, sin duplicar ni borrar.</p>
    <button class="btn btn-secundario" data-act="toast" data-msg="Copia guardada en Descargas">${ico('bajar')}Exportar</button>
    <button class="btn btn-secundario" data-act="toast" data-msg="Importadas 3 sesiones nuevas">${ico('subir')}Importar</button></section>
  </div>` };

P.conexiones = { titulo: 'Conexiones', render: () => { const c = S.conectado; return `${cab('Conexiones', 'tu')}
  <div class="pantalla"><div class="lista">
    ${item({ t: 'Claude', m: c.claude ? 'Conectado · leyó tu historial hoy a las 8:10' : 'Sin conectar', go: 'claude', icono: 'chispa' })}
    ${item({ t: 'Strava', m: c.strava ? 'Conectado · 1 sesión pendiente' : 'Sin conectar', go: 'strava', icono: 'subir' })}
    ${item({ t: 'Polar', m: c.polar ? 'Conectado' : 'Sin conectar · pulso en directo disponible', go: 'polar', icono: 'reloj2' })}
  </div></div>`; } };

P.claude = { titulo: 'Conectar Claude', render: () => `${cab('Claude', 'conexiones')}
  <div class="pantalla">
    <div class="fila"><span class="crece h2">Claude</span>${S.conectado.claude ? '<span class="estado bien">' + ico('check') + 'Conectado</span>' : '<span class="estado neutro">Sin conectar</span>'}</div>
    <p>Con Claude conectado, en tus conversaciones puede ver tu historial, tu peso y tu plan, y crearte las sesiones y el plan de la semana aquí.</p>
    <section class="seccion"><h2>Cómo conectarlo</h2>
      <ol class="pila" style="margin:0;padding-left:1.4em;gap:var(--e3)">
        <li>En Claude, abre Ajustes → Conectores → Añadir conector personalizado.</li>
        <li>Pega esta dirección:<div class="fila" style="margin-top:var(--e2)"><code class="crece" style="background:var(--capa-2);padding:var(--e2) var(--e3);border-radius:var(--r1);font-size:var(--t1);overflow-wrap:anywhere">https://ejemplo.supabase.co/functions/v1/mcp</code><button class="icono-btn" data-act="copiar" aria-label="Copiar la dirección">${ico('copiar')}</button></div></li>
        <li>Entra con el email de tu cuenta de Rutina core.</li>
      </ol></section>
    <p class="meta">Necesitas un plan de Claude que permita conectores personalizados. Sin Claude, la app funciona igual con sus planes por objetivo.</p>
    ${S.conectado.claude ? '<button class="btn btn-peligro" data-act="desc" data-v="claude">Desconectar</button>' : ''}
  </div>` };

P.strava = { titulo: 'Strava', render: () => `${cab('Strava', 'conexiones')}
  <div class="pantalla">
    <div class="fila"><span class="crece h2">Strava</span>${S.conectado.strava ? '<span class="estado bien">' + ico('check') + 'Conectado</span>' : '<span class="estado neutro">Sin conectar</span>'}</div>
    <p>Cada sesión se sube con la lista de ejercicios, series, kilos, pulso y cómo te has sentido.</p>
    <div class="lista">
      <label class="item" for="st-auto"><span class="crece"><span class="nombre">Subir al terminar</span><span class="meta">Si lo quitas, usa «Enviar a Strava» en el historial</span></span>${inter('st-auto', true, 'Subir al terminar')}</label>
      <label class="item" for="st-run"><span class="crece"><span class="nombre">Traer carreras</span><span class="meta">Salen en el historial y en el plan</span></span>${inter('st-run', true, 'Traer carreras')}</label>
    </div>
    <div class="tarjeta"><div class="fila"><span class="crece nombre" style="font-weight:700">1 sesión pendiente</span>${estado('pendiente')}</div><button class="btn btn-secundario" data-act="det" data-id="h3">Ver</button></div>
    ${S.conectado.strava ? '<button class="btn btn-peligro" data-act="desc" data-v="strava">Desconectar</button>' : '<button class="btn btn-principal btn-grande" data-act="con" data-v="strava">Conectar con Strava</button>'}
  </div>` };

P.polar = { titulo: 'Polar y pulso', render: () => `${cab('Polar', 'conexiones')}
  <div class="pantalla">
    <section class="seccion"><h2>Pulso en directo</h2><p>Mientras el reloj graba, la app ve tu pulso y lo guarda en cada serie.</p>
      <div class="lista">${item({ t: 'Probar pulso', m: 'Comprueba que el reloj se ve', go: 'pulso', icono: 'corazon' })}
      <label class="item" for="p-on"><span class="crece"><span class="nombre">Usar el pulso en las sesiones</span></span>${inter('p-on', S.pulsoOn, 'Usar el pulso')}</label></div></section>
    <section class="seccion"><h2>Cuenta de Polar Flow</h2><p class="meta">Para traer el archivo de cada sesión con el pulso y subirlo a Strava.</p>
      ${S.conectado.polar ? '<button class="btn btn-peligro" data-act="desc" data-v="polar">Desconectar</button>' : '<button class="btn btn-principal" data-act="con" data-v="polar">Conectar con Polar</button>'}</section>
  </div>` };

P.pulso = { titulo: 'Probar pulso', render: () => `${cab('Probar pulso', 'polar')}
  <div class="pantalla" style="align-items:center;text-align:center">
    <span class="estado bien">${ico('check')}Polar Vantage V3</span>
    <p class="repro-tiempo" style="font-size:var(--p2)" aria-live="polite">72</p><p class="h2">ppm · zona 1</p>
    <div class="barra" style="width:100%"><i style="width:22%"></i></div>
    <div class="tarjeta" style="text-align:left;width:100%"><h2 class="h2">¿No aparece?</h2><ol class="pila" style="margin:0;padding-left:1.4em"><li>En el reloj, empieza a grabar o entra en el pre-entreno.</li><li>En Polar Flow, en el perfil de deporte: Compartir FC con otros dispositivos → Visible para todos.</li><li>Acerca el móvil al reloj.</li></ol></div>
  </div>` };

/* Widgets: imágenes WebP de la figura 3D (D1, docs/diseno/figura/widget/), una por fase; aquí se alternan como en el widget */
const FASES_W = { remo_incl_banda: 2, press_goma: 2, curl_goma: 2, flex: 2, plancha: 2, deadbug: 4, puente: 2 };
let WF = 0;
const temaOscuro = () => getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim() === 'dark';
function wSrc(id, i, op, tema) {
  const g = window.FIG_GENERO();
  if (op === 'b') return `widget-ropa-coral/${g}/${id}_${i}.webp`;
  return `${window.FIG_BASE}widget/${g}/${tema || (temaOscuro() ? 'oscuro' : 'claro')}/${id}_${i}.webp`;
}
const wImg = (id, op = 'a', tema = '') => `<img class="w-fig" data-wex="${id}" data-wop="${op}" data-wtema="${tema}" alt="" src="${wSrc(id, WF % FASES_W[id], op, tema)}">`;
function widgetAnim() { document.querySelectorAll('img[data-wex]').forEach(im => { const id = im.dataset.wex, src = wSrc(id, WF % FASES_W[id], im.dataset.wop, im.dataset.wtema); if (!im.src.endsWith(src.replace(/^\.\.\//, ''))) im.setAttribute('src', src); }); }
setInterval(() => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { WF++; widgetAnim(); } }, 1400);
const RAYAS_W = `<div class="rayas" aria-hidden="true"><span class="grupo" style="--n:7">${'<i class="hecho"></i>'.repeat(6)}<i class="desc hecho"></i></span><span class="grupo" style="--n:7"><i class="ahora"></i>${'<i></i>'.repeat(5)}<i class="desc"></i></span><span class="grupo" style="--n:6">${'<i></i>'.repeat(6)}</span></div>`;
const wGrandeMarcha = (op = 'a', tema = '', cls = '') => `<div class="w w-grande ${cls}" aria-label="Widget grande durante la sesión">
      <div class="w-arriba"><span class="meta">Ronda 2 de 3 · 1 de 6</span><span class="meta">${ico('corazon')}128</span></div>
      <div class="fila w-cuerpo">${wImg('remo_incl_banda', op, tema)}<span class="crece"><span class="w-nombre">Remo inclinado con banda</span><span class="w-tiempo">12 <span class="meta">reps</span></span><span class="meta">Banda roja · luego: press de suelo</span></span></div>
      ${RAYAS_W}
      <div class="fila"><button class="w-btn w-alt" style="width:56px" aria-label="Pausa">${ico('pausa')}</button><button class="w-btn crece">${ico('check')}Hecho</button></div>
    </div>`;
const wPeqMarcha = (op = 'a', tema = '', cls = '') => `<div class="w w-peq ${cls}" aria-label="Widget pequeño durante la sesión">${wImg('remo_incl_banda', op, tema)}<span class="fila" style="justify-content:space-between;gap:var(--e2)"><span class="meta w-corto">Remo inclinado</span><span class="w-tiempo">12</span></span><button class="w-btn">${ico('check')}Hecho</button></div>`;
P.widgets = { sinPestanas: true, titulo: 'Widget grande y pequeño', render: () => `${cab('Widgets', 'mapa')}
  <div class="inicio">
    <p class="meta">Con el fondo propuesto (opción A: el de la app, claro u oscuro). Cambia el tema arriba y hombre o mujer en Tú → Figura.</p>
    <span class="etiqueta">Grande · antes de empezar</span>
    <div class="w w-grande" aria-label="Widget grande">
      <div class="segmentos" role="group" aria-label="Qué empezar" style="background:var(--capa-2)"><button aria-pressed="true">Hoy</button><button aria-pressed="false">★ Favorita</button><button aria-pressed="false">Core</button></div>
      <div class="fila w-cuerpo">${wImg('remo_incl_banda')}<span class="crece"><span class="w-nombre">Fuerza de tren superior</span><span class="meta">${origen('claude')}</span><span class="meta">6 ejercicios · ${minutos(SESION_HOY)} min</span></span></div>
      <div class="fila"><span class="crece meta">Rondas</span>${paso('w.rondas', 3, '', 'Rondas')}</div>
      <button class="w-btn">${ico('play')}Empezar</button>
    </div>
    <span class="etiqueta">Grande · durante la sesión</span>
    ${wGrandeMarcha()}
    <div class="fila" style="gap:var(--e4);align-items:flex-start;flex-wrap:wrap">
      <div class="pila"><span class="etiqueta">Pequeño</span><div class="w w-peq">${wImg('remo_incl_banda')}<span class="meta">Hoy · ${minutos(SESION_HOY)} min</span><button class="w-btn">${ico('play')}Empezar</button></div></div>
      <div class="pila"><span class="etiqueta">Pequeño · en marcha</span>${wPeqMarcha()}</div>
    </div>
    <button class="btn btn-secundario" data-go="widget-fondo">Ver las dos opciones de fondo</button>
  </div>` };

P['widget-fondo'] = { sinPestanas: true, titulo: 'Fondo del widget: dos opciones', render: () => `${cab('Fondo del widget', 'widgets')}
  <div class="pantalla">
    <p>El fondo de hoy (<code>#1E6B74</code>) es el color de la camiseta: la figura se pierde, sobre todo ella. Dos salidas, con las imágenes reales:</p>
    ${seg('fig.sexo', ['Hombre', 'Mujer'], S.fig.sexo === 'hombre' ? 'Hombre' : 'Mujer', 'Figura')}
    <section class="seccion"><h2>Hoy: el problema</h2>${wGrandeMarcha('a', 'claro', 'w-b')}</section>
    <section class="seccion"><h2>A · Fondo de la app, claro u oscuro <span class="estado bien">${ico('check')}Propuesta</span></h2>
      <div class="pila forzar-claro" style="background:var(--fondo);padding:var(--e3);border-radius:var(--r2)">${wGrandeMarcha('a', 'claro')}<div class="fila" style="align-items:flex-start;gap:var(--e3)">${wPeqMarcha('a', 'claro')}</div></div>
      <div class="pila forzar-oscuro" style="background:var(--fondo);padding:var(--e3);border-radius:var(--r2)">${wGrandeMarcha('a', 'oscuro')}<div class="fila" style="align-items:flex-start;gap:var(--e3)">${wPeqMarcha('a', 'oscuro')}</div></div>
      <p class="meta">La camiseta sigue siendo del color de la marca, igual que en la app. Las imágenes de claro y oscuro ya están hechas (D1). Sigue al tema del móvil.</p></section>
    <section class="seccion"><h2>B · Fondo verde azulado y camiseta coral</h2>
      <div class="pila" style="padding:var(--e3);border-radius:var(--r2);background:var(--capa-2)">${wGrandeMarcha('b', '', 'w-b')}<div class="fila" style="align-items:flex-start;gap:var(--e3)">${wPeqMarcha('b', '', 'w-b')}</div></div>
      <p class="meta">El widget conserva el color de hoy. Pero la camiseta coral tendría que ser la de toda la app (si no, la persona cambia de ropa entre la app y el widget), y el coral compite con el ámbar de la zona que trabaja.</p></section>
  </div>` };

/* Sistema */
P.sistema = { proto: true, titulo: 'Sistema de diseño', render: () => `${cab('Sistema de diseño', 'mapa')}
  <div class="pantalla">
    <section class="seccion"><h2>Color</h2><div class="muestra">${[['--accion', 'Acción · marca'], ['--trabajo', 'Trabajo · marca'], ['--fondo', 'Fondo · marca'], ['--capa', 'Capa'], ['--capa-2', 'Capa 2 · hueco'], ['--tinta', 'Texto'], ['--tinta-2', 'Texto secundario'], ['--linea', 'Línea'], ['--bien', 'Bien'], ['--aviso', 'Aviso'], ['--error', 'Error'], ['--accion-suave', 'Seleccionado']].map(([v, t]) => `<span class="c"><i style="background:var(${v})"></i>${t}</span>`).join('')}</div>
    <p class="meta">Ámbar solo para el cuerpo que trabaja y el progreso de la serie; nunca como texto sobre fondo claro.</p></section>
    <section class="seccion"><h2>Letra · Atkinson Hyperlegible</h2>
      <p style="font-size:var(--p2);font-weight:700;line-height:1">12<small style="font-size:var(--t3);color:var(--tinta-2)"> reps</small></p><p class="meta">p2 · 64–104 · cuántas, en el reproductor</p>
      <p style="font-size:var(--t4);font-weight:700">Título de pantalla</p><p class="meta">t4 · 28</p>
      <p style="font-size:var(--t3);font-weight:700">Título de sección</p><p class="meta">t3 · 20</p>
      <p>Texto de la app, ejercicios y explicaciones.</p><p class="meta">t2 · 16 · también este texto secundario en t1 · 14</p></section>
    <section class="seccion"><h2>Espacios</h2><div class="fila" style="align-items:flex-end">${[4, 8, 12, 16, 24, 32, 48].map(n => `<div class="pila" style="align-items:center;gap:2px"><i style="display:block;width:${n}px;height:${n}px;background:var(--accion)"></i><span class="meta">${n}</span></div>`).join('')}</div></section>
    <section class="seccion"><h2>Botones</h2><button class="btn btn-principal btn-grande">${ico('play')}Empezar</button><div class="fila envuelve"><button class="btn btn-secundario">Secundario</button><button class="btn btn-texto">Texto</button><button class="btn btn-peligro">Desconectar</button></div></section>
    <section class="seccion"><h2>Controles</h2>${seg('demo', ['Suave', 'Normal', 'Fuerte'], 'Normal', 'Nivel')}<div class="fila">${paso('demo', 12, '', 'Repeticiones')}<span class="crece"></span>${inter('demo-sw', true, 'Interruptor de ejemplo')}</div><div class="chips"><button class="chip" aria-pressed="true">Core</button><button class="chip" aria-pressed="false">Glúteo</button><button class="chip" aria-pressed="false">Espalda</button></div></section>
    <section class="seccion"><h2>Estados de Strava</h2><div class="fila envuelve">${Object.keys(STRAVA).map(estado).join('')}</div></section>
    <section class="seccion"><h2>Origen de una sesión</h2><div class="fila envuelve" style="gap:var(--e4)">${Object.keys(ORIGEN).map(origen).join('')}</div></section>
    <section class="seccion"><h2>Figura</h2><div class="fila" style="align-items:flex-start"><div style="width:120px">${fig(ej('puente'))}</div><div class="crece">${fig(ej('puente'), 'grande')}</div></div><p class="meta">Figura 3D de D1, proporción 180:112. Miniatura quieta en la postura clave, sin etiquetas; grande en bucle con la zona que trabaja en ámbar. En el reproductor, sin caja y a toda pantalla (en los de pie se recortan los lados).</p>
    <h3 class="h2">Rayas de progreso</h3><div style="padding:var(--e2);background:var(--capa);border-radius:var(--r1)">${(() => { const g = (a, b) => `<span class="grupo" style="--n:${a + b}">${'<i class="hecho"></i>'.repeat(a)}${'<i></i>'.repeat(b)}</span>`; return `<div class="rayas"><span class="grupo" style="--n:7">${'<i class="hecho"></i>'.repeat(6)}<i class="desc hecho"></i></span><span class="grupo" style="--n:7"><i class="hecho"></i><i class="hecho"></i><i class="ahora"></i><i></i><i></i><i></i><i class="desc"></i></span><span class="grupo" style="--n:6">${'<i></i>'.repeat(6)}</span></div>`; })()}</div>
    <p class="meta">Un paquete por ronda, una raya por ejercicio y una más corta y hueca para el descanso. Hecho en verde azulado, el actual en ámbar.</p></section>
  </div>` };

/* ---------- Hojas inferiores ---------- */
const HOJAS = {
  dia: () => { const d = SEMANA.find(x => x.n === S.diaSel) || SEMANA[4]; return `<h2 class="h2">${d.n} · ${d.tipo}</h2><p class="meta">${d.carrera ? 'Se graba con el reloj; aquí llega desde Strava.' : ORIGEN[d.o][1]}</p>${d.carrera || d.est === 'descanso' ? '' : `<button class="btn btn-principal btn-grande" data-go="reproductor">${ico('play')}Hacerla hoy</button>`}<button class="btn btn-secundario" data-act="cerrar" data-msg="Cambiada por una favorita">${ico('estrella')}Cambiar por una favorita</button><button class="btn btn-texto" data-act="cerrar" data-msg="${d.n}: descanso">${ico('luna')}Dejar como descanso</button>`; },
  personas: () => `<h2 class="h2">¿Quién entrena?</h2><div class="lista">${PERSONAS.map(p => `<button class="item" data-act="cerrar"><span class="item-icono" style="border-radius:50%;font-weight:700">${p.i}</span><span class="crece"><span class="nombre">${p.n}</span><span class="meta">${p.yo ? 'En este móvil ahora' : 'Sus propios datos'}</span></span>${p.yo ? ico('check', 'chev') : ''}</button>`).join('')}</div><button class="btn btn-secundario" data-go="entrar">${ico('mas')}Añadir persona</button>`,
  banda: () => `<h2 class="h2">¿Qué banda llevas?</h2><div class="lista">${BANDAS.map(b => `<button class="item" data-act="cerrar"><span style="width:28px;height:28px;border-radius:50%;background:${b.c};border:2px solid var(--linea)" aria-hidden="true"></span><span class="crece"><span class="nombre">${b.n}</span><span class="meta">${b.d}</span></span>${b.n === 'Roja' ? ico('check', 'chev') : ''}</button>`).join('')}</div><p class="meta">La próxima vez sale la que elijas.</p>`,
  pausa: () => `<h2 class="h2">En pausa</h2><button class="btn btn-principal btn-grande" data-act="cerrar">${ico('play')}Seguir</button><button class="btn btn-secundario" data-act="anterior">${ico('atras')}Ejercicio anterior</button><button class="btn btn-texto" data-act="hoja" data-v="parar">${ico('parar')}Parar la sesión</button>`,
  parar: () => `<h2 class="h2">¿Parar la sesión?</h2><p>Se guarda como incompleta con las series hechas. No cuenta para la racha.</p><button class="btn btn-peligro btn-grande" data-act="pararya">${ico('parar')}Parar y guardar</button><button class="btn btn-principal btn-grande" data-act="cerrar">Seguir entrenando</button>`,
  peso: () => `<h2 class="h2">Apuntar</h2><div class="campo"><label for="p-kg">Peso (kg)</label><input id="p-kg" inputmode="decimal" value="78,4"></div><div class="campo"><label for="p-cm">Cintura (cm, opcional)</label><input id="p-cm" inputmode="decimal" placeholder="86"></div><button class="btn btn-principal btn-grande" data-act="cerrar" data-msg="Peso guardado">Guardar</button>`,
};

/* ---------- Pintar ---------- */
const TABS = [['entrenar', 'Entrenar'], ['ejercicios', 'Ejercicios'], ['historial', 'Historial'], ['tu', 'Tú']];
const TAB_DE = { semana: 'entrenar', sesion: 'entrenar', core: 'entrenar', nueva: 'entrenar', elegir: 'entrenar', objetivo: 'entrenar', ficha: 'ejercicios', detalle: 'historial', marcas: 'historial',
  peso: 'tu', material: 'tu', bandas: 'tu', sonido: 'tu', figura: 'tu', personalizar: 'tu', 'widget-conf': 'tu', copia: 'tu', conexiones: 'tu', claude: 'tu', strava: 'tu', polar: 'tu', pulso: 'tu' };
function rutaActual() { const h = location.hash.slice(1); return P[h] ? h : 'mapa'; }
function pintar(scrollArriba = true) {
  const id = rutaActual(), p = P[id], movil = document.getElementById('movil');
  const sc = movil.querySelector('.pantalla'), y = sc && !scrollArriba ? sc.scrollTop : 0;
  const tab = p.tab || TAB_DE[id] || null;
  const conTabs = !p.sinPestanas && !p.proto;
  movil.innerHTML = p.render() +
    (conTabs ? `<nav class="pestanas" aria-label="Secciones">${TABS.map(([k, t]) => `<button data-go="${k}" ${tab === k ? 'aria-current="page"' : ''}><span class="pastilla-icono">${ico(k)}</span>${t}</button>`).join('')}</nav>` : '') +
    (S.hoja && HOJAS[S.hoja] ? `<div class="velo" data-act="velo"><div class="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-t"><span class="asa"></span>${HOJAS[S.hoja]().replace('<h2 class="h2">', '<h2 class="h2" id="hoja-t">')}</div></div>` : '') +
    (S.toast ? `<div class="aviso-toast" role="status">${ico('check').replace('<svg', '<svg style="width:20px;height:20px;flex:none"')}${S.toast}</div>` : '');
  const nsc = movil.querySelector('.pantalla'); if (nsc) nsc.scrollTop = y;
  const hoja = movil.querySelector('.hoja'); if (hoja && !hoja.contains(document.activeElement)) { hoja.tabIndex = -1; hoja.focus(); }
  document.title = 'Rutina core · prototipo';
  if (window.FIG) window.FIG.pintar(movil);
  widgetAnim();
  if (scrollArriba) { const h = movil.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
}
let toastT;
function toast(m) { S.toast = m; pintar(false); clearTimeout(toastT); toastT = setTimeout(() => { S.toast = null; pintar(false); }, 2200); }

/* ---------- Acciones ---------- */
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
function cambiar(k, d) {
  if (k === 'core.rondas') S.core.rondas = lim(S.core.rondas + d, 1, 6);
  else if (k === 'n.rondas') S.nueva.rondas = lim(S.nueva.rondas + d, 1, 10);
  else if (k === 'n.desc') S.nueva.desc = lim(S.nueva.desc + d * 15, 0, 240);
  else if (k === 'esfuerzo') S.final.esfuerzo = lim(S.final.esfuerzo + d, 1, 10);
  else if (k.startsWith('reps.')) { const id = k.slice(5), e = ej(id); if (e.reps) S.nueva.reps[id] = lim((S.nueva.reps[id] || e.reps) + d, 1, 50); }
}
const A = {
  mas: b => cambiar(b.dataset.k, 1), menos: b => cambiar(b.dataset.k, -1),
  seg: b => { const k = b.dataset.k, v = b.dataset.v;
    if (k === 'core.dia') S.core.dia = v; else if (k.startsWith('nivel.')) S.core.mod[k.slice(6)][1] = v;
    else if (k.startsWith('mod')) S.final.mods[k] = v; else if (k === 'sentir') S.final.sentir = v;
    else if (k === 'obj.meta') S.obj.meta = v; else if (k === 'obj.semanas') S.obj.semanas = +v; else if (k === 'fig.sexo') S.fig.sexo = v.toLowerCase();
    else b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); },
  sw: b => { const k = b.dataset.k, on = b.checked;
    if (k.startsWith('mod-')) S.core.mod[k.slice(4)][0] = on; else if (k === 'alt') S.nueva.alternar = on; else if (k === 'rodA') S.nueva.rodAntes = on; else if (k === 'rodD') S.nueva.rodDespues = on;
    else if (k.startsWith('m-')) S.mat2[k.slice(2)] = on; else if (k.startsWith('s-')) S.sonido[k.slice(2)] = on; else if (k === 'p-on') S.pulsoOn = on; else if (k === 'fin-strava') S.final.strava = on; },
  zona: b => { S.zona = S.zona === b.dataset.v ? null : b.dataset.v; },
  mat: b => { S.mat = S.mat === b.dataset.v ? null : b.dataset.v; },
  ficha: b => { S.ex = b.dataset.id; location.hash = 'ficha'; return 'nav'; },
  elegir: b => { const id = b.dataset.id; S.elegir = S.elegir.includes(id) ? S.elegir.filter(x => x !== id) : [...S.elegir, id]; },
  anadir: b => { if (!S.elegir.includes(b.dataset.id)) S.elegir.push(b.dataset.id); location.hash = 'nueva'; return 'nav'; },
  objdia: b => { const d = b.dataset.v; S.obj.dias = S.obj.dias.includes(d) ? S.obj.dias.filter(x => x !== d) : [...S.obj.dias, d]; },
  figsexo: b => { S.fig.sexo = b.dataset.v; }, figprev: b => { S.figPrev = b.dataset.v; },
  look: b => { S.look[b.dataset.k] = b.dataset.v; window.FIG && window.FIG.look(S.look); },
  lookcero: () => { S.look = { complexion: 0, musculo: 0, piel: '', pelo: '', top: '' }; window.FIG && window.FIG.look(S.look); },
  wconf: b => { S.widget = b.dataset.v; },
  widgetfav: b => { const id = b.dataset.id, ya = FAVORITAS.find(f => f.id === id).widget; FAVORITAS = FAVORITAS.map(f => ({ ...f, widget: !ya && f.id === id })); toast(ya ? 'El widget empezará la sesión de hoy' : 'Esta es ahora la del widget'); return 'nada'; },
  toast: b => toast(b.dataset.msg), copiar: () => { try { navigator.clipboard.writeText('https://ejemplo.supabase.co/functions/v1/mcp').catch(() => {}); } catch (e) {} toast('Dirección copiada'); },
  hoja: b => { S.hoja = b.dataset.v; },
  dia: b => { S.diaSel = b.dataset.v; S.hoja = 'dia'; },
  pulsopill: () => { S.sinSenal = !S.sinSenal; }, cerrar: b => { if (S.hoja === 'parar' || S.hoja === 'pausa') R.pausa = false; S.hoja = null; if (b.dataset.msg) toast(b.dataset.msg); },
  velo: (b, ev) => { if (ev.target === b) S.hoja = null; else return 'nada'; },
  pararya: () => { S.hoja = null; location.hash = 'final'; return 'nav'; },
  pausa: () => { R.pausa = true; S.hoja = 'pausa'; },
  anterior: () => { R.pausa = false; S.hoja = null; rAnterior(); return 'nada'; },
  tap: () => { if (R.ignorarClic) { R.ignorarClic = false; return 'nada'; } rSiguiente(); return 'nada'; },
  guardarfin: () => { location.hash = 'entrenar'; setTimeout(() => toast(S.final.strava ? 'Guardada. Subiendo a Strava…' : 'Guardada'), 50); return 'nav'; },
  repetir: () => { rReiniciar(); location.hash = 'reproductor'; return 'nav'; },
  enviar: b => { S.enviado = b.dataset.id; toast('Enviada a Strava'); return 'nada'; },
  det: b => { S.det = b.dataset.id; location.hash = 'detalle'; return 'nav'; },
  desc: b => { S.conectado[b.dataset.v] = false; }, con: b => { S.conectado[b.dataset.v] = true; toast('Conectado'); return 'nada'; },
  salir: () => { S.cuenta = false; toast('Has salido. Tus datos siguen en este móvil'); return 'nada'; },
  reenviar: () => toast('Código enviado otra vez'),
};
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-go],[data-act],[data-tema]'); if (!t) return;
  if (t.dataset.tema) { const r = document.documentElement, v = { undefined: 'light', light: 'dark', dark: undefined }[r.dataset.theme];
    if (v) r.dataset.theme = v; else delete r.dataset.theme; t.textContent = 'Tema: ' + ({ light: 'claro', dark: 'oscuro' }[v] || 'auto'); pintar(false); return; }
  if (t.dataset.go) { S.hoja = null; if (t.dataset.go === 'reproductor' && rutaActual() !== 'reproductor') rReiniciar(); if (location.hash.slice(1) === t.dataset.go) pintar(); else location.hash = t.dataset.go; return; }
  const f = A[t.dataset.act]; if (!f) return;
  if (t.dataset.act === 'sw') return; // lo lleva el evento change
  const r = f(t, ev); if (r !== 'nav' && r !== 'nada') pintar(false);
});
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'sw') { A.sw(t); pintar(false); } });
document.addEventListener('submit', ev => { ev.preventDefault(); if (ev.target.dataset.form === 'entrar') { S.hoja = 'enviado'; pintar(false); } else if (ev.target.dataset.form === 'codigo') { S.hoja = null; S.cuenta = true; location.hash = 'tu'; setTimeout(() => toast('Has entrado. Subiendo lo de este móvil…'), 50); } });
window.addEventListener('hashchange', () => { if (rutaActual() !== 'entrar' && S.hoja === 'enviado') S.hoja = null; pintar(); });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Tab' && S.hoja) { const h = document.querySelector('.hoja'); const f = h ? [...h.querySelectorAll('button,a,input')] : []; if (f.length) { const i = f.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); } } } if (ev.key === 'Escape' && S.hoja) { if (S.hoja === 'parar' || S.hoja === 'pausa') R.pausa = false; S.hoja = null; pintar(false); } });
document.addEventListener('pointerdown', ev => { if (ev.target.closest('.repro')) R.swipe = { x: ev.clientX, y: ev.clientY }; });
document.addEventListener('pointerup', ev => {
  if (!R.swipe) return; const dx = ev.clientX - R.swipe.x, dy = ev.clientY - R.swipe.y; R.swipe = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { R.ignorarClic = true; setTimeout(() => { R.ignorarClic = false; }, 0); if (dx > 0) rAnterior(); else rSiguiente(); }
});
document.addEventListener('keydown', ev => {
  if (rutaActual() !== 'reproductor' || S.hoja) return;
  if (ev.key === 'ArrowRight') { ev.preventDefault(); rSiguiente(); }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); rAnterior(); }
});
rEmpezar(0);
document.documentElement.lang = 'es';
setInterval(rTick, 1000);
pintar();
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'rango') { S.look[t.dataset.k] = +t.value; if (window.FIG) window.FIG.look(S.look); } });
