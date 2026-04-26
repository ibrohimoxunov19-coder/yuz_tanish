# Yuz Tanish va Kayfiyat Tizimi

Brauzerda ishlaydigan, serverсиз yuz tanish va kayfiyat aniqlash ilovasi.

---

## 📦 Papka tuzilmasi

```
face-recognition/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js       ← Asosiy mantiq
│   ├── camera.js    ← Kamera va face-api
│   ├── db.js        ← LocalStorage baza
│   └── emotion.js   ← Kayfiyat ko'rsatish
├── models/          ← ⚠️ Modellarni shu yerga joylashtiring!
│   ├── tiny_face_detector_model-weights_manifest.json
│   ├── tiny_face_detector_model-shard1
│   ├── face_landmark_68_tiny_model-weights_manifest.json
│   ├── face_landmark_68_tiny_model-shard1
│   ├── face_recognition_model-weights_manifest.json
│   ├── face_recognition_model-shard1
│   ├── face_recognition_model-shard2
│   ├── face_expression_model-weights_manifest.json
│   └── face_expression_model-shard1
└── README.md
```

---

## 🚀 Ishga tushirish (2 qadam)

### 1-qadam: Modellarni yuklab olish

Quyidagi manzildan modellarni yuklab, `models/` papkasiga joylashtiring:

```
https://github.com/vladmandic/face-api/tree/master/model
```

**Yoki terminalda:**
```bash
mkdir models
cd models

# Kerakli fayllar:
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_tiny_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_tiny_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard2
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-shard1
```

### 2-qadam: Local server ishga tushirish

**VS Code bilan (tavsiya etiladi):**
1. VS Code da `Live Server` extension o'rnating
2. `index.html` ni oching → pastdagi `Go Live` tugmasini bosing

**yoki Python bilan:**
```bash
python -m http.server 5500
# Keyin: http://localhost:5500
```

**yoki Node.js bilan:**
```bash
npx serve .
```

> ⚠️ `file://` orqali to'g'ridan-to'g'ri ochmang — kamera ruxsati ishlamaydi.

---

## ✨ Imkoniyatlar

| Funksiya | Tavsif |
|----------|--------|
| Yuz aniqlash | Real vaqtda yuzni qutichada ko'rsatish |
| Yuz tanish | Bazadagi shaxsni topish |
| Kayfiyat tahlili | 7 ta kayfiyat: xursand, g'amgin, g'azablangan va boshqalar |
| Bazaga qo'shish | Yangi shaxs uchun ism, yosh, kasb kiritish |
| Qidirish | Bazadagi shaxslarni filterlash |
| O'chirish | Alohida yoki barchasini o'chirish |

---

## 🔧 Sozlamalar

`js/camera.js` faylida:
```js
// Aniqlik chegarasi (past → ko'proq qabul qiladi, yuqori → qat'iyroq)
DB.findByFace(descriptor, threshold = 0.48)
```

---

## 📝 Eslatmalar

- Ma'lumotlar **faqat sizning brauzeringizda** saqlanadi (localStorage)
- Server, bulut yoki internet kerak emas (modellar yuklanganidan keyin)
- Eng yaxshi natija uchun: yaxshi yoritish, to'g'ri turing, kamera bilan ko'z barobari bo'ling
