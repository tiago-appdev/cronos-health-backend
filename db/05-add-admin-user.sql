-- Actualizar el check constraint de user_type para incluir admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('patient', 'doctor', 'admin'));

-- Insertar un usuario administrador por defecto
INSERT INTO users (email, password, name, user_type) 
VALUES (
  'admin@cronoshealth.com',
  -- password: admin123 (hashed)
  '$2b$10$XHHxG.CkHHQ1x5vNUBzDAeNZjYMoAkLDVrKitZP23xq3bh6N7TQPS',
  'Administrador',
  'admin'
) ON CONFLICT (email) DO NOTHING;
