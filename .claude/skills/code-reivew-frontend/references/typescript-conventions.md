# TypeScript Conventions

## Naming

- **Types/Interfaces**: PascalCase — `User`, `UserProfile`, `ApiResponse`
- **Variables/functions**: camelCase, verb-first for functions — `getUserById()`, `userName`, `isActive`
- **Constants**: UPPER_SNAKE_CASE — `MAX_RETRIES`, `DEFAULT_TIMEOUT`, `API_BASE_URL`
- **Files**: kebab-case for utilities and hooks — `user-service.ts`, `use-auth.ts`; PascalCase for components — `UserCard.tsx`, `Button.tsx`
- **React hooks**: use* prefix — `useAuth`, `useFetch`, `useLocalStorage`
- **Boolean variables**: prefix with `is`, `has`, `should` — `isActive`, `hasPermission`, `shouldRetry`

## Type safety

- Never use `any` — use `unknown` and narrow with type guards, or `unknown extends X ? ... : never`
- Prefer `interface` for object shapes, `type` for unions and discriminated unions
- All function parameters and return types must be explicitly typed: `function add(a: number, b: number): number`
- Use `readonly` for arrays and objects that should not be mutated: `readonly string[]`, `readonly user: User`
- Use `as const` for literal types: `const roles = ["admin", "user"] as const` → `type Role = typeof roles[number]`

## Null safety & optional chaining

- Use optional chaining (`?.`) instead of null checks: `user?.name` not `user ? user.name : undefined`
- Use nullish coalescing (`??`) for defaults: `name ?? "Unknown"` (not `||` which treats empty string as falsy)
- Never use non-null assertion (`!`) unless you've confirmed it's safe: `user!.name` should be rare

## Imports & organization

- No unused imports
- Group imports: external packages → internal modules → types
- One main export per file (exceptions: utility exports, types, enums)
- No circular dependencies

## Function signatures

- Prefer single parameters (use object destructuring for multiple): `function createUser({ name, email }: CreateUserDTO)`
- Return types should be explicit: `function fetchUser(id: string): Promise<User>`
- Use overloads sparingly — if many overloads, consider generics instead

## Error handling

- Always type catch clause: `catch (error: unknown)`
- Never swallow errors with empty catch blocks
- Async functions must have try/catch or propagate errors

## Enums vs unions

- Prefer discriminated unions over enums: `type Status = "active" | "inactive" | "pending"`
- Enums OK for large sets or when you need reverse mapping, but prefer string literals for smaller sets
