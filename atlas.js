import {stops} from './stops.js';

const ui = {
  skip:['Vai al contenuto','Skip to content'], edition:['ANTEPRIMA · IJF 2027','PREVIEW · IJF 2027'],
  intro:['Cinque incontri di giornalismo giocabile nel centro storico. Scegli una tappa in qualsiasi ordine.','Five playable journalism encounters in the historic centre. Explore the stops in any order.'],
  map:['Mappa','Map'], stops:['Tappe','Stops'], journal:['Taccuino','Notebook'],
  venueCount:['1 ingresso + 5 incontri','1 entry point + 5 encounters'],
  historic:['Centro storico','Historic centre'], mapStatus:['Sedi proposte','Proposed venues'],
  local:['Salvato su questo dispositivo','Saved on this device'],
  collected:['Incontri raccolti','Collected encounters'], empty:['Completa un incontro per aggiungerlo al taccuino.','Complete an encounter to add it to your notebook.'],
  close:['Chiudi ×','Close ×'], footer:['Anteprima del percorso · Orari, accessi e sedi da confermare','Trail preview · Times, access and venues to be confirmed'],
  zoomIn:['Ingrandisci','Zoom in'],zoomOut:['Riduci','Zoom out'],reset:['Centra le tappe','Fit all stops'],
  open:['Apri tappa','Open stop'], entry:['Ingresso','Entry'], getDirections:['Indicazioni a piedi ↗','Walking directions ↗'],
  openMap:['Esplora la mappa','Explore the map'], programme:['Sito del festival ↗','Festival website ↗'],
  step:['TAPPA','STOP'], sample:['Incontro dimostrativo · Senza camera','Sample encounter · Camera-free'],
  add:['Aggiungi al taccuino','Add to notebook'], added:['Nel taccuino ✓','In notebook ✓'],
  postcardGuide:['Scorcio illustrato · Fronte della cartolina','Illustrated view · Postcard front'],
  roomTitle:['La stanza dei giochi','The games room'],
  roomJump:['Stanza dei giochi →','Games room →'],
  roomStatus:['SPAZIO IN ATTESA DI CONFERMA','VENUE PENDING CONFIRMATION'],
  roomDescription:['Se IJF ci assegnerà la stanza, sarà il punto d’incontro di tutto il percorso. Potrai ritrovare i giochi e provarli con calma. Lo spazio che abbiamo in mente è appartato e tranquillo, e IJF lo ha già usato per mostre e attività simili.','If IJF allocates the room, it will be the meeting point for the whole trail. You can find the games there and try them at your own pace. The space we have in mind is quiet and tucked away, and IJF has used it for exhibitions and similar events.'],
  roomInvite:['Continua nella stanza dei giochi, se confermata.','Continue in the games room, if confirmed.'],
  pilot:['Apri il pilota AR ↗','Open the AR pilot ↗'], saveFailed:['Salvato per questa sessione.','Saved for this session.'],
};

const byId = (id) => document.getElementById(id);
const fromStorage = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const toStorage = (key, value) => {
  try { localStorage.setItem(key,value); return true; } catch { return false; }
};
const langKey = 'ijf-2027-pilot-language';
const progressKey = 'ijf-2027-atlas-notebook';
const validIds = new Set(stops.filter(stop=>!stop.type).map(stop=>stop.id));
let lang = fromStorage(langKey)==='en' ? 'en' : 'it';
let saved;
try {
  const previous = JSON.parse(fromStorage(progressKey));
  saved = new Set(Array.isArray(previous) ? previous.filter(id=>validIds.has(id)) : []);
} catch { saved = new Set(); }
if(fromStorage('ijf-2027-pilot-fragment')==='1') saved.add('bots-ridge');

