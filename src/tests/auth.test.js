import request from "supertest";
import app from "../app.js";
import db from "../db.js";

describe("Authentication Endpoints", () => {
	let testUserId;
	let authToken;

	beforeAll(async () => {
		// Clean up test database before running tests
		await db.query("DELETE FROM appointments WHERE id IS NOT NULL");
		await db.query("DELETE FROM patients WHERE id IS NOT NULL");
		await db.query("DELETE FROM doctors WHERE id IS NOT NULL");
		await db.query("DELETE FROM users WHERE email LIKE \'%test%\'");
	});

	afterAll(async () => {
		// Clean up after tests
		if (testUserId) {
			await db.query("DELETE FROM users WHERE id = $1", [testUserId]);
		}
		await db.end();
	});

	describe("POST /api/auth/register", () => {
		it("should register a new patient successfully", async () => {
			const userData = {
				name: "Test Patient",
				email: "testpatient@example.com",
				password: "password123",
				userType: "patient",
			};

			const response = await request(app)
				.post("/api/auth/register")
				.send(userData)
				.expect(200);

			expect(response.body).toHaveProperty("token");
			expect(typeof response.body.token).toBe("string");

			// Store for cleanup
			const decoded = JSON.parse(
				Buffer.from(
					response.body.token.split(".")[1],
					"base64"
				).toString()
			);
			testUserId = decoded.user.id;
		});

		it("should register a new doctor successfully", async () => {
			const userData = {
				name: "Test Doctor",
				email: "testdoctor@example.com",
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
				name: "Another Test Patient",
				email: "testpatient@example.com", // Same email as first test
				password: "password123",
				userType: "patient",
			};

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
				.expect(500); // Should be validation error

			expect(response.body).toHaveProperty("message");
		});

		it("should return error for invalid user type", async () => {
			const userData = {
				name: "Test User",
				email: "invalid@example.com",
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
		it("should login with valid credentials", async () => {
			const loginData = {
				email: "testpatient@example.com",
				password: "password123",
			};

			const response = await request(app)
				.post("/api/auth/login")
				.send(loginData)
				.expect(200);

			expect(response.body).toHaveProperty("token");
			expect(typeof response.body.token).toBe("string");

			// Store token for subsequent tests
			authToken = response.body.token;
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
				email: "testpatient@example.com",
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
		it("should get user data with valid token", async () => {
			const response = await request(app)
				.get("/api/auth/user")
				.set("x-auth-token", authToken)
				.expect(200);

			expect(response.body).toHaveProperty("id");
			expect(response.body).toHaveProperty("name", "Test Patient");
			expect(response.body).toHaveProperty(
				"email",
				"testpatient@example.com"
			);
			expect(response.body).toHaveProperty("user_type", "patient");
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
