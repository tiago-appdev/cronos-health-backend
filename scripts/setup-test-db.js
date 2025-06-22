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
      }    }

    console.log("📝 Creating test data...");
    await createTestData();

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

const createTestData = async () => {
  try {
    // Import bcrypt for password hashing
    const bcrypt = await import("bcrypt");
    
    // Create test password hash (password: "testpass123")
    const passwordHash = await bcrypt.default.hash("testpass123", 10);

    // Create test doctor user
    const doctorUserResult = await testDb.query(`
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['Dr. Test Smith', 'dr.test@hospital.com', passwordHash, 'doctor']);
    const doctorUserId = doctorUserResult.rows[0].id;

    // Create doctor profile
    await testDb.query(`
      INSERT INTO doctors (user_id, specialty, phone, work_schedule) 
      VALUES ($1, $2, $3, $4)
    `, [doctorUserId, 'Medicina General', '+1234567890', 
        JSON.stringify({ monday: '09:00-17:00', tuesday: '09:00-17:00', wednesday: '09:00-17:00' })]);
    console.log("✅ Created test doctor profile");

    // Create test patient user
    const patientUserResult = await testDb.query(`
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['John Test Doe', 'john.test@email.com', passwordHash, 'patient']);
    const patientUserId = patientUserResult.rows[0].id;

    // Create patient profile
    await testDb.query(`
      INSERT INTO patients (user_id, phone, date_of_birth, address) 
      VALUES ($1, $2, $3, $4)
    `, [patientUserId, '+0987654321', '1990-01-15', '123 Test Street']);
    console.log("✅ Created test patient profile");

    // Create a second patient for testing
    const patient2UserResult = await testDb.query(`
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['Jane Test Smith', 'jane.test@email.com', passwordHash, 'patient']);
    const patient2UserId = patient2UserResult.rows[0].id;

    await testDb.query(`
      INSERT INTO patients (user_id, phone, date_of_birth, address) 
      VALUES ($1, $2, $3, $4)
    `, [patient2UserId, '+1122334455', '1985-06-20', '456 Test Avenue']);
    console.log("✅ Created second test patient profile");

    console.log("📝 Test data creation completed");
  } catch (error) {
    console.error("❌ Error creating test data:", error.message);
    throw error;
  }
};

setupTestDatabase();