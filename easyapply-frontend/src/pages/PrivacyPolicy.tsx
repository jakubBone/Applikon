import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { privacyPolicyPl, privacyPolicyEn } from '../content/privacyPolicy'
import '../PrivacyPolicy.css'

export function PrivacyPolicy() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const policy = i18n.language === 'pl' ? privacyPolicyPl : privacyPolicyEn

  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        <div className="privacy-back-bar">
          <button className="privacy-back-btn" onClick={() => navigate(-1)}>
            ← {i18n.language === 'pl' ? 'Powrót' : 'Back'}
          </button>
        </div>
        <div className="privacy-content">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="privacy-heading">{children}</h1>,
              h2: ({ children }) => <h2 className="privacy-heading">{children}</h2>,
              h3: ({ children }) => <h3 className="privacy-heading">{children}</h3>,
              p: ({ children }) => <p className="privacy-paragraph">{children}</p>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
              code: ({ children }) => <code className="privacy-code">{children}</code>,
              ul: ({ children }) => <ul className="privacy-list">{children}</ul>,
              ol: ({ children }) => <ol className="privacy-list">{children}</ol>,
              li: ({ children }) => <li className="privacy-list-item">{children}</li>,
            }}
          >
            {policy}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
