const express = require("express");
const router = express.Router();
const mcqController = require("../controller/mcqController");

// Admin
router.post("/", mcqController.createMCQ);
router.put("/:id", mcqController.updateMCQ);
router.delete("/:id", mcqController.deleteMCQ);

// Public
router.get("/topic/:topicId", mcqController.getMCQsByTopic);
router.get("/:id", mcqController.getMCQById);
router.post("/bulk", mcqController.bulkCreateMCQs);

module.exports = router;
