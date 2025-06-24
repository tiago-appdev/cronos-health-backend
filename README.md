# Cronos Health — Backend (API REST)

Este es el backend del sistema **Cronos Health**, desarrollado con **Express.js**, que expone una API RESTful para gestionar turnos médicos, usuarios, historial clínico, encuestas de satisfacción y notificaciones.

## 🚀 Configuración Rápida

### Opción Recomendada: Configuración Automática (Full-Stack)

Para una configuración completa del sistema (frontend y backend) en un solo paso, utiliza nuestro script de inicio automático:

**Windows (PowerShell):**
```powershell
# Descargar el script de inicio
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tiago-appdev/cronos-health-backend/main/start.ps1" -OutFile "start.ps1"

# Habilitar ejecución de scripts (solo primera vez)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Ejecutar
.\start.ps1

```
**Linux (Bash):**
```bash
# Descargar el script de inicio
curl -o start.sh "https://raw.githubusercontent.com/tiago-appdev/cronos-health-backend/main/start.sh"

# Dar permisos de ejecución
chmod +x start.sh

# Ejecutar
./start.sh
``` 

### Opción 2: Configuración Manual con Docker

```bash
# Clonar el repositorio
git clone https://github.com/tiago-appdev/cronos-health-backend.git
cd cronos-health-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env-template .env
# Editar .env con tus configuraciones

# Iniciar con Docker (incluye base de datos y seeding)
npm run docker:up:build
```

### Opción 3: Configuración Manual

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env-template .env

# Iniciar solo las bases de datos con Docker
docker compose up -d postgres postgres-test

# Poblar con datos de ejemplo (opcional)
npm run seed

# Iniciar en modo desarrollo
npm run dev
```

### Cuentas de Prueba

Puedes utilizar las siguientes credenciales para acceder a la plataforma:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | admin@cronoshealth.com | password123 |
| **Paciente** | juan.perez@email.com | password123 |
| **Doctor** | luis.garcia@email.com | password123 |

## 📦 Scripts Disponibles

### Desarrollo

```bash
npm run dev              # Modo desarrollo con nodemon
npm start               # Producción
npm run seed            # Poblar BD con datos de ejemplo
npm run health          # Verificar salud de la aplicación
```

### Testing

```bash
npm test                # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Cobertura de tests
npm run test:setup      # Configurar BD de pruebas
```

### Docker

```bash
npm run docker:up              # Iniciar servicios
npm run docker:up:build        # Construir e iniciar
npm run docker:down            # Detener servicios
npm run docker:logs            # Ver logs
npm run docker:clean           # Limpiar Docker
```

## 🏗️ Arquitectura y Estructura

```
cronos-health-backend/
├── .github/workflows/         # CI/CD workflows
├── db/                        # Scripts SQL de inicialización
├── scripts/                   # Scripts de utilidad
├── src/
│   ├── controllers/           # Controladores de la API
│   ├── middleware/            # Middleware personalizado
│   ├── models/               # Modelos de datos
│   ├── routes/               # Definición de rutas
│   └── tests/               # Tests unitarios y de integración
├── docker-compose.yml        # Configuración Docker desarrollo
├── Dockerfile               # Imagen Docker multi-stage
└── package.json
```

## 🛠️ Configuración

### Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
PORT=4000
DATABASE_URL=postgres://cronos_user:cronos_pass@localhost:5432/cronos_db
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRATION=24h
NODE_ENV=development
```

### Base de Datos

El proyecto utiliza Docker para la gestión de PostgreSQL:

- **Base de datos principal**: `localhost:5432/cronos_db`
- **Base de datos de pruebas**: `localhost:5433/cronos_test_db`

## 📡 Endpoints de la API

### Autenticación

| Método | Ruta                 | Descripción            | Auth Requerida |
| ------ | -------------------- | ---------------------- | -------------- |
| POST   | `/api/auth/register` | Registro de usuario    | No             |
| POST   | `/api/auth/login`    | Inicio de sesión       | No             |
| GET    | `/api/auth/user`     | Obtener usuario actual | Sí             |

### Citas Médicas

| Método | Ruta                        | Descripción                 | Auth Requerida |
| ------ | --------------------------- | --------------------------- | -------------- |
| GET    | `/api/appointments`         | Listar citas del usuario    | Sí             |
| POST   | `/api/appointments`         | Crear nueva cita            | Sí             |
| GET    | `/api/appointments/:id`     | Obtener cita específica     | Sí             |
| PUT    | `/api/appointments/:id`     | Actualizar cita             | Sí             |
| DELETE | `/api/appointments/:id`     | Cancelar cita               | Sí             |
| GET    | `/api/appointments/doctors` | Listar doctores disponibles | Sí             |

### Encuestas de Satisfacción

| Método | Ruta                      | Descripción                     | Auth Requerida |
| ------ | ------------------------- | ------------------------------- | -------------- |
| POST   | `/api/surveys`            | Enviar encuesta (pacientes)     | Sí             |
| GET    | `/api/surveys/my-surveys` | Ver mis encuestas (pacientes)   | Sí             |
| GET    | `/api/surveys`            | Ver todas las encuestas (admin) | Sí (Admin)     |
| GET    | `/api/surveys/stats`      | Estadísticas de encuestas       | Sí (Admin)     |

