import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { API_V1 } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { useUserInitials } from "@/hooks/useUserInitials";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { listarChats } from "@/services/chatService";
import { isAdminRole } from "@/utils/role";
import type { Chat } from "@/types/chat";

export default function ListaChats() {
  const router = useRouter();
  const { iniciais } = useUserInitials();
  const { goToProfile } = useProfileNavigation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userRole = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
        setRole(userRole);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const fetchChats = async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);

      if (!token) {
        return;
      }

      const lista = await listarChats(token, isAdminRole(role));
      setChats(lista);
    } catch (err) {}
  };

  // =========================
  // DISPARA SEMPRE QUE ENTRA NA TELA
  // =========================
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [role]),
  );

  // =========================
  // NOVO CHAT
  // =========================
  const iniciarNovoChat = async () => {
    if (isAdminRole(role)) {
      return;
    }

    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);

      if (!token) return;

      const res = await fetch(
        `${API_V1}/chats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      const chatId = data.data?._id || data._id;

      if (!chatId) {
        return;
      }

      router.push({
        pathname: "/support/chat",
        params: { chatId },
      });
    } catch (err) {}
  };

  // =========================
  // RENDER
  // =========================
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
            </TouchableOpacity>

            <View>
              <Text style={styles.welcomeText}>Suporte Online</Text>
              <Text style={styles.subwelcomeText}>Suporte</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={goToProfile}
              >
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/alert")}>
                <Feather name="bell" size={24} color="#2A3A56" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Conversas</Text>

          <FlatList
            data={chats}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={() => (
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                Nenhum chat ativo
              </Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() =>
                  router.push({
                    pathname: "/support/chat",
                    params: { chatId: item._id },
                  })
                }
              >
                <View style={styles.avatar}>
                  <Feather name="user" size={20} color="#95C159" />
                </View>

                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{item.nome || "Suporte"}</Text>
                  <Text style={styles.chatStatus}>
                    {item.status || "ativo"}
                  </Text>
                </View>

                <Text style={styles.chatTime}>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </TouchableOpacity>
            )}
          />

          {role !== "admin" && role !== "superadmin" && (
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={iniciarNovoChat}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.newChatText}>Nova Conversa</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// =========================
// ESTILOS
// =========================

const styles = StyleSheet.create({
  // =========================
  // CONTAINERS PRINCIPAIS
  // =========================
  container: {
    flex: 1,
    backgroundColor: "#95C159",
  },

  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 25,
  },

  /// =========================
  // HEADER (TOPO VERDE)
  // =========================

  topContainer: {
    backgroundColor: "#95C159",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 1,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  subwelcomeText: {
    fontSize: 14,
    color: "#2A3A56",
    opacity: 0.8,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  // =========================
  // AVATAR
  // =========================
  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  // =========================
  // TEXTOS / SEÇÕES
  // =========================
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 20,
  },

  // =========================
  // BOTÃO NOVO CHAT
  // =========================
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D2B1",
    padding: 14,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },

  newChatText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  // =========================
  // CARD DE CHAT
  // =========================
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 22,
    marginBottom: 15,
  },

  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },

  chatName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  chatStatus: {
    fontSize: 13,
    color: "#95C159",
  },

  chatTime: {
    fontSize: 11,
    color: "#AAA",
  },
});
