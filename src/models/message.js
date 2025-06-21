import db from "../db.js";

const Message = {
  // Get all conversations for a user
  getUserConversations: async (userId) => {
    const query = `
      SELECT 
        cs.*,
        CASE 
          WHEN cs.type = 'direct' THEN (
            SELECT u.name 
            FROM conversation_participants cp2 
            JOIN users u ON cp2.user_id = u.id 
            WHERE cp2.conversation_id = cs.id 
            AND cp2.user_id != cs.user_id 
            LIMIT 1
          )
          ELSE cs.name
        END as display_name,
        CASE 
          WHEN cs.type = 'direct' THEN (
            SELECT u.user_type 
            FROM conversation_participants cp2 
            JOIN users u ON cp2.user_id = u.id 
            WHERE cp2.conversation_id = cs.id 
            AND cp2.user_id != cs.user_id 
            LIMIT 1
          )
          ELSE 'group'
        END as other_user_type
      FROM conversation_summary cs
      WHERE cs.user_id = $1
      ORDER BY cs.last_message_time DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get messages for a conversation
  getConversationMessages: async (conversationId, userId, limit = 50, offset = 0) => {
    // First, verify user has access to this conversation
    const accessQuery = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2 AND is_active = TRUE
    `;
    const accessResult = await db.query(accessQuery, [conversationId, userId]);
    
    if (accessResult.rows.length === 0) {
      throw new Error("No tienes acceso a esta conversación");
    }

    const query = `
      SELECT 
        m.*,
        u.name as sender_name,
        u.user_type as sender_type,
        reply_msg.message_text as reply_to_text,
        reply_sender.name as reply_to_sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN messages reply_msg ON m.reply_to_message_id = reply_msg.id
      LEFT JOIN users reply_sender ON reply_msg.sender_id = reply_sender.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [conversationId, limit, offset]);
    return result.rows.reverse(); // Return in chronological order
  },

  // Send a message
  sendMessage: async (messageData) => {
    const { conversationId, senderId, messageText, messageType = 'text', replyToMessageId = null } = messageData;

    // Verify user has access to this conversation
    const accessQuery = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2 AND is_active = TRUE
    `;
    const accessResult = await db.query(accessQuery, [conversationId, senderId]);
    
    if (accessResult.rows.length === 0) {
      throw new Error("No tienes acceso a esta conversación");
    }

    const query = `
      INSERT INTO messages (conversation_id, sender_id, message_text, message_type, reply_to_message_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [conversationId, senderId, messageText, messageType, replyToMessageId];
    const result = await db.query(query, values);

    // Get the complete message data with sender info
    const messageQuery = `
      SELECT 
        m.*,
        u.name as sender_name,
        u.user_type as sender_type
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `;
    const messageResult = await db.query(messageQuery, [result.rows[0].id]);
    
    return messageResult.rows[0];
  },

  // Create or get direct conversation between two users
  getOrCreateDirectConversation: async (user1Id, user2Id) => {
    const query = `SELECT get_or_create_direct_conversation($1, $2) as conversation_id`;
    const result = await db.query(query, [user1Id, user2Id]);
    return result.rows[0].conversation_id;
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, userId, messageId = null) => {
    // Update last_read_at for the user in this conversation
    const updateQuery = `
      UPDATE conversation_participants 
      SET last_read_at = CURRENT_TIMESTAMP 
      WHERE conversation_id = $1 AND user_id = $2
    `;
    await db.query(updateQuery, [conversationId, userId]);

    // If specific message ID provided, mark that message as read
    if (messageId) {
      const readStatusQuery = `
        INSERT INTO message_read_status (message_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (message_id, user_id) DO NOTHING
      `;
      await db.query(readStatusQuery, [messageId, userId]);
    }

    return true;
  },

  // Get conversation details
  getConversationDetails: async (conversationId, userId) => {
    // Verify access
    const accessQuery = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2 AND is_active = TRUE
    `;
    const accessResult = await db.query(accessQuery, [conversationId, userId]);
    
    if (accessResult.rows.length === 0) {
      throw new Error("No tienes acceso a esta conversación");
    }

    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.type = 'direct' THEN (
            SELECT u.name 
            FROM conversation_participants cp 
            JOIN users u ON cp.user_id = u.id 
            WHERE cp.conversation_id = c.id 
            AND cp.user_id != $2 
            LIMIT 1
          )
          ELSE c.name
        END as display_name,
        CASE 
          WHEN c.type = 'direct' THEN (
            SELECT u.user_type 
            FROM conversation_participants cp 
            JOIN users u ON cp.user_id = u.id 
            WHERE cp.conversation_id = c.id 
            AND cp.user_id != $2 
            LIMIT 1
          )
          ELSE 'group'
        END as other_user_type
      FROM conversations c
      WHERE c.id = $1
    `;
    const result = await db.query(query, [conversationId, userId]);
    return result.rows[0];
  },

  // Search for users to start a conversation with
  searchUsers: async (currentUserId, searchTerm, userType = null) => {
    let query = `
      SELECT u.id, u.name, u.email, u.user_type
      FROM users u
      WHERE u.id != $1
      AND (u.name ILIKE $2 OR u.email ILIKE $2)
    `;
    const params = [currentUserId, `%${searchTerm}%`];

    if (userType) {
      query += ` AND u.user_type = $3`;
      params.push(userType);
    }

    query += ` ORDER BY u.name LIMIT 10`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get users that have appointments with the current user (for doctors/patients)
  getRelatedUsers: async (userId, userType) => {
    let query;
    let params = [userId];

    if (userType === 'doctor') {
      // Get patients that have appointments with this doctor
      query = `
        SELECT DISTINCT u.id, u.name, u.email, u.user_type
        FROM users u
        JOIN patients p ON u.id = p.user_id
        JOIN appointments a ON p.id = a.patient_id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = $1
        ORDER BY u.name
      `;
    } else if (userType === 'patient') {
      // Get doctors that have appointments with this patient
      query = `
        SELECT DISTINCT u.id, u.name, u.email, u.user_type
        FROM users u
        JOIN doctors d ON u.id = d.user_id
        JOIN appointments a ON d.id = a.doctor_id
        JOIN patients p ON a.patient_id = p.id
        WHERE p.user_id = $1
        ORDER BY u.name
      `;
    } else {
      return [];
    }

    const result = await db.query(query, params);
    return result.rows;
  },

  // Delete a message (soft delete by setting message_text to null and marking as deleted)
  deleteMessage: async (messageId, userId) => {
    // Verify the user owns the message
    const verifyQuery = `
      SELECT conversation_id FROM messages 
      WHERE id = $1 AND sender_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [messageId, userId]);
    
    if (verifyResult.rows.length === 0) {
      throw new Error("No tienes permiso para eliminar este mensaje");
    }

    const query = `
      UPDATE messages 
      SET message_text = '[Mensaje eliminado]',
          message_type = 'system',
          is_edited = TRUE,
          edited_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [messageId]);
    return result.rows[0];
  },

  // Edit a message
  editMessage: async (messageId, userId, newText) => {
    // Verify the user owns the message
    const verifyQuery = `
      SELECT conversation_id FROM messages 
      WHERE id = $1 AND sender_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [messageId, userId]);
    
    if (verifyResult.rows.length === 0) {
      throw new Error("No tienes permiso para editar este mensaje");
    }

    const query = `
      UPDATE messages 
      SET message_text = $3,
          is_edited = TRUE,
          edited_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [messageId, userId, newText]);
    return result.rows[0];
  },

  // Get unread message count for a user
  getUnreadCount: async (userId) => {
    const query = `
      SELECT SUM(
        CASE WHEN cs.unread_count IS NULL THEN 0 ELSE cs.unread_count END
      ) as total_unread
      FROM conversation_summary cs
      WHERE cs.user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].total_unread) || 0;
  },

  // Check if user has new messages since last check
  hasNewMessages: async (userId, lastCheckTime) => {
    const query = `
      SELECT COUNT(*) as new_count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = $1 
      AND cp.is_active = TRUE
      AND m.sender_id != $1
      AND m.created_at > $2
    `;
    const result = await db.query(query, [userId, lastCheckTime]);
    return parseInt(result.rows[0].new_count) > 0;
  },
};

export default Message;