-- Seed data for healthcare management system

-- Insert sample users (doctors)
INSERT INTO users (email, password, name, user_type) VALUES
('dr.smith@hospital.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Dr. Sarah Smith', 'doctor'),
('dr.johnson@hospital.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Dr. Michael Johnson', 'doctor'),
('dr.williams@hospital.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Dr. Emily Williams', 'doctor'),
('dr.brown@hospital.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Dr. James Brown', 'doctor'),
('dr.davis@hospital.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Dr. Lisa Davis', 'doctor')
ON CONFLICT (email) DO NOTHING;

-- Insert sample users (patients)
INSERT INTO users (email, password, name, user_type) VALUES
('john.doe@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'John Doe', 'patient'),
('jane.doe@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Jane Doe', 'patient'),
('bob.wilson@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Bob Wilson', 'patient'),
('alice.martin@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Alice Martin', 'patient'),
('charlie.garcia@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Charlie Garcia', 'patient'),
('diana.rodriguez@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Diana Rodriguez', 'patient'),
('eva.martinez@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Eva Martinez', 'patient'),
('frank.lopez@email.com', '$2b$10$9S8F5YGX4TQzrZrNvJp8cOZKj5X3yH7jQwErTyUiOp2MnBvCxAsDe', 'Frank Lopez', 'patient')
ON CONFLICT (email) DO NOTHING;

-- Insert doctor profiles
INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule)
SELECT 
    u.id,
    CASE 
        WHEN u.name = 'Dr. Sarah Smith' THEN 'Cardiology'
        WHEN u.name = 'Dr. Michael Johnson' THEN 'Pediatrics'
        WHEN u.name = 'Dr. Emily Williams' THEN 'Dermatology'
        WHEN u.name = 'Dr. James Brown' THEN 'Orthopedics'
        WHEN u.name = 'Dr. Lisa Davis' THEN 'Internal Medicine'
    END as specialty,
    CASE 
        WHEN u.name = 'Dr. Sarah Smith' THEN 'MD12345'
        WHEN u.name = 'Dr. Michael Johnson' THEN 'MD23456'
        WHEN u.name = 'Dr. Emily Williams' THEN 'MD34567'
        WHEN u.name = 'Dr. James Brown' THEN 'MD45678'
        WHEN u.name = 'Dr. Lisa Davis' THEN 'MD56789'
    END as license_number,
    CASE 
        WHEN u.name = 'Dr. Sarah Smith' THEN '+1-555-0101'
        WHEN u.name = 'Dr. Michael Johnson' THEN '+1-555-0102'
        WHEN u.name = 'Dr. Emily Williams' THEN '+1-555-0103'
        WHEN u.name = 'Dr. James Brown' THEN '+1-555-0104'
        WHEN u.name = 'Dr. Lisa Davis' THEN '+1-555-0105'
    END as phone,
    CASE 
        WHEN u.name = 'Dr. Sarah Smith' THEN 'Mon-Fri: 8AM-5PM'
        WHEN u.name = 'Dr. Michael Johnson' THEN 'Mon-Fri: 9AM-6PM, Sat: 9AM-1PM'
        WHEN u.name = 'Dr. Emily Williams' THEN 'Tue-Sat: 10AM-7PM'
        WHEN u.name = 'Dr. James Brown' THEN 'Mon-Thu: 7AM-4PM, Fri: 7AM-12PM'
        WHEN u.name = 'Dr. Lisa Davis' THEN 'Mon-Fri: 8AM-6PM'
    END as work_schedule
FROM users u 
WHERE u.user_type = 'doctor'
ON CONFLICT DO NOTHING;

