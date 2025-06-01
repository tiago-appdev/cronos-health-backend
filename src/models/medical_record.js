import db from "../db.js";

const MedicalRecord = {
  // Get all medical records for a patient
  findByPatientId: async (patientId) => {
    const query = `
      SELECT 
        mr.*,
        u.name as doctor_name,
        d.specialty as doctor_specialty
      FROM medical_records mr
      JOIN doctors doc ON mr.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      JOIN doctors d ON doc.id = d.id
      WHERE mr.patient_id = $1
      ORDER BY mr.date DESC
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
  },

  // Get a single medical record
  findById: async (recordId) => {
    const query = `
      SELECT 
        mr.*,
        u_doctor.name as doctor_name,
        d.specialty as doctor_specialty,
        u_patient.name as patient_name,
        p.date_of_birth as patient_dob,
        p.phone as patient_phone
      FROM medical_records mr
      JOIN doctors doc ON mr.doctor_id = doc.id
      JOIN users u_doctor ON doc.user_id = u_doctor.id
      JOIN doctors d ON doc.id = d.id
      JOIN patients pat ON mr.patient_id = pat.id
      JOIN users u_patient ON pat.user_id = u_patient.id
      JOIN patients p ON pat.id = p.id
      WHERE mr.id = $1
    `;
    const result = await db.query(query, [recordId]);
    return result.rows[0];
  },

  // Create a new medical record
  create: async (recordData) => {
    const { patientId, doctorId, diagnosis, treatment, notes } = recordData;

    const query = `
      INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const values = [patientId, doctorId, diagnosis, treatment, notes];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Update a medical record
  update: async (recordId, updateData) => {
    const { diagnosis, treatment, notes } = updateData;

    const query = `
      UPDATE medical_records 
      SET diagnosis = COALESCE($2, diagnosis),
          treatment = COALESCE($3, treatment),
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;

    const values = [recordId, diagnosis, treatment, notes];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Create a prescription
  addPrescription: async (recordId, prescriptionData) => {
    const { medication, dosage, frequency, duration } = prescriptionData;

    const query = `
      INSERT INTO prescriptions (medical_record_id, medication, dosage, frequency, duration) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const values = [recordId, medication, dosage, frequency, duration];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Get prescriptions for a medical record
  getPrescriptions: async (recordId) => {
    const query = `
      SELECT * FROM prescriptions 
      WHERE medical_record_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [recordId]);
    return result.rows;
  },

  // Add a medical test
  addTest: async (recordId, testData) => {
    const { testName, testDate, results, notes } = testData;

    const query = `
      INSERT INTO medical_tests (medical_record_id, test_name, test_date, results, notes) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const values = [recordId, testName, testDate, results, notes];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Get tests for a medical record
  getTests: async (recordId) => {
    const query = `
      SELECT * FROM medical_tests 
      WHERE medical_record_id = $1 
      ORDER BY test_date DESC
    `;
    const result = await db.query(query, [recordId]);
    return result.rows;
  },

  // Add a patient note
  addNote: async (noteData) => {
    const { patientId, doctorId, note } = noteData;

    const query = `
      INSERT INTO patient_notes (patient_id, doctor_id, note) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;

    const values = [patientId, doctorId, note];
    const result = await db.query(query, values);

    return result.rows[0];
  },

  // Get all notes for a patient
  getPatientNotes: async (patientId) => {
    const query = `
      SELECT 
        pn.*,
        u.name as doctor_name,
        d.specialty as doctor_specialty
      FROM patient_notes pn
      JOIN doctors doc ON pn.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      JOIN doctors d ON doc.id = d.id
      WHERE pn.patient_id = $1
      ORDER BY pn.created_at DESC
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
  },
};

export default MedicalRecord;