let selected = stops[0];
let view = 'map';
let current = null;
let answerIndex = null;
let stored = true;
let mapRect;
let scale = 1;
let origin = {x:500,y:380};
let limits = {min:.5,max:2.8};
let drag = null;
const map = byId('map');
const svg = byId('map-svg');
const dialog = byId('stop-dialog');
const modal = byId('stop-content');
const pins = byId('pins');
const markerLabels = ['Teatro Pavone','Dark Money','Kleptocrat','Ciudad Perdida','Simulations Lab','The Bots Ridge'];
const postcardViews = {
  pavone: ['Ingresso del Teatro Pavone', 'Teatro Pavone entrance'],
  'dark-money': ['Facciata dell’Hotel Brufani', 'Hotel Brufani façade'],
  kleptocrat: ['Ingresso vetrato di Via Giuseppe Mazzini 10', 'Glazed entrance at Via Giuseppe Mazzini 10'],
  'ciudad-perdida': ['Arco e rilievi di Porta Marzia', 'Doorway and carved heads at Porta Marzia'],
  'simulations-lab': ['Fontana Maggiore e Palazzo dei Priori', 'Fontana Maggiore and Palazzo dei Priori'],
  'bots-ridge': ['Portale del Palazzo del Capitano del Popolo', 'Entrance of Palazzo del Capitano del Popolo'],
};
const markerButton = new Map();
const zoomButtons = [...document.querySelectorAll('[data-zoom]')];
const list = byId('stops');
const notebook = byId('journal-items');
const fullList = byId('all-stops');

const local = (pair) => pair[lang==='en' ? 1 : 0];
const t = (key) => local(ui[key]);
const world = (stop) => ({x:500+(stop.lon-12.3885)*117000,y:380-(stop.lat-43.1103)*160000});
const points = stops.map(world);
const bounds = {
  left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),
  top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y)),
};

function el(tag, text, cls) {
  const node=document.createElement(tag);
  if (text) node.textContent=text;
  if (cls) node.className=cls;
  return node;
}

function action(label, run, secondary=false) {
  const button=el('button',label,secondary?'action secondary':'action');
  button.type='button';
  button.addEventListener('click',run);
  return button;
}

function link(label,href,external=false) {
  const a=el('a',label,'action secondary');
  a.href=href;
  if(external) { a.target='_blank'; a.rel='noopener'; }
  return a;
}

for(const [i,stop] of stops.entries()){
  const button=el('button',stop.number,stop.left?'pin label-left':'pin');
  button.type='button';
  button.setAttribute('aria-label',`${stop.number} ${stop.name}`);
  const lab=el('span',markerLabels[i]);
  lab.setAttribute('aria-hidden','true');
  button.append(lab);
  button.addEventListener('click',()=>select(stop));
  pins.append(button);
  markerButton.set(stop.id,button);
}

function renderMap() {
  if(!mapRect?.width || !mapRect.height) return;
  const w=mapRect.width/scale;
  const h=mapRect.height/scale;
  const x=origin.x-w/2;
  const y=origin.y-h/2;
  svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
  for(const stop of stops) {
    const pos=world(stop);
    const btn=markerButton.get(stop.id);
    const left=(pos.x-x)*scale;
    const top=(pos.y-y)*scale;
    btn.style.left=`${left}px`;
    btn.style.top=`${top}px`;
    btn.hidden=left<15 || top<15 || left>mapRect.width-15 || top>mapRect.height-15;
  }
  const scaleM=scale>1.18?50:100;
  byId('scale').style.width=`${scaleM*1.44*scale}px`;
  byId('scale').firstElementChild.textContent=`${scaleM} m`;
  zoomButtons[0].disabled=scale>=limits.max-.001;
  zoomButtons[1].disabled=scale<=limits.min+.001;
}

function fit() {
  const rect=map.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  mapRect=rect;
  const narrow=rect.width<540;
  limits.min=Math.min(rect.width/(bounds.right-bounds.left+(narrow?110:300)),rect.height/(bounds.bottom-bounds.top+142))*.74;
  limits.min=Math.max(.21,limits.min);
  scale=limits.min/.74;
  origin={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2};
  renderMap();
}

function keepOriginInBounds() {
  origin.x=Math.min(820,Math.max(180,origin.x));
  origin.y=Math.min(660,Math.max(100,origin.y));
}

function zoom(factor,x,y) {
  const next=Math.max(limits.min,Math.min(scale*factor,limits.max));
  if(x!==undefined) {
    const offset=1/scale-1/next;
    origin.x+=(x-mapRect.width/2)*offset;
    origin.y+=(y-mapRect.height/2)*offset;
    keepOriginInBounds();
  }
  scale=next;
  renderMap();
}

