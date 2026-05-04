import en from "./en";

const fr: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "Annuler",
    error: "Erreur",
    close: "Fermer",
    confirm: "Confirmer",
    retry: "Réessayer",
    loading: "Chargement...",
    delete: "Supprimer",
  },
  tabs: {
    ...en.tabs,
    dashboard: "Tableau de bord",
    wordBank: "Banque de mots",
    voca: "Voca",
    calendar: "Calendrier",
    settings: "Réglages",
  },
  settings: {
    ...en.settings,
    title: "Réglages",
    language: {
      ...en.settings.language,
      title: "Langue",
      systemDefault: "Langue du système",
      english: "Anglais",
      englishUnitedStates: "Anglais (États-Unis)",
      englishUnitedKingdom: "Anglais (Royaume-Uni)",
      korean: "Coréen",
      japanese: "Japonais",
      spanish: "Espagnol",
      french: "Français",
      russian: "Russe",
      german: "Allemand",
      italian: "Italien",
      hindi: "Hindi",
      learningLanguage: "Langue d'apprentissage",
      wishToLearn: "La langue que vous voulez apprendre",
    },
    speech: {
      ...en.settings.speech,
      title: "Voix et masque",
      speed: "Vitesse de la voix",
      autoVocabularySpeech: "Voix automatique",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "Le volume est coupé",
      volumeMutedMessage:
        "Le volume de votre appareil est réglé sur 0. Augmentez le volume pour entendre la voix.",
      lowVolumeMessage:
        "Le volume de l'appareil est faible ({{percentage}}%). Vous risquez de ne pas entendre clairement la voix.",
      silentModeTitle: "Le mode silencieux est activé",
      silentModeMessage: "Mode silencieux activé. Désactivez-le pour entendre la voix.",
      playAnyway: "Lire quand même",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "Pas de connexion internet",
      message: "Connectez-vous à internet pour lire la voix.",
    },
  },
};

export default fr;
