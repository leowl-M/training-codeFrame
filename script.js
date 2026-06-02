const code = document.getElementById('code');
const lnums = document.getElementById('lnums');
const hlCode = document.getElementById('hl-code');

const EXT_LANG = {
  js:'javascript', mjs:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript',
  py:'python', rb:'ruby', go:'go', rs:'rust', java:'java', c:'c', h:'c', cpp:'cpp', cc:'cpp',
  cs:'csharp', php:'php', swift:'swift', kt:'kotlin', html:'xml', xml:'xml', css:'css',
  scss:'scss', json:'json', yml:'yaml', yaml:'yaml', sh:'bash', bash:'bash', sql:'sql', md:'markdown'
};
function curLang() {
  const manual = document.getElementById('lang').value; // '' = auto
  if (manual) return manual === 'plaintext' ? 'plaintext' : manual;
  const name = document.getElementById('fname').value || '';
  const ext = name.split('.').pop().toLowerCase();
  return EXT_LANG[ext] || null; // null = auto-detect
}

function sync() {
  const v = code.value;
  const n = v.split('\n').length;
  lnums.textContent = Array.from({length: n}, (_, i) => i + 1).join('\n');

  if (!v) {
    hlCode.className = 'hl-ph';
    hlCode.removeAttribute('data-highlighted');
    hlCode.textContent = 'incolla il tuo codice qui...';
    saveState();
    return;
  }

  const lang = curLang();
  hlCode.removeAttribute('data-highlighted');
  hlCode.textContent = v;

  // E3: se highlight.js non è caricato o lingua = plaintext → testo grezzo, niente crash
  if (!window.hljs || lang === 'plaintext') {
    hlCode.className = '';
  } else if (lang && hljs.getLanguage(lang)) {
    hlCode.className = 'language-' + lang;
    hljs.highlightElement(hlCode);
  } else {
    const r = hljs.highlightAuto(v);
    hlCode.innerHTML = r.value;
    hlCode.className = 'hljs';
  }
  saveState();
}

function onLang() { sync(); }

function htab(e) {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = code.selectionStart, en = code.selectionEnd;
  code.value = code.value.slice(0, s) + '  ' + code.value.slice(en);
  code.selectionStart = code.selectionEnd = s + 2;
  sync();
}

function setFname(v) {
  document.getElementById('wname').textContent = v || 'untitled';
  sync(); // estensione cambiata → ri-evidenzia
}

function setFs(v) {
  const px = v + 'px';
  code.style.fontSize = px;
  lnums.style.fontSize = px;
  hlCode.style.fontSize = px;
  sync();
}

function setLh(v) {
  code.style.lineHeight = v;
  lnums.style.lineHeight = v;
  hlCode.style.lineHeight = v;
  saveState();
}

let curTheme = 'dark';
function setTheme(name, el) {
  curTheme = name;
  document.getElementById('win').className = 'th-' + name;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('on'));
  if (el) el.classList.add('on');
  saveState();
}

let curBg = '';
function setBg(v) {
  curBg = v;
  const z = document.getElementById('export-zone');
  z.classList.remove('bg-solid', 'bg-grad-violet', 'bg-grad-blue', 'bg-none');
  if (v) z.classList.add(v);
  saveState();
}

function setPad(v) {
  document.getElementById('padV').textContent = v;
  document.getElementById('export-zone').style.padding = v + 'px';
  saveState();
}

function setW(v) { document.getElementById('win').style.width = v; saveState(); }

let lnOn = true;
function togLn() {
  lnOn = !lnOn;
  document.getElementById('togLn').classList.toggle('on', lnOn);
  lnums.style.display = lnOn ? '' : 'none';
  saveState();
}

let tbOn = true;
function togTb() {
  tbOn = !tbOn;
  document.getElementById('togTb').classList.toggle('on', tbOn);
  document.getElementById('wbar').style.display = tbOn ? '' : 'none';
  saveState();
}

let wmOn = false;
function togWm() {
  wmOn = !wmOn;
  document.getElementById('togWm').classList.toggle('on', wmOn);
  applyWm();
  saveState();
}
function setWm() { applyWm(); saveState(); }
function applyWm() {
  const wm = document.getElementById('wm');
  const t = document.getElementById('wmText').value;
  wm.textContent = t;
  wm.style.display = (wmOn && t) ? '' : 'none';
}

let _tt;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2000);
}

