export const adminMiddleware = (req, res, next) => {
  // Verificar si el usuario está autenticado y es admin
  if (!req.user || req.user.userType !== "admin") {
    return res
      .status(403)
      .json({
        message: "Acceso denegado. Se requieren permisos de administrador.",
      });
  }
  next();
};
