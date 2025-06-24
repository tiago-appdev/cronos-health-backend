import db from "../src/db.js";
import bcrypt from "bcrypt";

// Sample data arrays
const specialties = [
  "Cardiología",
  "Dermatología",
  "Pediatría",
  "Traumatología",
  "Neurología",
  "Ginecología",
  "Oftalmología",
  "Psiquiatría",
  "Medicina General",
  "Endocrinología",
];

const doctorNames = [
  "Dr. Gabriel Méndez",
  "Dra. María Rodríguez",
  "Dr. Carlos López",
  "Dra. Ana Martínez",
  "Dr. Luis García",
  "Dra. Carmen Fernández",
  "Dr. Andrés Silva",
  "Dra. Patricia Ruiz",
  "Dr. Miguel Torres",
  "Dra. Laura Jiménez",
  "Dr. Rafael Herrera",
  "Dra. Sandra Morales",
  "Dr. Diego Castro",
  "Dra. Elena Vargas",
  "Dr. Fernando Ramos",
];

const patientNames = [
  "Juan Pérez",
  "María González",
  "Carlos Sánchez",
  "Ana Martín",
  "Luis Rodríguez",
  "Carmen López",
  "José García",
  "Isabel Fernández",
  "Manuel Díaz",
  "Rosa Ruiz",
  "Antonio Torres",
  "Pilar Jiménez",
  "Francisco Herrera",
  "Dolores Morales",
  "Ramón Castro",
  "Esperanza Vargas",
  "Jesús Ramos",
  "Amparo Ortega",
  "Miguel Delgado",
  "Concepción Romero",
  "Fernando Iglesias",
  "Mercedes Guerrero",
  "Alberto Medina",
  "Cristina Garrido",
  "Enrique Serrano",
  "Teresa Peña",
  "Alejandro Cabrera",
  "Mónica Vega",
  "Ricardo Aguilar",
  "Beatriz Flores",
];

const addresses = [
  "Calle Mayor 123, Madrid",
  "Avenida de la Libertad 45, Barcelona",
  "Plaza del Sol 7, Valencia",
  "Calle de la Paz 89, Sevilla",
  "Paseo de Gracia 234, Barcelona",
  "Gran Vía 156, Madrid",
  "Calle Real 67, Granada",
  "Avenida del Puerto 34, Málaga",
  "Plaza de España 12, Córdoba",
  "Calle Nueva 78, Bilbao",
];

const diagnoses = [
  "Hipertensión arterial",
  "Diabetes tipo 2",
  "Gastritis crónica",
  "Dermatitis atópica",
  "Migraña",
  "Artritis reumatoide",
  "Asma bronquial",
  "Depresión leve",
  "Lumbalgia",
  "Conjuntivitis alérgica",
  "Rinitis alérgica",
  "Ansiedad generalizada",
  "Otitis media",
  "Bronquitis aguda",
  "Eccema",
  "Cefalea tensional",
  "Dolor cervical",
  "Insomnio",
  "Reflujo gastroesofágico",
  "Fatiga crónica",
];

const treatments = [
  "Reposo y medicación antiinflamatoria",
  "Dieta hipocalórica y ejercicio regular",
  "Antihistamínicos y cremas hidratantes",
  "Fisioterapia y relajación muscular",
  "Terapia cognitivo-conductual",
  "Medicación antihipertensiva",
  "Inhaladores broncodilatadores",
  "Antidepresivos y psicoterapia",
  "Analgésicos y ejercicios de estiramiento",
  "Colirios antihistamínicos",
  "Descongestionantes nasales",
  "Ansiolíticos y técnicas de relajación",
  "Antibióticos y analgésicos",
  "Expectorantes y reposo",
  "Corticoides tópicos",
  "Relajantes musculares",
  "Ejercicios de fisioterapia",
  "Higiene del sueño y melatonina",
  "Inhibidores de la bomba de protones",
  "Vitaminas del complejo B",
];

const medications = [
  "Paracetamol 500mg",
  "Ibuprofeno 400mg",
  "Omeprazol 20mg",
  "Loratadina 10mg",
  "Atorvastatina 20mg",
  "Metformina 850mg",
  "Enalapril 10mg",
  "Salbutamol 100mcg",
  "Sertralina 50mg",
  "Diazepam 5mg",
  "Amoxicilina 500mg",
  "Prednisolona 5mg",
  "Furosemida 40mg",
  "Levotiroxina 50mcg",
  "Amlodipino 5mg",
];

