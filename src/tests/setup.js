import { TestUtils } from './test-utils.js';

// Global test setup
beforeAll(async () => {
  // Wait for test database to be ready
  await TestUtils.waitForDatabase();
  console.log('Test database connection established');
});

// Clean database before each test to ensure isolation
beforeEach(async () => {
  await TestUtils.clearDatabase();
});

// Global test teardown
afterAll(async () => {
  // Close database connections
  const db = (await import('../db.js')).default;
  await db.end();
});

