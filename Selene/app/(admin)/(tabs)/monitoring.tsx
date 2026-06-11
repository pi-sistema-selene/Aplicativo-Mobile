import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

type Sensor = {
  id: string;
  nome: string;
  local: string;
  tipo: string;
  status: "Ativo" | "Inativo";
  criadoPor?: string;
};

export default function MonitoramentoAdmin() {
  const router = useRouter();
  const [iniciais, setIniciais] = useState("US");
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };

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

  const fetchSensores = async (isRefresh = false) => {
    const activeToken = token || (await SecureStore.getItemAsync("userToken"));
    if (!activeToken) return;

    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await fetch(
        `${API_V1}/dispositivos`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        },
      );

      const json = await res.json();

      if (res.status === 401) {
        router.replace("/(auth)");
        return;
      }

      const listaReais = json?.data || json || [];

      const formatados: Sensor[] = Array.isArray(listaReais)
        ? listaReais.map((d: any) => {

            return {
              id: d._id,
              nome: d.nome || d.nome_dispositivo || "Dispositivo",
              local: d.localizacao || d.local || "Área Externa",
              tipo: d.tipo || "SENSOR",
              status: (d.ativo ? "Ativo" : "Inativo") as "Ativo" | "Inativo",

              criadoPor:
                d.usuario?.nome_completo ??
                d.usuario?.email?.split("@")[0] ??
                "Usuário removido",
            };
          })
        : [];

      setSensores(formatados);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchSensores();
  }, [token]);

  const renderSensor = ({ item }: { item: Sensor }) => {
    const tipoUpper = item.tipo?.toUpperCase() || "";
    const isCamera = tipoUpper.includes("CAM") || tipoUpper.includes("CAMERA");

    return (
      <TouchableOpacity
        onPress={() => {
          const route = isCamera
            ? "/(admin)/detalhes-camera"
            : "/(admin)/detalhes-sensor";
          router.push({
            pathname: route as any,
            params: { id: item.id, nome: item.nome, local: item.local },
          });
        }}
      >
        <View style={styles.sensorCard}>
          <View style={styles.sensorIconContainer}>
            <MaterialCommunityIcons
              name={isCamera ? "camera" : "molecule"}
              size={32}
              color="#2A3A56"
            />
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorTitle}>{item.nome}</Text>
            <View style={styles.locationRow}>
              <Feather name="cpu" size={12} color="#777" />
              <Text style={styles.locationText}>{item.tipo}</Text>
            </View>
            <View style={styles.locationRow}>
              <Feather name="user" size={12} color="#777" />
              <Text style={styles.locationText}>{item.criadoPor}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === "Ativo" ? "#66FF66" : "#FF6666",
                },
              ]}
            />
            <Text style={styles.statusLabel}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/(tabs)/home-admin")}
            >
              <Feather name="arrow-left" size={28} color="#2A3A56" />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Monitoramento</Text>
              <Text style={styles.subwelcomeText}>Sensor</Text>
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

        {/* CONTEÚDO BRANCO */}
        <View style={styles.content}>
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#95C159"
                style={{ marginTop: 40 }}
              />
            ) : (
              <FlatList
                data={sensores}
                keyExtractor={(item) => item.id}
                renderItem={renderSensor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchSensores(true)}
                  />
                }
              />
            )}
          </View>

          {/* BOTÃO FORA DO SCROLL PARA FICAR FIXO */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.floatingAddBtn}
              onPress={() => router.push("/(admin)/sensors")}
            >
              <Feather name="plus" size={20} color="#2A3A56" />
              <Text style={styles.floatingAddBtnText}>Novo Sensor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// -------------------
// Main Container & Layout
// -------------------

const styles = StyleSheet.create({
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
    paddingTop: 40,
  },
  listContent: {
    paddingBottom: 20,
  },

  // -------------------
  // Header Section
  // -------------------

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
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  textContainer: {
    flex: 1,
    marginLeft: 20,
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

  // -------------------
  // Avatar Components
  // -------------------

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
    color: "#2A3A56",
  },

  // -------------------
  // Sensor Card Items
  // -------------------

  sensorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F9EE",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  sensorIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sensorInfo: {
    flex: 1,
    marginLeft: 15,
  },
  sensorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A3A56",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#777",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: "#2A3A56",
  },

  // -------------------
  // Floating Actions
  // -------------------

  buttonWrapper: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  floatingAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  floatingAddBtnText: {
    marginLeft: 8,
    color: "#2A3A56",
    fontWeight: "bold",
    fontSize: 16,
  },
});
