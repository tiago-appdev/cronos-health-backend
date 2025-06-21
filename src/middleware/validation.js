// Validation middleware for messages
export const validateSendMessage = (req, res, next) => {
  const { conversationId, text, messageType, replyToMessageId } = req.body;
  const errors = [];

  // Validate conversationId
  if (!conversationId) {
    errors.push("El ID de la conversación es requerido");
  } else if (isNaN(parseInt(conversationId))) {
    errors.push("El ID de la conversación debe ser un número válido");
  }

  // Validate text
  if (!text) {
    errors.push("El texto del mensaje es requerido");
  } else if (typeof text !== "string" || text.trim().length === 0) {
    errors.push("El mensaje no puede estar vacío");
  } else if (text.trim().length > 2000) {
    errors.push("El mensaje no puede exceder 2000 caracteres");
  }

  // Validate messageType (optional)
  if (messageType && !["text", "image", "file", "system"].includes(messageType)) {
    errors.push("Tipo de mensaje inválido");
  }

  // Validate replyToMessageId (optional)
  if (replyToMessageId && isNaN(parseInt(replyToMessageId))) {
    errors.push("El ID del mensaje de respuesta debe ser un número válido");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Errores de validación",
      errors,
    });
  }

  next();
};

// Validation middleware for conversation creation
export const validateCreateConversation = (req, res, next) => {
  const { otherUserId } = req.body;
  const errors = [];

  // Validate otherUserId
  if (!otherUserId) {
    errors.push("El ID del otro usuario es requerido");
  } else if (isNaN(parseInt(otherUserId))) {
    errors.push("El ID del usuario debe ser un número válido");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Errores de validación",
      errors,
    });
  }

  next();
};

// Validation middleware for search queries
export const validateSearchQuery = (req, res, next) => {
  const { q: searchTerm } = req.query;
  const errors = [];

  // Validate search term
  if (!searchTerm) {
    errors.push("El término de búsqueda es requerido");
  } else if (typeof searchTerm !== "string" || searchTerm.trim().length < 2) {
    errors.push("El término de búsqueda debe tener al menos 2 caracteres");
  } else if (searchTerm.trim().length > 100) {
    errors.push("El término de búsqueda no puede exceder 100 caracteres");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Errores de validación",
      errors,
    });
  }

  next();
};

// Validation middleware for editing messages
export const validateEditMessage = (req, res, next) => {
  const { text } = req.body;
  const errors = [];

  // Validate text
  if (!text) {
    errors.push("El texto del mensaje es requerido");
  } else if (typeof text !== "string" || text.trim().length === 0) {
    errors.push("El mensaje no puede estar vacío");
  } else if (text.trim().length > 2000) {
    errors.push("El mensaje no puede exceder 2000 caracteres");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Errores de validación",
      errors,
    });
  }

  next();
};

// Validation middleware for conversation ID parameter
export const validateConversationId = (req, res, next) => {
  const { conversationId } = req.params;

  if (!conversationId || isNaN(parseInt(conversationId))) {
    return res.status(400).json({
      message: "ID de conversación inválido",
    });
  }

  next();
};

// Validation middleware for message ID parameter
export const validateMessageId = (req, res, next) => {
  const { messageId } = req.params;

  if (!messageId || isNaN(parseInt(messageId))) {
    return res.status(400).json({
      message: "ID de mensaje inválido",
    });
  }

  next();
};

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    
    // Remove any potential HTML/script tags
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  // Sanitize body fields
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  next();
};