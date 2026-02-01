// const fs = require("fs");
// const path = require("path");

// const InterviewAnswer = require("../model/InterviewAnswer");
// const redis = require("../config/redis");

// const extractAudio = require("../config/extractAudio");
// const transcribeAudio = require("../config/transcribeAudio");

// /* ================== CREATE ANSWER ================== */
// exports.createAnswer = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { topicId, questionId, duration } = req.body;

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Video file is required",
//       });
//     }

//     const audioPath = path.join(
//   __dirname,
//   "..",
//   "tmp",
//   `${Date.now()}-${userId}.wav`
// );


//     /* 2️⃣ Extract audio from video */
//     await extractAudio(req.file.path, audioPath);

//     /* 3️⃣ Speech → Text */
//     const transcriptText = await transcribeAudio(audioPath);
//     console.log(transcriptText);

//     if (!transcriptText || transcriptText.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Could not extract speech from video",
//       });
//     }

//     /* 4️⃣ Save ONLY transcript */
//     const answer = await InterviewAnswer.create({
//       userId,
//       topicId,
//       questionId,
//       transcriptText,
//       duration,
//     });

//     console.log("Video path:", req.file.path);
// console.log("Audio path:", audioPath);



//     if (fs.existsSync(req.file.path)) {
//   fs.unlinkSync(req.file.path);
// }

// if (fs.existsSync(audioPath)) {
//   fs.unlinkSync(audioPath);
// }


//     /* 6️⃣ Clear cache */
//     await redis.del(`answers:topic:${topicId}`);
//     await redis.del(`answers:user:${userId}`);

//     res.status(201).json({
//       success: true,
//       message: "Speech converted to text successfully",
//       data: answer,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// /* ================== GET ALL BY TOPIC ================== */
// exports.getAnswersByTopic = async (req, res) => {
//   try {
//     const { topicId } = req.params;
//     const cacheKey = `answers:topic:${topicId}`;

//     const cached = await redis.get(cacheKey);
//     if (cached) {
//       return res.json({
//         success: true,
//         cached: true,
//         data: JSON.parse(cached),
//       });
//     }

//     const answers = await InterviewAnswer.find({ topicId })
//       .populate("questionId", "question")
//       .populate("userId", "name username")
//       .sort({ createdAt: -1 });

//     await redis.setex(cacheKey, 3600, JSON.stringify(answers));

//     res.json({
//       success: true,
//       data: answers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// /* ================== GET ANSWER BY ID ================== */
// exports.getAnswerById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const cacheKey = `answer:${id}`;

//     const cached = await redis.get(cacheKey);
//     if (cached) {
//       return res.json({
//         success: true,
//         cached: true,
//         data: JSON.parse(cached),
//       });
//     }

//     const answer = await InterviewAnswer.findById(id)
//       .populate("topicId", "title")
//       .populate("questionId", "question")
//       .populate("userId", "name username");

//     if (!answer) {
//       return res.status(404).json({
//         success: false,
//         message: "Answer not found",
//       });
//     }

//     await redis.setex(cacheKey, 3600, JSON.stringify(answer));

//     res.json({
//       success: true,
//       data: answer,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// /* ================== UPDATE ANSWER (TEXT ONLY) ================== */
// exports.updateAnswer = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { id } = req.params;
//     const { transcriptText, duration, confidenceScore } = req.body;

//     const answer = await InterviewAnswer.findOne({ _id: id, userId });
//     if (!answer) {
//       return res.status(403).json({
//         success: false,
//         message: "Not allowed or answer not found",
//       });
//     }

//     if (transcriptText) answer.transcriptText = transcriptText;
//     if (duration) answer.duration = duration;
//     if (confidenceScore !== undefined)
//       answer.confidenceScore = confidenceScore;

//     await answer.save();

//     await redis.del(`answer:${id}`);
//     await redis.del(`answers:topic:${answer.topicId}`);
//     await redis.del(`answers:user:${userId}`);

//     res.json({
//       success: true,
//       message: "Answer updated successfully",
//       data: answer,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// /* ================== DELETE ANSWER ================== */
// exports.deleteAnswer = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { id } = req.params;

//     const answer = await InterviewAnswer.findOne({ _id: id, userId });
//     if (!answer) {
//       return res.status(403).json({
//         success: false,
//         message: "Not allowed or answer not found",
//       });
//     }

//     await InterviewAnswer.findByIdAndDelete(id);

//     await redis.del(`answer:${id}`);
//     await redis.del(`answers:topic:${answer.topicId}`);
//     await redis.del(`answers:user:${userId}`);

//     res.json({
//       success: true,
//       message: "Answer deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };


const fs = require("fs");
const path = require("path");

const InterviewAnswer = require("../model/InterviewAnswer");
const InterviewQuestion = require("../model/InterviewQuestion");
const User = require("../model/User");

