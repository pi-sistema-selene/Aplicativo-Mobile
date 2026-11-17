import { API_V1, ENDPOINTS } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { authHeaders } from "@/utils/authHeaders";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

export interface NotificationPreferences {
  geral: boolean;
  som: boolean;
  celular: boolean;
  vibrar: boolean;
  personalizadas: boolean;
  baixos: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  geral: true,
  som: true,
  celular: false,
  vibrar: true,
  personalizadas: false,
  baixos: false,
};

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function requestJson(
  token: string,
  path: string,
  method: "GET" | "PUT" | "POST" | "DELETE",
  body?: object,
) {
  const response = await fetch(`${API_V1}${path}`, {
    method,
    headers: {
      ...authHeaders(token),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Não foi possível salvar as notificações.");
  }
  return result;
}

export async function getNotificationPreferences(
  token: string,
): Promise<NotificationPreferences> {
  const result = await requestJson(
    token,
    ENDPOINTS.users.notificationPreferences,
    "GET",
  );
  return result.data as NotificationPreferences;
}

export async function saveNotificationPreferences(
  token: string,
  preferences: NotificationPreferences,
): Promise<void> {
  await requestJson(
    token,
    ENDPOINTS.users.notificationPreferences,
    "PUT",
    preferences,
  );
}

async function configureAndroidChannels() {
  if (Platform.OS !== "android") return;

  for (const sound of [true, false]) {
    for (const vibrate of [true, false]) {
      const channelId = `alerts-${sound ? "sound" : "silent"}-${vibrate ? "vibrate" : "no-vibrate"}`;
      await Notifications.setNotificationChannelAsync(channelId, {
        name: "Alertas da estufa",
        description: "Avisos importantes sobre sensores e análises",
        importance: AndroidImportance.MAX,
        sound: sound ? "default" : null,
        vibrationPattern: vibrate ? [0, 250, 250, 250] : undefined,
        enableVibrate: vibrate,
        enableLights: true,
        lightColor: "#FF231F7C",
        showBadge: true,
      });
    }
  }
}

export async function registerForPushNotifications(
  authToken: string,
): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Notificações push estão disponíveis no aplicativo para celular.");
  }

  await configureAndroidChannels();

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== "granted") {
    throw new Error(
      "Permissão negada. Ative as notificações do Selene nas configurações do celular.",
    );
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("ID do projeto Expo não configurado para notificações push.");
  }

  const pushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  await requestJson(
    authToken,
    ENDPOINTS.users.pushToken,
    "POST",
    { token: pushToken },
  );
  return pushToken;
}

export async function removePushToken(
  authToken: string,
  pushToken: string,
): Promise<void> {
  await requestJson(authToken, ENDPOINTS.users.pushToken, "DELETE", {
    token: pushToken,
  });
}

export const PUSH_TOKEN_STORAGE_KEY = STORAGE_KEYS.PUSH_TOKEN;

export async function configureAndroidNotificationChannels() {
  await configureAndroidChannels();
}
