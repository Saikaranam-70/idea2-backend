const User = require("../model/User");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");
const nodemailer = require("nodemailer");
// const User = require("../model/User");

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.secret_key);


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "a1302f001@smtp-brevo.com",                // ← exactly this
    pass: process.env.BERVO_API_KEY // ← your real key
  },
});

// const sendOTPEmail = async (email, otp) => {
//   await transporter.sendMail({
//     from: "no-reply@brevo.com",
//     to: email,
//     subject: "Your Login OTP",
//     html: `
//       <h2>Prep App</h2>
//       <h1>${otp}</h1>
//       <p>OTP valid for 5 minutes</p>
//     `,
//   });
// };

const sendOTPEmail = async (email, otp) => {
  console.log(process.env.BERVO_API_KEY);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": process.env.BERVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Prep App",
        email: "saimanikantakaranam682@gmail.com", // must be verified in Brevo
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Your Login OTP",
      htmlContent: `
        <html>
          <body>
            <h2>Prep App</h2>
            <h1>${otp}</h1>
            <p>OTP valid for 5 minutes</p>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo API failed: ${error}`);
  }
};


exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // const alreadySent = await redis.get(`otp:${email}`);
  // if(alreadySent)
  //     return res.status(429).json({message:"OTP Already Sent"});
  // console.log(process.env.BERVO_API_KEY);

  console.log("called");

  const otp = generateOTP();
  console.log(otp);

  await redis.setex(`otp:${email}`, 300, otp);
  try {
  await sendOTPEmail(email, otp);
  res.json({ message: "OTP sent successfully" });
} catch (error) {
  console.error("EMAIL ERROR 👉", error);
  return res.status(500).json({ message: "Failed to send OTP email" });
}

};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const savedOTP = await redis.get(`otp:${email}`);
  if (!savedOTP || savedOTP !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
    });
  }

  await redis.del(`otp:${email}`);

  const token = generateToken(user._id);
  await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));
  const isProfileComplete = user.isProfileComplete;

  res.json({
    token,
    isProfileComplete,
    user,
  });
};

exports.completeProfile = async (req, res) => {
  try {
    const { name, username } = req.body;
    console.log("called");

    if (!name || !username)
      return res.status(400).json({ message: "Name and username is required" });

    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ message: "username is already exists" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        username,
        isProfileComplete: true,
      },
      {
        new: true,
      },
    );

    await redis.del(`user:${user._id}`);
    res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) return res.status(400).json({ available: false });

    const exists = await User.findOne({ username });
    res.status(200).json({ available: !exists });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const cached = await redis.get(`user:${req.user._id}`);
    if (cached) return res.status(200).json(JSON.parse(cached));

    const user = await User.findById(req.user._id);

    await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));
    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.logout = async (req, res) => {
  await redis.del(`user:${req.user._id}`);
  res.json({ message: "Logged out successfully" });
};
exports.markTopicAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topicId, subject, topicTitle, order } = req.body;

    if (!topicId || !subject)
      return res
        .status(400)
        .json({ message: "topicId and subject are required" });

    const user = await User.findById(userId);

    const existing = user.topicProgress.find(
      (t) => t.topicId.toString() === topicId,
    );

    let isNewRead = false;

    if (existing) {
      if (!existing.isRead) {
        existing.isRead = true;
        existing.readAt = new Date();
        isNewRead = true;
      }
    } else {
      user.topicProgress.push({
        topicId,
        subject,
        isRead: true,
        readAt: new Date(),
      });
      isNewRead = true;
    }

    if (isNewRead) {
      user.progress.totalTopicsRead += 1;
      user.points += 20; // 🎯 topic completion points
    }

    user.lastRead = {
      subject,
      topic: topicTitle || "",
      order: order || 0,
    };

    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate).toDateString()
      : null;

    if (lastActive !== today) {
      user.streak += 1;
      user.lastActiveDate = new Date();
    }

    await user.save();
    await redis.del(`user:${userId}`);
    await redis.del(`strakandpoints${user._id}`)

    res.json({
      success: true,
      points: user.points,
      streak: user.streak,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.submitMCQ = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const {
      mcqId,
      topicId,
      subject,
      selectedOptionIndex,
      isCorrect,
      timeSpentSeconds,
    } = req.body;

    const existing = user.mcqProgress.find((m) => m.mcqId.toString() === mcqId);

    if (existing) {
      return res.status(400).json({ message: "MCQ already attempted" });
    }

    user.mcqProgress.push({
      mcqId,
      topicId,
      subject,
      selectedOptionIndex,
      isCorrect,
      isCompleted: true,
      attemptedAt: new Date(),
      timeSpentSeconds,
    });

    if (isCorrect) {
      user.points += 4; // 🎯 correct MCQ reward
    }

    await user.save();
    await redis.del(`user:${user._id}`);
    await redis.del(`strakandpoints${user._id}`)

    res.json({
      success: true,
      points: user.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.submitInterview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const {
      interviewQuestionId,
      topicId,
      subject,
      confidenceScore,
      answerAudioUrl,
      timeSpentSeconds,
    } = req.body;

    const existing = user.interviewProgress.find(
      (i) => i.interviewQuestionId.toString() === interviewQuestionId,
    );

    if (existing) {
      return res.status(400).json({ message: "Interview already attempted" });
    }

    let pointsToAdd = 0;
    if (confidenceScore >= 80) pointsToAdd = 10;
    else if (confidenceScore >= 60) pointsToAdd = 6;
    else if (confidenceScore >= 40) pointsToAdd = 3;

    user.interviewProgress.push({
      interviewQuestionId,
      topicId,
      subject,
      isAttempted: true,
      confidenceScore,
      answerAudioUrl,
      timeSpentSeconds,
      attemptedAt: new Date(),
    });

    user.points += pointsToAdd;

    await user.save();
    await redis.del(`user:${user._id}`);
    await redis.del(`strakandpoints${user._id}`)

    res.json({
      success: true,
      pointsEarned: pointsToAdd,
      totalPoints: user.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTopicReadStatus = async (req, res) => {
  const user = await User.findById(req.user._id);
  const map = {};
  user.topicProgress.forEach((t) => {
    map[t.topicId] = t.isRead;
  });
  res.json(map);
};

exports.getMCQCompletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const map = {};
    user.mcqProgress.forEach((m) => {
      map[m.mcqId] = m.isCompleted;
    });

    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getInterviewCompletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const map = {};
    user.interviewProgress.forEach((i) => {
      map[i.interviewQuestionId] = i.isAttempted;
    });

    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getStreakAndPoints = async (req, res) => {
  try {
    const id = req.user._id;

    const cacheKey = `streakandpoints:${id}`;

    // 🔁 Check Redis
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 🔍 Fetch user
    const user = await User.findById(id).select(
      "streak points confidenceScore fearLevel"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const response = {
      success: true,
      streak: user.streak || 0,
      points: user.points || 0,
      confidenceScore: user.confidenceScore || 0,
      fearLevel: user.fearLevel || 0,
    };

    // 💾 Cache for 1 hour
    await redis.set(
      cacheKey,
      JSON.stringify(response),
      "EX",
      60 * 60
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("getStreakAndPoints error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



exports.getMCQProgressStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const map = {};

    user.mcqProgress.forEach((m) => {
      map[m.mcqId] = {
        isCompleted: m.isCompleted,
        selectedOptionIndex: m.selectedOptionIndex,
        isCorrect: m.isCorrect,
        timeSpentSeconds: m.timeSpentSeconds || 0,
      };
    });

    res.json({
      success: true,
      data: map,
    });
  } catch (err) {
    console.error("getMCQProgressStatus error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
