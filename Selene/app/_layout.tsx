import {
  configureAndroidNotificationChannels,
  getNotificationPreferences,
  registerForPushNotifications,
} from "@/services/notificationsService";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: notification.request.content.sound !== null,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    configureAndroidNotificationChannels().catch((error) => {
      console.error("Erro ao configurar canais de notificação:", error);
    });

    const registerPushToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        if (!token) return;

        const preferences = await getNotificationPreferences(token);
        if (preferences.geral && preferences.celular) {
          await registerForPushNotifications(token);
        }
      } catch (error) {
        console.error("Erro ao registrar notificações push:", error);
      }
    };

    registerPushToken();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => router.push("/alert"),
    );
    return () => subscription.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "simple_push" }} />
      <Stack.Screen name="(admin)" options={{ animation: "simple_push" }} />
      <Stack.Screen name="profile" options={{ animation: "simple_push" }} />
      <Stack.Screen name="edit-profile" options={{ animation: "simple_push" }} />
      <Stack.Screen
        name="nova-estufa"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}