// Render condiviso (usato da salva e copia)
async function renderCanvas() {
  // E2: aspetta i font web, altrimenti il PNG usa un fallback diverso dal video
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }
  const exportZone = document.getElementById('export-zone');
  const scale = parseInt(document.getElementById('scl').value, 10) || 1;

  return html2canvas(exportZone, {
    scale,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    onclone(doc) {
      // Layer visibile = .hl (colorato). Textarea trasparente → nascondi.
      const ta = doc.getElementById('code');
      if (ta) ta.style.display = 'none';

      // B1: espandi finestra per contenere righe lunghe (no clip in export)
      const origWin = document.getElementById('win');
      const clonedWin = doc.getElementById('win');
      if (clonedWin) {
        // E4: per larghezza "piena" (%) tieni la larghezza fissa renderizzata,
        // non forzare max-content (altrimenti il PNG differisce dal preview)
        const wIsPct = /%/.test(origWin.style.width || '');
        if (wIsPct) {
          clonedWin.style.width = origWin.offsetWidth + 'px';
        } else {
          clonedWin.style.minWidth = origWin.offsetWidth + 'px';
          clonedWin.style.width = 'max-content';
        }
        clonedWin.style.overflow = 'visible';
        const wb = clonedWin.querySelector('.wbody');
        if (wb) wb.style.overflow = 'visible';
        const cw = clonedWin.querySelector('.code-wrap');
        if (cw) cw.style.overflow = 'visible';
        const hl = clonedWin.querySelector('.hl');
        if (hl) { hl.style.overflow = 'visible'; if (!wIsPct) hl.style.flex = 'none'; }
      }
    }
  });
}

function exportPNG() {
  // E5: rimuovi solo l'ultima estensione (app.test.js → app.test)
  const fname = (document.getElementById('fname').value || 'code').replace(/\.[^.]*$/, '');
  renderCanvas().then(canvas => {
    const a = document.createElement('a');
    a.download = fname + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast('PNG salvato');
  }).catch(e => { console.error(e); toast('Export fallito'); }); // E1
}

function copyPNG() {
  if (!navigator.clipboard || !window.ClipboardItem) {
    toast('Clipboard non supportata');
    return;
  }
  renderCanvas().then(canvas => {
    canvas.toBlob(blob => {
      if (!blob) { toast('Copia fallita'); return; }
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(() => toast('Copiato negli appunti'))
        .catch(err => { console.error(err); toast('Copia fallita'); });
    }, 'image/png');
  }).catch(e => { console.error(e); toast('Export fallito'); });
}

/* ---- Persistenza localStorage (Feature 2) ---- */
const LS_KEY = 'codeframe.state';
let _restoring = false;
function saveState() {
  if (_restoring) return;
  const s = {
    code: code.value,
    fname: document.getElementById('fname').value,
    fs: document.getElementById('fs') ? document.getElementById('fs').value : null,
    lh: document.getElementById('lh').value,
    lang: document.getElementById('lang').value,
    theme: curTheme,
    bg: curBg,
    pad: document.getElementById('padR').value,
    width: document.getElementById('win').style.width,
    lnOn, tbOn, wmOn,
    wmText: document.getElementById('wmText').value,
    scl: document.getElementById('scl').value
  };
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
}
function restoreState() {
  let s;
  try { s = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  if (!s) return;
  _restoring = true;

  if (typeof s.code === 'string') code.value = s.code;
  if (s.fname != null) { document.getElementById('fname').value = s.fname; setFname(s.fname); }
  if (s.fs) { const el = document.getElementById('fs'); if (el) { el.value = s.fs; setFs(s.fs); } }
  if (s.lh) { document.getElementById('lh').value = s.lh; setLh(s.lh); }
  if (s.lang != null) document.getElementById('lang').value = s.lang;
  if (s.theme) {
    const sw = document.querySelector('.swatch[data-theme="' + s.theme + '"]');
    setTheme(s.theme, sw);
  }
  if (s.bg != null) { document.getElementById('bg').value = s.bg; setBg(s.bg); }
  if (s.pad != null) { document.getElementById('padR').value = s.pad; setPad(s.pad); }
  if (s.width) { document.getElementById('win').style.width = s.width; setSelectByValue('w', s.width); }
  if (typeof s.lnOn === 'boolean' && s.lnOn !== lnOn) togLn();
  if (typeof s.tbOn === 'boolean' && s.tbOn !== tbOn) togTb();
  if (s.wmText != null) document.getElementById('wmText').value = s.wmText;
  if (typeof s.wmOn === 'boolean' && s.wmOn !== wmOn) togWm(); else applyWm();
  if (s.scl) document.getElementById('scl').value = s.scl;

  _restoring = false;
}
// helper: seleziona l'option di una <select> per value (se id presente)
function setSelectByValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

restoreState();
sync();
