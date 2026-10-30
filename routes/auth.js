const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// 1. LOGIN ROUTE (Step 1 of flow)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Verify Password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            // User already set up MFA -> Prompt for OTP
            return res.status(200).json({
                message: "Password verified. Enter OTP to complete login.",
                mfaRequired: true,
                userId: user._id
            });
        } else {
            // MFA not enabled -> Direct user to setup MFA first
            return res.status(200).json({
                message: "MFA setup required.",
                mfaSetupRequired: true,
                userId: user._id
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. GENERATE MFA SECRET & QR CODE (Step 1 & 2 of flow)
router.post("/mfa/setup", async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate Speakeasy Secret
        const secret = speakeasy.generateSecret({
            name: `Blood Donation Management (${user.username})`
        });

        // Save secret temporarily until verified
        user.mfaSecret = secret.base32;
        await user.save();

        // Generate QR code Data URL
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            message: "Scan QR Code using Google Authenticator",
            qrCode: qrCodeUrl,
            secret: secret.base32
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. VERIFY OTP & COMPLETE LOGIN / ENABLE MFA (Step 4 & 5 of flow)
router.post("/mfa/verify", async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.mfaSecret) {
            return res.status(400).json({ message: "Invalid request or MFA not initiated" });
        }

        // Verify OTP token using Speakeasy
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: "base32",
            token: otp,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP code" });
        }

        // Activate MFA status permanently after first successful setup verification
        if (!user.mfaEnabled) {
            user.mfaEnabled = true;
            await user.save();
        }

        // Generate final JWT token upon successful 2FA verification
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Authentication successful",
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;