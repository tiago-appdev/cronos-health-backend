

-- DROP SEQUENCE appointments_id_seq;

CREATE SEQUENCE appointments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE conversation_participants_id_seq;

CREATE SEQUENCE conversation_participants_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE conversations_id_seq;

CREATE SEQUENCE conversations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE doctors_id_seq;

CREATE SEQUENCE doctors_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE medical_records_id_seq;

CREATE SEQUENCE medical_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE medical_tests_id_seq;

CREATE SEQUENCE medical_tests_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE message_read_status_id_seq;

CREATE SEQUENCE message_read_status_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE messages_id_seq;

CREATE SEQUENCE messages_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE notification_preferences_id_seq;

CREATE SEQUENCE notification_preferences_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE notifications_id_seq;

CREATE SEQUENCE notifications_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE patient_notes_id_seq;

CREATE SEQUENCE patient_notes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE patients_id_seq;

CREATE SEQUENCE patients_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE prescriptions_id_seq;

CREATE SEQUENCE prescriptions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE surveys_id_seq;

CREATE SEQUENCE surveys_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE users_id_seq;

CREATE SEQUENCE users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.users definition

-- Drop table

-- DROP TABLE users;

CREATE TABLE users ( id serial4 NOT NULL, email varchar(255) NOT NULL, "password" varchar(255) NOT NULL, "name" varchar(255) NOT NULL, user_type varchar(20) NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['patient'::character varying, 'doctor'::character varying, 'admin'::character varying])::text[]))));


-- public.conversations definition

-- Drop table

-- DROP TABLE conversations;

CREATE TABLE conversations ( id serial4 NOT NULL, "type" varchar(20) DEFAULT 'direct'::character varying NOT NULL, "name" varchar(255) NULL, created_by int4 NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT conversations_pkey PRIMARY KEY (id), CONSTRAINT conversations_type_check CHECK (((type)::text = ANY ((ARRAY['direct'::character varying, 'group'::character varying])::text[]))), CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL);
CREATE INDEX idx_conversations_created_at ON public.conversations USING btree (created_at DESC);
CREATE INDEX idx_conversations_type ON public.conversations USING btree (type);


-- public.doctors definition

-- Drop table

-- DROP TABLE doctors;

CREATE TABLE doctors ( id serial4 NOT NULL, user_id int4 NULL, specialty varchar(255) NULL, license_number varchar(50) NULL, phone varchar(20) NULL, work_schedule text NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT doctors_pkey PRIMARY KEY (id), CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);


-- public.messages definition

-- Drop table

-- DROP TABLE messages;

CREATE TABLE messages ( id serial4 NOT NULL, conversation_id int4 NULL, sender_id int4 NULL, message_text text NOT NULL, message_type varchar(20) DEFAULT 'text'::character varying NULL, file_url text NULL, file_name text NULL, reply_to_message_id int4 NULL, is_edited bool DEFAULT false NULL, edited_at timestamptz NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'file'::character varying, 'system'::character varying])::text[]))), CONSTRAINT messages_pkey PRIMARY KEY (id), CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE, CONSTRAINT messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL, CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL);
CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

-- Table Triggers

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE conversations 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

create trigger trigger_update_conversation_timestamp after
insert
    on
    public.messages for each row execute function update_conversation_timestamp();


-- public.notification_preferences definition

-- Drop table

-- DROP TABLE notification_preferences;

CREATE TABLE notification_preferences ( id serial4 NOT NULL, user_id int4 NULL, survey_reminders bool DEFAULT true NULL, appointment_reminders bool DEFAULT true NULL, system_notifications bool DEFAULT true NULL, email_notifications bool DEFAULT false NULL, sms_notifications bool DEFAULT false NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT notification_preferences_pkey PRIMARY KEY (id), CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id), CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);


-- public.notifications definition

-- Drop table

-- DROP TABLE notifications;

CREATE TABLE notifications ( id serial4 NOT NULL, user_id int4 NULL, "type" varchar(50) NOT NULL, title varchar(255) NOT NULL, message text NOT NULL, "data" jsonb DEFAULT '{}'::jsonb NULL, is_read bool DEFAULT false NULL, priority varchar(20) DEFAULT 'normal'::character varying NULL, expires_at timestamptz NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT notifications_pkey PRIMARY KEY (id), CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))), CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['survey_reminder'::character varying, 'appointment_reminder'::character varying, 'appointment_completed'::character varying, 'system'::character varying, 'welcome'::character varying])::text[]))), CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


-- public.patients definition

-- Drop table

-- DROP TABLE patients;

CREATE TABLE patients ( id serial4 NOT NULL, user_id int4 NULL, date_of_birth date NULL, phone varchar(20) NULL, address text NULL, emergency_contact varchar(255) NULL, emergency_phone varchar(20) NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT patients_pkey PRIMARY KEY (id), CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);


