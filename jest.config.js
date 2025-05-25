export default {
  testEnvironment: 'node',
  globals: {
    'jest': {
      useESM: true
    }
  },
  testTimeout: 10000,
  transform: {},
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ]
};