import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('pl') ? 'pl' : 'en'

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${current === 'pl' ? 'active' : ''}`}
        onClick={() => i18n.changeLanguage('pl')}
        aria-label="Polski"
      >
        PL
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn ${current === 'en' ? 'active' : ''}`}
        onClick={() => i18n.changeLanguage('en')}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
