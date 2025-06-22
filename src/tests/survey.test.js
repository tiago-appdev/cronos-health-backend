import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Survey API", () => {
  let patient, doctor, admin, patientToken, doctorToken, adminToken;
  let testAppointment;

  beforeEach(async () => {
    // Create test users
    patient = await TestUtils.createTestPatient({
      email: TestUtils.getRandomEmail(),
      name: "Test Patient Survey"
    });
    patientToken = TestUtils.generateTestToken(patient.user);

    doctor = await TestUtils.createTestDoctor({
      email: TestUtils.getRandomEmail(),
      name: "Test Doctor Survey"
    });
    doctorToken = TestUtils.generateTestToken(doctor.user);

    admin = await TestUtils.createTestAdmin({
      email: TestUtils.getRandomEmail(),
      name: "Test Admin Survey"
    });
    adminToken = TestUtils.generateTestToken(admin);

    // Create test appointment
    testAppointment = await TestUtils.createTestAppointment(
      patient.patient.id,
      doctor.doctor.id,
      { status: "completed", appointment_date: new Date(Date.now() - 86400000) } // Yesterday
    );
  });

  describe("POST /api/surveys", () => {
    it("should submit a survey as patient", async () => {
      const surveyData = {
        appointmentId: testAppointment.id,
        appointmentEaseRating: 5,
        punctualityRating: 4,
        medicalStaffRating: 5,
        platformRating: 4,
        wouldRecommend: "yes",
        additionalComments: "Excellent service!"
      };

      const response = await request(app)
        .post("/api/surveys")
        .set("x-auth-token", patientToken)
        .send(surveyData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("survey");
      expect(response.body.survey).toHaveProperty("id");
      expect(response.body.survey.patient_id).toBe(patient.patient.id);
    });

    it("should submit a survey without appointment", async () => {
      const surveyData = {
        appointmentEaseRating: 5,
        punctualityRating: 4,
        medicalStaffRating: 5,
        platformRating: 4,
        wouldRecommend: "yes",
        additionalComments: "Good general experience"
      };

      const response = await request(app)
        .post("/api/surveys")
        .set("x-auth-token", patientToken)
        .send(surveyData)
        .expect(201);

      expect(response.body).toHaveProperty("survey");
      expect(response.body.survey.appointment_id).toBeNull();
    });

    it("should not allow doctors to submit surveys", async () => {
      const surveyData = {
        appointmentEaseRating: 5,
        punctualityRating: 4,
        medicalStaffRating: 5,
        platformRating: 4,
        wouldRecommend: "yes"
      };

      const response = await request(app)
        .post("/api/surveys")
        .set("x-auth-token", doctorToken)
        .send(surveyData)
        .expect(403);

      expect(response.body.message).toContain("Solo los pacientes");
    });

    it("should validate required fields", async () => {
      const surveyData = {
        appointmentEaseRating: 5,
        // Missing other required ratings
      };

      const response = await request(app)
        .post("/api/surveys")
        .set("x-auth-token", patientToken)
        .send(surveyData)
        .expect(400);

      expect(response.body.message).toContain("requeridas");
    });

    it("should prevent duplicate surveys for same appointment", async () => {
      const surveyData = {
        appointmentId: testAppointment.id,
        appointmentEaseRating: 5,
        punctualityRating: 4,
        medicalStaffRating: 5,
        platformRating: 4,
        wouldRecommend: "yes"
      };

      // Submit first survey
      await request(app)
        .post("/api/surveys")
        .set("x-auth-token", patientToken)
        .send(surveyData)
        .expect(201);

      // Try to submit duplicate
      const response = await request(app)
        .post("/api/surveys")
        .set("x-auth-token", patientToken)
        .send(surveyData)
        .expect(400);

      expect(response.body.message).toContain("Ya has enviado una encuesta");
    });

    it("should require authentication", async () => {
      const surveyData = {
        appointmentEaseRating: 5,
        punctualityRating: 4,
        medicalStaffRating: 5,
        platformRating: 4,
        wouldRecommend: "yes"
      };

      const response = await request(app)
        .post("/api/surveys")
        .send(surveyData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/surveys/my-surveys", () => {
    beforeEach(async () => {
      // Create a test survey
      await TestUtils.createTestSurvey(patient.patient.id, {
        appointment_id: testAppointment.id
      });
    });

    it("should get patient's surveys", async () => {
      const response = await request(app)
        .get("/api/surveys/my-surveys")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("appointment_ease_rating");
    });

    it("should not allow doctors to access patient surveys", async () => {
      const response = await request(app)
        .get("/api/surveys/my-surveys")
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("Solo los pacientes");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/surveys/my-surveys")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/surveys", () => {
    beforeEach(async () => {
      // Create test surveys
      await TestUtils.createTestSurvey(patient.patient.id);
      await TestUtils.createTestSurvey(patient.patient.id);
    });

    it("should get all surveys as admin", async () => {
      const response = await request(app)
        .get("/api/surveys")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("patient_name");
    });

    it("should not allow patients to access all surveys", async () => {
      const response = await request(app)
        .get("/api/surveys")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/surveys?limit=1&offset=0")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(1);
    });
  });

  describe("GET /api/surveys/stats", () => {
    beforeEach(async () => {
      // Create test surveys with different ratings
      await TestUtils.createTestSurvey(patient.patient.id, {
        appointment_ease_rating: 5,
        punctuality_rating: 4,
        medical_staff_rating: 5,
        platform_rating: 4,
        would_recommend: "yes"
      });
      
      await TestUtils.createTestSurvey(patient.patient.id, {
        appointment_ease_rating: 3,
        punctuality_rating: 3,
        medical_staff_rating: 4,
        platform_rating: 3,
        would_recommend: "maybe"
      });
    });

    it("should get survey statistics as admin", async () => {
      const response = await request(app)
        .get("/api/surveys/stats")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body).toHaveProperty("totalSurveys");
      expect(response.body).toHaveProperty("averageRatings");
      expect(response.body).toHaveProperty("recommendations");
      expect(response.body.averageRatings).toHaveProperty("appointmentEase");
      expect(response.body.averageRatings).toHaveProperty("punctuality");
      expect(response.body.averageRatings).toHaveProperty("medicalStaff");
      expect(response.body.averageRatings).toHaveProperty("platform");
      expect(response.body.recommendations).toHaveProperty("yes");
      expect(response.body.recommendations).toHaveProperty("no");
      expect(response.body.recommendations).toHaveProperty("maybe");
    });

    it("should not allow non-admins to access stats", async () => {
      const response = await request(app)
        .get("/api/surveys/stats")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/surveys/stats")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});