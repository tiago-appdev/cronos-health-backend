import db from "../db.js";

const Analytics = {
  // Get overall system statistics
  getSystemStats: async () => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE user_type = 'patient') as total_patients,
        (SELECT COUNT(*) FROM users WHERE user_type = 'doctor') as total_doctors,
        (SELECT COUNT(*) FROM appointments WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_appointments,
        (SELECT 
          ROUND(
            (COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / 
             NULLIF(COUNT(CASE WHEN status IN ('completed', 'canceled') THEN 1 END), 0)) * 100, 
            0
          )
        FROM appointments 
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
        ) as attendance_rate,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURRENT_DATE) as upcoming_appointments,
        (SELECT COUNT(*) FROM surveys) as total_surveys
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  },

  // Get recent system activity
  getRecentActivity: async (limit = 10) => {
    const query = `
      SELECT * FROM (
        -- New appointments
        SELECT 
          'appointment_created' as activity_type,
          CONCAT('Nueva cita agendada - ', u_patient.name, ' con ', u_doctor.name) as description,
          CONCAT('Paciente: ', u_patient.name, ' - Dr. ', u_doctor.name) as details,
          a.created_at as activity_time
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u_patient ON p.user_id = u_patient.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u_doctor ON d.user_id = u_doctor.id
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '7 days'
        
        UNION ALL
        
        -- New user registrations
        SELECT 
          'user_registered' as activity_type,
          CONCAT('Nuevo ', 
            CASE 
              WHEN user_type = 'patient' THEN 'paciente'
              WHEN user_type = 'doctor' THEN 'médico'
              ELSE 'usuario'
            END,
            ' registrado'
          ) as description,
          CONCAT(name, ' se ha registrado en el sistema') as details,
          created_at as activity_time
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND user_type != 'admin'
        
        UNION ALL
        
        -- Survey submissions
        SELECT 
          'survey_submitted' as activity_type,
          'Nueva encuesta de satisfacción' as description,
          CONCAT('Encuesta enviada por ', u.name) as details,
          s.created_at as activity_time
        FROM surveys s
        JOIN patients p ON s.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
        
        UNION ALL
        
        -- Completed appointments
        SELECT 
          'appointment_completed' as activity_type,
          'Cita médica completada' as description,
          CONCAT('Cita completada - ', u_patient.name, ' con ', u_doctor.name) as details,
          a.updated_at as activity_time
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u_patient ON p.user_id = u_patient.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u_doctor ON d.user_id = u_doctor.id
        WHERE a.status = 'completed'
        AND a.updated_at >= CURRENT_DATE - INTERVAL '7 days'
      ) activities
      ORDER BY activity_time DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  },

  // Get appointment distribution by specialty
  getAppointmentDistribution: async () => {
    const query = `
      SELECT 
        COALESCE(d.specialty, 'Sin especialidad') as specialty,
        COUNT(a.id) as appointment_count,
        ROUND(
          (COUNT(a.id)::numeric / 
           NULLIF((SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'), 0)) * 100, 
          1
        ) as percentage
      FROM appointments a
      JOIN doctors doc ON a.doctor_id = doc.id
      LEFT JOIN doctors d ON doc.id = d.id
      WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY d.specialty
      ORDER BY appointment_count DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  },

  // Get monthly appointment trends
  getMonthlyTrends: async (months = 6) => {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', appointment_date), 'YYYY-MM') as month,
        TO_CHAR(DATE_TRUNC('month', appointment_date), 'Mon YYYY') as month_name,
        COUNT(*) as appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', appointment_date)
      ORDER BY month ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  },

  // Get doctor performance metrics
  getDoctorMetrics: async () => {
    const query = `
      SELECT 
        u.name as doctor_name,
        d.specialty,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        ROUND(
          (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::numeric / 
           NULLIF(COUNT(a.id), 0)) * 100, 
          1
        ) as completion_rate,
        COALESCE(AVG(s.medical_staff_rating), 0) as avg_rating
      FROM doctors doc
      JOIN users u ON doc.user_id = u.id
      LEFT JOIN doctors d ON doc.id = d.id
      LEFT JOIN appointments a ON doc.id = a.doctor_id
      LEFT JOIN surveys s ON a.id = s.appointment_id
      WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.name, d.specialty, doc.id
      HAVING COUNT(a.id) > 0
      ORDER BY total_appointments DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  },

  // Get patient engagement metrics
  getPatientMetrics: async () => {
    const query = `
      SELECT 
        COUNT(DISTINCT u.id) as total_active_patients,
        COUNT(DISTINCT a.patient_id) as patients_with_appointments,
        COUNT(DISTINCT s.patient_id) as patients_with_surveys,
        ROUND(
          (COUNT(DISTINCT s.patient_id)::numeric / 
           NULLIF(COUNT(DISTINCT a.patient_id), 0)) * 100, 
          1
        ) as survey_response_rate
      FROM users u
      JOIN patients p ON u.id = p.user_id
      LEFT JOIN appointments a ON p.id = a.patient_id 
        AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN surveys s ON p.id = s.patient_id 
        AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE u.user_type = 'patient'
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  },
};

export default Analytics;