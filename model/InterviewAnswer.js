const mongoose = require("mongoose");

const interviewAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
    },

    transcriptText: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewAnswer", interviewAnswerSchema);
