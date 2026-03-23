import { Component, ReactNode } from 'react'

/**
 * Error Boundary — łapie błędy w React komponentach
 *
 * Analogia do Javy: try/catch dla całego poddrzewa komponentów.
 *
 * Kiedy React komponent wysypie się błędem, Error Boundary:
 * 1. Łapie błąd w componentDidCatch()
 * 2. Ustawia hasError = true
 * 3. Pokazuje fallback UI zamiast białego ekranu
 *
 * Uwaga: Error Boundary NIE łapie:
 * - Błędy event listenerów (użyj try/catch wewnątrz handlera)
 * - Błędy w asynchronicznych callbackach (użyj try/catch w Promise)
 * - Błędy w samym Error Boundary (nieskończona pętla)
 */

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // React automatycznie wołamy to gdy dziecko wysypie się
    // Zwraca nowy state, React go ustawia
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Tutaj możesz zalogować błąd do serwisu
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          margin: '20px'
        }}>
          <h2>Coś poszło nie tak</h2>
          <p>Przepraszamy, aplikacja napotkała błąd.</p>
          <p style={{ fontSize: '12px', color: '#6c757d' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Odśwież stronę
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
