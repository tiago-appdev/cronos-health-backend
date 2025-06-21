import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class TestUtils {
  static async clearDatabase() {
    // Clear all tables in the correct order (respecting foreign key constraints)
    const tables = [
      'surveys',
      'message_read_status',
      'messages',
      'conversation_participants',
      'conversations',
      'patient_notes',
      'medical_tests',
      'prescriptions',
      'medical_records',
      'appointments',
      'patients',
      'doctors',
      'users'
    ];

    for (const table of tables) {
      await db.query(`DELETE FROM ${table}`);
    }

    // Reset sequences
    const sequences = [
      'users_id_seq',
      'patients_id_seq',
      'doctors_id_seq',
      'appointments_id_seq',
      'medical_records_id_seq',
      'prescriptions_id_seq',
      'medical_tests_id_seq',
      'patient_notes_id_seq',
      'surveys_id_seq',
      'conversations_id_seq',
      'messages_id_seq'
    ];

    for (const sequence of sequences) {
      await db.query(`ALTER SEQUENCE ${sequence} RESTART WITH 1`);
    }
  }

  static async createTestUser(userData = {}) {
    const defaultUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      userType: "patient"
    };

    const user = { ...defaultUser, ...userData };
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const query = `
      INSERT INTO users (name, email, password, user_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await db.query(query, [user.name, user.email, hashedPassword, user.userType]);
    return result.rows[0];
  }

  static async createTestPatient(userData = {}) {
    const user = await this.createTestUser({ 
      userType: "patient", 
      email: "patient@test.com",
      name: "Test Patient",
      ...userData 
    });

    const patientQuery = `
      INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const patientData = {
      date_of_birth: "1990-01-01",
      phone: "123456789",
      address: "Test Address",
      emergency_contact: "Emergency Contact",
      emergency_phone: "987654321",
      ...userData.profileData
    };

    const patientResult = await db.query(patientQuery, [
      user.id,
      patientData.date_of_birth,
      patientData.phone,
      patientData.address,
      patientData.emergency_contact,
      patientData.emergency_phone
    ]);

    return {
      user,
      patient: patientResult.rows[0]
    };
  }

  static async createTestDoctor(userData = {}) {
    const user = await this.createTestUser({ 
      userType: "doctor", 
      email: "doctor@test.com",
      name: "Test Doctor",
      ...userData 
    });

    const doctorQuery = `
      INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const doctorData = {
      specialty: "Test Specialty",
      license_number: "TEST123",
      phone: "123456789",
      work_schedule: "9:00-17:00",
      ...userData.profileData
    };

    const doctorResult = await db.query(doctorQuery, [
      user.id,
      doctorData.specialty,
      doctorData.license_number,
      doctorData.phone,
      doctorData.work_schedule
    ]);

    return {
      user,
      doctor: doctorResult.rows[0]
    };
  }

  static async createTestAdmin(userData = {}) {
    return await this.createTestUser({ 
      userType: "admin", 
      email: "admin@test.com",
      name: "Test Admin",
      ...userData 
    });
  }

  static generateTestToken(user) {
    const payload = {
      user: {
        id: user.id,
        userType: user.user_type
      }
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  }

  static async createTestAppointment(patientId, doctorId, appointmentData = {}) {
    const defaultData = {
      appointment_date: new Date(Date.now() + 86400000), // Tomorrow
      status: "scheduled"
    };

    const data = { ...defaultData, ...appointmentData };

    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await db.query(query, [patientId, doctorId, data.appointment_date, data.status]);
    return result.rows[0];
  }

  static async createTestMedicalRecord(patientId, doctorId, recordData = {}) {
    const defaultData = {
      diagnosis: "Test Diagnosis",
      treatment: "Test Treatment",
      notes: "Test Notes",
      date: new Date()
    };

    const data = { ...defaultData, ...recordData };

    const query = `
      INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes, date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await db.query(query, [
      patientId, 
      doctorId, 
      data.diagnosis, 
      data.treatment, 
      data.notes, 
      data.date
    ]);
    return result.rows[0];
  }

  static async createTestSurvey(patientId, surveyData = {}) {
    const defaultData = {
      appointment_ease_rating: 5,
      punctuality_rating: 4,
      medical_staff_rating: 5,
      platform_rating: 4,
      would_recommend: "yes",
      additional_comments: "Test comments"
    };

    const data = { ...defaultData, ...surveyData };

    const query = `
      INSERT INTO surveys (
        patient_id, 
        appointment_id, 
        appointment_ease_rating, 
        punctuality_rating, 
        medical_staff_rating, 
        platform_rating, 
        would_recommend, 
        additional_comments,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await db.query(query, [
      patientId,
      data.appointment_id || null,
      data.appointment_ease_rating,
      data.punctuality_rating,
      data.medical_staff_rating,
      data.platform_rating,
      data.would_recommend,
      data.additional_comments
    ]);
    return result.rows[0];
  }

  static getRandomEmail() {
    return `test${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static async waitForDatabase() {
    let retries = 5;
    while (retries > 0) {
      try {
        await db.query('SELECT 1');
        return;
      } catch (error) {
        console.log(`Database not ready, retrying... (${retries} attempts left)`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Database not available after retries');
  }
}