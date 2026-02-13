const { Expo } = require("expo-server-sdk");

let expo = new Expo();

async function sendNotification(pushToken, title, route, params={}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error("Invalid push token");
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: "default",
      title: title,
      body: body,
      data: { 
        route,
        params
      },
    },
  ];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log(tickets);
  } catch (error) {
    console.error(error);
  }
}

module.exports = sendNotification