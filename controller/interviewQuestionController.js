const InterviewQuestion = require("../model/InterviewQuestion");
const redis = require("../config/redis");

/* ================= CREATE QUESTION ================= */
exports.createQuestion = async (req, res) => {
  try {
    const {
      topicId,
      question,
      timeLimit,
      structureHints,
      difficulty,
    } = req.body;

    const newQuestion = await InterviewQuestion.create({
      topicId,
      question,
      timeLimit,
      structureHints,
      difficulty,
    });

    // 🔥 clear cache
    await redis.flushall();

    res.status(201).json({
      success: true,
      message: "Interview Question Created",
      data: newQuestion,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL QUESTIONS ================= */
exports.getAllQuestions = async (req, res) => {
  try {
    const cacheKey = "interview:all";

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    const questions = await InterviewQuestion.find()
      .populate("topicId", "title category")
      .sort({ createdAt: -1 });

    await redis.set(cacheKey, JSON.stringify(questions), "EX", 300);

    res.json({
      success: true,
      source: "db",
      data: questions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET BY TOPIC ================= */
exports.getQuestionsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const cacheKey = `interview:topic:${topicId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    const questions = await InterviewQuestion.find({ topicId }).sort({
      difficulty: 1,
    });

    await redis.set(cacheKey, JSON.stringify(questions), "EX", 300);

    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET BY DIFFICULTY ================= */
exports.getQuestionsByDifficulty = async (req, res) => {
  try {
    const { level } = req.params; // easy | medium | hard

    const questions = await InterviewQuestion.find({
      difficulty: level,
    }).populate("topicId", "title");

    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= SEARCH QUESTIONS ================= */
exports.searchQuestions = async (req, res) => {
  try {
    const { q } = req.query;

    const questions = await InterviewQuestion.find({
      question: { $regex: q, $options: "i" },
    })
      .populate("topicId", "title")
      .limit(20);

    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE QUESTION ================= */
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await InterviewQuestion.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    await redis.flushall();

    res.json({
      success: true,
      message: "Question Updated",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE QUESTION ================= */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await InterviewQuestion.findByIdAndDelete(id);
    await redis.flushall();

    res.json({
      success: true,
      message: "Question Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
