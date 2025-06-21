import request from "supertest";
import app from "../app.js";

describe("Message API", () => {
  let doctorToken;
  let patientToken;
  let conversationId;
  let messageId;

  beforeAll(async () => {
    // Login as doctor to get token
    const doctorLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "dr.smith@hospital.com",
        password: "password123",
      });
    
    doctorToken = doctorLogin.body.token;

    // Login as patient to get token
    const patientLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "john.doe@email.com",
        password: "password123",
      });
    
    patientToken = patientLogin.body.token;
  });

  describe("GET /api/messages/conversations", () => {
    it("should get user conversations", async () => {
      const response = await request(app)
        .get("/api/messages/conversations")
        .set("x-auth-token", doctorToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should deny access without token", async () => {
      await request(app)
        .get("/api/messages/conversations")
        .expect(401);
    });
  });

  describe("GET /api/messages/users/related", () => {
    it("should get related users for doctor", async () => {
      const response = await request(app)
        .get("/api/messages/users/related")
        .set("x-auth-token", doctorToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should get related users for patient", async () => {
      const response = await request(app)
        .get("/api/messages/users/related")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/messages/users/search", () => {
    it("should search for users", async () => {
      const response = await request(app)
        .get("/api/messages/users/search")
        .query({ q: "john" })
        .set("x-auth-token", doctorToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should validate search query", async () => {
      await request(app)
        .get("/api/messages/users/search")
        .query({ q: "a" }) // Too short
        .set("x-auth-token", doctorToken)
        .expect(400);
    });

    it("should require search query", async () => {
      await request(app)
        .get("/api/messages/users/search")
        .set("x-auth-token", doctorToken)
        .expect(400);
    });
  });

  describe("POST /api/messages/conversations", () => {
    it("should create or get conversation", async () => {
      // Get patient user ID first
      const patientResponse = await request(app)
        .get("/api/auth/user")
        .set("x-auth-token", patientToken);

      const patientUserId = patientResponse.body.id;

      const response = await request(app)
        .post("/api/messages/conversations")
        .set("x-auth-token", doctorToken)
        .send({
          otherUserId: patientUserId,
        })
        .expect(201);

      expect(response.body.conversation).toHaveProperty("id");
      conversationId = response.body.conversation.id;
    });

    it("should validate other user ID", async () => {
      await request(app)
        .post("/api/messages/conversations")
        .set("x-auth-token", doctorToken)
        .send({
          otherUserId: "invalid",
        })
        .expect(400);
    });

    it("should prevent self-conversation", async () => {
      // Get current user ID
      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("x-auth-token", doctorToken);

      await request(app)
        .post("/api/messages/conversations")
        .set("x-auth-token", doctorToken)
        .send({
          otherUserId: userResponse.body.id,
        })
        .expect(400);
    });
  });

  describe("POST /api/messages", () => {
    it("should send a message", async () => {
      const messageData = {
        conversationId: conversationId,
        text: "Hello, this is a test message",
        messageType: "text",
      };

      const response = await request(app)
        .post("/api/messages")
        .set("x-auth-token", doctorToken)
        .send(messageData)
        .expect(201);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.text).toBe("Hello, this is a test message");
      messageId = response.body.data.id;
    });

    it("should validate required fields", async () => {
      const invalidData = {
        conversationId: conversationId,
        // Missing text
      };

      await request(app)
        .post("/api/messages")
        .set("x-auth-token", doctorToken)
        .send(invalidData)
        .expect(400);
    });

    it("should validate message length", async () => {
      const longMessage = "a".repeat(2001); // Exceeds limit

      await request(app)
        .post("/api/messages")
        .set("x-auth-token", doctorToken)
        .send({
          conversationId: conversationId,
          text: longMessage,
        })
        .expect(400);
    });

    it("should not allow empty messages", async () => {
      await request(app)
        .post("/api/messages")
        .set("x-auth-token", doctorToken)
        .send({
          conversationId: conversationId,
          text: "   ", // Only whitespace
        })
        .expect(400);
    });
  });

  describe("GET /api/messages/conversations/:conversationId", () => {
    it("should get conversation messages", async () => {
      const response = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set("x-auth-token", doctorToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should allow patient to access their conversation", async () => {
      const response = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should validate conversation ID", async () => {
      await request(app)
        .get("/api/messages/conversations/invalid")
        .set("x-auth-token", doctorToken)
        .expect(400);
    });
  });

  describe("PUT /api/messages/:messageId", () => {
    it("should edit own message", async () => {
      const updatedText = "This is an edited message";

      const response = await request(app)
        .put(`/api/messages/${messageId}`)
        .set("x-auth-token", doctorToken)
        .send({
          text: updatedText,
        })
        .expect(200);

      expect(response.body.data.text).toBe(updatedText);
      expect(response.body.data.isEdited).toBe(true);
    });

    it("should not allow editing others messages", async () => {
      await request(app)
        .put(`/api/messages/${messageId}`)
        .set("x-auth-token", patientToken)
        .send({
          text: "Trying to edit someone else's message",
        })
        .expect(403);
    });

    it("should validate edit data", async () => {
      await request(app)
        .put(`/api/messages/${messageId}`)
        .set("x-auth-token", doctorToken)
        .send({
          text: "", // Empty text
        })
        .expect(400);
    });
  });

  describe("GET /api/messages/unread-count", () => {
    it("should get unread message count", async () => {
      const response = await request(app)
        .get("/api/messages/unread-count")
        .set("x-auth-token", patientToken)
        .expect(200);

      expect(response.body).toHaveProperty("unreadCount");
      expect(typeof response.body.unreadCount).toBe("number");
    });
  });

  describe("PUT /api/messages/:messageId/read", () => {
    it("should mark message as read", async () => {
      await request(app)
        .put(`/api/messages/${messageId}/read`)
        .set("x-auth-token", patientToken)
        .send({
          conversationId: conversationId,
        })
        .expect(200);
    });

    it("should validate message ID", async () => {
      await request(app)
        .put("/api/messages/invalid/read")
        .set("x-auth-token", patientToken)
        .send({
          conversationId: conversationId,
        })
        .expect(400);
    });
  });

  describe("DELETE /api/messages/:messageId", () => {
    it("should not allow deleting others messages", async () => {
      await request(app)
        .delete(`/api/messages/${messageId}`)
        .set("x-auth-token", patientToken)
        .expect(403);
    });

    it("should delete own message", async () => {
      await request(app)
        .delete(`/api/messages/${messageId}`)
        .set("x-auth-token", doctorToken)
        .expect(200);
    });

    it("should validate message ID", async () => {
      await request(app)
        .delete("/api/messages/invalid")
        .set("x-auth-token", doctorToken)
        .expect(400);
    });
  });
});