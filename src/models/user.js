import db from "../db.js";
import bcrypt from "bcrypt";

const User = {
  // Find a user by email
  findByEmail: async (email) => {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Find a user by ID
  findById: async (id) => {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Create a new user
  create: async (userData) => {
    const { name, email, password, userType } = userData;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // console.log(hashedPassword);

    const query = `
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, user_type
    `;

    const values = [name, email, hashedPassword, userType];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Create patient profile
  createPatient: async (userId, patientData = {}) => {
    const { dateOfBirth, phone, address, emergencyContact, emergencyPhone } =
      patientData;

    const query = `
      INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;

    const values = [
      userId,
      dateOfBirth || null,
      phone || null,
      address || null,
      emergencyContact || null,
      emergencyPhone || null,
    ];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Create doctor profile
  createDoctor: async (userId, doctorData = {}) => {
    const { specialty, licenseNumber, phone, workSchedule } = doctorData;

    const query = `
      INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const values = [
      userId,
      specialty || null,
      licenseNumber || null,
      phone || null,
      workSchedule || null,
    ];
    const result = await db.query(query, values);

    return result.rows[0];
  },
};

export default User;
