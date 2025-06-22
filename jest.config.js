export default {
  testEnvironment: 'node',
  globals: {
    'jest': {
      useESM: true
    }
  },
  testTimeout: 30000,
  transform: {},
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/models/**/*.js',
    'src/routes/**/*.js',
    '!**/node_modules/**',
    '!src/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ],
  // Test isolation
  clearMocks: true,
  restoreMocks: true,
  // Verbose output for better debugging
  verbose: true,
  // Force exit to prevent hanging
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true
};