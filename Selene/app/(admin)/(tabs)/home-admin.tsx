import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_V1 } from "@/constants/api";

export default function AdminHome() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Administrador");
  const [iniciais, setIniciais] = useState("US");
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  const [stats, setStats] = useState({
    usuarios_total: 0,
    sensores_operantes: 0,
    sensores_online: 0,
    plantas_ativas: 0,
  });

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync("userName");
        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(" ");
          const primeiroSegundo =
            partes.length > 1 ? `${partes[0]} ${partes[1]}` : partes[0];
          setNomeUsuario(primeiroSegundo);

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();
          setIniciais(init);
        }
      } catch (e) {
        console.error("Erro ao carregar dados do SecureStore", e);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosUsuario();
  }, []);

  useEffect(() => {
    const carregarStats = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          return;
        }

        const response = await axios.get(
          `${API_V1}/admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setStats(response.data.data);
      } catch (error: any) { }
    };

    carregarStats();
  }, []);

  const MenuButton = ({ title, subtitle, icon, onPress }: any) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <View>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Text style={styles.welcomeText}>Olá, {nomeUsuario}</Text>
                  <Text style={styles.subwelcomeText}>
                    Bem-vindo novamente!
                  </Text>
                </>
              )}
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => router.push("/(admin)/profile-admin")}
              >
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Feather name="external-link" size={14} color={Colors.text} />
              <Text style={styles.statLabel}>Produtores Online</Text>
            </View>

            <Text style={styles.statValue}>{stats.usuarios_total}</Text>
          </View>


          <View style={styles.divider} />


          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Feather name="cpu" size={14} color={Colors.text} />
              <Text style={styles.statLabel}>Sensores Operantes</Text>
            </View>

            <Text style={styles.statValueSensor}>{stats.sensores_online}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          >
            <MenuButton
              title="Controle de Acessos"
              subtitle="Informações sobre usuários ativos no sistema."
              icon={
                <MaterialCommunityIcons
                  name="account-cog-outline"
                  size={24}
                  color={Colors.white}
                />
              }
              onPress={() => router.push("/(admin)/(tabs)/users")}
            />

            <MenuButton
              title="Controle Sensores"
              subtitle="Medir o controle dos sensores em campo."
              icon={<Feather name="cpu" size={24} color={Colors.white} />}
              onPress={() => router.push("/(admin)/(tabs)/monitoring")}
            />

            <MenuButton
              title="Atualizações de Suporte"
              subtitle="Solicitações de suporte dos produtores."
              icon={
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={24}
                  color={Colors.white}
                />
              }
              onPress={() => router.push("/support/lista")}
            />

            <MenuButton
              title="Notas de Atualização"
              subtitle="Acompanhe as atualizações recentes da aplicação."
              icon={<Feather name="gift" size={24} color={Colors.white} />}
              onPress={() => router.push("/(admin)/(tabs)/statistics")}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.section,
    marginTop: Spacing.xxl,
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  notificationBtn: {
    backgroundColor: Colors.white,
    padding: Spacing.xs,
    borderRadius: Radius.xl,
  },


  greeting: {
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    color: Colors.text
  },
  welcomeText: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text
  },
  subwelcomeText: {
    fontSize: Typography.body,
    color: Colors.text,
    opacity: 0.8
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
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
    color: Colors.text
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  profileInitials: {
    fontWeight: FontWeight.bold,
    color: Colors.text
  },


  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  statLabel: {
    color: Colors.text,
    fontSize: Typography.small,
  },
  statValue: {
    color: Colors.white,
    fontSize: Typography.hero,
    fontWeight: FontWeight.bold,
  },
  statValueSensor: {
    color: Colors.info,
    fontSize: Typography.hero,
    fontWeight: FontWeight.bold,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: Spacing.lg,
  },


  card: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    alignItems: "center",
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: Radius.md,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1
  },
  cardTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: Typography.caption,
    color: Colors.mutedLight,
    lineHeight: 16,
  },
});