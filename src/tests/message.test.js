import request from "supertest";
import app from "../app.js";
import { TestUtils } from "./test-utils.js";

describe("Message API", () => {
	let doctorToken;
	let patientToken;
	let doctor;
	let patient;
	let conversationId;
	let messageId;
	beforeAll(async () => {
		// Create test users
		doctor = await TestUtils.createTestDoctor({
			email: TestUtils.getRandomEmail(),
			name: "Test Doctor",
		});
		doctorToken = TestUtils.generateTestToken(doctor.user);

		patient = await TestUtils.createTestPatient({
			email: TestUtils.getRandomEmail(),
			name: "Test Patient",
		});
		patientToken = TestUtils.generateTestToken(patient.user);

		// Create a test conversation for tests that need it
		const conversation = await TestUtils.createTestConversation(
			doctor.user.id,
			patient.user.id
		);
		conversationId = conversation.id;

		// Create a test message for tests that need it
		const message = await TestUtils.createTestMessage(
			conversationId,
			doctor.user.id,
			{
				message_text: "Hello, this is a test message",
			}
		);
		messageId = message.id;
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
			await request(app).get("/api/messages/conversations").expect(401);
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
	});	describe("POST /api/messages/conversations", () => {
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
			await request(app)
				.post("/api/messages/conversations")
				.set("x-auth-token", doctorToken)
				.send({
					otherUserId: doctor.user.id,
				})
				.expect(400);
		});
	});
	describe("POST /api/messages", () => {
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
	});		describe("GET /api/messages/conversations/:conversationId", () => {
			it("should validate conversation ID", async () => {
				await request(app)
					.get("/api/messages/conversations/invalid")
					.set("x-auth-token", doctorToken)
					.expect(400);
			});
		});
		describe("PUT /api/messages/:messageId", () => {
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
		});		describe("PUT /api/messages/:messageId/read", () => {
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

			it("should validate message ID", async () => {
				await request(app)
					.delete("/api/messages/invalid")
					.set("x-auth-token", doctorToken)
					.expect(400);
			});
		});
});
