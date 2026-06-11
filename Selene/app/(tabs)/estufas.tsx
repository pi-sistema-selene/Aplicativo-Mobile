import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

interface Estufa {
  _id: string;
  nome: string;
  data_criacao: string;
  status: string;
}

export default function EstufasScreen() {
  const router = useRouter();

  const [estufas, setEstufas] = useState<Estufa[]>([]);
  const [loadingEstufas, setLoadingEstufas] = useState(true);

  const [iniciais, setIniciais] = useState("US");

  // ================= USER =================
  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync("userName");
        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(" ");

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();

          setIniciais(init);
        }
      } catch (e) {
      }
    };

    carregarDadosUsuario();
  }, []);

  // ================= API =================
  const fetchEstufas = async () => {
    try {
      setLoadingEstufas(true);

      const token = await SecureStore.getItemAsync("userToken");

      const response = await axios.get(
        `${API_V1}/estufas/listar`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setEstufas(response.data.data);
      }
    } catch (error: any) {

      if (error.response?.status === 401) {
        Alert.alert("Sessão Expirada", "Faça login novamente.");
      }
    } finally {
      setLoadingEstufas(false);
    }
  };

  useEffect(() => {
    fetchEstufas();
  }, []);

  // ================= CARD =================
  const renderItem = ({ item }: { item: Estufa }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/estufa/${item._id}`)}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="greenhouse" size={28} color="#00D2B1" />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.estufaNome}>{item.nome}</Text>
          <Text style={styles.estufaData}>{item.data_criacao}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.status === "Médio" ? styles.statusMedio : styles.statusBaixo,
          ]}
        >
          <Text style={styles.statusText}>{item.status || "Ativo"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* ================= HEADER ================= */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Estufas</Text>
              <Text style={styles.subwelcomeText}>Gerencie suas estufas</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => router.push("/profile")}
              >
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/alert")}>
                <Feather
                  name="bell"
                  size={24}
                  color="#2A3A56"
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= CONTENT ================= */}
        <View style={styles.content}>
          {loadingEstufas ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#95C159" />
            </View>
          ) : (
            <>
              <View style={styles.statsSummary}>
                <Text style={styles.statsText}>
                  Total Estufas:{" "}
                  <Text style={styles.statsValue}>{estufas.length}</Text>
                </Text>

                <View style={styles.statsDivider} />

                <Text style={styles.statsText}>
                  Analizadas:{" "}
                  <Text style={styles.statsValue}>{estufas.length}</Text>
                </Text>
              </View>

              <FlatList
                data={estufas}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Nenhuma estufa encontrada.
                  </Text>
                }
                ListHeaderComponent={() => (
                  <View style={styles.listHeader}>
                    <Text style={styles.monthTitle}>Registros</Text>
                    <TouchableOpacity onPress={fetchEstufas}>
                      <Feather name="refresh-cw" size={18} color="#00D2B1" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}

          <TouchableOpacity
            style={styles.btnNovaEstufa}
            onPress={() => router.push("/nova-estufa")}
          >
            <Text style={styles.btnText}>Nova Estufa</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#95C159" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ✅ HEADER CORRIGIDO
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

  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#2A3A56" },
  subwelcomeText: { fontSize: 14, color: "#2A3A56", opacity: 0.8 },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

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

  avatarText: { fontSize: 16, fontWeight: "bold", color: "#2A3A56" },

  // CONTENT
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },

  statsSummary: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F9F7",
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },

  statsText: { fontSize: 13, color: "#2A3A56" },
  statsValue: { fontWeight: "bold", fontSize: 15 },
  statsDivider: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(42, 58, 86, 0.1)",
    marginHorizontal: 15,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  monthTitle: { fontSize: 16, fontWeight: "bold", color: "#2A3A56" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
    elevation: 3,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F0F9F7",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContainer: { flex: 1, marginLeft: 15 },

  estufaNome: { fontSize: 16, fontWeight: "bold", color: "#2A3A56" },
  estufaData: { fontSize: 12, color: "#007AFF" },

  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  statusBaixo: { backgroundColor: "#95C159" },
  statusMedio: { backgroundColor: "#A5A5A5" },

  statusText: { color: "#FFF", fontWeight: "bold" },

  btnNovaEstufa: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#D1FFD7",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  btnText: { color: "#2A3A56", fontWeight: "bold" },

  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
});
