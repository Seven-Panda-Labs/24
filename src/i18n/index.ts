import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import pt from './locales/pt.json'

export const LANGUAGES = ['pt', 'en'] as const

const STORAGE_KEY = '24:language'

function initialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (LANGUAGES as readonly string[]).includes(stored)) return stored
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

i18n.on('languageChanged', (language) => {
  localStorage.setItem(STORAGE_KEY, language)
  document.documentElement.lang = language
})

void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
