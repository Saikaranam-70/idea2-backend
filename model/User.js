const { default: mongoose } = require("mongoose");

/**
 * Per-topic read tracking (user-specific)
 */
const TopicProgressSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    subject: {
      type: String,
      enum: ["OS", "DBMS", "CN", "OOPS", "DSA", "APTITUDE", "INTERVIEW"],
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    // optional for future
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const MCQProgressSchema = new mongoose.Schema(
  {
    mcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mcq",
      required: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    subject: {
      type: String,
      enum: ["OS", "DBMS", "CN", "OOPS", "DSA", "APTITUDE", "INTERVIEW"],
      required: true,
    },

    isCompleted:{
      type:Boolean,
      default:false
    },

    selectedOptionIndex: {
      type: Number, // 0–3
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    attemptedAt: {
      type: Date,
    },

    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const InterviewProgressSchema = new mongoose.Schema(
  {
    interviewQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    subject: {
      type: String,
      enum: ["OS", "DBMS", "CN", "OOPS", "DSA", "APTITUDE", "INTERVIEW"],
      required: true,
    },

    isAttempted: {
      type: Boolean,
      default: false,
    },

    answerAudioUrl: {
      type: String, // if audio answer
    },

    confidenceScore: {
      type: Number, // 1–5 or 0–100
      default: 0,
    },

    timeSpentSeconds: {
      type: Number,
      default: 0,
    },

    attemptedAt: {
      type: Date,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /**
     * 🔹 Last read topic (used for resume / continue learning)
     */
    lastRead: {
      subject: { type: String },
      topic: { type: String },
      order: { type: Number, default: 0 },
    },

    /**
     * 🔹 Learning progress (high-level)
     */
    progress: {
      currentSubject: {
        type: String,
      },
      currentTopic: {
        type: String,
      },
      completedSubjects: {
        type: [String],
        default: [],
      },
      totalTopicsRead: {
        type: Number,
        default: 0,
      },
    },

    /**
     * ✅ NEW: Per-topic read tracking
     */
    topicProgress: {
      type: [TopicProgressSchema],
      default: [],
    },

    mcqProgress: {
      type: [MCQProgressSchema],
      default: [],
    },

    interviewProgress: {
      type: [InterviewProgressSchema],
      default: [],
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    fearLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    preferredMode: {
      type: String,
      enum: ["audio", "video"],
      default: "audio",
    },

    totalSpeakingSeconds: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },

    streak: {
      type: Number,
      default: 0,
    },

    points: {
      type: Number,
      default: 0,
    },

    lastActiveDate: {
      type: Date,
      default: null,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },
    pushToken:{
      type: String,
      default: null
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
