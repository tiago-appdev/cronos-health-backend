import express from "express";
import { register, login, getUser } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", login);

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get("/user", authMiddleware, getUser);

export default router;