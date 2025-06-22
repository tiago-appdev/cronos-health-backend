import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getSurveyReminders,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  getNotificationStats,
} from "../controllers/notification.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get("/", authMiddleware, getUserNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for current user
// @access  Private
router.get("/unread-count", authMiddleware, getUnreadCount);

// @route   GET /api/notifications/survey-reminders
// @desc    Get survey reminder notifications for current user
// @access  Private
router.get("/survey-reminders", authMiddleware, getSurveyReminders);

// @route   GET /api/notifications/preferences
// @desc    Get notification preferences for current user
// @access  Private
router.get("/preferences", authMiddleware, getNotificationPreferences);

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences for current user
// @access  Private
router.put("/preferences", authMiddleware, updateNotificationPreferences);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.put("/mark-all-read", authMiddleware, markAllNotificationsAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", authMiddleware, markNotificationAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete("/:id", authMiddleware, deleteNotification);

// Admin routes
// @route   POST /api/notifications
// @desc    Create a new notification (admin only)
// @access  Private (Admin only)
router.post("/", authMiddleware, adminMiddleware, createNotification);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (admin only)
// @access  Private (Admin only)
router.get("/stats", authMiddleware, adminMiddleware, getNotificationStats);

export default router;