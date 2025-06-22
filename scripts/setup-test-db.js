import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

// Test database connection
const testDb = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const setupTestDatabase = async () => {
  try {
    console.log("🔧 Setting up test database...");
    console.log(`🗄️  Using connection: ${process.env.DATABASE_URL}`);

    // Check if test database is accessible
    await testDb.query('SELECT 1');
    console.log("✅ Test database connection established");

    // Read all SQL files from db directory
    const dbDirectory = path.join(__dirname, '..', 'db');
    const sqlFiles = fs.readdirSync(dbDirectory)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    console.log(`📁 Found ${sqlFiles.length} SQL files to execute`);

    for (const file of sqlFiles) {
      console.log(`📄 Executing ${file}...`);
      const filePath = path.join(dbDirectory, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await testDb.query(sql);
        console.log(`✅ ${file} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        // Continue with other files even if one fails
      }
    }

    console.log("🎉 Test database setup completed!");

  } catch (error) {
    console.error("❌ Test database setup failed:", error.message);
    console.log("\n🔍 Troubleshooting tips:");
    console.log("1. Make sure the test database is running: docker compose up -d postgres-test");
    console.log("2. Check if the test database port (5433) is accessible");
    console.log("3. Verify the database credentials in the connection string");
    process.exit(1);
  } finally {
    await testDb.end();
  }
};

setupTestDatabase();