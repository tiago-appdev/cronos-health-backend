import AdminManagement from "../models/admin.js";

// @route   GET /api/admin/users
// @desc    Get all users with their profiles
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await AdminManagement.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// @route   GET /api/admin/users/:id
// @desc    Get specific user with profile
// @access  Private (Admin only)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await AdminManagement.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
};

// @route   PUT /api/admin/users/:id
// @desc    Update user and their profile
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userData, profileData } = req.body;

    // Verificar si el usuario existe
    const existingUser = await AdminManagement.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar datos básicos del usuario
    const updatedUser = await AdminManagement.updateUser(id, userData);

    // Actualizar perfil según el tipo de usuario
    let updatedProfile = null;
    if (profileData) {
      if (existingUser.user_type === "patient") {
        updatedProfile = await AdminManagement.updatePatientProfile(
          id,
          profileData
        );
      } else if (existingUser.user_type === "doctor") {
        updatedProfile = await AdminManagement.updateDoctorProfile(
          id,
          profileData
        );
      }
    }

    res.json({
      user: updatedUser,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and their profile
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await AdminManagement.deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// @route   POST /api/admin/users/:id/patient-profile
// @desc    Create patient profile for existing user
// @access  Private (Admin only)
export const createPatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const newProfile = await AdminManagement.createPatientProfile(
      id,
      profileData
    );
    res.json(newProfile);
  } catch (error) {
    console.error("Error creating patient profile:", error);
    res.status(500).json({ message: "Error al crear perfil de paciente" });
  }
};

// @route   POST /api/admin/users/:id/doctor-profile
// @desc    Create doctor profile for existing user
// @access  Private (Admin only)
export const createDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const newProfile = await AdminManagement.createDoctorProfile(
      id,
      profileData
    );
    res.json(newProfile);
  } catch (error) {
    console.error("Error creating doctor profile:", error);
    res.status(500).json({ message: "Error al crear perfil de doctor" });
  }
};
