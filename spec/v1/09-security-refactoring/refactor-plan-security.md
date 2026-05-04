# Security Refactoring Plan

Based on `code-review-security.md` findings.

## HIGH Priority (fix immediately)

1. **Timing Attack on Admin Key** — AdminKeyFilter.java:27
   - Replace `String.equals()` with `MessageDigest.isEqual()`
   - Estimate: 5 min
   - Files to modify: `AdminKeyFilter.java`

2. **Move Access Token from URL Query to Fragment** — OAuth2AuthenticationSuccessHandler.java:88
   - Change redirect to use `#token=` instead of `?token=`
   - Update frontend to read from fragment
   - Estimate: 15 min
   - Files to modify: `OAuth2AuthenticationSuccessHandler.java`, `authService.ts` or similar

3. **Add HTTP Security Headers** — SecurityConfig.java
   - Add CSP, X-Frame-Options, HSTS
   - Estimate: 5 min
   - Files to modify: `SecurityConfig.java`

## MEDIUM Priority (before re-enabling CV upload)

4. **Sanitize Filename in Content-Disposition** — CVController.java:70-72
   - Add filename sanitization before embedding in header
   - Estimate: 5 min
   - Files to modify: `CVController.java`

## LOW Priority (defense-in-depth)

5. **Add HMAC to TokenHasher** — TokenHasher.java:11-23
   - Implement HmacSHA256 with server-side secret
   - Update call sites to pass secret
   - Estimate: 10 min
   - Files to modify: `TokenHasher.java`, `UserService.java`, all call sites

6. **Add Audit Log for Retention Deletions** — AccountRetentionService.java:38-42
   - Log individual user IDs before deletion (not PII)
   - Estimate: 5 min
   - Files to modify: `AccountRetentionService.java`

---

## Implementation Progress

- [ ] Timing attack fix
- [ ] Token URL fragment migration
- [ ] Security headers
- [ ] Filename sanitization
- [ ] TokenHasher HMAC
- [ ] Audit logging
