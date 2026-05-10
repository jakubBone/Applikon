import { useTranslation } from 'react-i18next'
import './Footer.css'

const CONTACT_EMAIL = 'jakub.bone1990@gmail.com'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="footer-content">
        <a href="/privacy" className="footer-link">
          {t('footer.privacyLink')}
        </a>
        <span className="footer-separator">·</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">
          {t('footer.contact')}
        </a>
      </div>
    </footer>
  )
}
