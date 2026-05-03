# Spring Boot 3.4 Patterns

## Dependency injection

- Constructor injection (preferred): `public UserService(UserRepository repo) { this.repo = repo; }`
- Never use `@Autowired` on fields — leads to NullPointerException in tests
- Use `@Qualifier` only when multiple beans of same type exist
- Avoid optional dependencies (`@Autowired(required = false)`) unless truly optional

## Annotations & scopes

- `@Service` for business logic layers
- `@Repository` for data access layers
- `@Controller` / `@RestController` for HTTP endpoints
- `@Component` as fallback only if specific stereotype doesn't fit
- `@Scope` only needed if not singleton (rare in Spring Boot)

## @Transactional usage

- Use on service methods that modify data: `@Transactional public void createUser(User u)`
- Specify rollback conditions: `@Transactional(rollbackFor = PaymentException.class)`
- Use `readOnly = true` for query-only methods: `@Transactional(readOnly = true)`
- Don't use on `@Repository` methods (Spring Data handles it)
- Avoid `@Transactional` on read operations unless necessary for lazy loading

## REST API design

- **GET** `/users/{id}` — fetch single resource, return 200 OK
- **GET** `/users` — fetch collection, return 200 OK with pagination info
- **POST** `/users` — create resource, return 201 Created with Location header
- **PUT** `/users/{id}` — full update, return 200 OK or 204 No Content
- **PATCH** `/users/{id}` — partial update, return 200 OK
- **DELETE** `/users/{id}` — delete resource, return 204 No Content
- Always use DTOs for request/response, never expose entities directly

## Data validation

- Use `@Valid` on controller parameters: `public void createUser(@Valid @RequestBody CreateUserDTO dto)`
- Validate at request layer: `@NotNull`, `@NotBlank`, `@Email`, `@Min`, `@Max`
- Custom validators: implement `ConstraintValidator` interface
- Return 400 Bad Request for validation errors with error details

## Query optimization

- Avoid N+1 queries — use `@EntityGraph` or `JOIN FETCH`
- Example: `@EntityGraph(attributePaths = {"roles", "permissions"}) User findById(Long id)`
- Use projections for partial data: `interface UserNameOnly { String getName(); }`
- Enable query logging: `spring.jpa.properties.hibernate.generate_statistics=true`

## Error handling

- Use `@ControllerAdvice` for centralized exception handling
- Return appropriate HTTP status codes in error responses
- Never expose stack traces to clients — log internally, return generic message
- Example: `@ExceptionHandler(UserNotFoundException.class) public ResponseEntity<?> handle(...)`

## Lazy loading & sessions

- Avoid `LazyInitializationException` — load associations eagerly when needed
- Don't use `@Lazy` to defer problems — fix root cause
- Session per request pattern is default (use OpenSessionInViewFilter if needed)

## Caching

- Use `@Cacheable` for frequently-read data: `@Cacheable("users") User findById(Long id)`
- Use `@CacheEvict` on mutations: `@CacheEvict("users") void deleteUser(Long id)`
- Configure cache backend (Redis preferred over in-memory for production)
