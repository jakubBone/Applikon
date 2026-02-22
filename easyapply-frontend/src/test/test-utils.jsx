import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Tworzy świeży QueryClient dla każdego testu.
 * retry: false — nie ponawiaj zapytań w testach (szybsze i przewidywalne).
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

/**
 * Wrapper opakowujący komponent w QueryClientProvider.
 * Używaj jako `wrapper` w opcjach render() z Testing Library.
 */
export function QueryWrapper({ children }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
