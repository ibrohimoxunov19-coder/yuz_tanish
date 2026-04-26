// ============================================================
//  emotion.js  —  Kayfiyat tahlili va ko'rsatish
// ============================================================

const EMOTIONS = {
  happy:     { uz: 'Xursand',      color: '#639922', emoji: '😊' },
  sad:       { uz: "G'amgin",      color: '#378ADD', emoji: '😢' },
  angry:     { uz: "G'azablangan", color: '#E24B4A', emoji: '😠' },
  fearful:   { uz: "Qo'rqqan",     color: '#D85A30', emoji: '😨' },
  disgusted: { uz: 'Jirkanarli',   color: '#3B6D11', emoji: '🤢' },
  surprised: { uz: 'Hayron',       color: '#BA7517', emoji: '😲' },
  neutral:   { uz: 'Neytral',      color: '#888780', emoji: '😐' }
};

// Kayfiyat panelini yangilash
function renderEmotions(expressions) {
  const barsEl = document.getElementById('emotionBars');
  const dominantEl = document.getElementById('dominantEmotion');

  if (!expressions) {
    barsEl.innerHTML = '<p class="muted">Kayfiyat aniqlanmadi</p>';
    dominantEl.textContent = '';
    return;
  }

  // Saralab chiqarish
  const sorted = Object.entries(expressions)
    .sort((a, b) => b[1] - a[1]);

  const dominant = sorted[0];
  const dominantInfo = EMOTIONS[dominant[0]] || { emoji: '🤔', uz: dominant[0] };

  barsEl.innerHTML = sorted.map(([key, val]) => {
    const info = EMOTIONS[key] || { uz: key, color: '#888', emoji: '' };
    const pct = Math.round(val * 100);
    return `
      <div class="emotion-row">
        <span class="emo-label">${info.emoji} ${info.uz}</span>
        <div class="emo-bar-bg">
          <div class="emo-bar" style="width:${pct}%; background:${info.color};"></div>
        </div>
        <span class="emo-pct">${pct}%</span>
      </div>
    `;
  }).join('');

  dominantEl.textContent = `${dominantInfo.emoji} Asosiy kayfiyat: ${dominantInfo.uz} (${Math.round(dominant[1] * 100)}%)`;
}

// Kayfiyat nomi (asosiy)
function getDominantEmotion(expressions) {
  if (!expressions) return null;
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const [key, val] = sorted[0];
  const info = EMOTIONS[key] || { uz: key, emoji: '🤔' };
  return { key, value: val, ...info };
}
