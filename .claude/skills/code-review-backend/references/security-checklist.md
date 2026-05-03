# Security Checklist

## SQL injection & database access

- Never concatenate SQL strings: ❌ `"SELECT * FROM users WHERE id = " + id`
- Always use parameterized queries: ✅ `repository.findById(id)` or `@Query` with parameters
- When using raw queries, bind parameters: ✅ `em.createNativeQuery("SELECT * FROM users WHERE id = ?").setParameter(1, id)`
- JPA `@Query` with `#{...}` is safe, but `${...}` is not — flag any use of `${...}`

## Secrets & credentials

- Never hardcode secrets in code: ❌ `.properties` files with API keys, database passwords
- Use environment variables: ✅ `@Value("${PAYMENT_API_KEY}")` or Spring Cloud Config
- Don't commit `.env` files — add to `.gitignore`
- Rotate secrets regularly, especially if exposed
- Flag any hardcoded tokens, API keys, or passwords as Critical

## Logging & PII

- Never log passwords, tokens, or sensitive user data
- Flag: `log.debug("Password: " + password)` → Critical
- Flag: `log.info("User session: " + sessionToken)` → Critical
- Safe to log: user ID, timestamp, operation type, non-PII metadata
- Use masking/redaction for sensitive data if logging is necessary

## Authentication & authorization

- Use Spring Security for auth — don't roll your own
- Always validate JWT tokens before trusting claims
- Set `httpOnly = true` and `secure = true` on cookies: `new Cookie("sessionId", ...)`
- Session timeout should be configured and enforced
- Implement rate limiting on login endpoints to prevent brute force

## CORS & headers

- If CORS enabled, specify exact origins: ❌ `allowedOrigins = "*"`
- Use: ✅ `allowedOrigins = {"https://app.example.com"}`
- Set security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`
- Spring Security autoconfigures these, but verify if custom configuration exists

## Input validation

- Never trust user input — validate on request layer
- Use bean validation: `@NotNull`, `@NotBlank`, `@Email`, `@Pattern` on DTO fields
- Validate file uploads: check file type, size, content (not just extension)
- Sanitize user input before using in responses or logs

## Object deserialization

- Avoid deserializing untrusted data into Java objects
- If using custom deserialization, validate thoroughly
- Jackson is safe by default (does not execute code during deserialization)
- Flag any use of `ObjectInputStream` or custom deserialization handlers

## Error handling & info disclosure

- Never expose stack traces to API clients
- Log errors internally with full details
- Return generic error messages: "An error occurred" not "NullPointerException at line 42"
- Don't include system information, file paths, or version numbers in error responses

## Dependencies & known vulnerabilities

- Keep Spring Boot and dependencies up to date
- Check for known CVEs: `mvn dependency-check:check`
- Lock transitive dependencies explicitly if security update needed
- Audit `pom.xml` for deprecated libraries

## Access control

- Verify authorization checks before sensitive operations
- Use `@PreAuthorize` on controller methods: `@PreAuthorize("hasRole('ADMIN')")`
- Check that permission checks are not bypassable (e.g., direct ID manipulation)
- Ensure row-level security where applicable (users can only see their own data)
