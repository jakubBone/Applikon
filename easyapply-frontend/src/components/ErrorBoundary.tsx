import { Component, ReactNode } from 'react'

/**
 * Error Boundary — catches errors in React components
 *
 * Java analogy: try/catch for the entire component subtree.
 *
 * When a React component throws, the Error Boundary:
 * 1. Catches the error in componentDidCatch()
 * 2. Sets hasError = true
 * 3. Renders a fallback UI instead of a blank screen
 *
 * Note: Error Boundary does NOT catch:
 * - Errors in event listeners (use try/catch inside the handler)
 * - Errors in async callbacks (use try/catch in Promise)
 * - Errors inside the Error Boundary itself (infinite loop)
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
    // React calls this automatically when a child throws
    // Returns new state, React applies it
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Here you can log the error to an error reporting service
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
