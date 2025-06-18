import MedicalHistory from "../models/medical_history.js";

async function getMedicalHistorySummary(req, res) {
  try {
    const patientId = req.user.id;
    const summary = await MedicalHistory.getSummary(patientId);
    res.json(summary);
  } catch (error) {
    console.error("Error getting medical history summary:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el resumen del historial médico" });
  }
}

async function getConsultations(req, res) {
  try {
    const patientId = req.user.id;
    const consultations = await MedicalHistory.getConsultations(patientId);
    res.json(consultations);
  } catch (error) {
    console.error("Error getting consultations:", error);
    res.status(500).json({ error: "Error al obtener las consultas" });
  }
}

async function getPrescriptions(req, res) {
  try {
    const patientId = req.user.id;
    const prescriptions = await MedicalHistory.getPrescriptions(patientId);
    res.json(prescriptions);
  } catch (error) {
    console.error("Error getting prescriptions:", error);
    res.status(500).json({ error: "Error al obtener las recetas" });
  }
}

async function getMedicalTests(req, res) {
  try {
    const patientId = req.user.id;
    const tests = await MedicalHistory.getMedicalTests(patientId);
    res.json(tests);
  } catch (error) {
    console.error("Error getting medical tests:", error);
    res.status(500).json({ error: "Error al obtener los exámenes médicos" });
  }
}

async function getNotes(req, res) {
  try {
    const patientId = req.user.id;
    const notes = await MedicalHistory.getNotes(patientId);
    res.json(notes);
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500).json({ error: "Error al obtener las notas" });
  }
}

export default {
  getMedicalHistorySummary,
  getConsultations,
  getPrescriptions,
  getMedicalTests,
  getNotes,
};
