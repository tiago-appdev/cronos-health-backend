-- Notifications System Schema
-- File: db/08-notifications.sql

-- Notifications table for managing user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('survey_reminder', 'appointment_reminder', 'appointment_completed', 'system', 'welcome')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data (appointment_id, survey_id, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  survey_reminders BOOLEAN DEFAULT TRUE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Function to auto-expire notifications
CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS void AS $$
BEGIN
  -- Mark expired notifications as read
  UPDATE notifications 
  SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
  WHERE expires_at < CURRENT_TIMESTAMP AND is_read = FALSE;
  
  -- Delete very old notifications (older than 90 days)
  DELETE FROM notifications 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to create survey reminder notifications
CREATE OR REPLACE FUNCTION create_survey_notification(
  p_user_id INTEGER,
  p_appointment_id INTEGER,
  p_doctor_name TEXT,
  p_appointment_date TEXT
)
RETURNS INTEGER AS $$
DECLARE
  notification_id INTEGER;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority,
    expires_at
  )
  VALUES (
    p_user_id,
    'survey_reminder',
    'Evalúa tu atención médica',
    'Tu cita con ' || p_doctor_name || ' ha sido completada. ¡Tu opinión es importante para nosotros!',
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'doctor_name', p_doctor_name,
      'appointment_date', p_appointment_date,
      'action_url', '/survey?appointmentId=' || p_appointment_id
    ),
    'normal',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create survey notifications when appointments are completed
CREATE OR REPLACE FUNCTION trigger_survey_notification()
RETURNS TRIGGER AS $$
DECLARE
  patient_user_id INTEGER;
  doctor_name TEXT;
  appointment_date_str TEXT;
BEGIN
  -- Only create notification if appointment status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get patient user_id
    SELECT p.user_id INTO patient_user_id
    FROM patients p
    WHERE p.id = NEW.patient_id;
    
    -- Get doctor name and format appointment date
    SELECT u.name, to_char(NEW.appointment_date, 'DD/MM/YYYY')
    INTO doctor_name, appointment_date_str
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = NEW.doctor_id;
    
    -- Create survey notification
    IF patient_user_id IS NOT NULL AND doctor_name IS NOT NULL THEN
      PERFORM create_survey_notification(
        patient_user_id,
        NEW.id,
        doctor_name,
        appointment_date_str
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment completion
DROP TRIGGER IF EXISTS trigger_appointment_completed_survey ON appointments;
CREATE TRIGGER trigger_appointment_completed_survey
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_survey_notification();

-- Function to clean up survey notifications when survey is submitted
CREATE OR REPLACE FUNCTION cleanup_survey_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark survey reminder notifications as read when survey is submitted
  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE notifications
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = (
      SELECT p.user_id FROM patients p WHERE p.id = NEW.patient_id
    )
    AND type = 'survey_reminder'
    AND (data->>'appointment_id')::INTEGER = NEW.appointment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for survey submission
DROP TRIGGER IF EXISTS trigger_survey_submitted ON surveys;
CREATE TRIGGER trigger_survey_submitted
  AFTER INSERT ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_survey_notification();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, survey_reminders, appointment_reminders, system_notifications)
SELECT id, TRUE, TRUE, TRUE
FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE notification_preferences IS 'User notification preferences';
COMMENT ON FUNCTION create_survey_notification IS 'Creates a survey reminder notification';
COMMENT ON FUNCTION trigger_survey_notification IS 'Automatically creates survey notifications when appointments are completed';
COMMENT ON FUNCTION cleanup_survey_notification IS 'Marks survey notifications as read when survey is submitted';