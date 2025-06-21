-- Actualizar el check constraint de user_type para incluir admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('patient', 'doctor', 'admin'));

-- Insertar un usuario administrador por defecto
INSERT INTO users (email, password, name, user_type) 
VALUES (
  'admin@cronoshealth.com',
  -- password: admin123 (hashed)
  '$2b$10$FeWqF/5AP2btRHW/FeTFk.1MAT0t.MKhjv4HRjZFc55LDkKFbN6ae',
  'Administrador',
  'admin'
) ON CONFLICT (email) DO NOTHING;
