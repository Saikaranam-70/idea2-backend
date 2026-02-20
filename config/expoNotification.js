// const { Expo } = require("expo-server-sdk");

// let expo = new Expo();

// async function sendNotification(pushToken, title, body, route, params={}) {
//   if (!Expo.isExpoPushToken(pushToken)) {
//     console.error("Invalid push token");
//     return;
//   }

//   const messages = [
//     {
//       to: pushToken,
//       sound: "default",
//       title: title,
//       body: body,
//       data: { 
//         route,
//         params
//       },
//     },
//   ];

//   try {
//     const tickets = await expo.sendPushNotificationsAsync(messages);
//     console.log(tickets);
//   } catch (error) {
//     console.error(error);
//   }
// }

// module.exports = sendNotification


const { Expo } = require("expo-server-sdk");

let expo = new Expo();

async function sendNotification(pushToken, title, body, route, params = {}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error("❌ Invalid Expo push token:", pushToken);
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title: title,
    body: body,
    data: {
      route,
      params,
    },
    priority: "high", // 🔥 important for Android
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);

    for (let chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

      console.log("✅ Tickets:", ticketChunk);

      ticketChunk.forEach(ticket => {
        if (ticket.status === "error") {
          console.error("❌ Push Error:", ticket.details);
        }
      });
    }
  } catch (error) {
    console.error("❌ Send Error:", error);
  }
}

module.exports = sendNotification;