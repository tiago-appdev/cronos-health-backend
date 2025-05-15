import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    // Check if user already exists
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      userType
    });

    // Create profile based on user type
    if (userType === "patient") {
      await User.createPatient(user.id, req.body);
    } else if (userType === "doctor") {
      await User.createDoctor(user.id, req.body);
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        userType: user.user_type
      }
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // User matched, create JWT payload
    const payload = {
      user: {
        id: user.id,
        userType: user.user_type
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
export const getUser = async (req, res) => {
  try {
    // Get user by ID (excluding password)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Remove password from response
    const { password, ...userData } = user;
    
    res.json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};