const express = require("express");
const { sendOTP, verifyOTP, checkUsername, completeProfile, getProfile, logout } = require("../controller/userController");
const authMiddleware = require("../middleware/middleware")

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP)
router.get("check-username", checkUsername);

router.post("/complete-profile", authMiddleware, completeProfile)

router.get("/me", authMiddleware, getProfile)

router.post("/logout", authMiddleware, logout)

module.exports = router;