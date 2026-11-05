import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [role]),
  );

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
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
                <Feather name="bell" size={24} color={Colors.text} />
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
              <Text style={{ textAlign: "center", marginTop: Spacing.lg }}>
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
                  <Feather name="user" size={20} color={Colors.primary} />
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
              <Feather name="plus" size={18} color={Colors.white} />
              <Text style={styles.newChatText}>Nova Conversa</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: Spacing.xl,
  },


  topContainer: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: Spacing.xxl,
    paddingTop: 10,
    paddingHorizontal: Spacing.screen,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 1,
  },

  welcomeText: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  subwelcomeText: {
    fontSize: Typography.body,
    color: Colors.text,
    opacity: 0.8,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.greenSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.mutedLight,
    marginBottom: Spacing.lg,
  },

  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    padding: 14,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },

  newChatText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: Typography.body,
  },

  chatCard: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
  },

  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },

  chatName: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
  },

  chatStatus: {
    fontSize: Typography.small,
    color: Colors.primary,
  },

  chatTime: {
    fontSize: Typography.footnote,
    color: "#AAA",
  },
});
