const MCQ = require("../model/Mcq");
const redis = require("../config/redis");

/* =========================
   REDIS KEYS
========================= */
const MCQ_TOPIC_KEY = (topicId) => `mcqs:topic:${topicId}`;
const MCQ_SINGLE_KEY = (id) => `mcq:${id}`;

/* =========================
   CREATE MCQ
========================= */
exports.createMCQ = async (req, res) => {
  try {
    const { topicId, question, options, correctOptionIndex, explanation } =
      req.body;

    // validations
    if (!options || options.length !== 4) {
      return res.status(400).json({ message: "Exactly 4 options required" });
    }

    if (correctOptionIndex < 0 || correctOptionIndex > 3) {
      return res
        .status(400)
        .json({ message: "correctOptionIndex must be 0-3" });
    }

    const mcq = await MCQ.create({
      topicId,
      question,
      options,
      correctOptionIndex,
      explanation,
    });

    // ❌ invalidate cache
    await redis.del(MCQ_TOPIC_KEY(topicId));

    res.status(201).json({
      success: true,
      message: "MCQ created successfully",
      mcq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET MCQS BY TOPIC (CACHED)
========================= */
exports.getMCQsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    // 🔍 check redis
    const cached = await redis.get(MCQ_TOPIC_KEY(topicId));
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        mcqs: JSON.parse(cached),
      });
    }

    const mcqs = await MCQ.find({ topicId }).sort({ createdAt: -1 });

    // 💾 cache for 10 minutes
    await redis.setex(
      MCQ_TOPIC_KEY(topicId),
      600,
      JSON.stringify(mcqs)
    );

    res.json({
      success: true,
      source: "db",
      mcqs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET SINGLE MCQ (CACHED)
========================= */
exports.getMCQById = async (req, res) => {
  try {
    const { id } = req.params;

    const cached = await redis.get(MCQ_SINGLE_KEY(id));
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        mcq: JSON.parse(cached),
      });
    }

    const mcq = await MCQ.findById(id);
    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" });
    }

    await redis.setex(MCQ_SINGLE_KEY(id), 600, JSON.stringify(mcq));

    res.json({
      success: true,
      source: "db",
      mcq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE MCQ
========================= */
exports.updateMCQ = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    if (update.options && update.options.length !== 4) {
      return res.status(400).json({ message: "Options must be 4" });
    }

    if (
      update.correctOptionIndex !== undefined &&
      (update.correctOptionIndex < 0 || update.correctOptionIndex > 3)
    ) {
      return res
        .status(400)
        .json({ message: "correctOptionIndex must be 0-3" });
    }

    const mcq = await MCQ.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" });
    }

    // ❌ invalidate cache
    await redis.del(MCQ_SINGLE_KEY(id));
    await redis.del(MCQ_TOPIC_KEY(mcq.topicId));

    res.json({
      success: true,
      message: "MCQ updated successfully",
      mcq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   DELETE MCQ
========================= */
exports.deleteMCQ = async (req, res) => {
  try {
    const { id } = req.params;

    const mcq = await MCQ.findByIdAndDelete(id);
    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" });
    }

    // ❌ invalidate cache
    await redis.del(MCQ_SINGLE_KEY(id));
    await redis.del(MCQ_TOPIC_KEY(mcq.topicId));

    res.json({
      success: true,
      message: "MCQ deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
