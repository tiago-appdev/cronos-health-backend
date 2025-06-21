-- Chat System Database Schema
-- File: db/04-chat-system.sql

-- Conversations table (chat rooms between users)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name VARCHAR(255), -- For group chats, null for direct messages
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants (who's in each conversation)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT, -- For file attachments
  file_name TEXT, -- Original filename
  reply_to_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message read status (to track who has read what)
CREATE TABLE IF NOT EXISTS message_read_status (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON message_read_status(user_id);

-- Function to update conversation updated_at when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Create a view for conversation summary (last message, unread count, etc.)
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  c.id,
  c.type,
  c.name,
  c.created_at,
  c.updated_at,
  cp.user_id,
  cp.last_read_at,
  COALESCE(last_msg.message_text, '') as last_message,
  COALESCE(last_msg.created_at, c.created_at) as last_message_time,
  COALESCE(sender.name, 'Sistema') as last_sender_name,
  (
    SELECT COUNT(*)
    FROM messages m2
    WHERE m2.conversation_id = c.id 
    AND m2.created_at > cp.last_read_at
    AND m2.sender_id != cp.user_id
  ) as unread_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN messages last_msg ON last_msg.id = (
  SELECT m.id 
  FROM messages m 
  WHERE m.conversation_id = c.id 
  ORDER BY m.created_at DESC 
  LIMIT 1
)
LEFT JOIN users sender ON last_msg.sender_id = sender.id
WHERE cp.is_active = TRUE
ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC;

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user1_id INTEGER, user2_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  conversation_id INTEGER;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = user1_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = user2_id
  WHERE c.type = 'direct'
  AND cp1.is_active = TRUE
  AND cp2.is_active = TRUE;

  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (type, created_by)
    VALUES ('direct', user1_id)
    RETURNING id INTO conversation_id;

    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
-- Create direct conversations between doctors and patients
DO $$
DECLARE
  doctor_user_id INTEGER;
  patient_user_id INTEGER;
  conv_id INTEGER;
BEGIN
  -- Get first doctor and first patient
  SELECT u.id INTO doctor_user_id 
  FROM users u 
  WHERE u.user_type = 'doctor' 
  LIMIT 1;

  SELECT u.id INTO patient_user_id 
  FROM users u 
  WHERE u.user_type = 'patient' 
  LIMIT 1;

  -- Create conversation if both users exist
  IF doctor_user_id IS NOT NULL AND patient_user_id IS NOT NULL THEN
    SELECT get_or_create_direct_conversation(doctor_user_id, patient_user_id) INTO conv_id;
    
    -- Add some sample messages
    INSERT INTO messages (conversation_id, sender_id, message_text) VALUES
    (conv_id, doctor_user_id, 'Hola, ¿cómo se ha sentido con la medicación que le receté?'),
    (conv_id, patient_user_id, 'Hola doctora, me he sentido mejor. La presión arterial ha bajado un poco.'),
    (conv_id, doctor_user_id, 'Excelente noticia. ¿Ha tenido algún efecto secundario?'),
    (conv_id, patient_user_id, 'Solo un poco de mareo por las mañanas, pero nada grave.'),
    (conv_id, doctor_user_id, 'Es normal en los primeros días. Si persiste por más de una semana, avíseme y ajustaremos la dosis.');
  END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE conversation_participants IS 'Users participating in each conversation';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE message_read_status IS 'Tracking which messages have been read by which users';
COMMENT ON VIEW conversation_summary IS 'Summary view with last message and unread counts for each conversation';
COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Get existing or create new direct conversation between two users';