import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Appointments Endpoints", () => {
  let patient, doctor, patientToken, doctorToken;

  beforeEach(async () => {
    // Create test patient
    patient = await TestUtils.createTestPatient({
      email: TestUtils.getRandomEmail(),
      name: "Test Patient Appointments"
    });
    patientToken = TestUtils.generateTestToken(patient.user);

    // Create test doctor
    doctor = await TestUtils.createTestDoctor({
      email: TestUtils.getRandomEmail(),
      name: "Test Doctor Appointments",
      profileData: { specialty: "Cardiology" }
    });
    doctorToken = TestUtils.generateTestToken(doctor.user);
  });

  describe("GET /api/appointments/doctors", () => {
    it("should get list of available doctors", async () => {
      const response = await request(app)
        .get("/api/appointments/doctors")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const doctorResponse = response.body[0];
      expect(doctorResponse).toHaveProperty("id");
      expect(doctorResponse).toHaveProperty("name");
      expect(doctorResponse).toHaveProperty("specialty");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/appointments/doctors")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/appointments", () => {
    it("should create new appointment as patient", async () => {
      const appointmentData = {
        doctorId: doctor.doctor.id,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      };

      const response = await request(app)
        .post("/api/appointments")
        .set("x-auth-token", patientToken)
        .send(appointmentData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("appointment");
      expect(response.body.appointment).toHaveProperty("id");
      expect(response.body.appointment).toHaveProperty("status", "scheduled");
    });

    it("should not allow doctors to create appointments", async () => {
      const appointmentData = {
        doctorId: doctor.doctor.id,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request(app)
        .post("/api/appointments")
        .set("x-auth-token", doctorToken)
        .send(appointmentData)
        .expect(403);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Solo los pacientes");
    });

    it("should reject past dates", async () => {
      const appointmentData = {
        doctorId: doctor.doctor.id,
        appointmentDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };

      const response = await request(app)
        .post("/api/appointments")
        .set("x-auth-token", patientToken)
        .send(appointmentData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("fecha debe ser futura");
    });

    it("should require authentication", async () => {
      const appointmentData = {
        doctorId: doctor.doctor.id,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request(app)
        .post("/api/appointments")
        .send(appointmentData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("x-auth-token", patientToken)
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("requeridos");
    });
  });

  describe("GET /api/appointments", () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await TestUtils.createTestAppointment(
        patient.patient.id, 
        doctor.doctor.id
      );
    });

    it("should get appointments for patient", async () => {
      const response = await request(app)
        .get("/api/appointments")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const appointment = response.body[0];
      expect(appointment).toHaveProperty("id");
      expect(appointment).toHaveProperty("doctor");
      expect(appointment).toHaveProperty("date");
      expect(appointment).toHaveProperty("time");
      expect(appointment).toHaveProperty("status");
    });

    it("should get appointments for doctor", async () => {
      const response = await request(app)
        .get("/api/appointments")
        .set("x-auth-token", doctorToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/appointments")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/appointments/:id", () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await TestUtils.createTestAppointment(
        patient.patient.id, 
        doctor.doctor.id
      );
    });

    it("should update appointment status", async () => {
      const updateData = {
        status: "completed",
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set("x-auth-token", patientToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("appointment");
      expect(response.body.appointment).toHaveProperty("status", "completed");
    });

    it("should not allow unauthorized updates", async () => {
      const updateData = {
        status: "canceled",
      };

      const response = await request(app)
        .put(`/api/appointments/99999`)
        .set("x-auth-token", patientToken)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .send({ status: "canceled" })
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await TestUtils.createTestAppointment(
        patient.patient.id, 
        doctor.doctor.id
      );
    });

    it("should cancel appointment", async () => {
      const response = await request(app)
        .delete(`/api/appointments/${testAppointment.id}`)
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("cancelada exitosamente");
    });

    it("should not allow unauthorized cancellation", async () => {
      const response = await request(app)
        .delete(`/api/appointments/99999`)
        .set("x-auth-token", patientToken)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/appointments/${testAppointment.id}`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/appointments/:id", () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await TestUtils.createTestAppointment(
        patient.patient.id, 
        doctor.doctor.id
      );
    });

    it("should get single appointment details", async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment.id}`)
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("id", testAppointment.id);
      expect(response.body).toHaveProperty("doctor");
      expect(response.body).toHaveProperty("date");
      expect(response.body).toHaveProperty("time");
      expect(response.body).toHaveProperty("status");
    });

    it("should not allow unauthorized access", async () => {
      const response = await request(app)
        .get(`/api/appointments/99999`)
        .set("x-auth-token", patientToken)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`/api/appointments/1`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});