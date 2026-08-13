const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate } = req.body;

        if (!mongoose.isValidObjectId(vehicleId)) {
            return res.status(400).json({ message: "Invalid vehicle id" });
        }

        const vehicle = await Vehicle.findById(vehicleId);

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        if (vehicle.owner.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: "You cannot rent your own vehicle." });
        }

        if (vehicle.status !== "Available") {
            return res.status(400).json({ message: "Vehicle is not available" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid start or end date" });
        }

        if (end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        const totalHours = Math.ceil((end - start) / 3600000);

        if (totalHours <= 0) {
            return res.status(400).json({ message: "Rental duration must be at least 1 hour" });
        }

        const totalAmount = totalHours * vehicle.chargesPerHour;

        const booking = await Booking.create({
            vehicle: vehicle._id,
            renter: req.user.id,
            owner: vehicle.owner,
            startDate: start,
            endDate: end,
            totalHours,
            totalAmount
        });

        res.status(201).json({ message: "Booking request sent", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/my", auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ renter: req.user.id })
            .populate("vehicle")
            .populate("owner", "name phone");

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get(["/requests", "/owner"], auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ owner: req.user.id })
            .populate("vehicle")
            .populate("renter", "name phone email");

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch("/:id/status", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findOne({ _id: req.params.id, owner: req.user.id });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const { status } = req.body;

        if (!["Accepted", "Rejected", "Completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        if (status === "Accepted" && booking.status !== "Pending") {
            return res.status(400).json({ message: "Only pending bookings can be accepted" });
        }

        if (status === "Rejected" && booking.status === "Completed") {
            return res.status(400).json({ message: "Completed bookings cannot be rejected" });
        }

        if (status === "Completed" && booking.status !== "Accepted") {
            return res.status(400).json({ message: "Only accepted bookings can be completed" });
        }

        booking.status = status;
        await booking.save();

        if (status === "Accepted") {
            await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "Rented" });
        }

        if (status === "Rejected" || status === "Completed") {
            await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "Available" });
        }

        res.json({ message: `Booking ${status}`, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;