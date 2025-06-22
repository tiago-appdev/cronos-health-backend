import Notification from "../models/notification.js";

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
export const getUserNotifications = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { limit = 20, offset = 0, include_read = false } = req.query;

    const notifications = await Notification.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset),
      include_read === 'true'
    );

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.is_read,
      priority: notification.priority,
      expiresAt: notification.expires_at,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      timeAgo: getTimeAgo(notification.created_at)
    }));

    res.json(formattedNotifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for current user
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({ unreadCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: notificationId } = req.params;

    if (!notificationId || isNaN(parseInt(notificationId))) {
      return res.status(400).json({
        message: "ID de notificación inválido"
      });
    }

    const notification = await Notification.markAsRead(parseInt(notificationId), userId);

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada"
      });
    }

    res.json({
      message: "Notificación marcada como leída",
      notification: {
        id: notification.id,
        isRead: notification.is_read
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    await Notification.markAllAsRead(userId);
    
    res.json({
      message: "Todas las notificaciones marcadas como leídas"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: notificationId } = req.params;

    if (!notificationId || isNaN(parseInt(notificationId))) {
      return res.status(400).json({
        message: "ID de notificación inválido"
      });
    }

    const notification = await Notification.delete(parseInt(notificationId), userId);

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada"
      });
    }

    res.json({
      message: "Notificación eliminada exitosamente"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/notifications/survey-reminders
// @desc    Get survey reminder notifications for current user
// @access  Private
export const getSurveyReminders = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const reminders = await Notification.getSurveyReminders(userId);

    const formattedReminders = reminders.map(reminder => ({
      id: reminder.id,
      appointmentId: reminder.data?.appointment_id,
      doctorName: reminder.data?.doctor_name,
      appointmentDate: reminder.data?.appointment_date,
      actionUrl: reminder.data?.action_url,
      title: reminder.title,
      message: reminder.message,
      priority: reminder.priority,
      createdAt: reminder.created_at,
      timeAgo: getTimeAgo(reminder.created_at)
    }));

    res.json(formattedReminders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/notifications/preferences
// @desc    Get notification preferences for current user
// @access  Private
export const getNotificationPreferences = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const preferences = await Notification.getPreferences(userId);

    const formattedPreferences = {
      surveyReminders: preferences.survey_reminders,
      appointmentReminders: preferences.appointment_reminders,
      systemNotifications: preferences.system_notifications,
      emailNotifications: preferences.email_notifications,
      smsNotifications: preferences.sms_notifications
    };

    res.json(formattedPreferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences for current user
// @access  Private
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      surveyReminders,
      appointmentReminders,
      systemNotifications,
      emailNotifications,
      smsNotifications
    } = req.body;

    const preferences = await Notification.updatePreferences(userId, {
      surveyReminders,
      appointmentReminders,
      systemNotifications,
      emailNotifications,
      smsNotifications
    });

    const formattedPreferences = {
      surveyReminders: preferences.survey_reminders,
      appointmentReminders: preferences.appointment_reminders,
      systemNotifications: preferences.system_notifications,
      emailNotifications: preferences.email_notifications,
      smsNotifications: preferences.sms_notifications
    };

    res.json({
      message: "Preferencias actualizadas exitosamente",
      preferences: formattedPreferences
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/notifications
// @desc    Create a new notification (admin only)
// @access  Private (Admin only)
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      data,
      priority,
      expiresAt
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        message: "userId, type, title y message son requeridos"
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      priority,
      expiresAt
    });

    res.status(201).json({
      message: "Notificación creada exitosamente",
      notification
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (admin only)
// @access  Private (Admin only)
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.getStats();

    const formattedStats = {
      totalNotifications: parseInt(stats.total_notifications) || 0,
      unreadNotifications: parseInt(stats.unread_notifications) || 0,
      surveyReminders: parseInt(stats.survey_reminders) || 0,
      appointmentReminders: parseInt(stats.appointment_reminders) || 0,
      notifications24h: parseInt(stats.notifications_24h) || 0,
      notifications7d: parseInt(stats.notifications_7d) || 0,
    };

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffMs = now - notificationDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return notificationDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};