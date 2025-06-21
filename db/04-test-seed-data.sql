-- Archivo de seed para pruebas del historial médico
-- Crear usuario doctor de prueba
INSERT INTO users (email, password, name, user_type) VALUES
('doctor.test@hospital.com', '$2b$10$8wd9gf3VbDUg5zSSj5NGDejZ64EPDz.qLdgrGFjfJPYL6WPc9PRJq', 'Dr. Juan Pérez', 'doctor')
ON CONFLICT (email) DO NOTHING;

-- Crear perfil del doctor
INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule)
SELECT 
    u.id,
    'Medicina General',
    'MED123456',
    '+1-555-0123',
    'Lun-Vie: 9AM-6PM'
FROM users u 
WHERE u.email = 'doctor.test@hospital.com'
ON CONFLICT DO NOTHING;

-- Crear usuario paciente de prueba
INSERT INTO users (email, password, name, user_type) VALUES
('paciente.test@email.com', '$2b$10$FeWqF/5AP2btRHW/FeTFk.1MAT0t.MKhjv4HRjZFc55LDkKFbN6ae', 'María González', 'patient')
ON CONFLICT (email) DO NOTHING;

-- Crear perfil del paciente
INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone)
SELECT 
    u.id,
    '1990-01-01'::date,
    '+1-555-9876',
    'Av. Principal 123, Ciudad',
    'Juan González (Padre)',
    '+1-555-5555'
FROM users u 
WHERE u.email = 'paciente.test@email.com'
ON CONFLICT DO NOTHING;

-- Insertar registros médicos
INSERT INTO medical_records (patient_id, doctor_id, date, diagnosis, treatment, notes)
SELECT 
    p.id as patient_id,
    d.id as doctor_id,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    'Gripe estacional',
    'Reposo y medicamentos antivirales',
    'Paciente presenta síntomas de gripe. Se recomienda reposo.'
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id = (SELECT id FROM users WHERE email = 'doctor.test@hospital.com')
WHERE pu.email = 'paciente.test@email.com';

INSERT INTO medical_records (patient_id, doctor_id, date, diagnosis, treatment, notes)
SELECT 
    p.id as patient_id,
    d.id as doctor_id,
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    'Control de rutina',
    'Sin tratamiento necesario',
    'Paciente en buen estado general'
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id = (SELECT id FROM users WHERE email = 'doctor.test@hospital.com')
WHERE pu.email = 'paciente.test@email.com';

-- Insertar recetas
INSERT INTO prescriptions (medical_record_id, medication, dosage, frequency, duration)
SELECT 
    mr.id,
    'Paracetamol',
    '500mg',
    'Cada 8 horas',
    '5 días'
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = 'paciente.test@email.com'
ORDER BY mr.date DESC
LIMIT 1;

INSERT INTO prescriptions (medical_record_id, medication, dosage, frequency, duration)
SELECT 
    mr.id,
    'Ibuprofeno',
    '400mg',
    'Cada 12 horas',
    '3 días'
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = 'paciente.test@email.com'
ORDER BY mr.date DESC
LIMIT 1;

-- Insertar exámenes médicos
INSERT INTO medical_tests (medical_record_id, test_name, test_date, results, notes)
SELECT 
    mr.id,
    'Hemograma completo',
    CURRENT_TIMESTAMP - INTERVAL '14 days',
    'Valores dentro del rango normal',
    'No se observan alteraciones significativas'
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = 'paciente.test@email.com'
ORDER BY mr.date DESC
LIMIT 1;

INSERT INTO medical_tests (medical_record_id, test_name, test_date, results, notes)
SELECT 
    mr.id,
    'Radiografía de tórax',
    CURRENT_TIMESTAMP - INTERVAL '14 days',
    'Sin hallazgos patológicos',
    'Imagen pulmonar normal'
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = 'paciente.test@email.com'
ORDER BY mr.date DESC
LIMIT 1;

-- Insertar notas del paciente
INSERT INTO patient_notes (patient_id, doctor_id, note)
SELECT 
    p.id,
    d.id,
    'Paciente muestra buena adherencia al tratamiento'
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id = (SELECT id FROM users WHERE email = 'doctor.test@hospital.com')
WHERE pu.email = 'paciente.test@email.com';

INSERT INTO patient_notes (patient_id, doctor_id, note)
SELECT 
    p.id,
    d.id,
    'Se programa seguimiento en 2 semanas'
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id = (SELECT id FROM users WHERE email = 'doctor.test@hospital.com')
WHERE pu.email = 'paciente.test@email.com';
