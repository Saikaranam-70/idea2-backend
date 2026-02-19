const cron = require("node-cron");
const User = require("../model/User");
const sendNotification = require("./expoNotification");

const isToday = (date) => {
  if (!date) return false;

  const today = new Date();
  const d = new Date(date);

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

// ⏰ Run every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("⏰ Running cron job...");

  try {
    const users = await User.find();

    for (let user of users) {
      if (!user.pushToken || !user.notificationsEnabled) continue;

      let title = "";
      let message = "";

      const practicedToday = isToday(user.lastActiveDate);

      // 🎯 1. User practiced today
      if (practicedToday) {
        title = "🔥 Great Job!";
        message = "You're on track! Try one more topic today 🚀";
      }

      // ⚡ 2. User didn't practice today
      else {
        title = "⚡ Don't break your streak!";
        message = "Practice now to keep your streak alive 🔥";
      }

      // 😢 3. Streak broken (inactive > 1 day)
      const lastActive = new Date(user.lastActiveDate);
      const diffDays = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

      if (diffDays >= 2) {
        title = "😢 We miss you!";
        message = "Come back and restart your learning journey 💪";
      }

      // 🏆 4. High streak motivation
      if (user.streak >= 5 && practicedToday) {
        title = "🏆 Amazing Streak!";
        message = `You're on a ${user.streak}-day streak! Keep it going 🔥`;
      }

      await sendNotification(
        user.pushToken,
        title,
        message,
        "/(tabs)/play"
      );
    }

    console.log("✅ Notifications sent");
  } catch (error) {
    console.error("❌ Cron error:", error);
  }
});
