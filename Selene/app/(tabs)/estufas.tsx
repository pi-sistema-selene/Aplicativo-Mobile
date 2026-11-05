import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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

  const renderItem = ({ item }: { item: Estufa }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/estufa/${item._id}`)}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="greenhouse" size={28} color={Colors.accent} />
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
                  color={Colors.text}
                  style={{ marginLeft: Spacing.sm }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View style={styles.content}>
          {loadingEstufas ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
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
                      <Feather name="refresh-cw" size={18} color={Colors.accent} />
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
  container: { flex: 1, backgroundColor: Colors.primary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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

  welcomeText: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.text },
  subwelcomeText: { fontSize: Typography.body, color: Colors.text, opacity: 0.8 },

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

  avatarText: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },

  statsSummary: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F9F7",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },

  statsText: { fontSize: Typography.small, color: Colors.text },
  statsValue: { fontWeight: FontWeight.bold, fontSize: Typography.medium },
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

  monthTitle: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },

  card: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
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

  estufaNome: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },
  estufaData: { fontSize: Typography.caption, color: Colors.info },

  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 18,
    borderRadius: Radius.xl,
  },

  statusBaixo: { backgroundColor: Colors.primary },
  statusMedio: { backgroundColor: "#A5A5A5" },

  statusText: { color: Colors.white, fontWeight: FontWeight.bold },

  btnNovaEstufa: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#D1FFD7",
    paddingVertical: 14,
    paddingHorizontal: Spacing.section,
    borderRadius: Radius.xxl,
  },

  btnText: { color: Colors.text, fontWeight: FontWeight.bold },

  emptyText: {
    textAlign: "center",
    color: Colors.mutedLight,
    marginTop: Spacing.section,
  },
});
