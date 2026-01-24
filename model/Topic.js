const mongoose = require("mongoose");

const DescriptionBlockSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true, // e.g., "What is Deadlock?"
    },

    content: {
      type: String,
      required: true, // explanation text
    },

    images: [
      {
        type: String, // image URLs related to this section
      },
    ],
  },
  { _id: false }
);

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    enum: ["OS", "DBMS", "CN", "OOPS", "DSA", "APTITUDE", "INTERVIEW"],
    required: true,
  },

  // 🔥 Description blocks with images
  descriptions: [DescriptionBlockSchema],

  animationUrl: String,

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },

  order: Number,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Topic", TopicSchema);
