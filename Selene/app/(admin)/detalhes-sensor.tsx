import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function DetalhesSensor() {
  const router = useRouter();
  const { id, nome } = useLocalSearchParams();
  const [iniciais, setIniciais] = useState("US");
  const [token, setToken] = useState<string | null>(null);
  const [leituras, setLeituras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const buscarLeituras = useCallback(
    async (sensorId: string, adminToken: string) => {
      try {
        const response = await fetch(
          `${API_V1}/dispositivos/${sensorId}/leituras`,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao buscar leituras");
        }

        // 🔥 GARANTE ARRAY
        let lista = [];

        if (Array.isArray(data)) {
          lista = data;
        } else if (Array.isArray(data?.data)) {
          lista = data.data;
        } else if (Array.isArray(data?.leituras)) {
          lista = data.leituras;
        }

        setLeituras(lista);
      } catch (error: any) {

        setLeituras([]);

        Alert.alert(
          "Erro",
          error.message || "Falha ao carregar leituras",
        );
      } finally {
        setTimeout(() => {
          setLoading(false);
          setRefreshing(false);
        }, 500);
      }
    },
    [],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const sensorId = Array.isArray(id) ? id[0] : id;
    if (sensorId && token) {
      await buscarLeituras(sensorId, token);
    } else {
      setRefreshing(false);
    }
  }, [id, token, buscarLeituras]);

  useEffect(() => {
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
        const sensorId = Array.isArray(id) ? id[0] : id;
        if (sensorId) await buscarLeituras(sensorId, adminToken);

        if (adminName) {
          const partes = adminName.trim().split(" ");
          setIniciais(
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase(),
          );
        }
      } catch (e) {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, buscarLeituras]);

  const handleExcluir = () => {
    Alert.alert("Excluir Sensor", `Deseja realmente remover o ${nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const sensorId = Array.isArray(id) ? id[0] : id;
            if (!token) return;
            const response = await fetch(
              `${API_V1}/dispositivos/${sensorId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            if (!response.ok) throw new Error("Erro ao excluir");
            Alert.alert("Sucesso", "Sensor removido");
            router.replace("/(admin)/(tabs)/monitoring");
          } catch (error: any) {
            Alert.alert("Erro", error.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2A3A56" />
      </View>
    );
  }

  const ultimaLeitura = Array.isArray(leituras)
    ? leituras
      .filter((l) => l.tipo_leitura === "SENSORES" && l.timestamp)
      .sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
        );
      })[0]
    : null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/(tabs)/monitoring")}
            >
              <Feather name="arrow-left" size={28} color="#2A3A56" />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>{nome || "Sensor"}</Text>
              <Text style={styles.subwelcomeText}>
                {ultimaLeitura?.tipo_leitura === "SENSORES"
                  ? "ESP32-SENSOR"
                  : "ESP32-CAM"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push("/(admin)/profile-admin")}
            >
              <Text style={styles.avatarText}>{iniciais}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#95C159"]}
                tintColor="#95C159"
              />
            }
          >
            <Text style={styles.panelTitle}>PAINEL DE CONTROLE</Text>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="activity" size={18} color="#2A3A56" />
                <Text style={styles.sectionTitle}>Dados do Sensor</Text>
              </View>

              <View style={styles.alertRow}>
                <Text style={styles.alertText}>
                  🌡 Temperatura:{" "}
                  {ultimaLeitura?.dados?.temperatura != null
                    ? Number(ultimaLeitura.dados.temperatura).toFixed(0)
                    : "--"}{" "}
                  °C
                </Text>
              </View>

              <View style={styles.alertRow}>
                <Text style={styles.alertText}>
                  💧 Umidade:{" "}
                  {ultimaLeitura?.dados?.umidade != null
                    ? Number(ultimaLeitura.dados.umidade).toFixed(0)
                    : "--"}{" "}
                  %
                </Text>
              </View>

              <View style={styles.alertRow}>
                <Text style={styles.alertText}>
                  ☀️ Luminosidade:{" "}
                  {ultimaLeitura?.dados?.luminosidade != null
                    ? Number(ultimaLeitura.dados.luminosidade).toFixed(0)
                    : "--"}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="clock" size={18} color="#2A3A56" />
                <Text style={styles.sectionTitle}>Última Atualização</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "100%" }]}>
                  <Text style={styles.progressText}>
                    {ultimaLeitura?.timestamp
                      ? new Date(ultimaLeitura.timestamp).toLocaleString(
                        "pt-BR",
                        {
                          timeZone: "America/Sao_Paulo",
                        },
                      )
                      : "--"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {

                router.push({
                  pathname: "/(admin)/edit-sensors",
                  params: {
                    id: String(id),
                  },
                });
              }}
            >
              <Feather name="edit-2" size={20} color="#FFF" />
              <Text style={styles.editBtnText}>Editar Sensor</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleExcluir}>
              <Feather name="trash-2" size={20} color="#FFF" />
              <Text style={styles.deleteBtnText}>Excluir Sensor</Text>
            </TouchableOpacity>
          </ScrollView>
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
  // Dashboard / Section Cards
  // -------------------

  panelTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2A3A56",
    marginBottom: 20,
    letterSpacing: 1,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#E8F9EE",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  // -------------------
  // Alertas & List Items
  // -------------------

  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    color: "#2A3A56",
    flex: 1,
  },

  // -------------------
  // Progress Bar
  // -------------------

  progressBarBg: {
    height: 35,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#45E3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  // -------------------
  // Buttons & Actions
  // -------------------

  deleteBtn: {
    flexDirection: "row",
    backgroundColor: "#FF6666",
    height: 55,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  deleteBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  editBtn: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    height: 55,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  editBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
