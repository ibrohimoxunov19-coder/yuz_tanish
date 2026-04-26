// ============================================================
//  app.js  —  Asosiy dastur mantig'i (v2)
// ============================================================

let currentDescriptor = null;

const startBtn    = document.getElementById('startBtn');
const captureBtn  = document.getElementById('captureBtn');
const stopBtn     = document.getElementById('stopBtn');
const saveBtn     = document.getElementById('saveBtn');
const clearDbBtn  = document.getElementById('clearDbBtn');
const searchInput = document.getElementById('searchInput');
const unknownCard = document.getElementById('unknownCard');
const connectIpBtn = document.getElementById('connectIpBtn');

startBtn.disabled = true;

// ---- Modellar + TTS init ----
window.addEventListener('DOMContentLoaded', async () => {
  TTS.init();
  renderDbList();
  setupVoiceControls();
  setupSourceToggle();
  const ok = await loadModels();
  if (ok) startBtn.disabled = false;
});

// ---- Manba tanlash (webcam / ipcam) ----
function setupSourceToggle() {
  document.querySelectorAll('input[name="source"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const ipcamInput = document.getElementById('ipcamInput');
      ipcamInput.style.display = radio.value === 'ipcam' ? 'flex' : 'none';
    });
  });

  connectIpBtn.addEventListener('click', async () => {
    const url = document.getElementById('ipUrl').value.trim();
    if (!url) { setStatus('IP manzilni kiriting!'); return; }
    IPCAM.setUrl(url);
    const ok = await IPCAM.test(url);
    setStatus(ok ? '✅ Manzil to\'g\'ri. "Kamerani yoqish" tugmasini bosing.' : '❌ Ulanib bo\'lmadi. Manzil yoki Wi-Fi ni tekshiring.');
  });
}

// ---- Ovoz sozlamalari ----
function setupVoiceControls() {
  const ttsEnabled = document.getElementById('ttsEnabled');
  const voiceLang  = document.getElementById('voiceLang');
  const voiceRate  = document.getElementById('voiceRate');
  const voiceRateVal = document.getElementById('voiceRateVal');
  const testVoiceBtn = document.getElementById('testVoiceBtn');

  ttsEnabled.addEventListener('change', () => { TTS.enabled = ttsEnabled.checked; });
  voiceLang.addEventListener('change', () => { TTS.lang = voiceLang.value; });
  voiceRate.addEventListener('input', () => {
    TTS.rate = parseFloat(voiceRate.value);
    voiceRateVal.textContent = parseFloat(voiceRate.value).toFixed(1);
  });
  testVoiceBtn.addEventListener('click', () => TTS.test());
}

// ---- Kamera yoqish ----
startBtn.addEventListener('click', async () => {
  const ok = await startCamera();
  if (ok) {
    startBtn.disabled = true;
    captureBtn.disabled = false;
    stopBtn.disabled = false;
    resetPersonPanel();
  }
});

// ---- Kamera o'chirish ----
stopBtn.addEventListener('click', () => {
  stopCamera();
  startBtn.disabled = false;
  captureBtn.disabled = true;
  stopBtn.disabled = true;
  unknownCard.style.display = 'none';
  resetPersonPanel();
});

// ---- Tahlil qilish ----
captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  unknownCard.style.display = 'none';
  currentDescriptor = null;
  resetPersonPanel();

  const result = await analyzeFrame();
  captureBtn.disabled = false;
  if (!result) return;

  renderEmotions(result.expressions);
  currentDescriptor = result.descriptor;

  // Dominant kayfiyat
  const sorted = Object.entries(result.expressions).sort((a,b) => b[1]-a[1]);
  const dominantKey = sorted[0][0];
  const emotionInfo = EMOTION_MULTILANG[dominantKey] || { uz: dominantKey, ru: dominantKey, en: dominantKey };

  // Bazadan qidirish
  const match = DB.findByFace(result.descriptor);
  if (match) {
    showPerson(match.person);
    setStatus(`✅ Tanildi! (masofa: ${match.distance.toFixed(3)})`);
    TTS.announceKnown(match.person, emotionInfo);
  } else {
    showUnknown();
    setStatus('❓ Noma\'lum shaxs. Ma\'lumot kiriting.');
    TTS.announceUnknown(emotionInfo);
  }
});

