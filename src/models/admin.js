import db from "../db.js";
import bcrypt from "bcrypt";

const AdminManagement = {
  // Obtener todos los usuarios con sus perfiles
  getAllUsers: async () => {
    const query = `
      SELECT u.*, 
        CASE 
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'date_of_birth', p.date_of_birth,
            'phone', p.phone,
            'address', p.address,
            'emergency_contact', p.emergency_contact,
            'emergency_phone', p.emergency_phone
          )
          WHEN d.id IS NOT NULL THEN json_build_object(
            'id', d.id,
            'specialty', d.specialty,
            'license_number', d.license_number,
            'phone', d.phone,
            'work_schedule', d.work_schedule
          )
          ELSE NULL
        END as profile
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Obtener un usuario específico con su perfil
  getUserById: async (userId) => {
    const query = `
      SELECT u.*, 
        CASE 
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'date_of_birth', p.date_of_birth,
            'phone', p.phone,
            'address', p.address,
            'emergency_contact', p.emergency_contact,
            'emergency_phone', p.emergency_phone
          )
          WHEN d.id IS NOT NULL THEN json_build_object(
            'id', d.id,
            'specialty', d.specialty,
            'license_number', d.license_number,
            'phone', d.phone,
            'work_schedule', d.work_schedule
          )
          ELSE NULL
        END as profile
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Actualizar usuario
  updateUser: async (userId, userData) => {
    const { name, email, password } = userData;
    let updateQuery = "UPDATE users SET name = $1, email = $2";
    let values = [name, email];
    let paramCount = 2;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += `, password = $${paramCount + 1}`;
      values.push(hashedPassword);
      paramCount++;
    }

    updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${
      paramCount + 1
    } RETURNING *`;
    values.push(userId);

    const result = await db.query(updateQuery, values);
    return result.rows[0];
  },

  // Actualizar perfil de paciente
  updatePatientProfile: async (userId, profileData) => {
    const {
      date_of_birth,
      phone,
      address,
      emergency_contact,
      emergency_phone,
    } = profileData;

    const query = `
      UPDATE patients 
      SET date_of_birth = $1, 
          phone = $2, 
          address = $3, 
          emergency_contact = $4, 
          emergency_phone = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $6
      RETURNING *
    `;

    const values = [
      date_of_birth,
      phone,
      address,
      emergency_contact,
      emergency_phone,
      userId,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Actualizar perfil de doctor
  updateDoctorProfile: async (userId, profileData) => {
    const { specialty, license_number, phone, work_schedule } = profileData;

    const query = `
      UPDATE doctors 
      SET specialty = $1, 
          license_number = $2, 
          phone = $3, 
          work_schedule = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING *
    `;

    const values = [specialty, license_number, phone, work_schedule, userId];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Eliminar usuario y su perfil asociado
  deleteUser: async (userId) => {
    // La eliminación en cascada se encargará de eliminar los perfiles asociados
    const query = "DELETE FROM users WHERE id = $1 RETURNING *";
    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Crear un nuevo paciente a partir de un usuario existente
  createPatientProfile: async (userId, profileData) => {
    const {
      date_of_birth,
      phone,
      address,
      emergency_contact,
      emergency_phone,
    } = profileData;

    // Primero actualizamos el tipo de usuario
    await db.query("UPDATE users SET user_type = $1 WHERE id = $2", [
      "patient",
      userId,
    ]);

    const query = `
      INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userId,
      date_of_birth,
      phone,
      address,
      emergency_contact,
      emergency_phone,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Crear un nuevo doctor a partir de un usuario existente
  createDoctorProfile: async (userId, profileData) => {
    const { specialty, license_number, phone, work_schedule } = profileData;

    // Primero actualizamos el tipo de usuario
    await db.query("UPDATE users SET user_type = $1 WHERE id = $2", [
      "doctor",
      userId,
    ]);

    const query = `
      INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [userId, specialty, license_number, phone, work_schedule];
    const result = await db.query(query, values);
    return result.rows[0];
  },
};

export default AdminManagement;
