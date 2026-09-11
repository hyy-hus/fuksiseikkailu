import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import fi from './locales/fi.json'
import sv from './locales/sv.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fi, // Passes { translation: { ... } } directly
            sv, // Passes { translation: { ... } } directly
            en, // Passes { translation: { ... } } directly
        },
        defaultNS: 'translation',
        fallbackLng: 'en',
        supportedLngs: ['fi', 'sv', 'en'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    })

export default i18n
