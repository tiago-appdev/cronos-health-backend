import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Analytics API", () => {
  let patient, doctor, admin, patientToken, doctorToken, adminToken;
  let testAppointment, testMedicalRecord;

  beforeEach(async () => {
    // Create test users
    patient = await TestUtils.createTestPatient({
      email: TestUtils.getRandomEmail(),
      name: "Test Patient Analytics"
    });
    patientToken = TestUtils.generateTestToken(patient.user);

    doctor = await TestUtils.createTestDoctor({
      email: TestUtils.getRandomEmail(),
      name: "Test Doctor Analytics",
      profileData: { specialty: "Cardiology" }
    });
    doctorToken = TestUtils.generateTestToken(doctor.user);

    admin = await TestUtils.createTestAdmin({
      email: TestUtils.getRandomEmail(),
      name: "Test Admin Analytics"
    });
    adminToken = TestUtils.generateTestToken(admin);

    // Create test data for analytics
    testAppointment = await TestUtils.createTestAppointment(
      patient.patient.id,
      doctor.doctor.id,
      { status: "completed" }
    );

    testMedicalRecord = await TestUtils.createTestMedicalRecord(
      patient.patient.id,
      doctor.doctor.id
    );

    await TestUtils.createTestSurvey(patient.patient.id, {
      appointment_id: testAppointment.id
    });
  });

  describe("GET /api/analytics/stats", () => {
    it("should get system statistics as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/stats")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body).toHaveProperty("totalPatients");
      expect(response.body).toHaveProperty("totalDoctors");
      expect(response.body).toHaveProperty("monthlyAppointments");
      expect(response.body).toHaveProperty("attendanceRate");
      expect(response.body).toHaveProperty("upcomingAppointments");
      expect(response.body).toHaveProperty("totalSurveys");

      expect(typeof response.body.totalPatients).toBe("number");
      expect(typeof response.body.totalDoctors).toBe("number");
      expect(typeof response.body.monthlyAppointments).toBe("number");
      expect(typeof response.body.attendanceRate).toBe("number");
      expect(typeof response.body.upcomingAppointments).toBe("number");
      expect(typeof response.body.totalSurveys).toBe("number");
    });

    it("should not allow non-admins to access stats", async () => {
      const response = await request(app)
        .get("/api/analytics/stats")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/analytics/stats")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/analytics/recent-activity", () => {
    it("should get recent activity as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/recent-activity")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const activity = response.body[0];
        expect(activity).toHaveProperty("type");
        expect(activity).toHaveProperty("title");
        expect(activity).toHaveProperty("description");
        expect(activity).toHaveProperty("timestamp");
        expect(activity).toHaveProperty("timeAgo");
      }
    });

    it("should support limit parameter", async () => {
      const response = await request(app)
        .get("/api/analytics/recent-activity?limit=5")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it("should not allow non-admins to access recent activity", async () => {
      const response = await request(app)
        .get("/api/analytics/recent-activity")
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("GET /api/analytics/appointment-distribution", () => {
    it("should get appointment distribution by specialty as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/appointment-distribution")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const distribution = response.body[0];
        expect(distribution).toHaveProperty("specialty");
        expect(distribution).toHaveProperty("count");
        expect(distribution).toHaveProperty("percentage");
        expect(typeof distribution.count).toBe("number");
        expect(typeof distribution.percentage).toBe("number");
      }
    });

    it("should not allow non-admins to access distribution", async () => {
      const response = await request(app)
        .get("/api/analytics/appointment-distribution")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("GET /api/analytics/monthly-trends", () => {
    it("should get monthly trends as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/monthly-trends")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const trend = response.body[0];
        expect(trend).toHaveProperty("month");
        expect(trend).toHaveProperty("monthName");
        expect(trend).toHaveProperty("total");
        expect(trend).toHaveProperty("completed");
        expect(trend).toHaveProperty("canceled");
        expect(typeof trend.total).toBe("number");
        expect(typeof trend.completed).toBe("number");
        expect(typeof trend.canceled).toBe("number");
      }
    });

    it("should support months parameter", async () => {
      const response = await request(app)
        .get("/api/analytics/monthly-trends?months=3")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should not allow non-admins to access trends", async () => {
      const response = await request(app)
        .get("/api/analytics/monthly-trends")
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("GET /api/analytics/doctor-metrics", () => {
    it("should get doctor metrics as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/doctor-metrics")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const metric = response.body[0];
        expect(metric).toHaveProperty("doctorName");
        expect(metric).toHaveProperty("specialty");
        expect(metric).toHaveProperty("totalAppointments");
        expect(metric).toHaveProperty("completedAppointments");
        expect(metric).toHaveProperty("completionRate");
        expect(metric).toHaveProperty("averageRating");
        expect(typeof metric.totalAppointments).toBe("number");
        expect(typeof metric.completedAppointments).toBe("number");
        expect(typeof metric.completionRate).toBe("number");
        expect(typeof metric.averageRating).toBe("string");
      }
    });

    it("should not allow non-admins to access doctor metrics", async () => {
      const response = await request(app)
        .get("/api/analytics/doctor-metrics")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("GET /api/analytics/patient-metrics", () => {
    it("should get patient metrics as admin", async () => {
      const response = await request(app)
        .get("/api/analytics/patient-metrics")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body).toHaveProperty("totalActivePatients");
      expect(response.body).toHaveProperty("patientsWithAppointments");
      expect(response.body).toHaveProperty("patientsWithSurveys");
      expect(response.body).toHaveProperty("surveyResponseRate");

      expect(typeof response.body.totalActivePatients).toBe("number");
      expect(typeof response.body.patientsWithAppointments).toBe("number");
      expect(typeof response.body.patientsWithSurveys).toBe("number");
      expect(typeof response.body.surveyResponseRate).toBe("number");
    });

    it("should not allow non-admins to access patient metrics", async () => {
      const response = await request(app)
        .get("/api/analytics/patient-metrics")
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/analytics/patient-metrics")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});