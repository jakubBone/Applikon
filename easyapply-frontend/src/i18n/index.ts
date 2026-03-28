import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import plCommon from './locales/pl/common.json'
import plErrors from './locales/pl/errors.json'
import plBadges from './locales/pl/badges.json'
import plTour from './locales/pl/tour.json'

import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enBadges from './locales/en/badges.json'
import enTour from './locales/en/tour.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['pl', 'en'],
    defaultNS: 'common',
    ns: ['common', 'errors', 'badges', 'tour'],
    resources: {
      pl: { common: plCommon, errors: plErrors, badges: plBadges, tour: plTour },
      en: { common: enCommon, errors: enErrors, badges: enBadges, tour: enTour },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
