import express from "express";
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createOrGetConversation,
  searchUsers,
  getRelatedUsers,
  markMessageAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount,
  checkNewMessages,
} from "../controllers/message.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  validateSendMessage,
  validateConversationId,
  validateMessageId,
  validateSearchQuery,
  validateCreateConversation,
  validateEditMessage,
  sanitizeInput,
} from "../middleware/validation.js";

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get("/conversations", authMiddleware, getUserConversations);

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages for a specific conversation
// @access  Private
router.get(
  "/conversations/:conversationId",
  authMiddleware,
  validateConversationId,
  getConversationMessages
);

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post("/", authMiddleware, validateSendMessage, sendMessage);

// @route   POST /api/messages/conversations
// @desc    Create or get direct conversation with another user
// @access  Private
router.post(
  "/conversations",
  authMiddleware,
  validateCreateConversation,
  createOrGetConversation
);

// @route   GET /api/messages/users/search
// @desc    Search for users to start a conversation with
// @access  Private
router.get("/users/search", authMiddleware, validateSearchQuery, searchUsers);

// @route   GET /api/messages/users/related
// @desc    Get users related to current user (doctors/patients with appointments)
// @access  Private
router.get("/users/related", authMiddleware, getRelatedUsers);

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put(
  "/:messageId/read",
  authMiddleware,
  validateMessageId,
  markMessageAsRead
);

// @route   PUT /api/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put(
  "/:messageId",
  authMiddleware,
  validateMessageId,
  validateEditMessage,
  editMessage
);

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete("/:messageId", authMiddleware, validateMessageId, deleteMessage);

// @route   GET /api/messages/unread-count
// @desc    Get unread message count for current user
// @access  Private
router.get("/unread-count", authMiddleware, getUnreadCount);

// @route   GET /api/messages/check-new
// @desc    Check if user has new messages since last check
// @access  Private
router.get("/check-new", authMiddleware, checkNewMessages);

export default router;