import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Admin API", () => {
  let admin, patient, doctor, adminToken, patientToken, doctorToken;

  beforeEach(async () => {
    // Create test users
    admin = await TestUtils.createTestAdmin({
      email: TestUtils.getRandomEmail(),
      name: "Test Admin"
    });
    adminToken = TestUtils.generateTestToken(admin);

    patient = await TestUtils.createTestPatient({
      email: TestUtils.getRandomEmail(),
      name: "Test Patient Admin"
    });
    patientToken = TestUtils.generateTestToken(patient.user);

    doctor = await TestUtils.createTestDoctor({
      email: TestUtils.getRandomEmail(),
      name: "Test Doctor Admin"
    });
    doctorToken = TestUtils.generateTestToken(doctor.user);
  });

  describe("POST /api/admin/users", () => {
    it("should create a new patient as admin", async () => {
      const userData = {
        name: "New Patient",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "patient",
        dateOfBirth: "1990-01-01",
        phone: "123456789",
        address: "Test Address"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name", userData.name);
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).toHaveProperty("user_type", userData.userType);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should create a new doctor as admin", async () => {
      const userData = {
        name: "New Doctor",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "doctor",
        specialty: "Cardiology",
        licenseNumber: "DOC123",
        phone: "123456789"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("user_type", "doctor");
    });

    it("should create a new admin as admin", async () => {
      const userData = {
        name: "New Admin",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "admin"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(201);

      expect(response.body.user).toHaveProperty("user_type", "admin");
    });

    it("should not allow duplicate emails", async () => {
      const userData = {
        name: "Duplicate User",
        email: patient.user.email, // Use existing email
        password: "password123",
        userType: "patient"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("usuario ya existe");
    });

    it("should validate required fields", async () => {
      const userData = {
        name: "Incomplete User",
        // Missing email, password, userType
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("requeridos");
    });

    it("should validate userType", async () => {
      const userData = {
        name: "Invalid User",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "invalid"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", adminToken)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain("inválido");
    });

    it("should not allow non-admins to create users", async () => {
      const userData = {
        name: "Unauthorized User",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "patient"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .set("x-auth-token", patientToken)
        .send(userData)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const userData = {
        name: "Unauthenticated User",
        email: TestUtils.getRandomEmail(),
        password: "password123",
        userType: "patient"
      };

      const response = await request(app)
        .post("/api/admin/users")
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/admin/users", () => {
    it("should get all users as admin", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const user = response.body[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("user_type");
      expect(user).toHaveProperty("created_at");
    });

    it("should not allow non-admins to get all users", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("x-auth-token", patientToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/admin/users/:id", () => {
    it("should get specific user by id as admin", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body).toHaveProperty("id", patient.user.id);
      expect(response.body).toHaveProperty("name", patient.user.name);
      expect(response.body).toHaveProperty("email", patient.user.email);
      expect(response.body).toHaveProperty("profile");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/admin/users/99999")
        .set("x-auth-token", adminToken)
        .expect(404);

      expect(response.body.message).toContain("no encontrado");
    });

    it("should not allow non-admins to get user details", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    it("should update user as admin", async () => {
      const updateData = {
        userData: {
          name: "Updated Patient Name",
          email: patient.user.email // Keep same email
        }
      };

      const response = await request(app)
        .put(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", adminToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("name", "Updated Patient Name");
    });

    it("should update user with new password", async () => {
      const updateData = {
        userData: {
          name: patient.user.name,
          email: patient.user.email,
          password: "newpassword123"
        }
      };

      const response = await request(app)
        .put(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", adminToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 404 for non-existent user", async () => {
      const updateData = {
        userData: {
          name: "Non-existent User"
        }
      };

      const response = await request(app)
        .put("/api/admin/users/99999")
        .set("x-auth-token", adminToken)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("no encontrado");
    });

    it("should not allow non-admins to update users", async () => {
      const updateData = {
        userData: {
          name: "Unauthorized Update"
        }
      };

      const response = await request(app)
        .put(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", patientToken)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("should delete user as admin", async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", adminToken)
        .expect(200);

      expect(response.body.message).toContain("eliminado exitosamente");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .delete("/api/admin/users/99999")
        .set("x-auth-token", adminToken)
        .expect(404);

      expect(response.body.message).toContain("no encontrado");
    });

    it("should not allow non-admins to delete users", async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${patient.user.id}`)
        .set("x-auth-token", doctorToken)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${patient.user.id}`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/admin/users/:id/patient-profile", () => {
    let userWithoutProfile;

    beforeEach(async () => {
      userWithoutProfile = await TestUtils.createTestUser({
        email: TestUtils.getRandomEmail(),
        userType: "patient"
      });
    });

    it("should create patient profile as admin", async () => {
      const profileData = {
        date_of_birth: "1990-01-01",
        phone: "123456789",
        address: "Test Address",
        emergency_contact: "Emergency Contact",
        emergency_phone: "987654321"
      };

      const response = await request(app)
        .post(`/api/admin/users/${userWithoutProfile.id}/patient-profile`)
        .set("x-auth-token", adminToken)
        .send(profileData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id", userWithoutProfile.id);
      expect(response.body).toHaveProperty("phone", profileData.phone);
    });

    it("should not allow non-admins to create profiles", async () => {
      const profileData = {
        date_of_birth: "1990-01-01",
        phone: "123456789"
      };

      const response = await request(app)
        .post(`/api/admin/users/${userWithoutProfile.id}/patient-profile`)
        .set("x-auth-token", patientToken)
        .send(profileData)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });

  describe("POST /api/admin/users/:id/doctor-profile", () => {
    let userWithoutProfile;

    beforeEach(async () => {
      userWithoutProfile = await TestUtils.createTestUser({
        email: TestUtils.getRandomEmail(),
        userType: "doctor"
      });
    });

    it("should create doctor profile as admin", async () => {
      const profileData = {
        specialty: "Cardiology",
        license_number: "DOC123",
        phone: "123456789",
        work_schedule: "9:00-17:00"
      };

      const response = await request(app)
        .post(`/api/admin/users/${userWithoutProfile.id}/doctor-profile`)
        .set("x-auth-token", adminToken)
        .send(profileData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id", userWithoutProfile.id);
      expect(response.body).toHaveProperty("specialty", profileData.specialty);
      expect(response.body).toHaveProperty("license_number", profileData.license_number);
    });

    it("should not allow non-admins to create doctor profiles", async () => {
      const profileData = {
        specialty: "Cardiology",
        license_number: "DOC123"
      };

      const response = await request(app)
        .post(`/api/admin/users/${userWithoutProfile.id}/doctor-profile`)
        .set("x-auth-token", doctorToken)
        .send(profileData)
        .expect(403);

      expect(response.body.message).toContain("administrador");
    });
  });
});