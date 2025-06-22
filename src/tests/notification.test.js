import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Notification API", () => {
  let patient, doctor, admin, patientToken, doctorToken, adminToken;
  let testNotification;

  beforeEach(async () => {
    // Create test users
    patient = await TestUtils.createTestPatient({
      email: TestUtils.getRandomEmail(),
      name: "Test Patient Notifications"
    });
    patientToken = TestUtils.generateTestToken(patient.user);

    doctor = await TestUtils.createTestDoctor({
      email: TestUtils.getRandomEmail(),
      name: "Test Doctor Notifications"
    });
    doctorToken = TestUtils.generateTestToken(doctor.user);

    admin = await TestUtils.createTestAdmin({
      email: TestUtils.getRandomEmail(),
      name: "Test Admin Notifications"
    });
    adminToken = TestUtils.generateTestToken(admin);

    // Create a test notification
    testNotification = await TestUtils.createTestNotification(patient.user.id, {
      type: "survey_reminder",
      title: "Complete your survey",
      message: "Please complete the survey for your recent appointment",
      data: { appointment_id: 123 }
    });
  });

  describe("GET /api/notifications", () => {
    it("should get notifications for current user", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const notification = response.body[0];
      expect(notification).toHaveProperty("id");
      expect(notification).toHaveProperty("type");
      expect(notification).toHaveProperty("title");
      expect(notification).toHaveProperty("message");
      expect(notification).toHaveProperty("isRead");
      expect(notification).toHaveProperty("priority");
      expect(notification).toHaveProperty("timeAgo");
    });

    it("should support pagination", async () => {
      // Create more notifications
      await TestUtils.createTestNotification(patient.user.id);
      await TestUtils.createTestNotification(patient.user.id);

      const response = await request(app)
        .get("/api/notifications?limit=1&offset=0")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it("should filter out read notifications by default", async () => {
      // Mark notification as read
      await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set("x-auth-token", patientToken);

      const response = await request(app)
        .get("/api/notifications")
        .set("x-auth-token", patientToken)
        .expect(200);

      const hasReadNotification = response.body.some(
        n => n.id === testNotification.id && n.isRead === true
      );
      expect(hasReadNotification).toBe(false);
    });

    it("should include read notifications when requested", async () => {
      // Mark notification as read
      await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set("x-auth-token", patientToken);

      const response = await request(app)
        .get("/api/notifications?include_read=true")
        .set("x-auth-token", patientToken)
        .expect(200);

      const hasReadNotification = response.body.some(
        n => n.id === testNotification.id
      );
      expect(hasReadNotification).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should get unread notification count", async () => {
      const response = await request(app)
        .get("/api/notifications/unread-count")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("unreadCount");
      expect(typeof response.body.unreadCount).toBe("number");
      expect(response.body.unreadCount).toBeGreaterThan(0);
    });

    it("should decrease count when notification is marked as read", async () => {
      // Get initial count
      const initialResponse = await request(app)
        .get("/api/notifications/unread-count")
        .set("x-auth-token", patientToken);

      const initialCount = initialResponse.body.unreadCount;

      // Mark notification as read
      await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set("x-auth-token", patientToken);

      // Get updated count
      const updatedResponse = await request(app)
        .get("/api/notifications/unread-count")
        .set("x-auth-token", patientToken);

      expect(updatedResponse.body.unreadCount).toBe(initialCount - 1);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/notifications/unread-count")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.notification).toHaveProperty("isRead", true);
    });

    it("should not allow marking other users' notifications", async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set("x-auth-token", doctorToken)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate notification ID", async () => {
      const response = await request(app)
        .put("/api/notifications/invalid/read")
        .set("x-auth-token", patientToken)
        .expect(400);

      expect(response.body.message).toContain("inválido");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/notifications/mark-all-read", () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await TestUtils.createTestNotification(patient.user.id);
      await TestUtils.createTestNotification(patient.user.id);
    });

    it("should mark all notifications as read", async () => {
      const response = await request(app)
        .put("/api/notifications/mark-all-read")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("message");

      // Verify all notifications are read
      const countResponse = await request(app)
        .get("/api/notifications/unread-count")
        .set("x-auth-token", patientToken);

      expect(countResponse.body.unreadCount).toBe(0);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put("/api/notifications/mark-all-read")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("should delete notification", async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("message");

      // Verify notification is deleted
      const notificationsResponse = await request(app)
        .get("/api/notifications?include_read=true")
        .set("x-auth-token", patientToken);

      const hasDeletedNotification = notificationsResponse.body.some(
        n => n.id === testNotification.id
      );
      expect(hasDeletedNotification).toBe(false);
    });

    it("should not allow deleting other users' notifications", async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .set("x-auth-token", doctorToken)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should validate notification ID", async () => {
      const response = await request(app)
        .delete("/api/notifications/invalid")
        .set("x-auth-token", patientToken)
        .expect(400);

      expect(response.body.message).toContain("inválido");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification.id}`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/notifications/survey-reminders", () => {
    beforeEach(async () => {
      // Create a survey reminder notification
      await TestUtils.createTestNotification(patient.user.id, {
        type: "survey_reminder",
        title: "Survey Reminder",
        message: "Please complete your survey",
        data: {
          appointment_id: 123,
          doctor_name: "Dr. Test",
          appointment_date: "2025-01-15",
          action_url: "/survey?appointmentId=123"
        }
      });
    });

    it("should get survey reminder notifications", async () => {
      const response = await request(app)
        .get("/api/notifications/survey-reminders")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const reminder = response.body[0];
      expect(reminder).toHaveProperty("appointmentId");
      expect(reminder).toHaveProperty("doctorName");
      expect(reminder).toHaveProperty("appointmentDate");
      expect(reminder).toHaveProperty("actionUrl");
      expect(reminder).toHaveProperty("timeAgo");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/notifications/survey-reminders")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/notifications/preferences", () => {
    it("should get notification preferences", async () => {
      const response = await request(app)
        .get("/api/notifications/preferences")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("surveyReminders");
      expect(response.body).toHaveProperty("appointmentReminders");
      expect(response.body).toHaveProperty("systemNotifications");
      expect(response.body).toHaveProperty("emailNotifications");
      expect(response.body).toHaveProperty("smsNotifications");

      expect(typeof response.body.surveyReminders).toBe("boolean");
      expect(typeof response.body.appointmentReminders).toBe("boolean");
      expect(typeof response.body.systemNotifications).toBe("boolean");
    });

    it("should create default preferences if none exist", async () => {
      const response = await request(app)
        .get("/api/notifications/preferences")
        .set("x-auth-token", patientToken)
        .expect(200);

      // Default values should be true for basic notifications
      expect(response.body.surveyReminders).toBe(true);
      expect(response.body.appointmentReminders).toBe(true);
      expect(response.body.systemNotifications).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/notifications/preferences")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/notifications/preferences", () => {
    it("should update notification preferences", async () => {
      const preferences = {
        surveyReminders: false,
        appointmentReminders: true,
        systemNotifications: true,
        emailNotifications: true,
        smsNotifications: false
      };

      const response = await request(app)
        .put("/api/notifications/preferences")
        .set("x-auth-token", patientToken)
        .send(preferences)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.preferences).toHaveProperty("surveyReminders", false);
      expect(response.body.preferences).toHaveProperty("appointmentReminders", true);
      expect(response.body.preferences).toHaveProperty("emailNotifications", true);
    });

    it("should update partial preferences", async () => {
      // First set some preferences
      await request(app)
        .put("/api/notifications/preferences")
        .set("x-auth-token", patientToken)
        .send({ surveyReminders: false });

      // Update only one preference
      const response = await request(app)
        .put("/api/notifications/preferences")
        .set("x-auth-token", patientToken)
        .send({ emailNotifications: true })
        .expect(200);

      expect(response.body.preferences).toHaveProperty("emailNotifications", true);
      // Should preserve previous setting
      expect(response.body.preferences).toHaveProperty("surveyReminders", false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put("/api/notifications/preferences")
        .send({ surveyReminders: false })
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/notifications (Admin only)", () => {
    it("should create notification as admin", async () => {
      const notificationData = {
        userId: patient.user.id,
        type: "system",
        title: "System Notification",
        message: "This is a system notification",
        data: { test: "data" },
        priority: "high"
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("x-auth-token", adminToken)
        .send(notificationData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body.notification).toHaveProperty("id");
      expect(response.body.notification).toHaveProperty("type", "system");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        type: "system"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("x-auth-token", adminToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain("requeridos");
    });

    it("should not allow non-admins to create notifications", async () => {
      const notificationData = {
        userId: patient.user.id,
        type: "system",
        title: "Test",
        message: "Test"
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("x-auth-token", patientToken)
        .send(notificationData)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/notifications")
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/notifications/stats (Admin only)", () => {
    beforeEach(async () => {
      // Create various types of notifications
      await TestUtils.createTestNotification(patient.user.id, { type: "survey_reminder" });
      await TestUtils.createTestNotification(patient.user.id, { type: "appointment_reminder" });
      await TestUtils.createTestNotification(doctor.user.id, { type: "system" });
    });

    it("should get notification statistics as admin", async () => {
      const response = await request(app)
        .get("/api/notifications/stats")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body).toHaveProperty("totalNotifications");
      expect(response.body).toHaveProperty("unreadNotifications");
      expect(response.body).toHaveProperty("surveyReminders");
      expect(response.body).toHaveProperty("appointmentReminders");
      expect(response.body).toHaveProperty("notifications24h");
      expect(response.body).toHaveProperty("notifications7d");

      expect(typeof response.body.totalNotifications).toBe("number");
      expect(typeof response.body.unreadNotifications).toBe("number");
    });

    it("should not allow non-admins to access stats", async () => {
      const response = await request(app)
        .get("/api/notifications/stats")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/notifications/stats")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});