-- Insert patient profiles
INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone)
SELECT 
    u.id,
    CASE 
        WHEN u.name = 'John Doe' THEN '1985-03-15'::date
        WHEN u.name = 'Jane Doe' THEN '1990-07-22'::date
        WHEN u.name = 'Bob Wilson' THEN '1978-11-08'::date
        WHEN u.name = 'Alice Martin' THEN '1995-01-30'::date
        WHEN u.name = 'Charlie Garcia' THEN '1982-09-12'::date
        WHEN u.name = 'Diana Rodriguez' THEN '1988-05-18'::date
        WHEN u.name = 'Eva Martinez' THEN '1992-12-03'::date
        WHEN u.name = 'Frank Lopez' THEN '1975-06-25'::date
    END as date_of_birth,
    CASE 
        WHEN u.name = 'John Doe' THEN '+1-555-1001'
        WHEN u.name = 'Jane Doe' THEN '+1-555-1002'
        WHEN u.name = 'Bob Wilson' THEN '+1-555-1003'
        WHEN u.name = 'Alice Martin' THEN '+1-555-1004'
        WHEN u.name = 'Charlie Garcia' THEN '+1-555-1005'
        WHEN u.name = 'Diana Rodriguez' THEN '+1-555-1006'
        WHEN u.name = 'Eva Martinez' THEN '+1-555-1007'
        WHEN u.name = 'Frank Lopez' THEN '+1-555-1008'
    END as phone,
    CASE 
        WHEN u.name = 'John Doe' THEN '123 Main St, Anytown, ST 12345'
        WHEN u.name = 'Jane Doe' THEN '456 Oak Ave, Somewhere, ST 23456'
        WHEN u.name = 'Bob Wilson' THEN '789 Pine Rd, Elsewhere, ST 34567'
        WHEN u.name = 'Alice Martin' THEN '321 Elm St, Nowhere, ST 45678'
        WHEN u.name = 'Charlie Garcia' THEN '654 Maple Dr, Anywhere, ST 56789'
        WHEN u.name = 'Diana Rodriguez' THEN '987 Cedar Ln, Everywhere, ST 67890'
        WHEN u.name = 'Eva Martinez' THEN '147 Birch Way, Someplace, ST 78901'
        WHEN u.name = 'Frank Lopez' THEN '258 Spruce Ct, Otherplace, ST 89012'
    END as address,
    CASE 
        WHEN u.name = 'John Doe' THEN 'Mary Doe (Wife)'
        WHEN u.name = 'Jane Doe' THEN 'John Doe (Husband)'
        WHEN u.name = 'Bob Wilson' THEN 'Sarah Wilson (Wife)'
        WHEN u.name = 'Alice Martin' THEN 'Tom Martin (Father)'
        WHEN u.name = 'Charlie Garcia' THEN 'Maria Garcia (Mother)'
        WHEN u.name = 'Diana Rodriguez' THEN 'Carlos Rodriguez (Brother)'
        WHEN u.name = 'Eva Martinez' THEN 'Luis Martinez (Husband)'
        WHEN u.name = 'Frank Lopez' THEN 'Ana Lopez (Daughter)'
    END as emergency_contact,
    CASE 
        WHEN u.name = 'John Doe' THEN '+1-555-2001'
        WHEN u.name = 'Jane Doe' THEN '+1-555-2002'
        WHEN u.name = 'Bob Wilson' THEN '+1-555-2003'
        WHEN u.name = 'Alice Martin' THEN '+1-555-2004'
        WHEN u.name = 'Charlie Garcia' THEN '+1-555-2005'
        WHEN u.name = 'Diana Rodriguez' THEN '+1-555-2006'
        WHEN u.name = 'Eva Martinez' THEN '+1-555-2007'
        WHEN u.name = 'Frank Lopez' THEN '+1-555-2008'
    END as emergency_phone
FROM users u 
WHERE u.user_type = 'patient'
ON CONFLICT DO NOTHING;

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status)
SELECT 
    p.id as patient_id,
    d.id as doctor_id,
    appointment_date,
    status
FROM (
    VALUES 
        (1, 1, '2024-06-15 09:00:00+00'::timestamptz, 'scheduled'),
        (1, 2, '2024-06-20 14:30:00+00'::timestamptz, 'completed'),
        (2, 1, '2024-06-18 10:15:00+00'::timestamptz, 'scheduled'),
        (2, 3, '2024-06-22 11:00:00+00'::timestamptz, 'scheduled'),
        (3, 4, '2024-06-16 08:30:00+00'::timestamptz, 'completed'),
        (3, 1, '2024-06-25 15:45:00+00'::timestamptz, 'scheduled'),
        (4, 2, '2024-06-19 09:30:00+00'::timestamptz, 'scheduled'),
        (4, 5, '2024-06-24 13:15:00+00'::timestamptz, 'scheduled'),
        (5, 3, '2024-06-17 16:00:00+00'::timestamptz, 'completed'),
        (5, 4, '2024-06-26 10:30:00+00'::timestamptz, 'scheduled'),
        (6, 1, '2024-06-21 14:00:00+00'::timestamptz, 'scheduled'),
        (6, 5, '2024-06-27 11:45:00+00'::timestamptz, 'scheduled'),
        (7, 2, '2024-06-23 08:15:00+00'::timestamptz, 'scheduled'),
        (7, 3, '2024-06-28 15:30:00+00'::timestamptz, 'scheduled'),
        (8, 4, '2024-06-14 12:00:00+00'::timestamptz, 'completed'),
        (8, 5, '2024-06-29 09:45:00+00'::timestamptz, 'scheduled')
) AS appointment_data (patient_num, doctor_num, appointment_date, status)
JOIN (
    SELECT ROW_NUMBER() OVER (ORDER BY id) as rn, id 
    FROM patients
) p ON p.rn = appointment_data.patient_num
JOIN (
    SELECT ROW_NUMBER() OVER (ORDER BY id) as rn, id 
    FROM doctors  
) d ON d.rn = appointment_data.doctor_num
ON CONFLICT DO NOTHING;

