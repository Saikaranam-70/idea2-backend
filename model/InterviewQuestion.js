const mongoose = require("mongoose")

const InterviewQuestionSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },

  question: {
    type: String,
    required: true,
  },

  timeLimit: {
    type: Number, 
    default: 60,
  },

  structureHints: {
    type: [String],

  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("InterviewQuestion", InterviewQuestionSchema)