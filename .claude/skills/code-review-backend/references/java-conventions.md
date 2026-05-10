# Java Conventions

## Naming

- **Classes**: PascalCase — `UserService`, `ApplicationRepository`, `PaymentProcessor`
- **Methods/fields**: camelCase, verb-first for methods — `getUserById()`, `applicationStatus`, `isActive`
- **Constants**: UPPER_SNAKE_CASE — `MAX_RETRIES`, `DEFAULT_TIMEOUT`, `API_BASE_URL`
- **Packages**: lowercase, reverse domain — `com.applikon.service`, `com.applikon.repository`
- **Test classes**: *Test suffix — `UserServiceTest`, `ApplicationRepositoryTest`
- **Boolean variables**: prefix with `is`, `has`, `should` — `isActive`, `hasPermission`, `shouldRetry`

## Type safety & null handling

- Never use raw types — use generics: `List<String>` not `List`
- Avoid `null` — use `Optional<T>` instead: `Optional<User> user = getUserById(id)`
- Annotate nullable values: `@Nullable String value` or `@NonNull String required`
- No unchecked casts — if needed, flag as Warning
- Use `var` only when type is obvious from context: `var users = userRepository.findAll()`

## Exception handling

- Never catch `Exception` — catch specific exceptions: `catch (UserNotFoundException e)`
- Never swallow exceptions — always log or re-throw: `catch (IOException e) { throw new RuntimeException(e); }`
- Use checked exceptions for recoverable errors, unchecked for programming errors
- Always close resources (use try-with-resources): `try (FileReader fr = new FileReader(file)) { ... }`

## Imports & organization

- No unused imports or fields
- Group imports: java.* → javax.* → external packages → internal packages
- One class per file (inner classes are exceptions)
- No circular dependencies

## Records & immutability

- Use records for data classes (Java 16+): `record User(String name, int age) {}`
- Immutable POJOs preferred over mutable beans
- Fields should be `private` unless there's a reason (mark as Info if public)
