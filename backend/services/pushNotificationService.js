const User = require("../models-mongodb/User");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendAlertPush(userId, alert) {
  const user = await User.findById(userId).select(
    "+pushTokens notificationPreferences",
  );
  if (!user) {
    throw new Error("Usuário do alerta não encontrado");
  }

  const preferences = user.notificationPreferences || {};
  if (
    preferences.geral === false ||
    preferences.celular === false ||
    (!preferences.baixos && alert.severity !== "Alta") ||
    user.pushTokens.length === 0
  ) {
    return;
  }

  const sound = preferences.som !== false;
  const vibrate = preferences.vibrar !== false;
  const channelId = `alerts-${sound ? "sound" : "silent"}-${vibrate ? "vibrate" : "no-vibrate"}`;
  const messages = user.pushTokens.map((token) => ({
    to: token,
    title: alert.title,
    body: alert.body,
    sound: sound ? "default" : null,
    channelId,
    priority: "high",
    data: {
      screen: "alert",
      deviceId: String(alert.deviceId),
      category: alert.category,
    },
  }));

  const invalidTokens = [];
  for (let offset = 0; offset < messages.length; offset += 100) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages.slice(offset, offset + 100)),
    });
    if (!response.ok) {
      throw new Error(`Expo Push retornou HTTP ${response.status}`);
    }

    const result = await response.json();
    const tickets = Array.isArray(result.data) ? result.data : [];
    for (const [index, ticket] of tickets.entries()) {
      if (ticket.status !== "error") continue;

      const code = ticket.details?.error;
      console.error("Expo Push rejeitou uma notificação:", {
        code,
        message: ticket.message,
      });
      if (code === "DeviceNotRegistered") {
        invalidTokens.push(user.pushTokens[offset + index]);
      }
    }
  }

  if (invalidTokens.length > 0) {
    await User.updateOne(
      { _id: userId },
      { $pull: { pushTokens: { $in: invalidTokens } } },
    );
  }
}

module.exports = { sendAlertPush };
