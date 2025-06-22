import Survey from "../models/survey.js";
import Appointment from "../models/appointment.js";

// @route   GET /api/surveys/pending
// @desc    Get pending surveys for current patient
// @access  Private (Patients only)
export const getPendingSurveys = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "patient") {
      return res.status(403).json({
        message: "Solo los pacientes pueden ver encuestas pendientes",
      });
    }

    const patientId = await Appointment.getPatientIdByUserId(userId);
    if (!patientId) {
      return res.status(404).json({
        message: "Perfil de paciente no encontrado",
      });
    }

    const pendingSurveys = await Survey.getPendingSurveys(patientId);

    // Format the response to match frontend expectations
    const formattedSurveys = pendingSurveys.map(survey => ({
      appointmentId: survey.appointment_id,
      doctorName: survey.doctor_name,
      specialty: survey.doctor_specialty || 'Medicina General',
      appointmentDate: survey.appointment_date,
      completedAt: survey.appointment_completed_at,
      daysSinceCompletion: Math.floor((new Date() - new Date(survey.appointment_completed_at)) / (1000 * 60 * 60 * 24)),
      formattedDate: new Date(survey.appointment_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      isUrgent: Math.floor((new Date() - new Date(survey.appointment_completed_at)) / (1000 * 60 * 60 * 24)) > 7 // Urgent if more than 7 days
    }));

    res.json(formattedSurveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/surveys/stats
// @desc    Get survey completion statistics for current patient
// @access  Private (Patients only)
export const getPatientSurveyStats = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "patient") {
      return res.status(403).json({
        message: "Solo los pacientes pueden ver sus estadísticas",
      });
    }

    const patientId = await Appointment.getPatientIdByUserId(userId);
    if (!patientId) {
      return res.status(404).json({
        message: "Perfil de paciente no encontrado",
      });
    }

    const stats = await Survey.getPatientSurveyStats(patientId);

    const formattedStats = {
      totalCompletedAppointments: parseInt(stats.total_completed_appointments) || 0,
      surveysCompleted: parseInt(stats.surveys_completed) || 0,
      surveysPending: (parseInt(stats.total_completed_appointments) || 0) - (parseInt(stats.surveys_completed) || 0),
      completionRate: parseFloat(stats.completion_rate) || 0,
    };

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/surveys
// @desc    Submit a new survey
// @access  Private (Patients only)
export const submitSurvey = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "patient") {
      return res.status(403).json({
        message: "Solo los pacientes pueden enviar encuestas",
      });
    }

    const {
      appointmentId,
      appointmentEaseRating,
      punctualityRating,
      medicalStaffRating,
      platformRating,
      wouldRecommend,
      additionalComments,
    } = req.body;

    // Validate required fields
    if (
      !appointmentEaseRating ||
      !punctualityRating ||
      !medicalStaffRating ||
      !platformRating ||
      !wouldRecommend
    ) {
      return res.status(400).json({
        message: "Todas las calificaciones son requeridas",
      });
    }

    // Get patient ID
    const patientId = await Appointment.getPatientIdByUserId(userId);
    if (!patientId) {
      return res.status(404).json({
        message: "Perfil de paciente no encontrado",
      });
    }

    // If appointmentId is provided, verify it belongs to the patient
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.patient_id !== patientId) {
        return res.status(403).json({
          message: "No autorizado para esta cita",
        });
      }

      // Check if survey already exists for this appointment
      const existingSurvey = await Survey.checkExistingSurvey(patientId, appointmentId);
      if (existingSurvey) {
        return res.status(400).json({
          message: "Ya has enviado una encuesta para esta cita",
        });
      }
    }

    // Create survey
    const survey = await Survey.create({
      patientId,
      appointmentId,
      appointmentEaseRating,
      punctualityRating,
      medicalStaffRating,
      platformRating,
      wouldRecommend,
      additionalComments,
    });

    res.status(201).json({
      message: "Encuesta enviada exitosamente",
      survey,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/surveys/my-surveys
// @desc    Get surveys submitted by current patient
// @access  Private (Patients only)
export const getMySurveys = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    if (userType !== "patient") {
      return res.status(403).json({
        message: "Solo los pacientes pueden ver sus encuestas",
      });
    }

    const patientId = await Appointment.getPatientIdByUserId(userId);
    if (!patientId) {
      return res.status(404).json({
        message: "Perfil de paciente no encontrado",
      });
    }

    const surveys = await Survey.findByPatientId(patientId);

    res.json(surveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/surveys
// @desc    Get all surveys (admin only)
// @access  Private (Admin only)
export const getAllSurveys = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const surveys = await Survey.findAll(parseInt(limit), parseInt(offset));

    res.json(surveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/surveys/stats
// @desc    Get survey statistics (admin only)
// @access  Private (Admin only)
export const getSurveyStats = async (req, res) => {
  try {
    const stats = await Survey.getStats();

    // Format the response
    const formattedStats = {
      totalSurveys: parseInt(stats.total_surveys),
      averageRatings: {
        appointmentEase: parseFloat(stats.avg_appointment_ease).toFixed(2),
        punctuality: parseFloat(stats.avg_punctuality).toFixed(2),
        medicalStaff: parseFloat(stats.avg_medical_staff).toFixed(2),
        platform: parseFloat(stats.avg_platform).toFixed(2),
      },
      recommendations: {
        yes: parseInt(stats.recommend_yes),
        no: parseInt(stats.recommend_no),
        maybe: parseInt(stats.recommend_maybe),
      },
    };

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};