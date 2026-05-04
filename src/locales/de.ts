import en from "./en";

const de: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "Abbrechen",
    error: "Fehler",
    close: "Schließen",
    confirm: "Bestätigen",
    retry: "Erneut versuchen",
    loading: "Wird geladen...",
    delete: "Löschen",
  },
  tabs: {
    ...en.tabs,
    dashboard: "Dashboard",
    wordBank: "Wortbank",
    voca: "Voca",
    calendar: "Kalender",
    settings: "Einstellungen",
  },
  settings: {
    ...en.settings,
    title: "Einstellungen",
    language: {
      ...en.settings.language,
      title: "Sprache",
      systemDefault: "Systemstandard",
      english: "Englisch",
      englishUnitedStates: "Englisch (Vereinigte Staaten)",
      englishUnitedKingdom: "Englisch (Vereinigtes Königreich)",
      korean: "Koreanisch",
      japanese: "Japanisch",
      spanish: "Spanisch",
      french: "Französisch",
      russian: "Russisch",
      german: "Deutsch",
      italian: "Italienisch",
      hindi: "Hindi",
      learningLanguage: "Lernsprache",
      wishToLearn: "Die Sprache, die du lernen möchtest",
    },
    speech: {
      ...en.settings.speech,
      title: "Sprache und Maske",
      speed: "Sprechgeschwindigkeit",
      autoVocabularySpeech: "Automatische Sprachausgabe",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "Lautstärke ist stummgeschaltet",
      volumeMutedMessage:
        "Die Gerätelautstärke ist auf 0 eingestellt. Erhöhe die Lautstärke, um die Sprache zu hören.",
      lowVolumeMessage: "Niedrige Lautstärke ({{percentage}}%). Sprache kann leise sein.",
      silentModeTitle: "Stummmodus ist aktiviert",
      silentModeMessage: "Stummmodus ist an. Schalte ihn aus, um Sprache zu hören.",
      playAnyway: "Trotzdem abspielen",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "Keine Internetverbindung",
      message: "Verbinde dich mit dem Internet, um die Sprache abzuspielen.",
    },
  },
};

export default de;
