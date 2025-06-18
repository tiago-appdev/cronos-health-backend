import { Router } from "express";
const router = Router();
import { authMiddleware } from "../middleware/authMiddleware.js";
import medicalHistoryController from "../controllers/medical_history.js";

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener resumen del historial médico
router.get("/summary", medicalHistoryController.getMedicalHistorySummary);

// Obtener listado de consultas
router.get("/consultations", medicalHistoryController.getConsultations);

// Obtener listado de recetas
router.get("/prescriptions", medicalHistoryController.getPrescriptions);

// Obtener listado de exámenes médicos
router.get("/tests", medicalHistoryController.getMedicalTests);

// Obtener listado de notas
router.get("/notes", medicalHistoryController.getNotes);

export default router;
