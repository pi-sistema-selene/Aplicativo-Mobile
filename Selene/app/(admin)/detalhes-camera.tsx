import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function DetalhesCamera() {
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
    const deviceId = Array.isArray(id) ? id[0] : id;
    if (deviceId && token) {
      await buscarLeituras(deviceId, token);
    } else {
      setRefreshing(false);
    }
  }, [id, token, buscarLeituras]);

  useEffect(() => {
    const bootstrap = async () => {
      const [adminToken, adminName] = await Promise.all([
        SecureStore.getItemAsync("userToken"),
        SecureStore.getItemAsync("userName"),
      ]);

      if (!adminToken) {
        router.replace("/(auth)");
        return;
      }

      setToken(adminToken);
      const deviceId = Array.isArray(id) ? id[0] : id;
      if (deviceId) await buscarLeituras(deviceId, adminToken);

      if (adminName) {
        const partes = adminName.trim().split(" ");
        setIniciais(
          partes.length > 1
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : partes[0][0].toUpperCase(),
        );
      }
    };
    bootstrap();
  }, [id, buscarLeituras]);

  const handleExcluir = () => {
    Alert.alert("Excluir Câmera", `Deseja realmente remover a ${nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const deviceId = Array.isArray(id) ? id[0] : id;
            if (!token) return;
            const response = await fetch(
              `${API_V1}/dispositivos/${deviceId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            if (response.ok) {
              Alert.alert("Sucesso", "Câmera removida");
              router.replace("/(admin)/(tabs)/monitoring");
            } else {
              throw new Error();
            }
          } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir a câmera");
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
        <ActivityIndicator size="large" color={Colors.text} />
        <Text style={{ marginTop: 10, color: Colors.text, fontWeight: FontWeight.bold }}>
          Carregando capturas...
        </Text>
      </View>
    );
  }

  const ultimaLeitura = Array.isArray(leituras)
    ? leituras
      .filter((l) => l.tipo_leitura === "CAMERA" && l.timestamp)
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
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>{nome || "Câmera"}</Text>
              <Text style={styles.subwelcomeText}>
                {ultimaLeitura?.tipo_leitura === "SENSORES"
                  ? "ESP32-SENSOR"
                  : ultimaLeitura?.tipo_leitura === "CAMERA"
                    ? "ESP32-CAM"
                    : "--"}
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
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          >
            <Text style={styles.panelTitle}>HISTÓRICO DE CAPTURAS</Text>

            {leituras.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: Spacing.panel }}>
                <Feather name="camera-off" size={50} color={Colors.border} />
                <Text style={styles.emptyText}>
                  Nenhuma captura disponível.
                </Text>
              </View>
            ) : (
              leituras.map((item) => {
                const path = item.dados?.foto_path;
                if (!path) return null;

                const predicao = item.dados?.predicao;
                const uriImagem = path.startsWith("http")
                  ? path
                  : `https://selene-mobile.onrender.com${path}`;

                const isAnomalia = predicao?.anomalia === true;
                const confiancaPct = predicao?.confianca
                  ? `${(predicao.confianca * 100).toFixed(1)}%`
                  : null;

                return (
                  <View key={item._id} style={styles.imageCard}>
                    <Image
                      source={{ uri: uriImagem }}
                      style={styles.capturedImage}
                    />
                    {predicao && (
                      <View
                        style={[
                          styles.predicaoBadge,
                          isAnomalia
                            ? styles.predicaoAnomalia
                            : styles.predicaoSaudavel,
                        ]}
                      >
                        <Feather
                          name={isAnomalia ? "alert-triangle" : "check-circle"}
                          size={14}
                          color={Colors.white}
                        />
                        <Text style={styles.predicaoText}>
                          {predicao.classe || "—"}
                          {confiancaPct ? ` · ${confiancaPct}` : ""}
                        </Text>
                      </View>
                    )}
                    <View style={styles.imageFooter}>
                      <Feather name="calendar" size={14} color={Colors.text} />
                      <Text style={styles.imageDate}>
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString("pt-BR")
                          : "Data desconhecida"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

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
              <Feather name="edit-2" size={20} color={Colors.white} />
              <Text style={styles.editBtnText}>Editar Sensor</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleExcluir}>
              <Feather name="trash-2" size={20} color={Colors.white} />
              <Text style={styles.deleteBtnText}>Excluir Câmera</Text>
            </TouchableOpacity>
          </ScrollView>
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
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.section,
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
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
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
    color: Colors.text,
  },


  panelTitle: {
    fontSize: Typography.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    letterSpacing: 1,
    textAlign: "center",
  },
  imageCard: {
    marginBottom: Spacing.cardGap,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.card,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  capturedImage: {
    width: "100%",
    height: 280,
    backgroundColor: Colors.borderSubtle,
  },
  predicaoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  predicaoAnomalia: {
    backgroundColor: Colors.danger,
  },
  predicaoSaudavel: {
    backgroundColor: "#27AE60",
  },
  predicaoText: {
    color: Colors.white,
    fontSize: Typography.small,
    fontWeight: FontWeight.bold,
    textTransform: "capitalize",
  },
  imageFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  imageDate: {
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.mutedLight,
    marginTop: 10,
    fontSize: Typography.subtitle,
  },


  deleteBtn: {
    flexDirection: "row",
    backgroundColor: Colors.danger,
    height: 55,
    borderRadius: Radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: 10,
  },
  deleteBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
  editBtn: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    height: 55,
    borderRadius: Radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: 10,
  },
  editBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
});