for(const button of zoomButtons) button.addEventListener('click',()=>{
  if(button.dataset.zoom==='reset') fit();
  else zoom(button.dataset.zoom==='in'?1.32:1/1.32);
});
map.addEventListener('pointerdown',event=>{
  if(event.button!==0 || event.target.closest('button,a')) return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,origin:{...origin}};
  map.setPointerCapture(event.pointerId);
  map.classList.add('is-dragging');
});
map.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId) return;
  origin.x=drag.origin.x-(event.clientX-drag.x)/scale;
  origin.y=drag.origin.y-(event.clientY-drag.y)/scale;
  keepOriginInBounds();
  renderMap();
});
for(const name of ['lostpointercapture','pointercancel','pointerup']) map.addEventListener(name,()=>{
  drag=null;
  map.classList.remove('is-dragging');
});
map.addEventListener('wheel',event=>{
  if(!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  const viewport=map.getBoundingClientRect();
  zoom(event.deltaY<0?1.15:1/1.15,event.clientX-viewport.x,event.clientY-viewport.y);
},{passive:false});
map.addEventListener('keydown',event=>{
  if(event.target!==map) return;
  const moves={ArrowLeft:[-55,0],ArrowRight:[55,0],ArrowUp:[0,-55],ArrowDown:[0,55]};
  if(moves[event.key]) {
    event.preventDefault();
    const [x,y]=moves[event.key];
    origin.x+=x/scale;
    origin.y+=y/scale;
    keepOriginInBounds();
    renderMap();
  } else if(event.key==='+' || event.key==='-') {
    event.preventDefault();
    zoom(event.key==='+'?1.32:1/1.32);
  }
});

function renderList(dest, items) {
  dest.replaceChildren();
  for(const stop of items) {
    const li=el('li');
    const button=el('button');
    button.type='button';
    button.setAttribute('aria-current',String(stop===selected));
    button.addEventListener('click',()=>openStop(stop));
    const labels=el('span',null,'stop-text');
    labels.append(el('strong',stop.name),el('small',stop.place));
    const glyph=el('span',saved.has(stop.id)?'✓':'›','stop-arrow');
    glyph.setAttribute('aria-hidden','true');
    button.append(el('span',stop.number,'stop-num'),labels,glyph);
    li.append(button);
    dest.append(li);
  }
}

function renderProgress() {
  byId('count').textContent=`${saved.size}/${validIds.size}`;
  byId('journal-empty').hidden=saved.size>0;
  renderList(notebook,stops.filter(stop=>saved.has(stop.id)));
  renderList(list,stops);
  renderList(fullList,stops);
}

function select(stop) {
  selected=stop;
  for(const [id,btn] of markerButton) btn.setAttribute('aria-pressed',String(id===stop.id));
  const labels=el('div');
  labels.append(el('h2',stop.name),el('p',stop.place));
  byId('selection').replaceChildren(labels,action(t('open'),()=>openStop(stop)));
  renderProgress();
}

function setView(next) {
  view=next;
  document.body.dataset.view=next;
  byId('map-view').hidden=next!=='map';
  byId('list-view').hidden=next!=='list';
  byId('journal-view').hidden=next!=='journal';
  for(const button of document.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed',String(button.dataset.view===next));
  if(next==='map') requestAnimationFrame(fit);
}

function directions(stop) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.lat+','+stop.lon)}&travelmode=walking`;
}

function showAnswer(stop, box, chosen) {
  box.replaceChildren(el('h3',local(stop.task)),el('p',local(stop.options[chosen][1])));
  const save=action(t(saved.has(stop.id)?'added':'add'),()=>{
    saved.add(stop.id);
    stored=toStorage(progressKey,JSON.stringify([...saved]));
    save.textContent=t('added');
    save.disabled=true;
    renderProgress();
    status.textContent=stored?t('local'):t('saveFailed');
    status.focus();
  });
  save.disabled=saved.has(stop.id);
  const status=el('p',saved.has(stop.id)?t(stored?'local':'saveFailed'):'','totals');
  status.setAttribute('role','status');
  status.tabIndex=-1;
  box.append(save,status);
}

function renderEncounter(stop) {
  const box=el('section',null,'encounter');
  if(answerIndex!==null) {
    showAnswer(stop,box,answerIndex);
    return box;
  }
  const heading=el('h3',local(stop.task));
  const options=el('div',null,'stop-actions');
  stop.options.forEach((option,index)=>options.append(action(local(option[0]),()=>{
    answerIndex=index;
    showAnswer(stop,box,index);
    box.querySelector('button').focus();
  },true)));
  box.append(heading,el('p',local(stop.prompt)),options);
  return box;
}

function renderStop() {
  const stop=current;
  if(!stop) return;
  byId('stop-kicker').textContent=stop.type?t('entry'):`${t('step')} ${stop.number}`;
  const title=el('h2',stop.name);
  title.id='stop-title';
  const location=el('p',stop.place,'dialog-place');
  const body=el('p',local(stop.description));
  const postcard = el('figure',null,'stop-postcard');
  const front = el('img');
  front.width = 1184;
  front.height = 840;
  front.alt = local(postcardViews[stop.id]);
  front.src = './postcards/' + stop.id + '.webp';
  front.decoding = 'async';
  postcard.append(front,el('figcaption',t('postcardGuide')));
  modal.replaceChildren(title,location,postcard,body);
  const links=el('div',null,'stop-actions');
  links.append(link(t('getDirections'),directions(stop),true));
  if (stop.type) {
    links.prepend(action(t('openMap'),()=>{
      dialog.close();
      setView('map');
      byId('map').focus({preventScroll:true});
    }));
    links.append(link(t('programme'),'https://www.journalismfestival.com/',true));
  } else {
    modal.append(el('p',stop.team,'dialog-place'),el('p',t('sample'),'demo-note'),renderEncounter(stop));
    if(stop.pilot) links.append(link(t('pilot'),'./pilot/'));
  }
  const invitation=el('div',null,'stop-room');
  const roomLink=link(t('roomJump'),'#stanza');
  roomLink.addEventListener('click',()=>dialog.close());
  invitation.append(el('p',t('roomInvite')),roomLink);
  modal.append(invitation,links);
}

function openStop(stop, update=true) {
  select(stop);
  current=stop;
  answerIndex=null;
  renderStop();
  if(!dialog.open) dialog.showModal();
  if(update && location.hash!==`#tappa-${stop.id}`) history.pushState(null,'',`#tappa-${stop.id}`);
}

