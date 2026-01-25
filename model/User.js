const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
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

  lastRead:{
    subject: {type:String},
    topic: {type:String},
    order: {type:Number, default: 0}
  },

  progress:{
    currentSubject:{
      type:String
    },
    currentTopic:{
      type:String
    },
    completedSubjects:{
      type:[String]
    },
    totalTopicsRead:{
      type:Number,
      default:0
    }
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
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema)
