import express from "express";
import { 
  getAppointments, 
  createAppointment, 
  updateAppointment, 
  cancelAppointment, 
  getDoctors,
  getAppointment 
} from "../controllers/appointment.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments for current user
// @access  Private
router.get("/", authMiddleware, getAppointments);

// @route   GET /api/appointments/doctors
// @desc    Get all available doctors
// @access  Private
router.get("/doctors", authMiddleware, getDoctors);

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get("/:id", authMiddleware, getAppointment);

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Patients only)
router.post("/", authMiddleware, createAppointment);

// @route   PUT /api/appointments/:id
// @desc    Update appointment (reschedule)
// @access  Private
router.put("/:id", authMiddleware, updateAppointment);

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete("/:id", authMiddleware, cancelAppointment);

export default router;