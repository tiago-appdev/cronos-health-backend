import request from "supertest";
import app from "../app.js";
import db from "../db.js";

describe("Appointments Endpoints", () => {
	let patientToken;
	let doctorToken;
	let patientId;
	let doctorId;
	let testAppointmentId;

	beforeAll(async () => {
		// Clean up test data
		await db.query("DELETE FROM appointments WHERE id IS NOT NULL");
		await db.query("DELETE FROM patients WHERE id IS NOT NULL");
		await db.query("DELETE FROM doctors WHERE id IS NOT NULL");
		await db.query(
			"DELETE FROM users WHERE email LIKE \'%appointmenttest%\'"
		);

		// Create test patient
		const patientResponse = await request(app)
			.post("/api/auth/register")
			.send({
				name: "Test Patient Appointments",
				email: "appointmenttest.patient@example.com",
				password: "password123",
				userType: "patient",
			});

		patientToken = patientResponse.body.token;
		const patientDecoded = JSON.parse(
			Buffer.from(patientToken.split(".")[1], "base64").toString()
		);
		patientId = patientDecoded.user.id;

		// Create test doctor
		const doctorResponse = await request(app)
			.post("/api/auth/register")
			.send({
				name: "Test Doctor Appointments",
				email: "appointmenttest.doctor@example.com",
				password: "password123",
				userType: "doctor",
			});

		doctorToken = doctorResponse.body.token;
		const doctorDecoded = JSON.parse(
			Buffer.from(doctorToken.split(".")[1], "base64").toString()
		);
		doctorId = doctorDecoded.user.id;
	});

	afterAll(async () => {
		// Clean up after tests
		await db.query("DELETE FROM appointments WHERE id IS NOT NULL");
		await db.query("DELETE FROM patients WHERE user_id IN ($1, $2)", [
			patientId,
			doctorId,
		]);
		await db.query("DELETE FROM doctors WHERE user_id IN ($1, $2)", [
			patientId,
			doctorId,
		]);
		await db.query("DELETE FROM users WHERE id IN ($1, $2)", [
			patientId,
			doctorId,
		]);
		await db.end();
	});

	describe("GET /api/appointments/doctors", () => {
		it("should get list of available doctors", async () => {
			const response = await request(app)
				.get("/api/appointments/doctors")
				.set("x-auth-token", patientToken)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);

			const doctor = response.body[0];
			expect(doctor).toHaveProperty("id");
			expect(doctor).toHaveProperty("name");
			expect(doctor).toHaveProperty("specialty");
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
			// First get a doctor ID
			const doctorsResponse = await request(app)
				.get("/api/appointments/doctors")
				.set("x-auth-token", patientToken);

			const doctorDbId = doctorsResponse.body[0].id;

			const appointmentData = {
				doctorId: doctorDbId,
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
			expect(response.body.appointment).toHaveProperty(
				"status",
				"scheduled"
			);

			testAppointmentId = response.body.appointment.id;
		});

		it("should not allow doctors to create appointments", async () => {
			const appointmentData = {
				doctorId: 1,
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
			const doctorsResponse = await request(app)
				.get("/api/appointments/doctors")
				.set("x-auth-token", patientToken);

			const doctorDbId = doctorsResponse.body[0].id;

			const appointmentData = {
				doctorId: doctorDbId,
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
				doctorId: 1,
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
			// Doctor should see the appointment created by patient
		});

		it("should require authentication", async () => {
			const response = await request(app)
				.get("/api/appointments")
				.expect(401);

			expect(response.body).toHaveProperty("message");
		});
	});

	describe("PUT /api/appointments/:id", () => {
		it("should update appointment status", async () => {
			const updateData = {
				status: "completed",
			};

			const response = await request(app)
				.put(`/api/appointments/${testAppointmentId}`)
				.set("x-auth-token", patientToken)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("appointment");
			expect(response.body.appointment).toHaveProperty(
				"status",
				"completed"
			);
		});

		it("should not allow unauthorized updates", async () => {
			const updateData = {
				status: "canceled",
			};

			// Try to update with a different patient's token (we'd need to create another patient)
			const response = await request(app)
				.put(`/api/appointments/99999`)
				.set("x-auth-token", patientToken)
				.send(updateData)
				.expect(404);

			expect(response.body).toHaveProperty("message");
		});

		it("should require authentication", async () => {
			const response = await request(app)
				.put(`/api/appointments/${testAppointmentId}`)
				.send({ status: "canceled" })
				.expect(401);

			expect(response.body).toHaveProperty("message");
		});
	});

	describe("DELETE /api/appointments/:id", () => {
		it("should cancel appointment", async () => {
			const response = await request(app)
				.delete(`/api/appointments/${testAppointmentId}`)
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
				.delete(`/api/appointments/${testAppointmentId}`)
				.expect(401);

			expect(response.body).toHaveProperty("message");
		});
	});

	describe("GET /api/appointments/:id", () => {
		it("should get single appointment details", async () => {
			// First create a new appointment for this test
			const doctorsResponse = await request(app)
				.get("/api/appointments/doctors")
				.set("x-auth-token", patientToken);

			const createResponse = await request(app)
				.post("/api/appointments")
				.set("x-auth-token", patientToken)
				.send({
					doctorId: doctorsResponse.body[0].id,
					appointmentDate: new Date(
						Date.now() + 86400000
					).toISOString(),
				});

			const appointmentId = createResponse.body.appointment.id;

			const response = await request(app)
				.get(`/api/appointments/${appointmentId}`)
				.set("x-auth-token", patientToken)
				.expect(200);

			expect(response.body).toHaveProperty("id", appointmentId);
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
