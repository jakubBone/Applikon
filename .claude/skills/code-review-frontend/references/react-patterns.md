# React 19 Patterns

## Hooks & dependencies

- **useEffect**: always specify dependency array — never omit it
  - ❌ `useEffect(() => { ... })` — runs on every render
  - ✅ `useEffect(() => { ... }, [])` — runs once
  - ✅ `useEffect(() => { ... }, [userId])` — runs when userId changes
- **useCallback**: only when passing as prop to memoized child or as dependency to another hook
- **useMemo**: only when computation is expensive (array/object recreation is usually cheap)
- Never return early from hooks: `if (condition) return` is forbidden in hook bodies
- Custom hooks follow same rules as built-in hooks

## Component structure

- Functional components only (no class components)
- Props interface always defined and exported: `interface UserCardProps { name: string; }`
- Single responsibility — one main purpose per component
- Avoid unnecessary wrapper components
- Separate presentation from logic: dumb components for UI, smart components for state

## Props & composition

- Never mutate props: `const { name, ...rest } = props` is OK; `props.name = "..."` is not
- Pass event handlers as props, not logic
- Avoid prop drilling — use Context or component composition instead
- Default props via destructuring: `function Card({ title = "Untitled" })`

## State management

- **useState**: for local component state only
- **React Query/TanStack Query**: for server state (API calls, caching, background sync)
  - ✅ `const { data, isLoading, error } = useQuery({ queryKey: ["users"], queryFn: fetchUsers })`
  - Specify `staleTime`, `cacheTime`, `retry` appropriately
- **Context API**: for rarely-changing values (theme, auth) or top-level state
  - Don't use for frequently-changing values (form state, counters)
- Local storage: consider `useLocalStorage` hook to avoid SSR/hydration issues

## Conditional rendering

- Ternaries are OK for simple conditions: `{isLoading ? <Spinner /> : <Content />}`
- Logical AND for "show or hide": `{hasPermission && <AdminPanel />}`
- Avoid nested ternaries: extract to separate component instead
- Avoid rendering JSX in conditionals outside of return statement

## Event handling

- Event listeners added in useEffect must be removed in cleanup function:
  ```tsx
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  ```
- Never use `addEventListener` directly in component body (race conditions)
- Event handlers should be stable (use useCallback if passed as props)

## Performance optimization

- Use `React.memo()` only when you've confirmed re-renders are a problem
- Memoize expensive child components passed as props: `<List items={memoizedItems} />`
- Check dependency arrays in useMemo/useCallback — missing dependencies = bugs
- Use virtualization for long lists (react-window, react-virtualized)

## Keys in lists

- Always provide a unique `key` prop in `.map()`: `{items.map(item => <Item key={item.id} />)}`
- Never use array index as key — causes bugs if list is reordered/filtered
- Key must be stable across renders

## Accessibility

- Semantic HTML: `<button>`, `<form>`, `<input>`, not `<div onClick>`
- Add ARIA labels: `<button aria-label="Close menu">`
- Support keyboard navigation: Tab, Enter, Escape
- Don't remove focus indicators
- Use `<label htmlFor="...">` with inputs

## Form handling

- Use controlled components: `<input value={value} onChange={e => setValue(e.target.value)} />`
- Or use a form library (React Hook Form, Formik) for complex forms
- Always validate on change (debounced) or on blur
- Show validation errors clearly

## Refs & DOM manipulation

- Refs should be rare — if using many refs, reconsider design
- OK for: focus management, media playback, trigger animations, third-party library integration
- Not OK for: things that can be done with React state
- Use `useRef` for instance variables that don't cause re-render on change
