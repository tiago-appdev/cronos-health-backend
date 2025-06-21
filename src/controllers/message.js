import Message from "../models/message.js";

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
export const getUserConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const conversations = await Message.getUserConversations(userId);

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      name: conv.display_name || "Conversación",
      type: conv.type,
      otherUserType: conv.other_user_type,
      lastMessage: conv.last_message || "",
      lastMessageTime: conv.last_message_time,
      lastSenderName: conv.last_sender_name,
      unreadCount: parseInt(conv.unread_count) || 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));

    res.json(formattedConversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages for a specific conversation
// @access  Private
export const getConversationMessages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validate conversationId
    if (!conversationId || isNaN(parseInt(conversationId))) {
      return res.status(400).json({
        message: "ID de conversación inválido",
      });
    }

    const messages = await Message.getConversationMessages(
      parseInt(conversationId),
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderType: msg.sender_type,
      text: msg.message_text,
      type: msg.message_type,
      replyTo: msg.reply_to_message_id ? {
        id: msg.reply_to_message_id,
        text: msg.reply_to_text,
        senderName: msg.reply_to_sender,
      } : null,
      isEdited: msg.is_edited,
      editedAt: msg.edited_at,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    }));

    // Mark messages as read when fetching
    await Message.markMessagesAsRead(parseInt(conversationId), userId);

    res.json(formattedMessages);
  } catch (err) {
    console.error(err.message);
    if (err.message === "No tienes acceso a esta conversación") {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { conversationId, text, messageType = 'text', replyToMessageId } = req.body;

    // Validate required fields
    if (!conversationId || !text) {
      return res.status(400).json({
        message: "ID de conversación y texto son requeridos",
      });
    }

    if (!text.trim()) {
      return res.status(400).json({
        message: "El mensaje no puede estar vacío",
      });
    }

    // Validate conversationId
    if (isNaN(parseInt(conversationId))) {
      return res.status(400).json({
        message: "ID de conversación inválido",
      });
    }

    // Validate message length
    if (text.trim().length > 2000) {
      return res.status(400).json({
        message: "El mensaje no puede exceder 2000 caracteres",
      });
    }

    const message = await Message.sendMessage({
      conversationId: parseInt(conversationId),
      senderId: userId,
      messageText: text.trim(),
      messageType,
      replyToMessageId: replyToMessageId ? parseInt(replyToMessageId) : null,
    });

    const formattedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: message.sender_name,
      senderType: message.sender_type,
      text: message.message_text,
      type: message.message_type,
      replyTo: message.reply_to_message_id ? {
        id: message.reply_to_message_id,
      } : null,
      isEdited: message.is_edited,
      createdAt: message.created_at,
    };

    res.status(201).json({
      message: "Mensaje enviado exitosamente",
      data: formattedMessage,
    });
  } catch (err) {
    console.error(err.message);
    if (err.message === "No tienes acceso a esta conversación") {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   POST /api/messages/conversations
// @desc    Create or get direct conversation with another user
// @access  Private
export const createOrGetConversation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { otherUserId } = req.body;

    // Validate required fields
    if (!otherUserId) {
      return res.status(400).json({
        message: "ID del otro usuario es requerido",
      });
    }

    // Validate otherUserId
    if (isNaN(parseInt(otherUserId))) {
      return res.status(400).json({
        message: "ID de usuario inválido",
      });
    }

    // Can't create conversation with yourself
    if (parseInt(otherUserId) === userId) {
      return res.status(400).json({
        message: "No puedes crear una conversación contigo mismo",
      });
    }

    const conversationId = await Message.getOrCreateDirectConversation(
      userId,
      parseInt(otherUserId)
    );

    const conversationDetails = await Message.getConversationDetails(
      conversationId,
      userId
    );

    res.status(201).json({
      message: "Conversación creada o encontrada exitosamente",
      conversation: {
        id: conversationDetails.id,
        name: conversationDetails.display_name,
        type: conversationDetails.type,
        otherUserType: conversationDetails.other_user_type,
        createdAt: conversationDetails.created_at,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/messages/users/search
// @desc    Search for users to start a conversation with
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;
    const { q: searchTerm, type: filterUserType } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        message: "El término de búsqueda debe tener al menos 2 caracteres",
      });
    }

    const users = await Message.searchUsers(
      userId,
      searchTerm.trim(),
      filterUserType
    );

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      role: user.user_type === 'doctor' ? 'Médico' : 'Paciente',
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/messages/users/related
// @desc    Get users related to current user (doctors/patients with appointments)
// @access  Private
export const getRelatedUsers = async (req, res) => {
  try {
    const { id: userId, userType } = req.user;

    const users = await Message.getRelatedUsers(userId, userType);

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.user_type,
      role: user.user_type === 'doctor' ? 'Médico' : 'Paciente',
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
export const markMessageAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { messageId } = req.params;
    const { conversationId } = req.body;

    // Validate messageId
    if (!messageId || isNaN(parseInt(messageId))) {
      return res.status(400).json({
        message: "ID de mensaje inválido",
      });
    }

    await Message.markMessagesAsRead(
      conversationId ? parseInt(conversationId) : null,
      userId,
      parseInt(messageId)
    );

    res.json({ message: "Mensaje marcado como leído" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   PUT /api/messages/:messageId
// @desc    Edit a message
// @access  Private
export const editMessage = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { messageId } = req.params;
    const { text } = req.body;

    // Validate messageId
    if (!messageId || isNaN(parseInt(messageId))) {
      return res.status(400).json({
        message: "ID de mensaje inválido",
      });
    }

    // Validate text
    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "El texto del mensaje es requerido",
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        message: "El mensaje no puede exceder 2000 caracteres",
      });
    }

    const updatedMessage = await Message.editMessage(
      parseInt(messageId),
      userId,
      text.trim()
    );

    res.json({
      message: "Mensaje editado exitosamente",
      data: {
        id: updatedMessage.id,
        text: updatedMessage.message_text,
        isEdited: updatedMessage.is_edited,
        editedAt: updatedMessage.edited_at,
      },
    });
  } catch (err) {
    console.error(err.message);
    if (err.message === "No tienes permiso para editar este mensaje") {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { messageId } = req.params;

    // Validate messageId
    if (!messageId || isNaN(parseInt(messageId))) {
      return res.status(400).json({
        message: "ID de mensaje inválido",
      });
    }

    await Message.deleteMessage(parseInt(messageId), userId);

    res.json({ message: "Mensaje eliminado exitosamente" });
  } catch (err) {
    console.error(err.message);
    if (err.message === "No tienes permiso para eliminar este mensaje") {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/messages/unread-count
// @desc    Get unread message count for current user
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const unreadCount = await Message.getUnreadCount(userId);

    res.json({ unreadCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// @route   GET /api/messages/check-new
// @desc    Check if user has new messages since last check
// @access  Private
export const checkNewMessages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { lastCheck } = req.query;

    if (!lastCheck) {
      return res.status(400).json({
        message: "Timestamp de última verificación es requerido",
      });
    }

    const hasNew = await Message.hasNewMessages(userId, new Date(lastCheck));

    res.json({ hasNewMessages: hasNew });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};