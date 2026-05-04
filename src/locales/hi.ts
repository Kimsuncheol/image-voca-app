import en from "./en";

const hi: typeof en = {
  ...en,
  common: {
    ...en.common,
    cancel: "रद्द करें",
    error: "त्रुटि",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    retry: "फिर से प्रयास करें",
    loading: "लोड हो रहा है...",
    delete: "हटाएं",
  },
  tabs: {
    ...en.tabs,
    dashboard: "डैशबोर्ड",
    wordBank: "शब्द बैंक",
    voca: "Voca",
    calendar: "कैलेंडर",
    settings: "सेटिंग्स",
  },
  settings: {
    ...en.settings,
    title: "सेटिंग्स",
    language: {
      ...en.settings.language,
      title: "भाषा",
      systemDefault: "सिस्टम डिफ़ॉल्ट",
      english: "अंग्रेज़ी",
      englishUnitedStates: "अंग्रेज़ी (संयुक्त राज्य अमेरिका)",
      englishUnitedKingdom: "अंग्रेज़ी (यूनाइटेड किंगडम)",
      korean: "कोरियाई",
      japanese: "जापानी",
      spanish: "स्पेनिश",
      french: "फ़्रेंच",
      russian: "रूसी",
      german: "जर्मन",
      italian: "इतालवी",
      hindi: "हिंदी",
      learningLanguage: "सीखने की भाषा",
      wishToLearn: "वह भाषा जिसे आप सीखना चाहते हैं",
    },
    speech: {
      ...en.settings.speech,
      title: "वाणी और मास्क",
      speed: "वाणी की गति",
      autoVocabularySpeech: "स्वचालित वाणी",
    },
  },
  studyMode: {
    speech: {
      volumeMutedTitle: "वॉल्यूम म्यूट है",
      volumeMutedMessage:
        "आपके डिवाइस का वॉल्यूम 0 पर सेट है। वाणी सुनने के लिए वॉल्यूम बढ़ाएं।",
      lowVolumeMessage:
        "डिवाइस का वॉल्यूम कम है ({{percentage}}%). हो सकता है कि वाणी साफ़ न सुनाई दे.",
      silentModeTitle: "साइलेंट मोड चालू है",
      silentModeMessage: "साइलेंट मोड चालू है। वाणी सुनने के लिए इसे बंद करें।",
      playAnyway: "फिर भी चलाएं",
    },
  },
  kana: {
    ...en.kana,
    offlineSpeech: {
      title: "इंटरनेट कनेक्शन नहीं है",
      message: "वाणी चलाने के लिए इंटरनेट से कनेक्ट करें।",
    },
  },
};

export default hi;