// ---- Yangi shaxs saqlash ----
saveBtn.addEventListener('click', () => {
  const name = document.getElementById('newName').value.trim();
  if (!name) { alert('Iltimos, ism kiriting!'); return; }
  if (!currentDescriptor) { alert('Avval "Tahlil qilish" ni bosing.'); return; }

  const person = {
    name,
    age:  document.getElementById('newAge').value || '',
    job:  document.getElementById('newJob').value.trim(),
    dept: document.getElementById('newDept').value.trim(),
    info: document.getElementById('newInfo').value.trim(),
    descriptor: Object.assign({}, currentDescriptor)
  };

  const saved = DB.add(person);
  showPerson(saved);
  unknownCard.style.display = 'none';
  clearForm();
  renderDbList();
  setStatus(`✅ "${saved.name}" saqlandi!`);
  TTS.speak(TTS.lang.startsWith('ru') ? `${saved.name} сохранён в базе.`
    : TTS.lang.startsWith('en') ? `${saved.name} saved to database.`
    : `${saved.name} bazaga saqlandi.`);
});

// ---- Bazani tozalash ----
clearDbBtn.addEventListener('click', () => {
  if (confirm('Bazani tozalash?')) {
    DB.clear(); renderDbList(); resetPersonPanel();
    setStatus('Baza tozalandi.');
  }
});

// ---- Qidirish ----
searchInput.addEventListener('input', () => renderDbList(searchInput.value.trim()));

// ============================================================
//  UI funksiyalar
// ============================================================
function showPerson(p) {
  const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('personAvatar').textContent = initials;
  document.getElementById('personName').textContent = p.name;
  document.getElementById('personMeta').textContent =
    [p.age ? p.age+' yosh' : '', p.job, p.dept].filter(Boolean).join(' · ');
  document.getElementById('personExtra').textContent = p.info || '';
}

function showUnknown() {
  document.getElementById('personAvatar').textContent = '?';
  document.getElementById('personName').textContent = 'Noma\'lum shaxs';
  document.getElementById('personMeta').textContent = '';
  document.getElementById('personExtra').textContent = '';
  unknownCard.style.display = 'block';
}

function resetPersonPanel() {
  document.getElementById('personAvatar').textContent = '?';
  document.getElementById('personName').textContent = '—';
  document.getElementById('personMeta').textContent = '';
  document.getElementById('personExtra').textContent = '';
  document.getElementById('emotionBars').innerHTML = '<p class="muted">Tahlil kutilmoqda...</p>';
  document.getElementById('dominantEmotion').textContent = '';
}

function clearForm() {
  ['newName','newAge','newJob','newDept','newInfo'].forEach(id => document.getElementById(id).value = '');
}

function renderDbList(filter = '') {
  const list = document.getElementById('dbList');
  document.getElementById('dbCount').textContent = DB.count();
  let entries = DB.getAll();
  if (filter) {
    const q = filter.toLowerCase();
    entries = entries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.job||'').toLowerCase().includes(q) ||
      (e.dept||'').toLowerCase().includes(q)
    );
  }
  if (!entries.length) {
    list.innerHTML = filter ? '<p class="muted">Topilmadi.</p>' : '<p class="muted">Baza bo\'sh.</p>';
    return;
  }
  list.innerHTML = entries.map(p => {
    const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const meta = [p.age ? p.age+' y.' : '', p.job, p.dept].filter(Boolean).join(' · ');
    const date = new Date(p.createdAt).toLocaleDateString('uz-UZ');
    return `
      <div class="db-item">
        <div class="avatar">${initials}</div>
        <div class="db-item-info">
          <div class="db-item-name">${p.name}</div>
          <div class="db-item-meta">${meta}</div>
        </div>
        <span class="badge">${date}</span>
        <button class="btn" style="font-size:12px;padding:4px 10px;" onclick="removeEntry('${p.id}')">O'chirish</button>
      </div>`;
  }).join('');
}

window.removeEntry = function(id) {
  if (confirm('O\'chirishni tasdiqlang')) {
    DB.remove(id);
    renderDbList(searchInput.value.trim());
  }
};
