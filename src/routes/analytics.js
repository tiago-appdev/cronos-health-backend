import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  getSystemStats,
  getRecentActivity,
  getAppointmentDistribution,
  getMonthlyTrends,
  getDoctorMetrics,
  getPatientMetrics,
} from "../controllers/analytics.js";

const router = Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/analytics/stats
// @desc    Get overall system statistics
// @access  Private (Admin only)
router.get("/stats", getSystemStats);

// @route   GET /api/analytics/recent-activity
// @desc    Get recent system activity
// @access  Private (Admin only)
router.get("/recent-activity", getRecentActivity);

// @route   GET /api/analytics/appointment-distribution
// @desc    Get appointment distribution by specialty
// @access  Private (Admin only)
router.get("/appointment-distribution", getAppointmentDistribution);

// @route   GET /api/analytics/monthly-trends
// @desc    Get monthly appointment trends
// @access  Private (Admin only)
router.get("/monthly-trends", getMonthlyTrends);

// @route   GET /api/analytics/doctor-metrics
// @desc    Get doctor performance metrics
// @access  Private (Admin only)
router.get("/doctor-metrics", getDoctorMetrics);

// @route   GET /api/analytics/patient-metrics
// @desc    Get patient engagement metrics
// @access  Private (Admin only)
router.get("/patient-metrics", getPatientMetrics);

export default router;