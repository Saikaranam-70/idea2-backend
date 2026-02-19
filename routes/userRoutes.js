const express = require("express");
const { sendOTP, verifyOTP, checkUsername, completeProfile, getProfile, logout, markTopicAsRead, getTopicReadStatus, submitMCQ, submitInterview, getMCQCompletionStatus, getInterviewCompletionStatus, getStreakAndPoints, getMCQProgressStatus, getPushToken, deleteAccount } = require("../controller/userController");
const authMiddleware = require("../middleware/middleware");
const { getAllTopicsInOrder } = require("../controller/topicController");
const { createContact } = require("../controller/contactController");


const router = express.Router();


router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP)
router.get("/check-username", checkUsername);

router.post("/complete-profile", authMiddleware, completeProfile)

router.get("/me", authMiddleware, getProfile)

router.post("/logout", authMiddleware, logout)
router.post("/mark-as-read", authMiddleware, markTopicAsRead)
router.get("/topic-read-status", authMiddleware, getTopicReadStatus);
router.post("/submit-mcq", authMiddleware, submitMCQ),
router.post("/submit-interview", authMiddleware, submitInterview)
router.get("/mcq-status", authMiddleware, getMCQCompletionStatus);
router.get("/interview-status", authMiddleware, getInterviewCompletionStatus);
router.get("/streakandpoints", authMiddleware, getStreakAndPoints)
router.get("/topics-order", getAllTopicsInOrder)
router.get(
  "/mcq-progress-status",
  authMiddleware,
  getMCQProgressStatus
);

router.post("/save-token", authMiddleware, getPushToken);
router.delete("/delete-account", authMiddleware, deleteAccount)
router.post("/contact", createContact);
module.exports = router;