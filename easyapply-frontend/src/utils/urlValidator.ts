/**
 * URL Validator — protection against XSS via javascript: and data: schemes
 *
 * Java analogy: sanitizer/validator (like Spring Security or OWASP)
 */

/**
 * Checks whether a URL is safe to open in href or window.open()
 *
 * Rejects:
 * - javascript: (can execute code)
 * - data: (can be used for injection)
 * - other dangerous schemes
 *
 * Accepts:
 * - https:// (preferred)
 * - http:// (acceptable)
 *
 * Uses the URL() constructor (like Java URI) to properly parse the scheme.
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return false

  try {
    // URL() constructor parses the URL — similar to new URL() in Java
    // Throws if the URL is malformed
    const parsed = new URL(url)

    // Check the scheme (protocol) — must be http: or https:
    // (URL.protocol includes the colon, e.g. "https:")
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    // If the URL cannot be parsed (bad format) — reject it
    return false
  }
}