-- Add some additional appointments for variety
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status)
SELECT 
    (SELECT id FROM patients ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM doctors ORDER BY RANDOM() LIMIT 1),
    NOW() + INTERVAL '1 day' + (RANDOM() * INTERVAL '30 days'),
    'scheduled'
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Insert some past appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status)
SELECT 
    (SELECT id FROM patients ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM doctors ORDER BY RANDOM() LIMIT 1),
    NOW() - INTERVAL '1 day' - (RANDOM() * INTERVAL '90 days'),
    CASE 
        WHEN RANDOM() > 0.8 THEN 'canceled'
        ELSE 'completed'
    END
FROM generate_series(1, 15)
ON CONFLICT DO NOTHING;

-- Update timestamps to make them more realistic
UPDATE users SET 
    created_at = NOW() - INTERVAL '6 months' + (RANDOM() * INTERVAL '5 months'),
    updated_at = NOW() - INTERVAL '1 month' + (RANDOM() * INTERVAL '3 weeks')
WHERE user_type = 'doctor';

UPDATE users SET 
    created_at = NOW() - INTERVAL '1 year' + (RANDOM() * INTERVAL '10 months'),
    updated_at = NOW() - INTERVAL '2 weeks' + (RANDOM() * INTERVAL '1 week')
WHERE user_type = 'patient';

UPDATE patients SET 
    created_at = (SELECT created_at FROM users WHERE users.id = patients.user_id),
    updated_at = (SELECT updated_at FROM users WHERE users.id = patients.user_id);

UPDATE doctors SET 
    created_at = (SELECT created_at FROM users WHERE users.id = doctors.user_id),
    updated_at = (SELECT updated_at FROM users WHERE users.id = doctors.user_id);

-- Create some useful views for easier querying
CREATE OR REPLACE VIEW patient_details AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    p.date_of_birth,
    p.phone,
    p.address,
    p.emergency_contact,
    p.emergency_phone,
    EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age,
    u.created_at as registered_date
FROM users u
JOIN patients p ON u.id = p.user_id
WHERE u.user_type = 'patient';

CREATE OR REPLACE VIEW doctor_details AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    d.specialty,
    d.license_number,
    d.phone,
    d.work_schedule,
    u.created_at as registered_date
FROM users u
JOIN doctors d ON u.id = d.user_id
WHERE u.user_type = 'doctor';

CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id as appointment_id,
    pd.name as patient_name,
    pd.email as patient_email,
    dd.name as doctor_name,
    dd.specialty as doctor_specialty,
    a.appointment_date,
    a.status,
    a.created_at as scheduled_date
FROM appointments a
JOIN patient_details pd ON a.patient_id = (SELECT id FROM patients WHERE user_id = pd.user_id)
JOIN doctor_details dd ON a.doctor_id = (SELECT id FROM doctors WHERE user_id = dd.user_id)
ORDER BY a.appointment_date DESC;

-- Add helpful comments
COMMENT ON TABLE users IS 'Main user table for both patients and doctors';
COMMENT ON TABLE patients IS 'Patient-specific information';
COMMENT ON TABLE doctors IS 'Doctor-specific information';
COMMENT ON TABLE appointments IS 'Appointment bookings between patients and doctors';
COMMENT ON VIEW patient_details IS 'Convenient view combining user and patient data';
COMMENT ON VIEW doctor_details IS 'Convenient view combining user and doctor data';
COMMENT ON VIEW appointment_details IS 'Comprehensive appointment view with patient and doctor details';