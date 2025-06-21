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

## ✅ Características Implementadas

- [x] Sistema de autenticación con JWT
- [x] CRUD completo de citas médicas
- [x] Gestión de doctores y pacientes
- [x] Tests unitarios y de integración
- [x] Datos de prueba pre-cargados
- [x] Dockerización de la base de datos

## 🔜 Próximas Características

- [ ] Sistema de notificaciones
- [ ] Chat en tiempo real
- [ ] Historial médico digital
- [ ] Sistema de calificaciones
- [ ] Reportes y estadísticas

## 👥 Equipo

- Desarrolladores: Amarfil Carolina, Ibarrola Tiago, Ozuna Maria, Pereyra Maximiliano y Skidelsky Dario.
