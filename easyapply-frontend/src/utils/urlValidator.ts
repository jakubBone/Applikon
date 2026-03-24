/**
 * URL Validator — zabezpieczenie przed XSS przez javascript: i data: schemy
 *
 * Analogia do Javy: sanitizer/validator (jak Spring Security czy OWASP)
 */

/**
 * Sprawdza czy URL jest bezpieczny do otwarcia w href lub window.open()
 *
 * Odrzuca:
 * - javascript: (mogą wykonać kod)
 * - data: (mogą infekcji)
 * - inne niebezpieczne schematy
 *
 * Akceptuje:
 * - https:// (preferowany)
 * - http:// (akceptowalny)
 *
 * Używa URL() konstruktora (jak Java URI) aby prawidłowo sparsować schemat.
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return false

  try {
    // URL() konstruktor sparsuje URL — podobnie jak new URL() w Javie
    // Wyrzuca błąd jeśli URL jest złe sformułowany
    const parsed = new URL(url)

    // Sprawdź schemat (protocol) — powinien być http: lub https:
    // (URL.protocol zawiera dwukropek, np. "https:")
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    // Jeśli URL się nie parsuje (zły format) — odrzuć
    return false
  }
}
