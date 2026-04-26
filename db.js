// ============================================================
//  db.js  —  LocalStorage asosidagi shaxslar bazasi
// ============================================================

const DB_KEY = 'face_recognition_db';

const DB = {
  // Barcha yozuvlarni olish
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // Saqlash
  save(entries) {
    localStorage.setItem(DB_KEY, JSON.stringify(entries));
  },

  // Yangi shaxs qo'shish
  add(person) {
    const entries = this.getAll();
    const id = Date.now().toString();
    const entry = { id, ...person, createdAt: new Date().toISOString() };
    entries.push(entry);
    this.save(entries);
    return entry;
  },

  // ID bo'yicha o'chirish
  remove(id) {
    const entries = this.getAll().filter(e => e.id !== id);
    this.save(entries);
  },

  // Hammasini o'chirish
  clear() {
    localStorage.removeItem(DB_KEY);
  },

  // Yuzni qidirish (Euclidean masofa)
  findByFace(descriptor, threshold = 0.48) {
    const entries = this.getAll().filter(e => e.descriptor);
    let bestMatch = null;
    let bestDist = Infinity;

    entries.forEach(entry => {
      const stored = new Float32Array(Object.values(entry.descriptor));
      const dist = euclideanDistance(descriptor, stored);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = entry;
      }
    });

    return bestDist <= threshold ? { person: bestMatch, distance: bestDist } : null;
  },

  // Soni
  count() {
    return this.getAll().length;
  }
};

// Euclidean masofa hisoblash
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
