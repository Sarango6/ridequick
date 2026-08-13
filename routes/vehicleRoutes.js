const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const auth = require("../middleware/auth");

const router = express.Router();

function getRequesterId(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        return decoded.id;
    } catch (error) {
        return null;
    }
}

router.get("/", async (req, res) => {
    try {
        const requesterId = getRequesterId(req);
        const filter = { status: "Available" };

        if (requesterId) {
            filter.owner = { $ne: requesterId };
        }

        const vehicles = await Vehicle.find(filter).populate("owner", "name phone");
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/my", auth, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid vehicle id" });
        }

        const vehicle = await Vehicle.findById(req.params.id).populate("owner", "name phone");

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/", auth, async (req, res) => {
    try {
        const allowedTypes = ["Bike", "Car", "Scooty", "EV"];
        const vehicleType = String(req.body.vehicleType || "").trim();
        const brand = String(req.body.brand || "").trim();
        const model = String(req.body.model || "").trim();
        const vehicleNumber = String(req.body.vehicleNumber || "").trim();
        const imageUrl = String(req.body.imageUrl || "").trim();
        const description = String(req.body.description || "").trim();
        const chargesPerHour = Number(req.body.chargesPerHour);

        if (!allowedTypes.includes(vehicleType)) {
            return res.status(400).json({ message: "Invalid vehicle type" });
        }

        if (!brand || !model || !vehicleNumber || !Number.isFinite(chargesPerHour) || chargesPerHour <= 0) {
            return res.status(400).json({ message: "All vehicle fields are required." });
        }

        if (!imageUrl) {
            return res.status(400).json({ message: "Image URL is required." });
        }

        const vehicle = await Vehicle.create({
            owner: req.user.id,
            vehicleType,
            brand,
            model,
            vehicleNumber,
            chargesPerHour,
            imageUrl,
            description
        });

        res.status(201).json({ message: "Vehicle added successfully", vehicle });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Vehicle number already exists" });
        }

        res.status(500).json({ message: error.message });
    }
});

router.patch("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid vehicle id" });
        }

        const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.id });

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const updates = {};

        if (req.body.vehicleType !== undefined) updates.vehicleType = String(req.body.vehicleType || "").trim();
        if (req.body.brand !== undefined) updates.brand = String(req.body.brand || "").trim();
        if (req.body.model !== undefined) updates.model = String(req.body.model || "").trim();
        if (req.body.vehicleNumber !== undefined) updates.vehicleNumber = String(req.body.vehicleNumber || "").trim();
        if (req.body.chargesPerHour !== undefined) updates.chargesPerHour = Number(req.body.chargesPerHour);
        if (req.body.imageUrl !== undefined) updates.imageUrl = String(req.body.imageUrl || "").trim();
        if (req.body.description !== undefined) updates.description = String(req.body.description || "").trim();

        await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

        res.json({ message: "Vehicle updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid vehicle id" });
        }

        const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user.id });

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        await vehicle.deleteOne();

        res.json({ message: "Vehicle deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;