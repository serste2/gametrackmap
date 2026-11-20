const copy = {
  it: {
    skip: 'Vai al contenuto', intro: 'Inquadra un riferimento. Recupera il Data Fragment.',
    place: 'Piazza Giacomo Matteotti · Tappa pilota', choose: 'Scegli l’inquadratura', illustration: 'Fronte della cartolina',
    pilot: 'Prova di riconoscimento', sampleNotice: 'Apri un’immagine di prova su un secondo schermo o stampala e inquadrala. Le inquadrature di Perugia saranno verificate sul posto.',
    landscape: 'Paesaggio urbano', landscapeCopy: 'Una veduta ampia, da un punto riconoscibile.',
    detail: 'Dettaglio architettonico', detailCopy: 'Un elemento preciso, da inquadrare da fermo.',
    postcard: 'Cartolina', postcardCopy: 'Lo stesso incontro, attivato dall’immagine stampata.',
    scanButton: 'Inquadra', guide: 'Apri riferimento ↗', fallback: 'Continua senza camera →',
    privacy: 'I fotogrammi restano sul dispositivo. L’app non li registra né li invia.',
    clue: 'Un frammento è una traccia da verificare. Che cosa controlleresti prima di usarla in un’inchiesta?',
    collect: 'Raccogli il frammento', collected: 'Frammento raccolto', tryAnother: 'Prova un’altra inquadratura ↑',
    related: 'Esplora The Data Vault Canyon su Fortnite ↗',
    route: 'Percorso proposto per il festival', routeNote: 'La prova interattiva è disponibile alla tappa CCIJ. Le sedi delle tappe sono proposte.',
    entry: 'Ingresso', close: 'Chiudi', tryCard: 'Prova la cartolina', starting: 'Avvio della camera e del riconoscimento…',
    finding: 'Da fermo, inquadra il riferimento. Evita di puntare la camera verso i passanti.',
    denied: 'Camera non disponibile o accesso negato. Puoi aprire lo stesso incontro senza camera.',
    engineError: 'Riconoscimento non disponibile su questo dispositivo. Continua senza camera.',
    timeout: 'Riferimento non riconosciuto. Riprova dal percorso, usa la cartolina o continua senza camera.',
    paused: 'Camera chiusa. Chiudi questa finestra per avviare una nuova prova.',
    found: 'Riferimento riconosciuto.', cameraFree: 'Incontro senza camera',
    recorded: 'Raccolto sul dispositivo', memoryOnly: 'Raccolto per questa visita',
  },
  en: {
    skip: 'Skip to content', intro: 'Frame a reference. Recover the Data Fragment.',
    place: 'Piazza Giacomo Matteotti · Pilot stop', choose: 'Choose a view', illustration: 'Postcard front',
    pilot: 'Recognition test', sampleNotice: 'Open a test image on a second screen or print it, then point your camera at it. The Perugia views will be checked on site.',
    landscape: 'Streetscape', landscapeCopy: 'A wide view from a recognisable vantage point.',
    detail: 'Architectural detail', detailCopy: 'A single feature to frame from a stationary position.',
    postcard: 'Postcard', postcardCopy: 'The same encounter, unlocked by the printed image.',
    scanButton: 'Scan', guide: 'Open reference ↗', fallback: 'Continue without camera →',
    privacy: 'Frames stay on your device. The app does not record or upload them.',
    clue: 'A fragment is a lead to verify. What would you check before using it in an investigation?',
    collect: 'Collect fragment', collected: 'Fragment collected', tryAnother: 'Try another view ↑',
    related: 'Explore The Data Vault Canyon on Fortnite ↗',
    route: 'Proposed festival route', routeNote: 'The interactive test is at the CCIJ stop. All locations are proposed.',
    entry: 'Entry', close: 'Close', tryCard: 'Try the postcard', starting: 'Starting the camera and recognition…',
    finding: 'Stand still and frame the reference. Avoid pointing the camera at passers-by.',
    denied: 'The camera is unavailable or permission was blocked. You can open the same encounter without a camera.',
    engineError: 'Recognition is unavailable on this device. Continue without a camera.',
    timeout: 'Reference not recognised. Retry from the trail, try the postcard or continue without a camera.',
    paused: 'Camera closed. Close this window to start a new attempt.',
    found: 'Reference recognised.', cameraFree: 'Camera-free encounter',
    recorded: 'Collected on this device', memoryOnly: 'Collected for this visit',
  },
};

const readLocal = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writeLocal = (key, value) => {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
};

const dialog = document.querySelector('#scanner');
const camera = document.querySelector('#camera');
const postcardReveal = document.querySelector('#postcard-reveal');
const cameraStatus = document.querySelector('#camera-status');
const scannerTitle = document.querySelector('#scanner-title');
const encounter = document.querySelector('#encounter');
const encounterTitle = document.querySelector('#encounter-title');
const method = document.querySelector('#encounter-method');
const collect = document.querySelector('#collect');
const progress = document.querySelector('#progress');
const progressKey = 'ijf-2027-pilot-fragment';
const languageKey = 'ijf-2027-pilot-language';
let language = readLocal(languageKey) === 'en' ? 'en' : 'it';
let saved = readLocal(progressKey) === '1';
let collected = saved;
let encounterMode = null;
let currentTarget = null;
let statusKey = null;
let session = null;
let cameraRequest = null;

const translate = (key) => copy[language][key];

function updateEncounter() {
  if (encounterMode) method.textContent = encounterMode === 'cameraFree'
    ? translate('cameraFree') : `${translate('found')} ${translate(encounterMode)}`;
  collect.textContent = translate(collected ? 'collected' : 'collect');
  collect.disabled = collected;
  progress.textContent = collected ? translate(saved ? 'recorded' : 'memoryOnly') : '';
}

