CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  appointment_ease_rating INTEGER CHECK (appointment_ease_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  medical_staff_rating INTEGER CHECK (medical_staff_rating BETWEEN 1 AND 5),
  platform_rating INTEGER CHECK (platform_rating BETWEEN 1 AND 5),
  would_recommend VARCHAR(10) CHECK (would_recommend IN ('yes', 'no', 'maybe')),
  additional_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_patient ON surveys(patient_id);
CREATE INDEX IF NOT EXISTS idx_surveys_appointment ON surveys(appointment_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);

-- Comments
COMMENT ON TABLE surveys IS 'Patient satisfaction surveys';
COMMENT ON COLUMN surveys.appointment_ease_rating IS 'Rating 1-5 for appointment scheduling ease';
COMMENT ON COLUMN surveys.punctuality_rating IS 'Rating 1-5 for appointment punctuality';
COMMENT ON COLUMN surveys.medical_staff_rating IS 'Rating 1-5 for medical staff attention';
COMMENT ON COLUMN surveys.platform_rating IS 'Rating 1-5 for platform experience';
COMMENT ON COLUMN surveys.would_recommend IS 'Would recommend service: yes/no/maybe';