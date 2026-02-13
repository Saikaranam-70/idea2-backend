const cron = require("node-cron");
const User = require("../model/User");
const { sendNotification } = require("./expoNotification");

// ⏰ Runs every 2 minutes (TESTING)
cron.schedule("*/2 * * * *", async () => {
  console.log("⏰ Running cron job...");

  try {
    const users = await User.find();

    for (let user of users) {
      if (user.pushToken) {
        await sendNotification(
          user.pushToken,
          "🔥 Reminder",
          "Practice now to keep your streak!"
        );
      }
    }

    console.log("✅ Notifications sent");
  } catch (error) {
    console.error("❌ Cron error:", error);
  }
});
