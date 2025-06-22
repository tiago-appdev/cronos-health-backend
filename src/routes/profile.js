import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getCurrentProfile,
  getProfileById,
  updateCurrentProfile,
} from "../controllers/profile.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener perfil del usuario actual
router.get("/me", getCurrentProfile);

// Actualizar perfil del usuario actual
router.put("/me", updateCurrentProfile);

// Obtener perfil de un usuario específico (solo doctores pueden ver otros perfiles)
router.get("/:id", getProfileById);

export default router;
