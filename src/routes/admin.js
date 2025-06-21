import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createPatientProfile,
  createDoctorProfile,
} from "../controllers/admin.js";
const router = Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.use(authMiddleware);
router.use(adminMiddleware);

// Rutas para gestión de usuarios
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users", createUser);

// Rutas para creación de perfiles
router.post("/users/:id/patient-profile", createPatientProfile);
router.post("/users/:id/doctor-profile", createDoctorProfile);

export default router;