function setStatus(key) {
  statusKey = key;
  cameraStatus.textContent = key ? translate(key) : '';
}

function setLanguage(value) {
  language = value;
  document.documentElement.lang = value;
  for (const element of document.querySelectorAll('[data-i]')) {
    element.textContent = translate(element.dataset.i);
  }
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === value));
  }
  if (currentTarget) scannerTitle.textContent = translate(currentTarget);
  setStatus(statusKey);
  updateEncounter();
}

function stopScanner() {
  const active = session;
  session = null;
  postcardReveal.classList.remove('visible');
  if (!active) return;
  clearTimeout(active.timer);
  active.abort.abort();
  active.stream?.getTracks().forEach((track) => track.stop());
  camera.srcObject = null;
  active.controller?.dispose();
}

function closeDialog() {
  stopScanner();
  if (dialog.open) dialog.close();
}

function showEncounter(mode, focus = true) {
  closeDialog();
  encounterMode = mode;
  encounter.hidden = false;
  updateEncounter();
  if (focus) encounterTitle.focus({preventScroll: true});
  encounter.scrollIntoView({block: 'start'});
}

function waitForFrame(signal) {
  if (camera.readyState >= 2 && camera.videoWidth) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const listeners = new AbortController();
    const cleanup = () => {
      listeners.abort();
      signal.removeEventListener('abort', aborted);
    };
    const aborted = () => {
      cleanup();
      reject(new DOMException('Camera stopped', 'AbortError'));
    };
    const ready = () => {
      cleanup();
      resolve();
    };
    if (signal.aborted) {
      aborted();
      return;
    }
    signal.addEventListener('abort', aborted, {once: true});
    camera.addEventListener('loadeddata', ready, {once: true, signal: listeners.signal});
  });
}

function getCamera() {
  if (cameraRequest) return null;
  const pending = navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {facingMode: {ideal: 'environment'}, width: {ideal: 640}, height: {ideal: 480}},
  });
  cameraRequest = pending;
  return pending.finally(() => { cameraRequest = null; });
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

async function startScanner(target) {
  stopScanner();
  currentTarget = target;
  scannerTitle.textContent = translate(target);
  if (!dialog.open) dialog.showModal();
  setStatus('starting');

  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    setStatus('denied');
    return;
  }

  if (!supportsWebGL()) {
    setStatus('engineError');
    return;
  }

  const active = {abort: new AbortController(), stream: null, controller: null, timer: null, matched: false};
  session = active;
  active.timer = setTimeout(() => {
    if (session !== active) return;
    stopScanner();
    setStatus('timeout');
  }, 35000);

  let errorKey = 'denied';
  try {
    // Load and validate the compiled target before requesting camera permission.
    errorKey = 'engineError';
    const [module, targetFile] = await Promise.all([
      import('./vendor/mindar-image.prod.js'),
      fetch(`./targets/${target}.mind`, {signal: active.abort.signal}),
    ]);
    if (!targetFile.ok) throw new Error('Target unavailable');
    const targetData = await targetFile.arrayBuffer();
    if (session !== active) return;

    errorKey = 'denied';
    const request = getCamera();
    if (!request) throw new Error('Camera request pending');
    const stream = await request;
    if (session !== active) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    active.stream = stream;
    camera.srcObject = stream;
    await camera.play();
    await waitForFrame(active.abort.signal);
    if (session !== active) return;

    camera.width = camera.videoWidth;
    camera.height = camera.videoHeight;
    errorKey = 'engineError';
    const controller = new module.Controller({
      inputWidth: camera.videoWidth,
      inputHeight: camera.videoHeight,
      warmupTolerance: 3,
      onUpdate: ({type, worldMatrix}) => {
        if (session !== active || active.matched || type !== 'updateMatrix' || !worldMatrix) return;
        active.matched = true;
        setStatus('found');
        clearTimeout(active.timer);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          showEncounter(target);
          return;
        }
        postcardReveal.classList.add('visible');
        active.timer = setTimeout(() => {
          if (session === active) showEncounter(target);
        }, 300);
      },
    });
    active.controller = controller;
    const {dimensions} = controller.addImageTargetsFromBuffer(targetData);
    if (dimensions.length !== 1) throw new Error('Invalid target file');
    controller.dummyRun(camera);
    controller.processVideo(camera);
    clearTimeout(active.timer);
    active.timer = setTimeout(() => {
      if (session !== active) return;
      stopScanner();
      setStatus('timeout');
    }, 20000);
    setStatus('finding');
  } catch (error) {
    if (session !== active) return;
    console.warn('AR pilot:', error?.name || 'Camera error');
    stopScanner();
    setStatus(errorKey);
  }
}

for (const button of document.querySelectorAll('[data-scan]')) {
  button.addEventListener('click', () => startScanner(button.dataset.scan));
}
for (const button of document.querySelectorAll('[data-fallback]')) {
  button.addEventListener('click', () => showEncounter('cameraFree'));
}
for (const button of document.querySelectorAll('[data-lang]')) {
  button.addEventListener('click', () => {
    const value = button.dataset.lang;
    setLanguage(value);
    writeLocal(languageKey, value);
  });
}

document.querySelector('#close').addEventListener('click', closeDialog);
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !session) return;
  stopScanner();
  setStatus('paused');
});
window.addEventListener('pagehide', stopScanner);

collect.addEventListener('click', () => {
  collected = true;
  saved = writeLocal(progressKey, '1');
  updateEncounter();
});

setLanguage(language);
if (location.hash === '#encounter') showEncounter('cameraFree', false);
