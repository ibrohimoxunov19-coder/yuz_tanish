// ============================================================
//  camera.js  —  Kamera va yuz aniqlash (v2)
// ============================================================

const MODEL_URL = './models';

let videoStream = null;
let liveDetectionTimer = null;
let currentSource = 'webcam'; // 'webcam' | 'ipcam'

// ---- Model yuklash ----
async function loadModels() {
  const statusEl = document.getElementById('modelStatus');
  try {
    statusEl.textContent = '⏳ Modellar yuklanmoqda...';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    statusEl.textContent = '✅ Tayyor';
    statusEl.classList.add('ready');
    setStatus('Tayyor. Kamera manbасini tanlang va yoqing.');
    document.getElementById('startBtn').disabled = false;
    return true;
  } catch (err) {
    statusEl.textContent = '❌ Model xatosi';
    setStatus(`Xato: ${err.message}. models/ papkasini tekshiring.`);
    return false;
  }
}

// ---- Kamera yoqish ----
async function startCamera() {
  currentSource = document.querySelector('input[name="source"]:checked').value;

  if (currentSource === 'ipcam') {
    return await startIpCam();
  } else {
    return await startWebcam();
  }
}

// ---- Oddiy webcam ----
async function startWebcam() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    const video = document.getElementById('video');
    video.srcObject = videoStream;
    video.style.display = 'block';
    document.getElementById('ipFrame').style.display = 'none';
    await new Promise(r => video.onloadedmetadata = r);
    resizeOverlay(video.videoWidth, video.videoHeight);
    setStatus('Kamera yoqildi. "Tahlil qilish" tugmasini bosing.');
    startLiveDetection();
    return true;
  } catch (err) {
    setStatus(`Kamera xatosi: ${err.message}`);
    return false;
  }
}

// ---- IP Webcam ----
async function startIpCam() {
  const url = document.getElementById('ipUrl').value.trim();
  if (!url) { setStatus('❌ IP manzilni kiriting!'); return false; }

  setStatus('📱 IP Webcam ga ulanilmoqda...');
  const ok = await IPCAM.test(url);
  if (!ok) {
    setStatus('❌ Ulanib bo\'lmadi. Manzilni tekshiring va telefon bilan bir xil Wi-Fi da ekaningizni tekshiring.');
    return false;
  }

  const video = document.getElementById('video');
  const ipFrame = document.getElementById('ipFrame');
  video.style.display = 'none';
  video.srcObject = null;

  IPCAM.startStream(ipFrame, document.getElementById('overlay'));
  setStatus('📱 IP Webcam ulandi! "Tahlil qilish" tugmasini bosing.');
  startLiveDetectionIp();
  return true;
}

// ---- Kamera o'chirish ----
function stopCamera() {
  if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
  IPCAM.stop(document.getElementById('ipFrame'));
  stopLiveDetection();
  const ctx = document.getElementById('overlay').getContext('2d');
  ctx.clearRect(0, 0, 9999, 9999);
  document.getElementById('video').style.display = 'block';
  setStatus('Kamera o\'chirildi.');
}

// ---- Overlay canvas o'lchamini moslashtirish ----
function resizeOverlay(w, h) {
  const overlay = document.getElementById('overlay');
  overlay.width = w;
  overlay.height = h;
}

// ---- Real vaqt yuz chegarasi (webcam) ----
function startLiveDetection() {
  const video = document.getElementById('video');
  const overlay = document.getElementById('overlay');
  const ctx = overlay.getContext('2d');

  liveDetectionTimer = setInterval(async () => {
    if (!video.videoWidth) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const dets = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true);
    drawFaceBoxes(ctx, dets, overlay.width, overlay.height);
  }, 500);
}

// ---- Real vaqt yuz chegarasi (IP cam) ----
function startLiveDetectionIp() {
  const ipFrame = document.getElementById('ipFrame');
  const overlay = document.getElementById('overlay');
  const ctx = overlay.getContext('2d');

  liveDetectionTimer = setInterval(async () => {
    if (!ipFrame.naturalWidth) return;
    resizeOverlay(ipFrame.naturalWidth, ipFrame.naturalHeight);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    try {
      const canvas = await IPCAM.captureFrame();
      const dets = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true);
      drawFaceBoxes(ctx, dets, overlay.width, overlay.height);
    } catch {}
  }, 800);
}

function stopLiveDetection() {
  clearInterval(liveDetectionTimer);
  liveDetectionTimer = null;
}

// ---- Yuz qutichalarini chizish ----
function drawFaceBoxes(ctx, dets, w, h) {
  dets.forEach(det => {
    const { x, y, width, height } = det.detection.box;
    ctx.strokeStyle = '#185FA5';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    const c = 14;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 3;
    [[x,y],[x+width,y],[x,y+height],[x+width,y+height]].forEach(([cx,cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx - (cx > x+width/2 ? c : -c), cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + (cy > y+height/2 ? -c : c));
      ctx.stroke();
    });
  });
  if (dets.length > 0) {
    ctx.fillStyle = 'rgba(24,95,165,0.85)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${dets.length} yuz`, 8, 22);
  }
}

// ---- Yuz tahlili ----
async function analyzeFrame() {
  setStatus('🔍 Tahlil qilinmoqda...');
  let source;

  if (currentSource === 'ipcam') {
    try {
      source = await IPCAM.captureFrame();
    } catch {
      setStatus('❌ IP Webcam dan rasm olinmadi.');
      return null;
    }
  } else {
    source = document.getElementById('video');
  }

  const det = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceExpressions()
    .withFaceDescriptor();

  if (!det) {
    setStatus('⚠️ Yuz aniqlanmadi. Yoritishni yaxshilang yoki to\'g\'ri turgan holda bosing.');
    return null;
  }

  return { descriptor: det.descriptor, expressions: det.expressions, box: det.detection.box };
}

function setStatus(msg) {
  document.getElementById('statusMsg').textContent = msg;
}
