import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { clearSession } from "@/services/authService";
import {
  PUSH_TOKEN_STORAGE_KEY,
  removePushToken,
} from "@/services/notificationsService";

export function useLogout() {
  const router = useRouter();

  const logout = useCallback(() => {
    Alert.alert("Sair", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          try {
            const [authToken, pushToken] = await Promise.all([
              SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN),
              SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY),
            ]);
            if (authToken && pushToken) {
              try {
                await removePushToken(authToken, pushToken);
              } catch (error) {
                console.error("Erro ao remover token push ao sair:", error);
              }
            }
            await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
            await clearSession();
            router.replace("/(auth)");
          } catch (e) {
            console.error("Erro ao sair:", e);
          }
        },
      },
    ]);
  }, [router]);

  return { logout };
}
