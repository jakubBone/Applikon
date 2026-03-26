import '@testing-library/jest-dom'
import '../i18n'

// Mock fetch API for tests
global.fetch = vi.fn()

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks()
})
