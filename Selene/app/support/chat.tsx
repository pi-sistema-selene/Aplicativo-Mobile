import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  type ScrollViewInstance,
} from "react-native";

import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import axios, { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { isAdminRole } from "@/utils/role";

interface Message {
  _id: string;
  texto: string;
  autor: string;
  tipo?: "user" | "admin";
  createdAt: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const [iniciais, setIniciais] = useState("US");

  const scrollViewRef = useRef<ScrollViewInstance | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleGoProfile = async () => {
    const role = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);

    router.push(isAdminRole(role) ? "/(admin)/profile-admin" : "/profile");
  };

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      const nome = await SecureStore.getItemAsync(STORAGE_KEYS.USER_NAME);
      if (nome) {
        const partes = nome.split(" ");
        const init =
          partes.length > 1
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : partes[0][0].toUpperCase();

        setIniciais(init);
      }
    };
    carregarDadosUsuario();
  }, []);

  const loadUserData = useCallback(async () => {
    const userId = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
    const userRole = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);

    setCurrentUserId(userId);
    setRole(userRole);
  }, []);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateLabel = (date: string) => {
    const today = new Date();
    const msgDate = new Date(date);

    const isToday = msgDate.toDateString() === today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isYesterday = msgDate.toDateString() === yesterday.toDateString();

    if (isToday) return "Hoje";
    if (isYesterday) return "Ontem";

    return msgDate.toLocaleDateString("pt-BR");
  };

  const fetchMessages = useCallback(async (showError = false) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      let url =
        role === "admin" || role === "superadmin"
          ? `${API_V1}/admin/chats/${chatId}/mensagens`
          : `${API_V1}/chats/${chatId}/mensagens`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(res.data.data || res.data || []);
    } catch (err) {
      const responseMessage = isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      const message =
        typeof responseMessage === "string"
          ? responseMessage
          : err instanceof Error
            ? err.message
            : "Tente novamente.";
      if (showError) Alert.alert("Erro ao carregar conversa", message);
      else console.error("Erro ao atualizar conversa:", err);
    }
  }, [chatId, role]);

  const handleSendMessage = async () => {
    const texto = newMessage.trim();
    if (!texto || isTyping) return;

    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      let url =
        role === "admin" || role === "superadmin"
          ? `${API_V1}/admin/chats/${chatId}/mensagens`
          : `${API_V1}/chats/${chatId}/mensagens`;

      setIsTyping(true);

      const res = await axios.post(
        url,
        { texto },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const nova = res.data.data || res.data;

      setMessages((prev) =>
        prev.some((message) => message._id === nova._id)
          ? prev
          : [...prev, nova],
      );
      setNewMessage("");
      setIsTyping(false);
    } catch (err) {
      const responseMessage = isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      Alert.alert(
        "Erro ao enviar mensagem",
        typeof responseMessage === "string"
          ? responseMessage
          : err instanceof Error
            ? err.message
            : "Tente novamente.",
      );
      setIsTyping(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadUserData);
  }, [loadUserData]);
  useEffect(() => {
    if (role) void Promise.resolve().then(() => fetchMessages(true));
  }, [fetchMessages, role]);
  useRealtimeRefresh(() => {
    if (role) void fetchMessages();
  }, false);
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
              <Text style={styles.subwelcomeText}>Chat</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handleGoProfile}
              >
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View style={styles.content}>
          <ScrollView ref={scrollViewRef}>
            {messages.map((msg, index) => {
              const isMe =
                isAdminRole(role)
                  ? msg.tipo === "admin"
                  : msg.autor === currentUserId;

              const dateLabel = getDateLabel(msg.createdAt);
              const previousDate =
                index > 0 ? getDateLabel(messages[index - 1].createdAt) : "";
              const showDate = dateLabel !== previousDate;

              return (
                <View key={msg._id}>

                  {showDate && (
                    <Text style={styles.dateLabel}>{dateLabel}</Text>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text style={isMe ? styles.textMe : styles.textThem}>
                      {msg.texto}
                    </Text>


                    <Text style={styles.timeText}>
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}


            {isTyping && <Text style={styles.typingText}>digitando...</Text>}
          </ScrollView>


          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Digite..."
              />

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

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

  bubble: {
    padding: 10,
    borderRadius: Radius.lg,
    marginVertical: 5,
    maxWidth: "75%",
  },

  bubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: Colors.accent,
  },

  bubbleThem: {
    alignSelf: "flex-start",
    backgroundColor: Colors.greenSoft,
  },

  textMe: { color: Colors.white },
  textThem: { color: Colors.black },

  timeText: {
    fontSize: Typography.tiny,
    marginTop: Spacing.xxs,
    opacity: 0.6,
    alignSelf: "flex-end",
  },

  dateLabel: {
    alignSelf: "center",
    marginVertical: 10,
    fontSize: Typography.caption,
    color: Colors.mutedLight,
  },

  typingText: {
    fontStyle: "italic",
    color: Colors.mutedLight,
    marginTop: 10,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    paddingHorizontal: 15,
    height: 40,
  },

  sendBtn: {
    backgroundColor: Colors.accent,
    marginLeft: 10,
    padding: 10,
    borderRadius: Radius.xl,
  },
});
