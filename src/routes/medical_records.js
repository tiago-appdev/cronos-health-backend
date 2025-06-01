import express from "express";
import {
  getPatientRecords,
  createMedicalRecord,
  updateMedicalRecord,
  addPrescription,
  addMedicalTest,
  addPatientNote,
  getPatientNotes,
} from "../controllers/medical_record.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a patient
// @access  Private
router.get("/patient/:patientId", authMiddleware, getPatientRecords);

// @route   POST /api/medical-records
// @desc    Create new medical record
// @access  Private (Doctors only)
router.post("/", authMiddleware, createMedicalRecord);

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private (Doctor only)
router.put("/:id", authMiddleware, updateMedicalRecord);

// @route   POST /api/medical-records/:id/prescriptions
// @desc    Add prescription to medical record
// @access  Private (Doctors only)
router.post("/:id/prescriptions", authMiddleware, addPrescription);

// @route   POST /api/medical-records/:id/tests
// @desc    Add medical test to record
// @access  Private (Doctors only)
router.post("/:id/tests", authMiddleware, addMedicalTest);

// @route   POST /api/medical-records/notes
// @desc    Add note about a patient
// @access  Private (Doctors only)
router.post("/notes", authMiddleware, addPatientNote);

// @route   GET /api/medical-records/notes/:patientId
// @desc    Get all notes for a patient
// @access  Private
router.get("/notes/:patientId", authMiddleware, getPatientNotes);

export default router;
