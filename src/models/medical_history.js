import db from "../db.js";

const MedicalHistory = {
  getSummary: async (userId) => {
    const result = await db.query(
      `
      WITH patient_data AS (
        SELECT p.id as patient_id
        FROM patients p
        WHERE p.user_id = $1
      )
      SELECT 
        (SELECT COUNT(*) FROM medical_records mr, patient_data pd WHERE mr.patient_id = pd.patient_id) as consultations,
        (SELECT COUNT(*) FROM medical_records mr 
         INNER JOIN prescriptions p ON p.medical_record_id = mr.id 
         INNER JOIN patient_data pd ON mr.patient_id = pd.patient_id) as prescriptions,
        (SELECT COUNT(*) FROM medical_records mr 
         INNER JOIN medical_tests mt ON mt.medical_record_id = mr.id
         INNER JOIN patient_data pd ON mr.patient_id = pd.patient_id) as tests,
        (SELECT COUNT(*) FROM patient_notes pn 
         INNER JOIN patient_data pd ON pn.patient_id = pd.patient_id) as notes
    `,
      [userId]
    );
    return result.rows[0];
  },
  getConsultations: async (userId) => {
    const result = await db.query(
      `
      SELECT mr.*, u.name as doctor_name 
      FROM medical_records mr
      INNER JOIN doctors d ON d.id = mr.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN patients p ON p.id = mr.patient_id
      WHERE p.user_id = $1
      ORDER BY mr.date DESC
    `,
      [userId]
    );
    return result.rows;
  },
  getPrescriptions: async (userId) => {
    const result = await db.query(
      `
      SELECT p.*, mr.date as consultation_date, u.name as doctor_name
      FROM medical_records mr
      INNER JOIN prescriptions p ON p.medical_record_id = mr.id
      INNER JOIN doctors d ON d.id = mr.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN patients pat ON pat.id = mr.patient_id
      WHERE pat.user_id = $1
      ORDER BY mr.date DESC
    `,
      [userId]
    );
    return result.rows;
  },
  getMedicalTests: async (userId) => {
    const result = await db.query(
      `
      SELECT mt.*, mr.date as consultation_date, u.name as doctor_name
      FROM medical_records mr
      INNER JOIN medical_tests mt ON mt.medical_record_id = mr.id
      INNER JOIN doctors d ON d.id = mr.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN patients pat ON pat.id = mr.patient_id
      WHERE pat.user_id = $1
      ORDER BY mt.test_date DESC NULLS LAST
    `,
      [userId]
    );
    return result.rows;
  },
  getNotes: async (userId) => {
    const result = await db.query(
      `
      SELECT pn.*, u.name as doctor_name
      FROM patient_notes pn
      INNER JOIN doctors d ON d.id = pn.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN patients pat ON pat.id = pn.patient_id
      WHERE pat.user_id = $1
      ORDER BY pn.created_at DESC
    `,
      [userId]
    );
    return result.rows;
  },
};

export default MedicalHistory;
