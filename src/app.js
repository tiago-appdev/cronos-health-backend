// File: /app.js
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import authRoutes from "./routes/auth.js";
import appointmentRoutes from "./routes/appointments.js";
import medicalRecordRoutes from "./routes/medical_records.js";
import medicalHistoryRoutes from "./routes/medical_history.js";
import adminRoutes from "./routes/admin.js";
import messageRoutes from "./routes/message.js";
import surveyRoutes from "./routes/survey.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notification.js";
import profileRoutes from "./routes/profile.js";

// Initialize express app
const app = express();

// Security and CORS
app.use(cors(corsOptions));

// Middlewares
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Add size limit for security
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
	res.header("X-Content-Type-Options", "nosniff");
	res.header("X-Frame-Options", "DENY");
	res.header("X-XSS-Protection", "1; mode=block");
	next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/medical-history", medicalHistoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		message: "Cronos Health API running",
		environment: process.env.NODE_ENV,
		timestamp: new Date().toISOString(),
	});
});

// 404 handler for API routes
app.use(/^\/api\/.*/, (req, res) => {
	res.status(404).json({
		error: "API endpoint not found",
		path: req.path,
		method: req.method,
	});
});

// Global error handler
app.use((err, req, res, next) => {
	console.error(`Error ${req.method} ${req.path}:`, err.stack);

	// Don't leak error details in production
	const isDevelopment = process.env.NODE_ENV === "development";

	res.status(err.status || 500).json({
		error: isDevelopment ? err.message : "Internal server error",
		...(isDevelopment && { stack: err.stack }),
		timestamp: new Date().toISOString(),
	});
});

export default app;
