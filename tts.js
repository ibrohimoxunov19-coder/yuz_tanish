// ============================================================
//  tts.js  —  Text-to-Speech (Ovozli e'lon)
//  Web Speech API ishlatadi — bepul, brauzerda o'rnatilgan
// ============================================================

const TTS = {
  synth: window.speechSynthesis,
  enabled: true,
  lang: 'ru-RU',
  rate: 1.0,
  voices: [],

  init() {
    if (!this.synth) {
      console.warn('TTS: Bu brauzer Web Speech API ni qo\'llab-quvvatlamaydi.');
      return;
    }
    // Ovozlar ro'yxatini yuklash
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
    };
    loadVoices();
    this.synth.onvoiceschanged = loadVoices;
  },

  // Matnni o'qib berish
  speak(text) {
    if (!this.enabled || !this.synth || !text) return;
    this.synth.cancel(); // Avvalgi nutqni to'xtatish
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = this.lang;
    utt.rate = this.rate;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    // Til mos ovoz tanlash
    const match = this.voices.find(v => v.lang.startsWith(this.lang.split('-')[0]));
    if (match) utt.voice = match;

    this.synth.speak(utt);
  },

  // Shaxs tanilganda e'lon qilish
  announceKnown(person, emotion) {
    const lang = this.lang;
    let text = '';

    if (lang.startsWith('ru')) {
      text = `Добро пожаловать, ${person.name}.`;
      if (person.job) text += ` ${person.job}.`;
      if (person.dept) text += ` Отдел: ${person.dept}.`;
      if (person.info) text += ` ${person.info}.`;
      if (emotion) text += ` Настроение: ${emotion.ru || emotion.uz}.`;
    } else if (lang.startsWith('en')) {
      text = `Welcome, ${person.name}.`;
      if (person.job) text += ` ${person.job}.`;
      if (person.dept) text += ` Department: ${person.dept}.`;
      if (person.info) text += ` ${person.info}.`;
      if (emotion) text += ` Mood: ${emotion.en || emotion.uz}.`;
    } else {
      text = `Xush kelibsiz, ${person.name}.`;
      if (person.job) text += ` ${person.job}.`;
      if (person.dept) text += ` Bo'lim: ${person.dept}.`;
      if (person.info) text += ` ${person.info}.`;
      if (emotion) text += ` Kayfiyat: ${emotion.uz}.`;
    }

    this.speak(text);
  },

  // Noma'lum shaxs
  announceUnknown(emotion) {
    const lang = this.lang;
    let text = '';

    if (lang.startsWith('ru')) {
      text = 'Незнакомый человек.';
      if (emotion) text += ` Настроение: ${emotion.ru || emotion.uz}.`;
    } else if (lang.startsWith('en')) {
      text = 'Unknown person detected.';
      if (emotion) text += ` Mood: ${emotion.en || emotion.uz}.`;
    } else {
      text = 'Noma\'lum shaxs aniqlandi.';
      if (emotion) text += ` Kayfiyat: ${emotion.uz}.`;
    }

    this.speak(text);
  },

  // Test
  test() {
    const lang = this.lang;
    if (lang.startsWith('ru')) this.speak('Голосовая система работает нормально.');
    else if (lang.startsWith('en')) this.speak('Voice system is working correctly.');
    else this.speak('Ovoz tizimi to\'g\'ri ishlayapti.');
  }
};

// Kayfiyat nomlarini ko'p tilda
const EMOTION_MULTILANG = {
  happy:     { uz: 'Xursand',      ru: 'Радостный',    en: 'Happy' },
  sad:       { uz: "G'amgin",      ru: 'Грустный',     en: 'Sad' },
  angry:     { uz: "G'azablangan", ru: 'Злой',         en: 'Angry' },
  fearful:   { uz: "Qo'rqqan",     ru: 'Испуганный',   en: 'Fearful' },
  disgusted: { uz: 'Jirkanarli',   ru: 'Отвращение',   en: 'Disgusted' },
  surprised: { uz: 'Hayron',       ru: 'Удивлённый',   en: 'Surprised' },
  neutral:   { uz: 'Neytral',      ru: 'Нейтральный',  en: 'Neutral' }
};
