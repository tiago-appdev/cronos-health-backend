import { Pool } from 'pg';

// Database configuration for Render deployment
const getDatabaseConfig = () => {
  const config = {
    connectionString: process.env.DATABASE_URL,
    // SSL configuration for Render PostgreSQL
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    // Connection pool settings
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  };

  // Additional configuration for production
  if (process.env.NODE_ENV === 'production') {
    config.statement_timeout = 15000; // 15 seconds
    config.query_timeout = 15000; // 15 seconds
    config.application_name = 'cronos-health-api';
  }

  return config;
};

// Create database pool
const pool = new Pool(getDatabaseConfig());

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database query test passed:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

export default pool;