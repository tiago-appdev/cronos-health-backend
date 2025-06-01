import MedicalRecord from "../models/medical_record.js";
import Appointment from "../models/appointment.js";

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a patient
// @access  Private (only for doctors or the patient themselves)
export const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: userId, userType } = req.user;

    // Verify authorization
    if (userType === "patient") {
      const userPatientId = await Appointment.getPatientIdByUserId(userId);
      if (parseInt(patientId) !== userPatientId) {
        return res.status(403).json({
          message: "No autorizado para ver estos registros médicos",
        });
      }
    }

    const records = await MedicalRecord.findByPatientId(patientId);

    // Format records for response
    const formattedRecords = await Promise.all(
      records.map(async (record) => {
        const prescriptions = await MedicalRecord.getPrescriptions(record.id);
        const tests = await MedicalRecord.getTests(record.id);

        return {
          id: record.id,
          date: record.date,
          doctor: record.doctor_name,
          specialty: record.doctor_specialty,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          notes: record.notes,
          prescriptions,
          tests,
        };
      })
    );

    res.json(formattedRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/medical-records
// @desc    Create a new medical record
// @access  Private (Doctors only)
export const createMedicalRecord = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "doctor") {
      return res.status(403).json({
        message: "Solo los médicos pueden crear registros médicos",
      });
    }

    const { patientId, diagnosis, treatment, notes } = req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({
        message: "El paciente y el diagnóstico son requeridos",
      });
    }

    const doctorId = await Appointment.getDoctorIdByUserId(userId);
    if (!doctorId) {
      return res.status(404).json({
        message: "Perfil de médico no encontrado",
      });
    }

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      diagnosis,
      treatment,
      notes,
    });

    res.status(201).json({
      message: "Registro médico creado exitosamente",
      record,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/medical-records/:id
// @desc    Update a medical record
// @access  Private (Only the doctor who created it)
export const updateMedicalRecord = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;
    const recordId = req.params.id;

    if (userType !== "doctor") {
      return res.status(403).json({
        message: "Solo los médicos pueden actualizar registros médicos",
      });
    }

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    const doctorId = await Appointment.getDoctorIdByUserId(userId);
    if (record.doctor_id !== doctorId) {
      return res.status(403).json({
        message: "Solo el médico que creó el registro puede modificarlo",
      });
    }

    const updatedRecord = await MedicalRecord.update(recordId, req.body);

    res.json({
      message: "Registro médico actualizado exitosamente",
      record: updatedRecord,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/medical-records/:id/prescriptions
// @desc    Add a prescription to a medical record
// @access  Private (Doctors only)
export const addPrescription = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;
    const recordId = req.params.id;

    if (userType !== "doctor") {
      return res.status(403).json({
        message: "Solo los médicos pueden agregar recetas",
      });
    }

    const { medication, dosage, frequency, duration } = req.body;
    if (!medication || !dosage || !frequency) {
      return res.status(400).json({
        message: "Medicamento, dosis y frecuencia son requeridos",
      });
    }

    const prescription = await MedicalRecord.addPrescription(recordId, {
      medication,
      dosage,
      frequency,
      duration,
    });

    res.status(201).json({
      message: "Receta agregada exitosamente",
      prescription,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/medical-records/:id/tests
// @desc    Add a medical test to a record
// @access  Private (Doctors only)
export const addMedicalTest = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;
    const recordId = req.params.id;

    if (userType !== "doctor") {
      return res.status(403).json({
        message: "Solo los médicos pueden agregar exámenes médicos",
      });
    }

    const { testName, testDate, results, notes } = req.body;
    if (!testName) {
      return res.status(400).json({
        message: "El nombre del examen es requerido",
      });
    }

    const test = await MedicalRecord.addTest(recordId, {
      testName,
      testDate,
      results,
      notes,
    });

    res.status(201).json({
      message: "Examen médico agregado exitosamente",
      test,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/medical-records/notes
// @desc    Add a note about a patient
// @access  Private (Doctors only)
export const addPatientNote = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "doctor") {
      return res.status(403).json({
        message: "Solo los médicos pueden agregar notas",
      });
    }

    const { patientId, note } = req.body;
    if (!patientId || !note) {
      return res.status(400).json({
        message: "Paciente y nota son requeridos",
      });
    }

    const doctorId = await Appointment.getDoctorIdByUserId(userId);
    const patientNote = await MedicalRecord.addNote({
      patientId,
      doctorId,
      note,
    });

    res.status(201).json({
      message: "Nota agregada exitosamente",
      note: patientNote,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/medical-records/notes/:patientId
// @desc    Get all notes for a patient
// @access  Private (Doctors or the patient themselves)
export const getPatientNotes = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;
    const { patientId } = req.params;

    // Verify authorization
    if (userType === "patient") {
      const userPatientId = await Appointment.getPatientIdByUserId(userId);
      if (parseInt(patientId) !== userPatientId) {
        return res.status(403).json({
          message: "No autorizado para ver estas notas",
        });
      }
    }

    const notes = await MedicalRecord.getPatientNotes(patientId);
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};
