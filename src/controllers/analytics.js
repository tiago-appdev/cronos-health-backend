import Analytics from "../models/analytics.js";

// @route   GET /api/analytics/stats
// @desc    Get overall system statistics
// @access  Private (Admin only)
export const getSystemStats = async (req, res) => {
  try {
    const stats = await Analytics.getSystemStats();
    
    const formattedStats = {
      totalPatients: parseInt(stats.total_patients) || 0,
      totalDoctors: parseInt(stats.total_doctors) || 0,
      monthlyAppointments: parseInt(stats.monthly_appointments) || 0,
      attendanceRate: parseInt(stats.attendance_rate) || 0,
      upcomingAppointments: parseInt(stats.upcoming_appointments) || 0,
      totalSurveys: parseInt(stats.total_surveys) || 0,
    };

    res.json(formattedStats);
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas del sistema" });
  }
};

// @route   GET /api/analytics/recent-activity
// @desc    Get recent system activity
// @access  Private (Admin only)
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await Analytics.getRecentActivity(parseInt(limit));

    const formattedActivities = activities.map(activity => ({
      type: activity.activity_type,
      title: activity.description,
      description: activity.details,
      timestamp: activity.activity_time,
      timeAgo: getTimeAgo(activity.activity_time),
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    res.status(500).json({ message: "Error al obtener actividad reciente" });
  }
};

// @route   GET /api/analytics/appointment-distribution
// @desc    Get appointment distribution by specialty
// @access  Private (Admin only)
export const getAppointmentDistribution = async (req, res) => {
  try {
    const distribution = await Analytics.getAppointmentDistribution();

    const formattedDistribution = distribution.map(item => ({
      specialty: item.specialty,
      count: parseInt(item.appointment_count),
      percentage: parseFloat(item.percentage),
    }));

    res.json(formattedDistribution);
  } catch (error) {
    console.error("Error getting appointment distribution:", error);
    res.status(500).json({ message: "Error al obtener distribución de citas" });
  }
};

// @route   GET /api/analytics/monthly-trends
// @desc    Get monthly appointment trends
// @access  Private (Admin only)
export const getMonthlyTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const trends = await Analytics.getMonthlyTrends(parseInt(months));

    const formattedTrends = trends.map(trend => ({
      month: trend.month,
      monthName: trend.month_name,
      total: parseInt(trend.appointments),
      completed: parseInt(trend.completed),
      canceled: parseInt(trend.canceled),
    }));

    res.json(formattedTrends);
  } catch (error) {
    console.error("Error getting monthly trends:", error);
    res.status(500).json({ message: "Error al obtener tendencias mensuales" });
  }
};

// @route   GET /api/analytics/doctor-metrics
// @desc    Get doctor performance metrics
// @access  Private (Admin only)
export const getDoctorMetrics = async (req, res) => {
  try {
    const metrics = await Analytics.getDoctorMetrics();

    const formattedMetrics = metrics.map(metric => ({
      doctorName: metric.doctor_name,
      specialty: metric.specialty || 'Sin especialidad',
      totalAppointments: parseInt(metric.total_appointments),
      completedAppointments: parseInt(metric.completed_appointments),
      completionRate: parseFloat(metric.completion_rate),
      averageRating: parseFloat(metric.avg_rating).toFixed(1),
    }));

    res.json(formattedMetrics);
  } catch (error) {
    console.error("Error getting doctor metrics:", error);
    res.status(500).json({ message: "Error al obtener métricas de médicos" });
  }
};

// @route   GET /api/analytics/patient-metrics
// @desc    Get patient engagement metrics
// @access  Private (Admin only)
export const getPatientMetrics = async (req, res) => {
  try {
    const metrics = await Analytics.getPatientMetrics();

    const formattedMetrics = {
      totalActivePatients: parseInt(metrics.total_active_patients) || 0,
      patientsWithAppointments: parseInt(metrics.patients_with_appointments) || 0,
      patientsWithSurveys: parseInt(metrics.patients_with_surveys) || 0,
      surveyResponseRate: parseFloat(metrics.survey_response_rate) || 0,
    };

    res.json(formattedMetrics);
  } catch (error) {
    console.error("Error getting patient metrics:", error);
    res.status(500).json({ message: "Error al obtener métricas de pacientes" });
  }
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now - activityDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return activityDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};