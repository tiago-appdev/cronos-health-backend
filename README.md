# Cronos Health — Backend (API REST)

Este es el backend del sistema **Cronos Health**, desarrollado con **Express.js** y **TypeScript**, que expone una API RESTful para gestionar turnos médicos, usuarios, historial clínico, notificaciones, entre otros.

## 🚀 Tecnologías Utilizadas

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/) o MySQL
- [dotenv](https://www.npmjs.com/package/dotenv)

## 📦 Instalación

```bash
cd backend
npm install
```

## ⚙️ Scripts

```bash
# Modo desarrollo
npm run dev
```

## 🛠️ Configuración

Crear un archivo `.env` con tus variables sensibles:

```env
PORT=4000
DATABASE_URL=postgres://usuario:password@localhost:5432/cronosdb
JWT_SECRET=miclavesupersecreta
```

## 🗂️ Estructura

```
src/
├── index.ts           # Punto de entrada
├── routes/            # Definición de rutas
├── controllers/       # Lógica principal
├── services/          # Funciones reutilizables
└──models/            # Modelos de base de datos
```

## 📡 Endpoints Iniciales

| Método | Ruta            | Descripción         |
| ------ | --------------- | ------------------- |
| GET    | `/api/health`   | Estado del servidor |
| POST   | `/api/login`    | Inicio de sesión    |
| POST   | `/api/register` | Registro de usuario |
| GET    | `/api/turnos`   | Listado de turnos   |
| POST   | `/api/turnos`   | Crear nuevo turno   |

## 🔌 Conexión con Frontend

El frontend se conectará al backend a través de:

```
http://localhost:4000/api
```

## ✅ Tareas pendientes

- [ ] Validación de usuarios (JWT)
- [ ] CRUD de turnos
- [ ] Recordatorios automáticos (cron)
- [ ] Chat y mensajes
- [ ] Encuestas y métricas

## 📚 Documentación técnica

Documentar todos los endpoints y módulos en `/docs` o mediante Swagger (futuro).

## 👥 Equipo

- Desarrolladores: Amarfil Carolina, Ibarrola Tiago, Ozuna Maria, Pereyra Maximiliano y Skidelski Dario.
