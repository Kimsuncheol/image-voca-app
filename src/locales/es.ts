import en from "./en";

const es: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "Cancelar",
    error: "Error",
    close: "Cerrar",
    confirm: "Confirmar",
    retry: "Reintentar",
    loading: "Cargando...",
    delete: "Eliminar",
  },
  tabs: {
    ...en.tabs,
    dashboard: "Panel",
    wordBank: "Banco de palabras",
    voca: "Voca",
    calendar: "Calendario",
    settings: "Ajustes",
  },
  settings: {
    ...en.settings,
    title: "Ajustes",
    language: {
      ...en.settings.language,
      title: "Idioma",
      systemDefault: "Predeterminado del sistema",
      english: "Inglés",
      englishUnitedStates: "Inglés (Estados Unidos)",
      englishUnitedKingdom: "Inglés (Reino Unido)",
      korean: "Coreano",
      japanese: "Japonés",
      spanish: "Español",
      french: "Francés",
      russian: "Ruso",
      german: "Alemán",
      italian: "Italiano",
      hindi: "Hindi",
      learningLanguage: "Idioma de aprendizaje",
      wishToLearn: "El idioma que quieres aprender",
    },
    speech: {
      ...en.settings.speech,
      title: "Voz y máscara",
      speed: "Velocidad de voz",
      autoVocabularySpeech: "Voz automática",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "El volumen está silenciado",
      volumeMutedMessage:
        "El volumen del dispositivo está en 0. Sube el volumen para escuchar la voz.",
      lowVolumeMessage:
        "El volumen del dispositivo es bajo ({{percentage}}%). Puede que no escuches la voz con claridad.",
      silentModeTitle: "El modo silencioso está activado",
      silentModeMessage: "Modo silencioso activado. Desactívalo para escuchar la voz.",
      playAnyway: "Reproducir de todos modos",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "Sin conexión a internet",
      message: "Conéctate a internet para reproducir la voz.",
    },
  },
};

export default es;
