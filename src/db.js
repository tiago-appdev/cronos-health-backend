import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️  Database URL: ${process.env.DATABASE_URL}`);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default db;
