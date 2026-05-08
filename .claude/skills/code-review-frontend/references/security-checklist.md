# Security Checklist — Frontend

## XSS (Cross-Site Scripting)

- Never use `dangerouslySetInnerHTML` — flag as Critical unless absolutely necessary
- If using it, sanitize input: `import DOMPurify from 'dompurify'` → `<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />`
- Don't concatenate user input into JSX: ❌ `<div>{userInput}</div>` is safe, ✅ but never raw HTML
- React escapes content by default, so JSX is safe for text
- Flag: `eval()`, `Function()`, `innerHTML`, `textContent` assignments with user data

## Secrets & sensitive data

- Never hardcode API keys, tokens, passwords in code
- Use environment variables: `const apiKey = import.meta.env.VITE_API_KEY`
- Never commit `.env` files — add to `.gitignore`
- Don't log sensitive data (tokens, passwords, credit cards, PII) to console
- Flag: hardcoded secrets, credentials, or tokens as Critical

## Authentication & authorization

- Always validate JWT tokens before trusting claims
- Store tokens securely: use HttpOnly cookies (server-set) or localStorage as fallback
- Never store sensitive data in localStorage if it's exposed (avoid `user.password`)
- Check authorization before rendering admin UI (but always verify on backend)
- Clear tokens on logout

## CORS & API calls

- Validate origin headers (this happens server-side, but know what's expected)
- Never trust client-side origin validation
- Use credentials carefully: `fetch(..., { credentials: "include" })` only when needed
- Check for CSRF tokens in POST/PUT/DELETE requests (if your API requires them)

## Input validation

- Validate and sanitize all user input before sending to API
- File uploads: check file type, size, content (not just extension)
- Never allow arbitrary file paths: ❌ `/files/${userInput}` → use fixed paths or IDs
- Sanitize URL parameters before using in templates or redirects

## DOM security

- Don't use `eval()` or `new Function()` to execute user input
- Avoid `innerHTML` with user data — use `textContent` or React JSX instead
- Don't dynamically build onclick handlers: ❌ `<div onClick={eval(userCode)} />`
- Validate and sanitize data before inserting into DOM

## URL & navigation security

- Validate redirect URLs: don't redirect to user-provided URLs
  - ❌ `window.location = userUrl`
  - ✅ `if (ALLOWED_DOMAINS.includes(new URL(userUrl).hostname)) { ... }`
- Check protocol: ✅ `if (userUrl.startsWith('https://') || userUrl.startsWith('/')) { ... }`
- Use `<Link>` for same-origin navigation (not raw `<a href>`), use `useNavigate()` in React Router

## HTTP headers & communication

- Use HTTPS only (enforce in production)
- Set secure headers server-side: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- Don't trust HTTP headers in frontend validation (verify on server)
- CSP (Content Security Policy) headers should be set by server

## Password handling

- Never send passwords in query params: ❌ `/login?password=123`
- Always use HTTPS for login forms
- Never log passwords to console or local storage
- Use password managers (browser built-in)

## Third-party dependencies

- Keep dependencies up to date: check for known vulnerabilities
- Use `npm audit` or similar to scan for CVEs
- Review large or new dependencies for security practices
- Don't trust CDN links — use npm packages instead

## Error handling

- Never expose detailed error messages to users (but log internally)
- Don't include system info, file paths, stack traces in error UI
- Generic message: "An error occurred" is better than leaking internal details
- Log full errors on server, send sanitized version to client

## Local storage & session storage

- Avoid storing sensitive data (tokens, passwords, PII)
- Know that localStorage is accessible to any script on the same domain
- Clear storage on logout: `localStorage.clear()`, `sessionStorage.clear()`
- Don't assume data in localStorage is trustworthy (validate on server)

## Component-level secrets

- Don't hardcode API keys in component state or context
- Don't render tokens or secrets in debug logs
- Be careful with default props containing secrets

## Testing & development

- Remove `console.log()` statements with sensitive data before deployment
- Remove debug code before deployment
- Never commit credentials or test tokens
