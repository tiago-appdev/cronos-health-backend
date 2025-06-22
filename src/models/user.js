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

  // Get complete patient profile
  getPatientProfile: async (userId) => {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type,
        u.created_at,
        p.date_of_birth,
        p.phone,
        p.address,
        p.emergency_contact,
        p.emergency_phone
      FROM users u
      INNER JOIN patients p ON p.user_id = u.id
      WHERE u.id = $1 AND u.user_type = 'patient'
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Get complete doctor profile
  getDoctorProfile: async (userId) => {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type,
        u.created_at,
        d.specialty,
        d.license_number,
        d.phone,
        d.work_schedule
      FROM users u
      INNER JOIN doctors d ON d.user_id = u.id
      WHERE u.id = $1 AND u.user_type = 'doctor'
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Get any user's complete profile (patient or doctor)
  getCompleteProfile: async (userId) => {
    const userQuery = "SELECT user_type FROM users WHERE id = $1";
    const userResult = await db.query(userQuery, [userId]);

    if (!userResult.rows[0]) {
      return null;
    }

    const { user_type } = userResult.rows[0];

    if (user_type === "patient") {
      return User.getPatientProfile(userId);
    } else if (user_type === "doctor") {
      return User.getDoctorProfile(userId);
    }

    return null;
  },

  // Update user profile (name, email, y datos de paciente o doctor)
  updateProfile: async (userId, data) => {
    // Actualizar datos básicos
    const { name, email, password } = data;
    let userUpdateQuery = "UPDATE users SET name = $1, email = $2";
    let userUpdateValues = [name, email];
    let paramCount = 2;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      userUpdateQuery += `, password = $${paramCount + 1}`;
      userUpdateValues.push(hashedPassword);
      paramCount++;
    }
    userUpdateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${
      paramCount + 1
    }`;
    userUpdateValues.push(userId);
    await db.query(userUpdateQuery, userUpdateValues);

    // Detectar tipo de usuario
    const user = await User.findById(userId);
    if (!user) return null;

    if (user.user_type === "patient") {
      const {
        date_of_birth,
        phone,
        address,
        emergency_contact,
        emergency_phone,
      } = data;
      await db.query(
        `UPDATE patients SET date_of_birth = $1, phone = $2, address = $3, emergency_contact = $4, emergency_phone = $5, updated_at = CURRENT_TIMESTAMP WHERE user_id = $6`,
        [
          date_of_birth,
          phone,
          address,
          emergency_contact,
          emergency_phone,
          userId,
        ]
      );
    } else if (user.user_type === "doctor") {
      const { specialty, license_number, phone, work_schedule } = data;
      await db.query(
        `UPDATE doctors SET specialty = $1, license_number = $2, phone = $3, work_schedule = $4, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5`,
        [specialty, license_number, phone, work_schedule, userId]
      );
    }
    // Retornar perfil actualizado
    return User.getCompleteProfile(userId);
  },
};

export default User;
