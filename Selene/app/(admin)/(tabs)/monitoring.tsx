import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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
              color={Colors.text}
            />
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorTitle}>{item.nome}</Text>
            <View style={styles.locationRow}>
              <Feather name="cpu" size={12} color={Colors.mutedLight} />
              <Text style={styles.locationText}>{item.tipo}</Text>
            </View>
            <View style={styles.locationRow}>
              <Feather name="user" size={12} color={Colors.mutedLight} />
              <Text style={styles.locationText}>{item.criadoPor}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === "Ativo" ? "#66FF66" : Colors.danger,
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
              <Feather name="arrow-left" size={28} color={Colors.text} />
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


        <View style={styles.content}>
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={{ marginTop: Spacing.section }}
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


          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.floatingAddBtn}
              onPress={() => router.push("/(admin)/sensors")}
            >
              <Feather name="plus" size={20} color={Colors.text} />
              <Text style={styles.floatingAddBtnText}>Novo Sensor</Text>
            </TouchableOpacity>
          </View>
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
  listContent: {
    paddingBottom: Spacing.lg,
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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
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


  sensorCard: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F9EE",
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
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
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
  locationText: {
    fontSize: Typography.small,
    color: Colors.mutedLight,
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
    fontSize: Typography.small,
    color: Colors.text,
  },


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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xxl,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  floatingAddBtnText: {
    marginLeft: Spacing.xs,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
});
