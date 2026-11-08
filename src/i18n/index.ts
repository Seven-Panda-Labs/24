import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import pt from './locales/pt.json'

// pt-PT, not pt: i18next picks plural rules by code, and plain pt follows
// Brazilian Portuguese, where zero takes the singular ("0 comprado").
export const LANGUAGES = ['pt-PT', 'en'] as const

const STORAGE_KEY = '24:language'

function initialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (LANGUAGES as readonly string[]).includes(stored)) return stored
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-PT' : 'en'
}

i18n.on('languageChanged', (language) => {
  localStorage.setItem(STORAGE_KEY, language)
  document.documentElement.lang = language
})

void i18n.use(initReactI18next).init({
  resources: { 'pt-PT': { translation: pt }, en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
