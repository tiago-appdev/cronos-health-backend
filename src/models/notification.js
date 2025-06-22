import db from "../db.js";

const Notification = {
  // Get all notifications for a user
  getUserNotifications: async (userId, limit = 20, offset = 0, includeRead = false) => {
    let query = `
      SELECT 
        id,
        type,
        title,
        message,
        data,
        is_read,
        priority,
        expires_at,
        created_at,
        updated_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (!includeRead) {
      query += ` AND is_read = FALSE`;
    }

    // Don't show expired notifications
    query += ` AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;

    query += ` ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get unread notification count
  getUnreadCount: async (userId) => {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 
      AND is_read = FALSE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].unread_count) || 0;
  },

  // Mark notification as read
  markAsRead: async (notificationId, userId) => {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [notificationId, userId]);
    return result.rows[0];
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId) => {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING COUNT(*) as updated_count
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Create a new notification
  create: async (notificationData) => {
    const {
      userId,
      type,
      title,
      message,
      data = {},
      priority = 'normal',
      expiresAt = null
    } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      type,
      title,
      message,
      JSON.stringify(data),
      priority,
      expiresAt
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Delete a notification
  delete: async (notificationId, userId) => {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [notificationId, userId]);
    return result.rows[0];
  },

  // Get survey reminder notifications specifically
  getSurveyReminders: async (userId) => {
    const query = `
      SELECT 
        n.*,
        a.appointment_date,
        a.status as appointment_status
      FROM notifications n
      LEFT JOIN appointments a ON (n.data->>'appointment_id')::INTEGER = a.id
      WHERE n.user_id = $1 
      AND n.type = 'survey_reminder'
      AND n.is_read = FALSE
      AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
      ORDER BY n.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get user notification preferences
  getPreferences: async (userId) => {
    const query = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1
    `;
    const result = await db.query(query, [userId]);
    
    // If no preferences exist, create default ones
    if (result.rows.length === 0) {
      const createQuery = `
        INSERT INTO notification_preferences (
          user_id, 
          survey_reminders, 
          appointment_reminders, 
          system_notifications
        )
        VALUES ($1, TRUE, TRUE, TRUE)
        RETURNING *
      `;
      const createResult = await db.query(createQuery, [userId]);
      return createResult.rows[0];
    }
    
    return result.rows[0];
  },

  // Update user notification preferences
  updatePreferences: async (userId, preferences) => {
    const {
      surveyReminders,
      appointmentReminders,
      systemNotifications,
      emailNotifications,
      smsNotifications
    } = preferences;

    const query = `
      UPDATE notification_preferences
      SET 
        survey_reminders = COALESCE($2, survey_reminders),
        appointment_reminders = COALESCE($3, appointment_reminders),
        system_notifications = COALESCE($4, system_notifications),
        email_notifications = COALESCE($5, email_notifications),
        sms_notifications = COALESCE($6, sms_notifications),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [
      userId,
      surveyReminders,
      appointmentReminders,
      systemNotifications,
      emailNotifications,
      smsNotifications
    ]);

    return result.rows[0];
  },

  // Clean up expired notifications (can be called by a cron job)
  cleanupExpired: async () => {
    await db.query('SELECT expire_old_notifications()');
    return true;
  },

  // Get notification statistics (for admin)
  getStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN type = 'survey_reminder' THEN 1 END) as survey_reminders,
        COUNT(CASE WHEN type = 'appointment_reminder' THEN 1 END) as appointment_reminders,
        COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as notifications_24h,
        COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as notifications_7d
      FROM notifications
    `;
    const result = await db.query(query);
    return result.rows[0];
  }
};

export default Notification;