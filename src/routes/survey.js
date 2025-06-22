import express from "express";
import {
  submitSurvey,
  getMySurveys,
  getAllSurveys,
  getSurveyStats,
  getPendingSurveys,
  getPatientSurveyStats,
} from "../controllers/survey.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// @route   GET /api/surveys/pending
// @desc    Get pending surveys for current patient
// @access  Private (Patients only)
router.get("/pending", authMiddleware, getPendingSurveys);

// @route   GET /api/surveys/my-stats
// @desc    Get survey completion statistics for current patient
// @access  Private (Patients only)
router.get("/my-stats", authMiddleware, getPatientSurveyStats);

// @route   POST /api/surveys
// @desc    Submit a new survey
// @access  Private (Patients only)
router.post("/", authMiddleware, submitSurvey);

// @route   GET /api/surveys/my-surveys
// @desc    Get surveys submitted by current patient
// @access  Private (Patients only)
router.get("/my-surveys", authMiddleware, getMySurveys);

// @route   GET /api/surveys
// @desc    Get all surveys (admin only)
// @access  Private (Admin only)
router.get("/", authMiddleware, adminMiddleware, getAllSurveys);

// @route   GET /api/surveys/stats
// @desc    Get survey statistics (admin only)
// @access  Private (Admin only)
router.get("/stats", authMiddleware, adminMiddleware, getSurveyStats);

export default router;