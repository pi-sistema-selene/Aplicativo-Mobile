import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { clearSession } from "@/services/authService";

export function useLogout() {
  const router = useRouter();

  const logout = useCallback(() => {
    Alert.alert("Sair", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          try {
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
