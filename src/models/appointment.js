import db from "../db.js";

const Appointment = {
  // Get all appointments for a specific patient
  findByPatientId: async (patientId) => {
    const query = `
      SELECT 
        a.*,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        d.phone as doctor_phone,
        u_doctor.email as doctor_email,
        u_patient.name as patient_name,
        u_patient.email as patient_email,
        p.phone as patient_phone,
        p.date_of_birth as patient_dob
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doctor ON d.user_id = u_doctor.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date ASC
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
  },

  // Get all appointments for a specific doctor
  findByDoctorId: async (doctorId) => {
    const query = `
      SELECT 
        a.*,
        u_patient.name as patient_name,
        u_patient.email as patient_email,
        p.phone as patient_phone,
        p.date_of_birth as patient_dob,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        d.phone as doctor_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doctor ON d.user_id = u_doctor.id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows;
  },

  // Get appointment by ID with full details
  findById: async (appointmentId) => {
    const query = `
      SELECT 
        a.*,
        u_patient.name as patient_name,
        u_patient.email as patient_email,
        p.phone as patient_phone,
        u_doctor.name as doctor_name,
        u_doctor.email as doctor_email,
        d.specialty as doctor_specialty,
        d.phone as doctor_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doctor ON d.user_id = u_doctor.id
      WHERE a.id = $1
    `;
    const result = await db.query(query, [appointmentId]);
    return result.rows[0];
  },

  // Create new appointment
  create: async (appointmentData) => {
    const { patientId, doctorId, appointmentDate, status = 'scheduled' } = appointmentData;
    
    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    
    const values = [patientId, doctorId, appointmentDate, status];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Update appointment
  update: async (appointmentId, updateData) => {
    const { appointmentDate, status } = updateData;
    
    const query = `
      UPDATE appointments 
      SET appointment_date = COALESCE($2, appointment_date),
          status = COALESCE($3, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [appointmentId, appointmentDate, status];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Delete appointment
  delete: async (appointmentId) => {
    const query = "DELETE FROM appointments WHERE id = $1 RETURNING *";
    const result = await db.query(query, [appointmentId]);
    return result.rows[0];
  },

  // Get all doctors with their details
  getAllDoctors: async () => {
    const query = `
      SELECT 
        d.id,
        u.name,
        d.specialty,
        d.phone,
        d.work_schedule
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.user_type = 'doctor'
      ORDER BY u.name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Get patient ID by user ID
  getPatientIdByUserId: async (userId) => {
    const query = "SELECT id FROM patients WHERE user_id = $1";
    const result = await db.query(query, [userId]);
    return result.rows[0]?.id;
  },

  // Get doctor ID by user ID
  getDoctorIdByUserId: async (userId) => {
    const query = "SELECT id FROM doctors WHERE user_id = $1";
    const result = await db.query(query, [userId]);
    return result.rows[0]?.id;
  },

  // Check if appointment time is available
  isTimeSlotAvailable: async (doctorId, appointmentDate, excludeAppointmentId = null) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = $1 
      AND appointment_date = $2 
      AND status != 'canceled'
    `;
    let values = [doctorId, appointmentDate];

    if (excludeAppointmentId) {
      query += " AND id != $3";
      values.push(excludeAppointmentId);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count) === 0;
  }
};

export default Appointment;