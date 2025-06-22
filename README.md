# Cronos Health — Backend (API REST)

Este es el backend del sistema **Cronos Health**, desarrollado con **Express.js**, que expone una API RESTful para gestionar turnos médicos, usuarios, historial clínico y notificaciones.

## 🚀 Tecnologías Utilizadas

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT](https://jwt.io/) para autenticación
- [bcrypt](https://www.npmjs.com/package/bcrypt) para encriptación
- [Docker](https://www.docker.com/) para contenedorización
- [Jest](https://jestjs.io/) para testing

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tiago-appdev/cronos-health-backend.git
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env-template .env
# Editar .env con tus configuraciones

# Iniciar la base de datos con Docker
docker compose up -d

# Iniciar el servidor en modo desarrollo
npm run dev
```

## ⚙️ Scripts Disponibles

```bash
# Modo desarrollo
npm run dev

# Ejecutar tests
npm run test

# Ejecutar tests con watch mode
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

## 🛠️ Configuración

Crear un archivo `.env` con las siguientes variables:

```env
PORT=4000
DATABASE_URL=postgres://cronos_user:cronos_pass@localhost:5432/cronos_db
JWT_SECRET=tu_clave_secreta
NODE_ENV=development
```

## 🗂️ Estructura del Proyecto

```
backend/
├── db/                    # Scripts SQL de inicialización
│   ├── 01-create-tables.sql
│   └── 02-insert-seed-data.sql
├── src/
│   ├── controllers/       # Controladores de la API
│   ├── middleware/        # Middleware personalizado
│   ├── models/           # Modelos de datos
│   ├── routes/           # Definición de rutas
│   └── tests/           # Tests unitarios y de integración
├── docker-compose.yml    # Configuración de Docker
└── package.json
```

## 📡 Endpoints de la API

### Autenticación

| Método | Ruta                 | Descripción            | Auth Required |
| ------ | -------------------- | ---------------------- | ------------- |
| POST   | `/api/auth/register` | Registro de usuario    | No            |
| POST   | `/api/auth/login`    | Inicio de sesión       | No            |
| GET    | `/api/auth/user`     | Obtener usuario actual | Sí            |

### Citas Médicas

| Método | Ruta                        | Descripción                 | Auth Required |
| ------ | --------------------------- | --------------------------- | ------------- |
| GET    | `/api/appointments`         | Listar citas del usuario    | Sí            |
| GET    | `/api/appointments/doctors` | Listar doctores disponibles | Sí            |
| POST   | `/api/appointments`         | Crear nueva cita            | Sí            |
| PUT    | `/api/appointments/:id`     | Actualizar cita             | Sí            |
| DELETE | `/api/appointments/:id`     | Cancelar cita               | Sí            |

## 🔌 Docker y Base de Datos

El proyecto utiliza Docker para la gestión de la base de datos PostgreSQL. La base de datos se inicializa automáticamente con datos de prueba cuando se levanta el contenedor por primera vez.

```bash
# Iniciar servicios
docker compose up -d

# Detener servicios
docker compose down

# Reiniciar servicios
docker compose restart
```

## Testing

### 1. Configurar el Entorno de Pruebas

```bash
# Instalar dependencias si aún no están instaladas
npm install

# Iniciar la base de datos de pruebas
docker compose up -d postgres-test

# Esperar que la base de datos esté lista (aproximadamente 30 segundos)
# Luego configurar el esquema de la base de datos de pruebas
node scripts/setup-test-db.js

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

* **BD de Producción/Desarrollo**: `postgres://localhost:5432/cronos_db`
* **BD de Pruebas**: `postgres://localhost:5433/cronos_test_db`

La base de datos de pruebas corre en un puerto diferente (5433) y está completamente aislada de los datos de desarrollo.

### Aislamiento de Pruebas

Cada prueba está completamente aislada:

* La base de datos se limpia antes de cada prueba
* Se crean datos frescos para cada prueba
* Ninguna prueba afecta a otra
* No se tocan datos de producción

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

* Registro de usuarios (pacientes, doctores)
* Inicio de sesión con credenciales válidas/inválidas
* Acceso a rutas protegidas
* Validación de tokens JWT

### 2. Pruebas de Turnos (`appointment.test.js`)

* Crear turnos como paciente
* Ver turnos (vista de paciente y doctor)
* Actualizar estado del turno
* Cancelar turnos
* Listado de disponibilidad de doctores

### 3. Pruebas de Encuestas (`survey.test.js`)

* Enviar encuestas de satisfacción del paciente
* Ver las propias encuestas del paciente
* Acceso de admin a todas las encuestas
* Estadísticas y análisis de encuestas

### 4. Pruebas de Analíticas (`analytics.test.js`)

* Estadísticas del sistema (cantidad de pacientes/doctores, etc.)
* Feed de actividad reciente
* Distribución de turnos por especialidad
* Tendencias mensuales
* Métricas de rendimiento de doctores
* Métricas de participación de pacientes

### 5. Pruebas de Admin (`admin.test.js`)

* Crear nuevos usuarios (todos los tipos)
* Gestionar usuarios existentes
* Crear perfiles de usuario
* Eliminación de usuarios
* Controles de acceso exclusivos de admin

### 6. Pruebas de Mensajes (`message.test.js`)

* Crear conversaciones
* Enviar mensajes
* Historial de mensajes
* Búsqueda de usuarios para mensajería
* Edición y eliminación de mensajes

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

* Timeout de 30 segundos para operaciones de base de datos
* Soporte para ES modules
* Informes de cobertura
* Aislamiento de pruebas
* Limpieza automática

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
   node scripts/setup-test-db.js
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

* **Terminal**: Muestra resumen de cobertura
* **Informe HTML**: `coverage/lcov-report/index.html`
* **Datos LCOV**: `coverage/lcov.info`

Metas de cobertura:

* **Funciones**: > 80%
* **Líneas**: > 85%
* **Ramas**: > 75%


## 👥 Equipo

- Desarrolladores: Amarfil Carolina, Ibarrola Tiago, Ozuna Maria, Pereyra Maximiliano y Skidelsky Dario.