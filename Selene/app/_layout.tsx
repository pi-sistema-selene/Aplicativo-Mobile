import {
  configureAndroidNotificationChannels,
} from "@/services/notificationsService";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

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