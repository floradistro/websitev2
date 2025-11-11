// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'
