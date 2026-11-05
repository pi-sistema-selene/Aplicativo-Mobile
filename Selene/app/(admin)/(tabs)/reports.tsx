import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useRouter, useFocusEffect } from "expo-router";
import { API_V1 } from "@/constants/api";

type Chat = {
  _id: string;
  nome?: string;
  status?: string;
  updatedAt?: string;
};

export default function DashboardAdmin() {
  const router = useRouter();
  const [iniciais, setIniciais] = useState("US");
  const [chats, setChats] = useState<Chat[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const bootstrap = async () => {
    try {
      const [adminToken, adminName] = await Promise.all([
        SecureStore.getItemAsync("userToken"),
        SecureStore.getItemAsync("userName"),
      ]);

      if (!adminToken) {
        router.replace("/(auth)");
        return;
      }

      setToken(adminToken);

      if (adminName) {
        const partes = adminName.trim().split(" ");
        const init =
          partes.length > 1
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : partes[0][0].toUpperCase();
        setIniciais(init);
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar dados do usuário.");
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };

  const stats = {
    abertas: 1,
    andamento: 1,
    resolvidas: 0
  };

  const fetchChats = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;

      const res = await fetch(`${API_V1}/admin/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChats(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>


        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/(tabs)/home-admin")}
            >
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Controle Acessos</Text>
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
          <Text style={styles.sectionTitle}>Solicitações</Text>


          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="export" size={24} color={Colors.white} />
              <Text style={styles.statNumber}>{stats.abertas}</Text>
              <Text style={styles.statLabel}>Abertas</Text>
            </View>

            <View style={styles.statCard}>
              <Feather name="clock" size={24} color={Colors.white} />
              <Text style={styles.statNumber}>{stats.andamento}</Text>
              <Text style={styles.statLabel}>Em andamento</Text>
            </View>

            <View style={styles.statCard}>
              <Feather name="check-circle" size={24} color={Colors.white} />
              <Text style={styles.statNumber}>{stats.resolvidas}</Text>
              <Text style={styles.statLabel}>Resolvidas</Text>
            </View>
          </View>


          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Mensagens Recentes</Text>
            <TouchableOpacity style={styles.verMaisBtn}>
              <Text style={styles.verMaisText}>Ver mais</Text>
              <Feather name="arrow-right-circle" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          <Text style={styles.monthLabel}>Abril</Text>

          <FlatList
            data={chats}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() =>
                  router.push({
                    pathname: "/support/chat", // Caminho da sua tela de chat individual
                    params: { chatId: item._id }, // Passando o ID da conversa
                  })
                }
              >
                <View style={styles.iconBox}>
                  <Feather name="user" size={24} color={Colors.muted} />
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.itemTitle}>{item.nome || "Usuário"}</Text>
                  <Text style={styles.itemSub}>Status: {item.status || "Pendente"}</Text>
                </View>
                <Text style={styles.itemDate}>
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
        </View>


        <View style={styles.tabBar}>
          <Feather name="file-text" size={24} color={Colors.primary} />
          <Feather name="target" size={24} color={Colors.border} />
          <View style={styles.centerTab}>
            <MaterialCommunityIcons name="chart-donut" size={30} color={Colors.white} />
          </View>
          <Feather name="bar-chart-2" size={24} color={Colors.border} />
          <Feather name="user" size={24} color={Colors.border} />
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: Spacing.xxs,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: 35,
  },

  headerTitle: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text
  },

  welcomeText: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text
  },
  avatarMiniText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
  },
  statCard: {
    padding: Spacing.cardCompact,
    width: "31%",
    borderRadius: Radius.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
  },
  statNumber: {
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: 5,
  },
  statLabel: {
    fontSize: Typography.tiny,
    color: Colors.white,
    opacity: 0.9,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  verMaisBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verMaisText: {
    color: Colors.text,
    fontSize: Typography.small,
    fontWeight: FontWeight.medium,
  },
  monthLabel: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 10,
  },
  itemCard: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconBox: {
    width: 55,
    height: 55,
    borderRadius: Radius.md,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: Typography.medium,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  itemSub: {
    fontSize: Typography.caption,
    color: "#AAA",
    marginTop: 2,
  },
  itemDate: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: Colors.surfaceSubtle,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  centerTab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    borderWidth: 5,
    borderColor: Colors.white,
  }
});