import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        setToken(saved);
      } catch (e) {
        console.error("Erro ao carregar token:", e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  return { token, loading };
}
