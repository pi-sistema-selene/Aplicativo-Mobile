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
import { useRouter } from "expo-router";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
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

        {/* HEADER */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/(tabs)/home-admin")}
            >
              <Feather name="arrow-left" size={28} color="#2A3A56" />
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

        {/* CONTEÚDO BRANCO ARREDONDADO */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Solicitações</Text>

          {/* CARDS DE STATUS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="export" size={24} color="#FFF" />
              <Text style={styles.statNumber}>{stats.abertas}</Text>
              <Text style={styles.statLabel}>Abertas</Text>
            </View>

            <View style={styles.statCard}>
              <Feather name="clock" size={24} color="#FFF" />
              <Text style={styles.statNumber}>{stats.andamento}</Text>
              <Text style={styles.statLabel}>Em andamento</Text>
            </View>

            <View style={styles.statCard}>
              <Feather name="check-circle" size={24} color="#FFF" />
              <Text style={styles.statNumber}>{stats.resolvidas}</Text>
              <Text style={styles.statLabel}>Resolvidas</Text>
            </View>
          </View>

          {/* LISTA DE MENSAGENS RECENTES */}
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Mensagens Recentes</Text>
            <TouchableOpacity style={styles.verMaisBtn}>
              <Text style={styles.verMaisText}>Ver mais</Text>
              <Feather name="arrow-right-circle" size={20} color="#00D2B1" />
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
                  <Feather name="user" size={24} color="#666" />
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

        {/* TAB BAR (Fixa embaixo) */}
        <View style={styles.tabBar}>
          <Feather name="file-text" size={24} color="#95C159" />
          <Feather name="target" size={24} color="#CCC" />
          <View style={styles.centerTab}>
            <MaterialCommunityIcons name="chart-donut" size={30} color="#FFF" />
          </View>
          <Feather name="bar-chart-2" size={24} color="#CCC" />
          <Feather name="user" size={24} color="#CCC" />
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 4,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15
  },
  textContainer: {
    flex: 1,
    marginLeft: 20
  },
  container: {
    flex: 1,
    backgroundColor: "#95C159",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 35,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A3A56",
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3A56"
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56"
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A3A56",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A3A56",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "31%",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D2B1",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 10,
    color: "#FFF",
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
    color: "#2A3A56",
    fontSize: 13,
    fontWeight: "500",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A3A56",
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2A3A56",
  },
  itemSub: {
    fontSize: 12,
    color: "#AAA",
    marginTop: 2,
  },
  itemDate: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2A3A56",
  },
  tabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "#F9F9F9",
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
    backgroundColor: "#2A3A56",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    borderWidth: 5,
    borderColor: "#FFF",
  }
});