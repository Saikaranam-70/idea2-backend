const express = require("express");
const { createQuestion, getAllQuestions, getQuestionsByTopic, getQuestionsByDifficulty, searchQuestions, updateQuestion, deleteQuestion, getInterviewQuestionsByCategory } = require("../controller/interviewQuestionController");

const router = express.Router();

router.post("/", createQuestion);
router.get("/", getAllQuestions);
router.get("/topic/:topicId", getQuestionsByTopic);
router.get("/difficulty/:level", getQuestionsByDifficulty);
router.get("/search", searchQuestions);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

router.get(
  "/category/:category",
  getInterviewQuestionsByCategory
);


module.exports = router