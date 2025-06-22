import db from "../db.js";

const Survey = {
  // Create a new survey response
  create: async (surveyData) => {
    const {
      patientId,
      appointmentId,
      appointmentEaseRating,
      punctualityRating,
      medicalStaffRating,
      platformRating,
      wouldRecommend,
      additionalComments,
    } = surveyData;

    const query = `
      INSERT INTO surveys (
        patient_id, 
        appointment_id, 
        appointment_ease_rating, 
        punctuality_rating, 
        medical_staff_rating, 
        platform_rating, 
        would_recommend, 
        additional_comments
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;

    const values = [
      patientId,
      appointmentId,
      appointmentEaseRating,
      punctualityRating,
      medicalStaffRating,
      platformRating,
      wouldRecommend,
      additionalComments,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get surveys by patient ID
  findByPatientId: async (patientId) => {
    const query = `
      SELECT 
        s.*,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        a.appointment_date
      FROM surveys s
      LEFT JOIN appointments a ON s.appointment_id = a.id
      LEFT JOIN doctors doc ON a.doctor_id = doc.id
      LEFT JOIN users u_doctor ON doc.user_id = u_doctor.id
      LEFT JOIN doctors d ON doc.id = d.id
      WHERE s.patient_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
  },

  // Get pending surveys for a patient (completed appointments without surveys)
  getPendingSurveys: async (patientId) => {
    const query = `
      SELECT 
        a.id as appointment_id,
        a.appointment_date,
        a.status,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        d.id as doctor_id,
        a.created_at as appointment_created_at,
        a.updated_at as appointment_completed_at
      FROM appointments a
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN users u_doctor ON doc.user_id = u_doctor.id
      LEFT JOIN doctors d ON doc.id = d.id
      LEFT JOIN surveys s ON a.id = s.appointment_id
      WHERE a.patient_id = $1
      AND a.status = 'completed'
      AND s.id IS NULL
      ORDER BY a.appointment_date DESC
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
  },

  // Get survey completion statistics for a patient
  getPatientSurveyStats: async (patientId) => {
    const query = `
      SELECT 
        COUNT(a.id) as total_completed_appointments,
        COUNT(s.id) as surveys_completed,
        ROUND(
          (COUNT(s.id)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 
          1
        ) as completion_rate
      FROM appointments a
      LEFT JOIN surveys s ON a.id = s.appointment_id
      WHERE a.patient_id = $1
      AND a.status = 'completed'
    `;
    const result = await db.query(query, [patientId]);
    return result.rows[0];
  },

  // Get all surveys (for admin)
  findAll: async (limit = 50, offset = 0) => {
    const query = `
      SELECT 
        s.*,
        u_patient.name as patient_name,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        a.appointment_date
      FROM surveys s
      JOIN patients p ON s.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      LEFT JOIN appointments a ON s.appointment_id = a.id
      LEFT JOIN doctors doc ON a.doctor_id = doc.id
      LEFT JOIN users u_doctor ON doc.user_id = u_doctor.id
      LEFT JOIN doctors d ON doc.id = d.id
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },

  // Get survey statistics
  getStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_surveys,
        AVG(appointment_ease_rating) as avg_appointment_ease,
        AVG(punctuality_rating) as avg_punctuality,
        AVG(medical_staff_rating) as avg_medical_staff,
        AVG(platform_rating) as avg_platform,
        COUNT(CASE WHEN would_recommend = 'yes' THEN 1 END) as recommend_yes,
        COUNT(CASE WHEN would_recommend = 'no' THEN 1 END) as recommend_no,
        COUNT(CASE WHEN would_recommend = 'maybe' THEN 1 END) as recommend_maybe
      FROM surveys
    `;
    const result = await db.query(query);
    return result.rows[0];
  },

  // Check if patient already submitted survey for an appointment
  checkExistingSurvey: async (patientId, appointmentId) => {
    const query = `
      SELECT id FROM surveys 
      WHERE patient_id = $1 AND appointment_id = $2
    `;
    const result = await db.query(query, [patientId, appointmentId]);
    return result.rows[0];
  },
};

export default Survey;