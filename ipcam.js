// ============================================================
//  ipcam.js  —  IP Webcam (Android) integratsiyasi
//
//  Telefonda: "IP Webcam" ilovasini o'rnating (Pavel Khlebovich)
//  Play Store: https://play.google.com/store/apps/details?id=com.pas.webcam
//
//  Ilova manzili: http://TELEFON_IP:8080
//  Video oqimi:   http://TELEFON_IP:8080/video
//  Rasm:          http://TELEFON_IP:8080/shot.jpg
// ============================================================

const IPCAM = {
  baseUrl: '',
  isActive: false,
  frameTimer: null,
  snapshotUrl: '',
  videoUrl: '',

  // IP manzilni sozlash
  setUrl(url) {
    // Oxiridagi / ni olib tashlash
    this.baseUrl = url.replace(/\/$/, '');
    this.snapshotUrl = `${this.baseUrl}/shot.jpg`;
    this.videoUrl = `${this.baseUrl}/video`;
  },

  // Ulanishni tekshirish
  async test(url) {
    this.setUrl(url);
    try {
      // shot.jpg dan test rasm olish
      const testUrl = `${this.snapshotUrl}?t=${Date.now()}`;
      const res = await fetch(testUrl, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch (e) {
      console.error('IP Webcam ulanish xatosi:', e);
      return false;
    }
  },

  // Rasm oqimini boshlash (MJPEG yoki snapshot)
  startStream(imgEl, overlayCanvas) {
    this.isActive = true;
    const img = imgEl;

    // Avval MJPEG stream sinab ko'ramiz
    const mjpegUrl = `${this.videoUrl}`;
    img.src = mjpegUrl;
    img.style.display = 'block';

    img.onerror = () => {
      // MJPEG ishlamasa, snapshot rejimiga o'tamiz
      console.log('MJPEG ishlamadi, snapshot rejimiga o\'tilmoqda...');
      img.onerror = null;
      this.startSnapshotMode(img);
    };

    img.onload = () => {
      // Overlay canvas o'lchamini moslashtirish
      if (overlayCanvas && img.naturalWidth) {
        overlayCanvas.width = img.naturalWidth;
        overlayCanvas.height = img.naturalHeight;
      }
    };
  },

  // Snapshot rejimi — har 500ms da yangi rasm
  startSnapshotMode(imgEl) {
    this.frameTimer = setInterval(() => {
      if (!this.isActive) return;
      imgEl.src = `${this.snapshotUrl}?t=${Date.now()}`;
    }, 500);
  },

  // To'xtatish
  stop(imgEl) {
    this.isActive = false;
    clearInterval(this.frameTimer);
    this.frameTimer = null;
    if (imgEl) { imgEl.src = ''; imgEl.style.display = 'none'; }
  },

  // IP Webcam dan canvas orqali yuz tahlili uchun rasm olish
  async captureFrame() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 480;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Rasm olinmadi'));
      img.src = `${this.snapshotUrl}?t=${Date.now()}`;
    });
  }
};