-- public.appointments definition

-- Drop table

-- DROP TABLE appointments;

CREATE TABLE appointments ( id serial4 NOT NULL, patient_id int4 NULL, doctor_id int4 NULL, appointment_date timestamptz NOT NULL, status varchar(20) NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT appointments_pkey PRIMARY KEY (id), CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'canceled'::character varying])::text[]))), CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE);

-- Table Triggers


CREATE OR REPLACE FUNCTION public.trigger_survey_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  patient_user_id INTEGER;
  doctor_name TEXT;
  appointment_date_str TEXT;
BEGIN

  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    SELECT p.user_id INTO patient_user_id
    FROM patients p
    WHERE p.id = NEW.patient_id;

    SELECT u.name, to_char(NEW.appointment_date, 'DD/MM/YYYY')
    INTO doctor_name, appointment_date_str
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = NEW.doctor_id;

    IF patient_user_id IS NOT NULL AND doctor_name IS NOT NULL THEN
      PERFORM create_survey_notification(
        patient_user_id,
        NEW.id,
        doctor_name,
        appointment_date_str
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.update_conversation_timestamp();

create trigger trigger_appointment_completed_survey after
update
    on
    public.appointments for each row execute function trigger_survey_notification();


-- public.conversation_participants definition

-- Drop table

-- DROP TABLE conversation_participants;

CREATE TABLE conversation_participants ( id serial4 NOT NULL, conversation_id int4 NULL, user_id int4 NULL, joined_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_read_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, is_active bool DEFAULT true NULL, CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id), CONSTRAINT conversation_participants_pkey PRIMARY KEY (id), CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE, CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX idx_conversation_participants_conversation ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants USING btree (user_id);


-- public.medical_records definition

-- Drop table

-- DROP TABLE medical_records;

CREATE TABLE medical_records ( id serial4 NOT NULL, patient_id int4 NULL, doctor_id int4 NULL, "date" timestamptz DEFAULT CURRENT_TIMESTAMP NULL, diagnosis text NOT NULL, treatment text NULL, notes text NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT medical_records_pkey PRIMARY KEY (id), CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE);


-- public.medical_tests definition

-- Drop table

-- DROP TABLE medical_tests;

CREATE TABLE medical_tests ( id serial4 NOT NULL, medical_record_id int4 NULL, test_name text NOT NULL, test_date timestamptz NULL, results text NULL, notes text NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT medical_tests_pkey PRIMARY KEY (id), CONSTRAINT medical_tests_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE);


-- public.message_read_status definition

-- Drop table

-- DROP TABLE message_read_status;

CREATE TABLE message_read_status ( id serial4 NOT NULL, message_id int4 NULL, user_id int4 NULL, read_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT message_read_status_message_id_user_id_key UNIQUE (message_id, user_id), CONSTRAINT message_read_status_pkey PRIMARY KEY (id), CONSTRAINT message_read_status_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE, CONSTRAINT message_read_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX idx_message_read_status_user ON public.message_read_status USING btree (user_id);


-- public.patient_notes definition

-- Drop table

-- DROP TABLE patient_notes;

CREATE TABLE patient_notes ( id serial4 NOT NULL, patient_id int4 NULL, doctor_id int4 NULL, note text NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT patient_notes_pkey PRIMARY KEY (id), CONSTRAINT patient_notes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, CONSTRAINT patient_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE);


-- public.prescriptions definition

-- Drop table

-- DROP TABLE prescriptions;

CREATE TABLE prescriptions ( id serial4 NOT NULL, medical_record_id int4 NULL, medication text NOT NULL, dosage text NOT NULL, frequency text NOT NULL, duration text NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT prescriptions_pkey PRIMARY KEY (id), CONSTRAINT prescriptions_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE);


-- public.surveys definition

-- Drop table

-- DROP TABLE surveys;

CREATE TABLE surveys ( id serial4 NOT NULL, patient_id int4 NULL, appointment_id int4 NULL, appointment_ease_rating int4 NULL, punctuality_rating int4 NULL, medical_staff_rating int4 NULL, platform_rating int4 NULL, would_recommend varchar(10) NULL, additional_comments text NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT surveys_appointment_ease_rating_check CHECK (((appointment_ease_rating >= 1) AND (appointment_ease_rating <= 5))), CONSTRAINT surveys_medical_staff_rating_check CHECK (((medical_staff_rating >= 1) AND (medical_staff_rating <= 5))), CONSTRAINT surveys_pkey PRIMARY KEY (id), CONSTRAINT surveys_platform_rating_check CHECK (((platform_rating >= 1) AND (platform_rating <= 5))), CONSTRAINT surveys_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5))), CONSTRAINT surveys_would_recommend_check CHECK (((would_recommend)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'maybe'::character varying])::text[]))), CONSTRAINT surveys_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL, CONSTRAINT surveys_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE);
CREATE INDEX idx_surveys_appointment ON public.surveys USING btree (appointment_id);
CREATE INDEX idx_surveys_created_at ON public.surveys USING btree (created_at DESC);
CREATE INDEX idx_surveys_patient ON public.surveys USING btree (patient_id);

