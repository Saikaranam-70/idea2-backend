const express = require("express");
const { createQuestion, getAllQuestions, getQuestionsByTopic, getQuestionsByDifficulty, searchQuestions, updateQuestion, deleteQuestion } = require("../controller/interviewQuestionController");

const router = express.Router();

router.post("/", createQuestion);
router.get("/", getAllQuestions);
router.get("/topic/:topicId", getQuestionsByTopic);
router.get("/difficulty/:level", getQuestionsByDifficulty);
router.get("/search", searchQuestions);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

module.exports = router