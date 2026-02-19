const express = require("express");
const upload = require("../config/multer");
const auth = require("../middleware/middleware");

const {
  createAnswer,
  getAnswersByTopic,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  getAnswerByQuestionId,
} = require("../controller/interviewController");

const router = express.Router();

/* CREATE – requires video (temp) */
router.post("/", auth, upload.single("video"), createAnswer);

/* READ */
router.get("/topic/:topicId", getAnswersByTopic);
router.get("/question/:questionId", getAnswerByQuestionId)
router.get("/:id", getAnswerById);

/* UPDATE – text only */
router.put("/:id", auth, updateAnswer);

/* DELETE */
router.delete("/:id", auth, deleteAnswer);

module.exports = router;
