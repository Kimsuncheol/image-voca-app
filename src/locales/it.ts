import en from "./en";

const it: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "Annulla",
    error: "Errore",
    close: "Chiudi",
    confirm: "Conferma",
    retry: "Riprova",
    loading: "Caricamento...",
    delete: "Elimina",
  },
  tabs: {
    ...en.tabs,
    dashboard: "Dashboard",
    wordBank: "Banca parole",
    voca: "Voca",
    calendar: "Calendario",
    settings: "Impostazioni",
  },
  settings: {
    ...en.settings,
    title: "Impostazioni",
    language: {
      ...en.settings.language,
      title: "Lingua",
      systemDefault: "Predefinita di sistema",
      english: "Inglese",
      englishUnitedStates: "Inglese (Stati Uniti)",
      englishUnitedKingdom: "Inglese (Regno Unito)",
      korean: "Coreano",
      japanese: "Giapponese",
      spanish: "Spagnolo",
      french: "Francese",
      russian: "Russo",
      german: "Tedesco",
      italian: "Italiano",
      hindi: "Hindi",
      learningLanguage: "Lingua di apprendimento",
      wishToLearn: "La lingua che vuoi imparare",
    },
    speech: {
      ...en.settings.speech,
      title: "Voce e maschera",
      speed: "Velocità della voce",
      autoVocabularySpeech: "Voce automatica",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "Il volume è disattivato",
      volumeMutedMessage:
        "Il volume del dispositivo è impostato su 0. Aumenta il volume per ascoltare la voce.",
      lowVolumeMessage:
        "Il volume del dispositivo è basso ({{percentage}}%). Potresti non sentire chiaramente la voce.",
      silentModeTitle: "La modalità silenziosa è attiva",
      silentModeMessage: "Modalità silenziosa attiva. Disattivala per ascoltare la voce.",
      playAnyway: "Riproduci comunque",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "Nessuna connessione internet",
      message: "Connettiti a internet per riprodurre la voce.",
    },
  },
};

export default it;