-- DROP FUNCTION public.cleanup_survey_notification();

CREATE OR REPLACE FUNCTION public.cleanup_survey_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN

  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE notifications
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = (
      SELECT p.user_id FROM patients p WHERE p.id = NEW.patient_id
    )
    AND type = 'survey_reminder'
    AND (data->>'appointment_id')::INTEGER = NEW.appointment_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.create_survey_notification(int4, int4, text, text);

CREATE OR REPLACE FUNCTION public.create_survey_notification(p_user_id integer, p_appointment_id integer, p_doctor_name text, p_appointment_date text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id INTEGER;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority,
    expires_at
  )
  VALUES (
    p_user_id,
    'survey_reminder',
    'Evalúa tu atención médica',
    'Tu cita con ' || p_doctor_name || ' ha sido completada. ¡Tu opinión es importante para nosotros!',
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'doctor_name', p_doctor_name,
      'appointment_date', p_appointment_date,
      'action_url', '/survey?appointmentId=' || p_appointment_id
    ),
    'normal',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$
;

-- DROP FUNCTION public.expire_old_notifications();

CREATE OR REPLACE FUNCTION public.expire_old_notifications()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN

  UPDATE notifications 
  SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
  WHERE expires_at < CURRENT_TIMESTAMP AND is_read = FALSE;

  DELETE FROM notifications 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$function$
;

-- DROP FUNCTION public.get_or_create_direct_conversation(int4, int4);

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(user1_id integer, user2_id integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;


-- Table Triggers

create trigger trigger_survey_submitted after
insert
    on
    public.surveys for each row execute function cleanup_survey_notification();


-- public.appointment_details source

-- public.patient_details source

CREATE OR REPLACE VIEW patient_details
AS SELECT u.id AS user_id,
    u.name,
    u.email,
    p.date_of_birth,
    p.phone,
    p.address,
    p.emergency_contact,
    p.emergency_phone,
    EXTRACT(year FROM age(p.date_of_birth::timestamp with time zone)) AS age,
    u.created_at AS registered_date
   FROM users u
     JOIN patients p ON u.id = p.user_id
  WHERE u.user_type::text = 'patient'::text;

-- public.doctor_details source

CREATE OR REPLACE VIEW doctor_details
AS SELECT u.id AS user_id,
    u.name,
    u.email,
    d.specialty,
    d.license_number,
    d.phone,
    d.work_schedule,
    u.created_at AS registered_date
   FROM users u
     JOIN doctors d ON u.id = d.user_id
  WHERE u.user_type::text = 'doctor'::text;



CREATE OR REPLACE VIEW appointment_details
AS SELECT a.id AS appointment_id,
    pd.name AS patient_name,
    pd.email AS patient_email,
    dd.name AS doctor_name,
    dd.specialty AS doctor_specialty,
    a.appointment_date,
    a.status,
    a.created_at AS scheduled_date
   FROM appointments a
     JOIN patient_details pd ON a.patient_id = (( SELECT patients.id
           FROM patients
          WHERE patients.user_id = pd.user_id))
     JOIN doctor_details dd ON a.doctor_id = (( SELECT doctors.id
           FROM doctors
          WHERE doctors.user_id = dd.user_id))
  ORDER BY a.appointment_date DESC;


-- public.conversation_summary source

CREATE OR REPLACE VIEW conversation_summary
AS SELECT c.id,
    c.type,
    c.name,
    c.created_at,
    c.updated_at,
    cp.user_id,
    cp.last_read_at,
    COALESCE(last_msg.message_text, ''::text) AS last_message,
    COALESCE(last_msg.created_at, c.created_at) AS last_message_time,
    COALESCE(sender.name, 'Sistema'::character varying) AS last_sender_name,
    ( SELECT count(*) AS count
           FROM messages m2
          WHERE m2.conversation_id = c.id AND m2.created_at > cp.last_read_at AND m2.sender_id <> cp.user_id) AS unread_count
   FROM conversations c
     JOIN conversation_participants cp ON c.id = cp.conversation_id
     LEFT JOIN messages last_msg ON last_msg.id = (( SELECT m.id
           FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
         LIMIT 1))
     LEFT JOIN users sender ON last_msg.sender_id = sender.id
  WHERE cp.is_active = true
  ORDER BY (COALESCE(last_msg.created_at, c.created_at)) DESC;







-- DROP FUNCTION public.trigger_survey_notification();


