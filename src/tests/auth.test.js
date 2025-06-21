import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Authentication Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new patient successfully", async () => {
      const userData = {
        name: "Test Patient",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "patient",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("should register a new doctor successfully", async () => {
      const userData = {
        name: "Test Doctor",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "doctor",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("should return error for duplicate email", async () => {
      const userData = {
        name: "Test Patient",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "patient",
      };

      // Register first user
      await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(200);

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("usuario ya existe");
    });

    it("should return error for missing required fields", async () => {
      const userData = {
        name: "Test User",
        // Missing email, password, userType
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty("message");
    });

    it("should return error for invalid user type", async () => {
      const userData = {
        name: "Test User",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "invalid_type",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser({
        email: TestUtils.getRandomEmail(),
        password: "password123"
      });
    });

    it("should login with valid credentials", async () => {
      const loginData = {
        email: testUser.email,
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("should return error for invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Credenciales inválidas");
    });

    it("should return error for invalid password", async () => {
      const loginData = {
        email: testUser.email,
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Credenciales inválidas");
    });

    it("should return error for missing credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({})
        .expect(500);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/auth/user", () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser({
        email: TestUtils.getRandomEmail(),
        name: "Test Patient",
        userType: "patient"
      });
      authToken = TestUtils.generateTestToken(testUser);
    });

    it("should get user data with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .set("x-auth-token", authToken)
        .expect(200);

      expect(response.body).toHaveProperty("id", testUser.id);
      expect(response.body).toHaveProperty("name", testUser.name);
      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("user_type", testUser.user_type);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return error without token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("No token");
    });

    it("should return error with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .set("x-auth-token", "invalid.token.here")
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Token is not valid");
    });
  });
});