import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { getInitials, getShortName } from "@/utils/initials";

export function useUserInitials() {
  const [iniciais, setIniciais] = useState("US");
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync(STORAGE_KEYS.USER_NAME);
        if (nomeSalvo) {
          setNomeUsuario(getShortName(nomeSalvo));
          setIniciais(getInitials(nomeSalvo));
        }
      } catch (e) {
        console.error("Erro ao carregar iniciais:", e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  return { iniciais, nomeUsuario, loading };
}
