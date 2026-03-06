import { createContext, useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

const SUPPORTED_LANGUAGES = ['pl', 'en', 'fr', 'de']

export function LanguageProvider({ children }) {
  const { lang: urlLang } = useParams()
  const navigate = useNavigate()
  
  // Initialize with URL language or fallback to 'pl'
  const [lang, setLang] = useState(() => {
    if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
      return urlLang
    }
    return localStorage.getItem('mafia_lang') || 'pl'
  })

  // Sync language from URL changes
  useEffect(() => {
    if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang) && urlLang !== lang) {
      setLang(urlLang)
      localStorage.setItem('mafia_lang', urlLang)
    }
  }, [urlLang, lang])

  const changeLang = (code) => {
    if (SUPPORTED_LANGUAGES.includes(code)) {
      setLang(code)
      localStorage.setItem('mafia_lang', code)
      navigate(`/${code}`)
    }
  }

  const t = translations[lang] || translations['pl']

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
