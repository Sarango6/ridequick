const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        console.log("REGISTER BODY:", {
            ...req.body,
            password: req.body.password ? "[hidden]" : undefined
        });

        const {
            name,
            email,
            phone,
            licenseNumber,
            password,
            termsAccepted
        } = req.body;

        const normalizedName = String(name || "").trim();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPhone = String(phone || "").trim();
        const normalizedLicenseNumber = String(licenseNumber || "").trim();

        if (
            !normalizedName ||
            !normalizedEmail ||
            !normalizedPhone ||
            !normalizedLicenseNumber ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!termsAccepted) {
            return res.status(400).json({
                message: "You must accept the Terms & Conditions"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const existingEmail = await User.findOne({
            email: normalizedEmail
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const existingLicense = await User.findOne({
            licenseNumber: normalizedLicenseNumber
        });

        if (existingLicense) {
            return res.status(400).json({
                message: "Driving license number is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            licenseNumber: normalizedLicenseNumber,
            password: hashedPassword,
            termsAccepted: true
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                licenseNumber: user.licenseNumber,
                termsAccepted: user.termsAccepted
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const normalizedEmail = String(email || "")
            .trim()
            .toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                licenseNumber: user.licenseNumber
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;