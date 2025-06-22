import User from "../models/user.js";

// @route   GET /api/profile
// @desc    Get current user's complete profile
// @access  Private
export const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await User.getCompleteProfile(userId);

    if (!profile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
};

// @route   GET /api/profile/:id
// @desc    Get user profile by ID (for doctors to view patient profiles)
// @access  Private
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserType = req.user.userType;

    // Solo los doctores pueden ver perfiles de otros usuarios
    if (requestingUserType !== "doctor" && parseInt(id) !== req.user.id) {
      return res.status(403).json({
        message: "No autorizado para ver este perfil",
      });
    }

    const profile = await User.getCompleteProfile(id);

    if (!profile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
};

// @route   PUT /api/profile/me
// @desc    Update current user's profile
// @access  Private
export const updateCurrentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedProfile = await User.updateProfile(userId, req.body);
    if (!updatedProfile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }
    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error al actualizar el perfil" });
  }
};