function onHashChange() {
  const stop=stops.find(item=>location.hash===`#tappa-${item.id}`);
  if(stop) openStop(stop,false);
  else if(dialog.open) dialog.close();
}

function setLanguage(next) {
  lang=next;
  document.documentElement.lang=next;
  for(const el of document.querySelectorAll('[data-copy]')) el.textContent=t(el.dataset.copy);
  for(const el of document.querySelectorAll('[data-label]')) el.setAttribute('aria-label',t(el.dataset.label));
  for(const btn of document.querySelectorAll('[data-lang]')) btn.setAttribute('aria-pressed',String(btn.dataset.lang===next));
  map.setAttribute('aria-label',next==='en'?'Map of Perugia':'Mappa di Perugia');
  byId('map-view').setAttribute('aria-label',map.getAttribute('aria-label'));
  select(selected);
  renderStop();
}

for(const button of document.querySelectorAll('[data-view]')) button.addEventListener('click',()=>setView(button.dataset.view));
for(const button of document.querySelectorAll('[data-lang]')) button.addEventListener('click',()=>{
  setLanguage(button.dataset.lang);
  toStorage(langKey,lang);
});
dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{
  const prior=current;
  current=null;
  if(location.hash.startsWith('#tappa-')) history.replaceState(null,'',location.pathname+location.search);
  if(location.hash==='#stanza') return;
  if(view==='map' && prior) markerButton.get(prior.id)?.focus({preventScroll:true});
  else if(prior) document.querySelector(`#${view}-view button[aria-current=true]`)?.focus({preventScroll:true});
});
window.addEventListener('hashchange',onHashChange);
new ResizeObserver(()=>{
  const rect=map.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  if(!mapRect || rect.width!==mapRect.width || rect.height!==mapRect.height) fit();
}).observe(map);
setView(view);
setLanguage(lang);
onHashChange();
