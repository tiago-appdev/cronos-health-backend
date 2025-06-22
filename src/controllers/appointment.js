import Appointment from "../models/appointment.js";

// @route   GET /api/appointments
// @desc    Get appointments for current user
// @access  Private
export const getAppointments = async (req, res) => {
	try {
		const { id: userId, userType } = req.user;
		let appointments = [];

		if (userType === "patient") {
			const patientId = await Appointment.getPatientIdByUserId(userId);
			if (!patientId) {
				return res
					.status(404)
					.json({ message: "Perfil de paciente no encontrado" });
			}
			appointments = await Appointment.findByPatientId(patientId);
		} else if (userType === "doctor") {
			const doctorId = await Appointment.getDoctorIdByUserId(userId);
			if (!doctorId) {
				return res
					.status(404)
					.json({ message: "Perfil de médico no encontrado" });
			}
			appointments = await Appointment.findByDoctorId(doctorId);
		}

		// Helper function to calculate age from date of birth
		const calculateAge = (dateOfBirth) => {
			if (!dateOfBirth) return null;
			const today = new Date();
			const birthDate = new Date(dateOfBirth);
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
			return age;
		};

		const formattedAppointments = appointments.map((appointment) => {
			const localDate = new Date(appointment.appointment_date);
			const offset = localDate.getTimezoneOffset();
			localDate.setMinutes(localDate.getMinutes() - offset);

			// Calculate patient age if date_of_birth is available
			const patientAge = calculateAge(appointment.patient_dob);

			return {
				id: appointment.id,
				doctor: appointment.doctor_name,
				specialty: appointment.doctor_specialty || "Medicina General",
				patient: appointment.patient_name,
				patientAge: patientAge,
				date: localDate.toISOString().split("T")[0],
				time: localDate.toISOString().split("T")[1].slice(0, 5),
				status: appointment.status,
				phone: userType === "patient" ? appointment.doctor_phone : appointment.patient_phone,
				fullDate: localDate.toISOString(),
				// IDs for reference
				patientId: appointment.patient_id,
				doctorId: appointment.doctor_id,
				// Additional fields for doctors
				...(userType === "doctor" && {
					patientEmail: appointment.patient_email,
					patientDob: appointment.patient_dob,
				}),
				// Additional fields for patients  
				...(userType === "patient" && {
					doctorEmail: appointment.doctor_email,
				}),
			};
		});

		res.json(formattedAppointments);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Patients only)
export const createAppointment = async (req, res) => {
	try {
		const { id: userId, userType } = req.user;

		if (userType !== "patient") {
			return res
				.status(403)
				.json({ message: "Solo los pacientes pueden agendar citas" });
		}

		const { doctorId, appointmentDate } = req.body;

		// Validate input
		if (!doctorId || !appointmentDate) {
			return res
				.status(400)
				.json({ message: "Doctor y fecha son requeridos" });
		}

		// Get patient ID
		const patientId = await Appointment.getPatientIdByUserId(userId);
		if (!patientId) {
			return res
				.status(404)
				.json({ message: "Perfil de paciente no encontrado" });
		}

		// Check if appointment date is in the future
		const appointmentDateTime = new Date(appointmentDate);
		if (appointmentDateTime <= new Date()) {
			return res
				.status(400)
				.json({ message: "La fecha debe ser futura" });
		}

		// Check if time slot is available
		const isAvailable = await Appointment.isTimeSlotAvailable(
			doctorId,
			appointmentDateTime
		);
		if (!isAvailable) {
			return res
				.status(400)
				.json({ message: "El horario no está disponible" });
		}

		// Create appointment
		const appointment = await Appointment.create({
			patientId,
			doctorId,
			appointmentDate: appointmentDateTime,
			status: "scheduled",
		});

		// Get appointment details
		const appointmentDetails = await Appointment.findById(appointment.id);

		res.status(201).json({
			message: "Cita agendada exitosamente",
			appointment: {
				id: appointmentDetails.id,
				doctor: appointmentDetails.doctor_name,
				specialty: appointmentDetails.doctor_specialty,
				date: appointmentDetails.appointment_date
					.toISOString()
					.split("T")[0],
				time: appointmentDetails.appointment_date
					.toISOString()
					.split("T")[1]
					.slice(0, 5),
				status: appointmentDetails.status,
			},
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};

// @route   PUT /api/appointments/:id
// @desc    Update appointment (reschedule or cancel)
// @access  Private
export const updateAppointment = async (req, res) => {
	try {
		const { id: userId, userType } = req.user;
		const appointmentId = req.params.id;
		const { appointmentDate, status } = req.body;

		// Get appointment details
		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) {
			return res.status(404).json({ message: "Cita no encontrada" });
		}

		// Check authorization
		let userProfileId;
		if (userType === "patient") {
			userProfileId = await Appointment.getPatientIdByUserId(userId);
			if (appointment.patient_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		} else if (userType === "doctor") {
			userProfileId = await Appointment.getDoctorIdByUserId(userId);
			if (appointment.doctor_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		}

		// Validate new appointment date if provided
		if (appointmentDate) {
			const newDateTime = new Date(appointmentDate);
			if (newDateTime <= new Date()) {
				return res
					.status(400)
					.json({ message: "La fecha debe ser futura" });
			}

			// Check if new time slot is available
			const isAvailable = await Appointment.isTimeSlotAvailable(
				appointment.doctor_id,
				newDateTime,
				appointmentId
			);
			if (!isAvailable) {
				return res
					.status(400)
					.json({ message: "El nuevo horario no está disponible" });
			}
		}

		// Update appointment
		const updatedAppointment = await Appointment.update(appointmentId, {
			appointmentDate: appointmentDate
				? new Date(appointmentDate)
				: undefined,
			status,
		});

		// Get updated appointment details
		const appointmentDetails = await Appointment.findById(
			updatedAppointment.id
		);

		res.json({
			message: "Cita actualizada exitosamente",
			appointment: {
				id: appointmentDetails.id,
				doctor: appointmentDetails.doctor_name,
				specialty: appointmentDetails.doctor_specialty,
				date: appointmentDetails.appointment_date
					.toISOString()
					.split("T")[0],
				time: appointmentDetails.appointment_date
					.toISOString()
					.split("T")[1]
					.slice(0, 5),
				status: appointmentDetails.status,
			},
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
export const cancelAppointment = async (req, res) => {
	try {
		const { id: userId, userType } = req.user;
		const appointmentId = req.params.id;

		// Get appointment details
		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) {
			return res.status(404).json({ message: "Cita no encontrada" });
		}

		// Check authorization
		let userProfileId;
		if (userType === "patient") {
			userProfileId = await Appointment.getPatientIdByUserId(userId);
			if (appointment.patient_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		} else if (userType === "doctor") {
			userProfileId = await Appointment.getDoctorIdByUserId(userId);
			if (appointment.doctor_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		}

		// Update status to canceled instead of deleting
		await Appointment.update(appointmentId, { status: "canceled" });

		res.json({ message: "Cita cancelada exitosamente" });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};

// @route   GET /api/appointments/doctors
// @desc    Get all available doctors
// @access  Private
export const getDoctors = async (req, res) => {
	try {
		const doctors = await Appointment.getAllDoctors();

		const formattedDoctors = doctors.map((doctor) => ({
			id: doctor.id,
			name: doctor.name,
			specialty: doctor.specialty || "Medicina General",
			phone: doctor.phone,
			workSchedule: doctor.work_schedule,
		}));

		res.json(formattedDoctors);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};

// @route   GET /api/appointments/:id
// @desc    Get single appointment details
// @access  Private
export const getAppointment = async (req, res) => {
	try {
		const { id: userId, userType } = req.user;
		const appointmentId = req.params.id;

		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) {
			return res.status(404).json({ message: "Cita no encontrada" });
		}

		// Check authorization
		let userProfileId;
		if (userType === "patient") {
			userProfileId = await Appointment.getPatientIdByUserId(userId);
			if (appointment.patient_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		} else if (userType === "doctor") {
			userProfileId = await Appointment.getDoctorIdByUserId(userId);
			if (appointment.doctor_id !== userProfileId) {
				return res.status(403).json({ message: "No autorizado" });
			}
		}

		res.json({
			id: appointment.id,
			doctor: appointment.doctor_name,
			patient: appointment.patient_name,
			specialty: appointment.doctor_specialty,
			date: appointment.appointment_date.toISOString().split("T")[0],
			time: appointment.appointment_date
				.toISOString()
				.split("T")[1]
				.slice(0, 5),
			status: appointment.status,
			doctorEmail: appointment.doctor_email,
			doctorPhone: appointment.doctor_phone,
			patientEmail: appointment.patient_email,
			patientPhone: appointment.patient_phone,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: "Error del servidor" });
	}
};