// Utility functions
const getRandomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateEmail = (name) => {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/dr\.|dra\./, "") + "@email.com"
  );
};

const generatePhone = () => {
  return `6${Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")}`;
};

const seed = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (in correct order to avoid foreign key constraints)
    console.log("🗑️  Clearing existing data...");
    await db.query("DELETE FROM surveys");
    await db.query("DELETE FROM notifications");
    await db.query("DELETE FROM notification_preferences");
    await db.query("DELETE FROM message_read_status");
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM conversation_participants");
    await db.query("DELETE FROM conversations");
    await db.query("DELETE FROM patient_notes");
    await db.query("DELETE FROM medical_tests");
    await db.query("DELETE FROM prescriptions");
    await db.query("DELETE FROM medical_records");
    await db.query("DELETE FROM appointments");
    await db.query("DELETE FROM patients");
    await db.query("DELETE FROM doctors");
    await db.query("DELETE FROM users");

    // Reset sequences
    await db.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE patients_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE doctors_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE appointments_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE medical_records_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE prescriptions_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE medical_tests_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE patient_notes_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE surveys_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE notifications_id_seq RESTART WITH 1");
    await db.query(
      "ALTER SEQUENCE notification_preferences_id_seq RESTART WITH 1"
    );

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("password123", salt);

    // Create admin user
    console.log("👤 Creating admin user...");
    const adminQuery = `
      INSERT INTO users (name, email, password, user_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    await db.query(adminQuery, [
      "Administrador",
      "admin@cronoshealth.com",
      defaultPassword,
      "admin",
    ]);

    // Create doctors
    console.log("👨‍⚕️ Creating doctors...");
    const doctorIds = [];
    for (let i = 0; i < doctorNames.length; i++) {
      const doctorName = doctorNames[i];
      const email = generateEmail(doctorName);

      // Create user
      const userResult = await db.query(adminQuery, [
        doctorName,
        email,
        defaultPassword,
        "doctor",
      ]);

      const userId = userResult.rows[0].id;

      // Create doctor profile
      const doctorQuery = `
        INSERT INTO doctors (user_id, specialty, license_number, phone, work_schedule, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const doctorResult = await db.query(doctorQuery, [
        userId,
        getRandomElement(specialties),
        `COL${String(12345 + i).padStart(5, "0")}`,
        generatePhone(),
        "Lunes a Viernes 9:00-17:00",
      ]);

      doctorIds.push(doctorResult.rows[0].id);
    }

    // Create patients
    console.log("🧑‍🦲 Creating patients...");
    const patientIds = [];
    for (let i = 0; i < patientNames.length; i++) {
      const patientName = patientNames[i];
      const email = generateEmail(patientName);

      // Create user
      const userResult = await db.query(adminQuery, [
        patientName,
        email,
        defaultPassword,
        "patient",
      ]);

      const userId = userResult.rows[0].id;

      // Create patient profile
      const patientQuery = `
        INSERT INTO patients (user_id, date_of_birth, phone, address, emergency_contact, emergency_phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const birthDate = getRandomDate(
        new Date(1950, 0, 1),
        new Date(2005, 11, 31)
      );
      const patientResult = await db.query(patientQuery, [
        userId,
        birthDate.toISOString().split("T")[0],
        generatePhone(),
        getRandomElement(addresses),
        getRandomElement(patientNames.filter((name) => name !== patientName)),
        generatePhone(),
      ]);

      patientIds.push(patientResult.rows[0].id);
    }

    // Create appointments (last 6 months to future)
    console.log("📅 Creating appointments...");
    const appointmentIds = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    for (let i = 0; i < 200; i++) {
      const appointmentDate = getRandomDate(startDate, endDate);
      const patientId = getRandomElement(patientIds);
      const doctorId = getRandomElement(doctorIds);

      // Determine status based on date
      let status = "scheduled";
      if (appointmentDate < new Date()) {
        const randomStatus = Math.random();
        if (randomStatus < 0.8) status = "completed";
        else if (randomStatus < 0.95) status = "canceled";
      }

      const appointmentQuery = `
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const appointmentResult = await db.query(appointmentQuery, [
        patientId,
        doctorId,
        appointmentDate,
        status,
      ]);

      appointmentIds.push(appointmentResult.rows[0].id);
    }

    // Create medical records for completed appointments
    console.log("🏥 Creating medical records...");
    const completedAppointments = await db.query(`
      SELECT * FROM appointments WHERE status = 'completed' ORDER BY RANDOM() LIMIT 100
    `);

    const medicalRecordIds = [];
    for (const appointment of completedAppointments.rows) {
      const recordQuery = `
        INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes, date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const recordResult = await db.query(recordQuery, [
        appointment.patient_id,
        appointment.doctor_id,
        getRandomElement(diagnoses),
        getRandomElement(treatments),
        `Notas adicionales del ${new Date(
          appointment.appointment_date
        ).toLocaleDateString("es-ES")}`,
        appointment.appointment_date,
      ]);

      medicalRecordIds.push(recordResult.rows[0].id);

      // Add prescriptions (random chance)
      if (Math.random() < 0.7) {
        const prescriptionQuery = `
          INSERT INTO prescriptions (medical_record_id, medication, dosage, frequency, duration, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        await db.query(prescriptionQuery, [
          recordResult.rows[0].id,
          getRandomElement(medications),
          "1 comprimido",
          getRandomElement([
            "Cada 8 horas",
            "Cada 12 horas",
            "Una vez al día",
            "Dos veces al día",
          ]),
          getRandomElement(["7 días", "14 días", "30 días", "Hasta mejoría"]),
        ]);
      }

      // Add medical tests (random chance)
      if (Math.random() < 0.3) {
        const testQuery = `
          INSERT INTO medical_tests (medical_record_id, test_name, test_date, results, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        const testDate = new Date(appointment.appointment_date);
        testDate.setDate(testDate.getDate() + getRandomNumber(1, 14));

        await db.query(testQuery, [
          recordResult.rows[0].id,
          getRandomElement([
            "Análisis de sangre",
            "Radiografía",
            "Ecografía",
            "Electrocardiograma",
            "Resonancia magnética",
          ]),
          testDate,
          "Resultados dentro de parámetros normales",
          "Control en 3 meses",
        ]);
      }
    }

    // Create patient notes
    console.log("📝 Creating patient notes...");
    for (let i = 0; i < 50; i++) {
      const noteQuery = `
        INSERT INTO patient_notes (patient_id, doctor_id, note, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await db.query(noteQuery, [
        getRandomElement(patientIds),
        getRandomElement(doctorIds),
        getRandomElement([
          "Paciente colaborador, sigue bien las indicaciones",
          "Revisar medicación en próxima cita",
          "Recomendar dieta baja en sodio",
          "Paciente refiere mejoría en síntomas",
          "Programar examen de control en 6 meses",
          "Derivar a especialista si persisten síntomas",
          "Paciente alérgico a penicilina",
          "Antecedentes familiares de diabetes",
        ]),
      ]);
    }

    // Create surveys for some completed appointments
    console.log("📊 Creating surveys...");
    const surveyAppointments = completedAppointments.rows.slice(0, 60);

    for (const appointment of surveyAppointments) {
      const surveyQuery = `
        INSERT INTO surveys (
          patient_id, 
          appointment_id, 
          appointment_ease_rating, 
          punctuality_rating, 
          medical_staff_rating, 
          platform_rating, 
          would_recommend, 
          additional_comments,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const surveyDate = new Date(appointment.appointment_date);
      surveyDate.setDate(surveyDate.getDate() + getRandomNumber(1, 7));

      await db.query(surveyQuery, [
        appointment.patient_id,
        appointment.id,
        getRandomNumber(3, 5), // appointment_ease_rating
        getRandomNumber(3, 5), // punctuality_rating
        getRandomNumber(4, 5), // medical_staff_rating
        getRandomNumber(3, 5), // platform_rating
        getRandomElement(["yes", "yes", "yes", "maybe", "no"]), // weighted towards positive
        Math.random() < 0.4
          ? getRandomElement([
              "Excelente atención, muy profesional",
              "Todo perfecto, recomiendo el servicio",
              "La plataforma es muy fácil de usar",
              "El doctor fue muy amable y explicó todo claramente",
              "Muy contento con el servicio recibido",
              "",
              null,
            ])
          : null,
      ]);
    }

    // Create some conversations and messages
    console.log("💬 Creating conversations and messages...");
    for (let i = 0; i < 20; i++) {
      const patientId = getRandomElement(patientIds);
      const doctorId = getRandomElement(doctorIds);

      // Get user IDs for the conversation
      const patientUser = await db.query(
        "SELECT user_id FROM patients WHERE id = $1",
        [patientId]
      );
      const doctorUser = await db.query(
        "SELECT user_id FROM doctors WHERE id = $1",
        [doctorId]
      );

      if (patientUser.rows.length > 0 && doctorUser.rows.length > 0) {
        const conversationId = await db.query(
          "SELECT get_or_create_direct_conversation($1, $2) as id",
          [patientUser.rows[0].user_id, doctorUser.rows[0].user_id]
        );

        const convId = conversationId.rows[0].id;

        // Add some messages
        const messages = [
          {
            sender: doctorUser.rows[0].user_id,
            text: "Hola, ¿cómo se ha sentido con la medicación que le receté?",
          },
          {
            sender: patientUser.rows[0].user_id,
            text: "Hola doctora, me he sentido mejor. La presión arterial ha bajado un poco.",
          },
          {
            sender: doctorUser.rows[0].user_id,
            text: "Excelente noticia. ¿Ha tenido algún efecto secundario?",
          },
          {
            sender: patientUser.rows[0].user_id,
            text: "Solo un poco de mareo por las mañanas, pero nada grave.",
          },
          {
            sender: doctorUser.rows[0].user_id,
            text: "Es normal en los primeros días. Si persiste por más de una semana, avíseme y ajustaremos la dosis.",
          },
        ];

        for (let j = 0; j < messages.length; j++) {
          const messageDate = new Date();
          messageDate.setHours(messageDate.getHours() - (messages.length - j));

          await db.query(
            `
            INSERT INTO messages (conversation_id, sender_id, message_text, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $4)
          `,
            [convId, messages[j].sender, messages[j].text, messageDate]
          );
        }
      }
    }
    // Create sample notifications
    console.log("🔔 Creating sample notifications...");

    // Get only patient user IDs for notifications (notifications are only for patients)
    const patientUserIds = await db.query(`
      SELECT u.id 
      FROM users u 
      JOIN patients p ON u.id = p.user_id 
      WHERE u.user_type = 'patient'
    `);
    const patientUserIds_list = patientUserIds.rows.map((row) => row.id);

    // Create survey reminder notifications (only for patients)
    for (let i = 0; i < 10; i++) {
      const userId = getRandomElement(patientUserIds_list);
      const doctorName = getRandomElement(doctorNames);
      const appointmentDate = getRandomDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      );

      await db.query(
        `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          data, 
          priority,
          expires_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      `,
        [
          userId,
          "survey_reminder",
          "Evalúa tu atención médica",
          `Tu cita con ${doctorName} ha sido completada. ¡Tu opinión es importante para nosotros!`,
          JSON.stringify({
            appointment_id: getRandomNumber(1, 100),
            doctor_name: doctorName,
            appointment_date: appointmentDate.toISOString().split("T")[0],
            action_url: `/survey?appointmentId=${getRandomNumber(1, 100)}`,
          }),
          getRandomElement(["normal", "high"]),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
          getRandomDate(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            new Date()
          ),
        ]
      );
    }
    // Create appointment reminder notifications (only for patients)
    for (let i = 0; i < 5; i++) {
      const userId = getRandomElement(patientUserIds_list);
      const doctorName = getRandomElement(doctorNames);
      const appointmentDate = getRandomDate(
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      await db.query(
        `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          data, 
          priority,
          expires_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      `,
        [
          userId,
          "appointment_reminder",
          "Recordatorio de cita médica",
          `Tienes una cita con ${doctorName} el ${appointmentDate.toLocaleDateString(
            "es-ES"
          )}`,
          JSON.stringify({
            appointment_id: getRandomNumber(1, 100),
            doctor_name: doctorName,
            appointment_date: appointmentDate.toISOString().split("T")[0],
          }),
          "high",
          appointmentDate,
          getRandomDate(
            new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            new Date()
          ),
        ]
      );
    } // Create some welcome/system notifications (only for patients)
    for (let i = 0; i < 3; i++) {
      const userId = getRandomElement(patientUserIds_list);

      await db.query(
        `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          data, 
          priority,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `,
        [
          userId,
          "system",
          "¡Bienvenido a Cronos Health!",
          "Gracias por unirte a nuestra plataforma. Esperamos poder ayudarte con todas tus necesidades de salud.",
          JSON.stringify({
            action_url: "/dashboard",
          }),
          "normal",
          getRandomDate(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
          ),
        ]
      );
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`
📊 Summary:
- 1 Admin user
- ${doctorNames.length} Doctors
- ${patientNames.length} Patients
- ~200 Appointments
- ~100 Medical Records
- ~60 Surveys
- ~50 Patient Notes
- ~20 Conversations with messages
- ~18 Notifications (survey reminders, appointment reminders, system)

🔑 Login credentials:
- Admin: admin@cronoshealth.com / password123
- All users: [email] / password123
    `);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit();
  }
};

seed();
