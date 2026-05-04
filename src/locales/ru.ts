import en from "./en";

const ru: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "Отмена",
    error: "Ошибка",
    close: "Закрыть",
    confirm: "Подтвердить",
    retry: "Повторить",
    loading: "Загрузка...",
    delete: "Удалить",
  },
  tabs: {
    ...en.tabs,
    dashboard: "Панель",
    wordBank: "Словарь",
    voca: "Voca",
    calendar: "Календарь",
    settings: "Настройки",
  },
  settings: {
    ...en.settings,
    title: "Настройки",
    language: {
      ...en.settings.language,
      title: "Язык",
      systemDefault: "Системный язык",
      english: "Английский",
      englishUnitedStates: "Английский (США)",
      englishUnitedKingdom: "Английский (Великобритания)",
      korean: "Корейский",
      japanese: "Японский",
      spanish: "Испанский",
      french: "Французский",
      russian: "Русский",
      german: "Немецкий",
      italian: "Итальянский",
      hindi: "Хинди",
      learningLanguage: "Язык обучения",
      wishToLearn: "Язык, который вы хотите изучать",
    },
    speech: {
      ...en.settings.speech,
      title: "Речь и маска",
      speed: "Скорость речи",
      autoVocabularySpeech: "Автоматическая речь",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "Звук отключен",
      volumeMutedMessage:
        "Громкость устройства установлена на 0. Увеличьте громкость, чтобы услышать речь.",
      lowVolumeMessage: "Низкая громкость ({{percentage}}%). Речь может быть тихой.",
      silentModeTitle: "Включен беззвучный режим",
      silentModeMessage: "Беззвучный режим включен. Отключите его, чтобы слышать речь.",
      playAnyway: "Все равно воспроизвести",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "Нет подключения к интернету",
      message: "Подключитесь к интернету, чтобы воспроизвести речь.",
    },
  },
};

export default ru;