### Analíticas (Admin)

| Método | Ruta                                      | Descripción                   | Auth Requerida |
| ------ | ----------------------------------------- | ----------------------------- | -------------- |
| GET    | `/api/analytics/stats`                    | Estadísticas del sistema      | Sí (Admin)     |
| GET    | `/api/analytics/recent-activity`          | Actividad reciente            | Sí (Admin)     |
| GET    | `/api/analytics/appointment-distribution` | Distribución por especialidad | Sí (Admin)     |
| GET    | `/api/analytics/monthly-trends`           | Tendencias mensuales          | Sí (Admin)     |
| GET    | `/api/analytics/doctor-metrics`           | Métricas de médicos           | Sí (Admin)     |
| GET    | `/api/analytics/patient-metrics`          | Métricas de pacientes         | Sí (Admin)     |

### Administración

| Método | Ruta                   | Descripción                | Auth Requerida |
| ------ | ---------------------- | -------------------------- | -------------- |
| POST   | `/api/admin/users`     | Crear usuario              | Sí (Admin)     |
| GET    | `/api/admin/users`     | Listar todos los usuarios  | Sí (Admin)     |
| GET    | `/api/admin/users/:id` | Obtener usuario específico | Sí (Admin)     |
| PUT    | `/api/admin/users/:id` | Actualizar usuario         | Sí (Admin)     |
| DELETE | `/api/admin/users/:id` | Eliminar usuario           | Sí (Admin)     |

## 🔄 CI/CD Pipeline

### Estrategia de Ramas

- **`develop`**: Rama de desarrollo (CI solamente)
- **Feature branches**: Crear PRs hacia `develop`

### Workflow Automático

**CI en Develop**:

- Tests automatizados
- Auditoría de seguridad
- Construcción de imágenes Docker
- Verificación de código

## 🐳 Docker

### Desarrollo

```bash
# Iniciar entorno completo
npm run docker:up:build

# Ver logs en tiempo real
npm run docker:logs

# Detener servicios
npm run docker:down
```

## ✅ Características Implementadas

- [x] Sistema de autenticación con JWT
- [x] CRUD completo de citas médicas
- [x] Gestión de doctores y pacientes
- [x] Encuestas de satisfacción de pacientes
- [x] Panel de analíticas para administradores
- [x] Sistema de gestión de usuarios (admin)
- [x] Chat en tiempo real entre doctores y pacientes
- [x] Historial médico digital
- [x] Tests unitarios y de integración completos
- [x] Dockerización completa
- [x] CI/CD con GitHub Actions
- [x] Datos de prueba pre-cargados
- [x] Sistema de notificaciones push

## 🔜 Próximas Características

- [ ] Integración con servicios de email
- [ ] Reportes y estadísticas avanzadas
- [ ] API de webhooks
- [ ] Integración con servicios de pago

## 🛡️ Seguridad

- Encriptación de contraseñas con bcrypt
- Autenticación JWT con expiración
- Validación de entrada en todos los endpoints


## 🔧 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a BD**:

   ```bash
   npm run docker:down
   npm run docker:up:build
   ```

2. **Puerto ocupado**:
   ```bash
   # Cambiar puerto en .env
   PORT=4001
   ```

## Testing

### 1. Configurar el Entorno de Pruebas

```bash
# Instalar dependencias si aún no están instaladas
npm install

# Iniciar la base de datos de pruebas
docker compose up -d postgres-test

# Ejecutar todas las pruebas
npm test
```

### 2. Comandos de Prueba Disponibles

```bash
# Ejecutar todas las pruebas una vez
npm test

# Ejecutar pruebas en modo observación (se reejecutan al cambiar archivos)
npm test:watch

# Ejecutar pruebas con informe de cobertura
npm test:coverage

# Solo configurar la base de datos de pruebas
npm run test:setup
```

## 🏗️ Arquitectura de Pruebas

### Base de Datos de Pruebas Separada

- **BD de Producción/Desarrollo**: `postgres://localhost:5432/cronos_db`
- **BD de Pruebas**: `postgres://localhost:5433/cronos_test_db`

La base de datos de pruebas corre en un puerto diferente (5433) y está completamente aislada de los datos de desarrollo.

### Aislamiento de Pruebas

Cada prueba está completamente aislada:

- La base de datos se limpia antes de cada prueba
- Se crean datos frescos para cada prueba
- Ninguna prueba afecta a otra
- No se tocan datos de producción

### Utilidades de Prueba

La clase `TestUtils` proporciona métodos auxiliares para crear datos de prueba:

```javascript
import { TestUtils } from "./test-utils.js";

// Crear usuarios de prueba
const patient = await TestUtils.createTestPatient();
const doctor = await TestUtils.createTestDoctor();
const admin = await TestUtils.createTestAdmin();

// Generar tokens JWT
const token = TestUtils.generateTestToken(user);

// Crear datos de prueba
const appointment = await TestUtils.createTestAppointment(patientId, doctorId);
const survey = await TestUtils.createTestSurvey(patientId);
```