const redis = require("../config/redis");
const extractAudio = require("../config/extractAudio");
const transcribeAudio = require("../config/transcribeAudio");
const evaluateAnswer = require("../config/evaluateAnswer");
const Topic = require("../model/Topic");



/* ================== CREATE ANSWER ================== */
exports.createAnswer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topicId, questionId, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    /* 1️⃣ Prepare audio path */
    const audioPath = path.join(
      __dirname,
      "..",
      "tmp",
      `${Date.now()}-${userId}.wav`
    );

    /* 2️⃣ Extract audio */
    await extractAudio(req.file.path, audioPath);

    /* 3️⃣ Speech → Text */
    const transcriptText = await transcribeAudio(audioPath);
    if (!transcriptText || !transcriptText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract speech from video",
      });
    }

    /* 4️⃣ Fetch interview question */
    const questionDoc = await InterviewQuestion.findById(questionId).select(
      "question"
    );
    if (!questionDoc) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    /* 5️⃣ Fetch topic & category (SUBJECT) */
    const topicDoc = await Topic.findById(topicId).select("category");
    if (
      !topicDoc ||
      !topicDoc.category ||
      !["OS", "DBMS", "CN", "OOPS", "DSA", "APTITUDE", "INTERVIEW"].includes(
        topicDoc.category
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing topic category",
      });
    }

    const subject = topicDoc.category; // ✅ guaranteed

    /* 6️⃣ AI Evaluation */
    const { confidenceScore } = await evaluateAnswer(
      questionDoc.question,
      transcriptText
    );

    /* 7️⃣ Save interview answer */
    const answer = await InterviewAnswer.create({
      userId,
      topicId,
      questionId,
      transcriptText,
      duration,
      confidenceScore,
    });

    /* 8️⃣ Update user ONLY on first attempt */
    const user = await User.findById(userId);

    const alreadyAttempted = user.interviewProgress.some(
      (p) => p.interviewQuestionId.toString() === questionId.toString()
    );

      user.totalSpeakingSeconds += duration || 0;
      user.confidenceScore += confidenceScore;

    if (!alreadyAttempted) {
      user.points += confidenceScore;

      user.interviewProgress.push({
        interviewQuestionId: questionId,
        topicId,
        subject, // ✅ now always valid
        isAttempted: true,
        confidenceScore,
        timeSpentSeconds: duration || 0,
        attemptedAt: new Date(),
      });

      await user.save();
    }

    /* 9️⃣ Cleanup files */
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    /* 🔟 Clear cache */
    await redis.del(`answers:topic:${topicId}`);
    await redis.del(`answers:user:${userId}`);
    await redis.del(`user:${userId}`)

    res.status(201).json({
      success: true,
      message: "Speech evaluated successfully",
      data: {
        answer,
        confidenceScore,
        firstAttempt: !alreadyAttempted,
        subject,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



/* ================== GET ALL BY TOPIC ================== */
exports.getAnswersByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const cacheKey = `answers:topic:${topicId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: JSON.parse(cached),
      });
    }

    const answers = await InterviewAnswer.find({ topicId })
      .populate("questionId", "question")
      .populate("userId", "name username")
      .sort({ createdAt: -1 });

    await redis.setex(cacheKey, 3600, JSON.stringify(answers));

    res.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* ================== GET ANSWER BY ID ================== */
exports.getAnswerById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `answer:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: JSON.parse(cached),
      });
    }

    const answer = await InterviewAnswer.findById(id)
      .populate("topicId", "title")
      .populate("questionId", "question")
      .populate("userId", "name username");

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(answer));

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* ================== UPDATE ANSWER (TEXT ONLY) ================== */
exports.updateAnswer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { transcriptText, duration, confidenceScore } = req.body;

    const answer = await InterviewAnswer.findOne({ _id: id, userId });
    if (!answer) {
      return res.status(403).json({
        success: false,
        message: "Not allowed or answer not found",
      });
    }

    if (transcriptText) answer.transcriptText = transcriptText;
    if (duration) answer.duration = duration;
    if (confidenceScore !== undefined)
      answer.confidenceScore = confidenceScore;

    await answer.save();

    await redis.del(`answer:${id}`);
    await redis.del(`answers:topic:${answer.topicId}`);
    await redis.del(`answers:user:${userId}`);

    res.json({
      success: true,
      message: "Answer updated successfully",
      data: answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* ================== DELETE ANSWER ================== */
exports.deleteAnswer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const answer = await InterviewAnswer.findOne({ _id: id, userId });
    if (!answer) {
      return res.status(403).json({
        success: false,
        message: "Not allowed or answer not found",
      });
    }

    await InterviewAnswer.findByIdAndDelete(id);

    await redis.del(`answer:${id}`);
    await redis.del(`answers:topic:${answer.topicId}`);
    await redis.del(`answers:user:${userId}`);

    res.json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
