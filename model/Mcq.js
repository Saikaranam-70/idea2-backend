const mongoose = require("mongoose")

const MCQSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },

  question: {
    type: String,
    required: true,
  },

  options: {
    type: [String],
    validate: v => v.length === 4,
  },

  correctOptionIndex: {
    type: Number, // 0–3
    required: true,
  },

  explanation: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("Mcq", MCQSchema)