## 📁 Estructura de Pruebas

```
src/tests/
├── setup.js              # Configuración global de pruebas
├── test-utils.js         # Funciones auxiliares para pruebas
├── auth.test.js          # Pruebas de autenticación
├── appointment.test.js   # Pruebas de gestión de turnos
├── survey.test.js        # Pruebas de encuestas
├── analytics.test.js     # Pruebas de endpoints de analíticas
├── admin.test.js         # Pruebas del panel de administración
└── message.test.js       # Pruebas del sistema de mensajería
```

## 🧪 Categorías de Pruebas

### 1. Pruebas de Autenticación (`auth.test.js`)

- Registro de usuarios (pacientes, doctores)
- Inicio de sesión con credenciales válidas/inválidas
- Acceso a rutas protegidas
- Validación de tokens JWT

### 2. Pruebas de Turnos (`appointment.test.js`)

- Crear turnos como paciente
- Ver turnos (vista de paciente y doctor)
- Actualizar estado del turno
- Cancelar turnos
- Listado de disponibilidad de doctores

### 3. Pruebas de Encuestas (`survey.test.js`)

- Enviar encuestas de satisfacción del paciente
- Ver las propias encuestas del paciente
- Acceso de admin a todas las encuestas
- Estadísticas y análisis de encuestas

### 4. Pruebas de Analíticas (`analytics.test.js`)

- Estadísticas del sistema (cantidad de pacientes/doctores, etc.)
- Feed de actividad reciente
- Distribución de turnos por especialidad
- Tendencias mensuales
- Métricas de rendimiento de doctores
- Métricas de participación de pacientes

### 5. Pruebas de Admin (`admin.test.js`)

- Crear nuevos usuarios (todos los tipos)
- Gestionar usuarios existentes
- Crear perfiles de usuario
- Eliminación de usuarios
- Controles de acceso exclusivos de admin

### 6. Pruebas de Mensajes (`message.test.js`)

- Crear conversaciones
- Enviar mensajes
- Historial de mensajes
- Búsqueda de usuarios para mensajería
- Edición y eliminación de mensajes

## 🔧 Configuración

### Variables de Entorno

El entorno de prueba utiliza `.env.test`:

```env
PORT=4001
DATABASE_URL="postgres://cronos_user:cronos_pass@localhost:5433/cronos_test_db"
JWT_SECRET=CRONOS_HEALTH_JWT_SECRET_TEST
JWT_EXPIRATION=1h
NODE_ENV=test
```

### Configuración de Jest

Configuraciones clave en `jest.config.js`:

- Timeout de 30 segundos para operaciones de base de datos
- Soporte para ES modules
- Informes de cobertura
- Aislamiento de pruebas
- Limpieza automática

## 🐛 Depuración de Pruebas

### Problemas Comunes

1. **Errores de Conexión a la Base de Datos**

   ```bash
   # Asegúrate de que la base de datos de prueba esté corriendo
   docker compose up -d postgres-test

   # Verifica si la base de datos es accesible
   docker exec -it cronos-test-db psql -U cronos_user -d cronos_test_db -c "SELECT 1;"
   ```

2. **Conflictos de Puerto**

   ```bash
   # Verifica si el puerto 5433 está en uso
   lsof -i :5433

   # Si está ocupado, detén otros servicios o cambia el puerto en docker-compose.yml
   ```

3. **Problemas con el Esquema**

   ```bash
   # Reiniciar el esquema de la base de datos de pruebas
   docker compose down postgres-test
   docker volume rm cronos-health-backend_pgdata-test
   docker compose up -d postgres-test
   ```

4. **Pruebas Colgadas**

   ```bash
   # Forzar salida si las pruebas se quedan colgadas
   npm test -- --forceExit

   # Verificar handles abiertos
   npm test -- --detectOpenHandles
   ```

### Salida Detallada

Para ver una salida detallada de las pruebas:

```bash
npm test -- --verbose
```

### Ejecutar Pruebas Específicas

```bash
# Ejecutar solo pruebas de autenticación
npm test -- auth.test.js

# Ejecutar pruebas que coincidan con un patrón
npm test -- --testNamePattern="should create appointment"

# Ejecutar pruebas en un archivo específico en modo observación
npm test -- appointment.test.js --watch
```

## 📊 Informes de Cobertura

Después de ejecutar `npm run test:coverage`:

- **Terminal**: Muestra resumen de cobertura
- **Informe HTML**: `coverage/lcov-report/index.html`
- **Datos LCOV**: `coverage/lcov.info`

Metas de cobertura:

- **Funciones**: > 80%
- **Líneas**: > 85%
- **Ramas**: > 75%

## 👥 Equipo

- Desarrolladores: Amarfil Carolina, Ibarrola Tiago, Ozuna Maria, Pereyra Maximiliano y Skidelsky Dario.
