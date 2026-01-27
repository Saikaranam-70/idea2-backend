const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      default: 0, // years
      min: 0,
    },

    location: {
      type: String,
      default: "Remote",
    },

    graduationYear: {
      type: [Number],
      validate: {
        validator: (years) =>
          years.every((y) => y >= 2000 && y <= 2035),
        message: "Invalid graduation year",
      },
    },

    isInternship: {
      type: Boolean,
      default: false,
    },

    isHackathon: {
      type: Boolean,
      default: false,
    },

    stipend: {
      type: Number,
      min: 0,
    },

    applicationLink: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
