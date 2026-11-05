import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { API_V1 } from "@/constants/api";

interface Usuario {
  id: string;
  nome: string;
  data: string;
  cargo: string;
  codigo: string;
}

export default function ControleAcessoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [iniciais, setIniciais] = useState("US");
  const [filterActive, setFilterActive] = useState("Dia");

  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "null";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "Data inválida";

    return (
      date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
      }) +
      " - " +
      date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  useEffect(() => {
    const loadUser = async () => {
      const nome = await SecureStore.getItemAsync("userName");

      if (nome) {
        const parts = nome.split(" ");

        const init =
          parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0][0].toUpperCase();

        setIniciais(init);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadToken = async () => {
      const t = await SecureStore.getItemAsync("userToken");
      setToken(t);
    };

    loadToken();
  }, []);

  const normalizeList = (res: any) => {
    const data = res?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.usuarios)) return data.usuarios;
    if (Array.isArray(data?.admins)) return data.admins;

    return [];
  };

  const fetchDados = async () => {
    try {
      setLoading(true);

      const [resUsers, resAdmins] = await Promise.all([
        fetch(`${API_V1}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_V1}/admin/listar`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const usersData = await resUsers.json();
      const adminsData = await resAdmins.json();

      const usersFormatted = normalizeList(usersData).map(
        (u: any, index: number) => ({
          id: u._id || index.toString(),
          nome: u.nome_completo || u.nome || "Usuário",
          data: formatDate(u.criado_em),
          cargo: "Produtor",
          codigo: (u._id || "000000").slice(-7),
        }),
      );

      const adminsFormatted = normalizeList(adminsData).map(
        (u: any, index: number) => ({
          id: u._id || index.toString(),
          nome: u.nome_completo || u.usuario || "Admin",
          data: formatDate(u.criado_em),
          cargo: "Admin",
          codigo: (u._id || "000000").slice(-7),
        }),
      );

      setUsuarios(usersFormatted);
      setAdmins(adminsFormatted);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchDados();
      }
    }, [token]),
  );

  const renderUserItem = (item: Usuario) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(admin)/see-profile",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.userCard}>
        <View style={styles.userIconContainer}>
          <Feather name="user" size={24} color={Colors.white} />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nome}</Text>
          <Text style={styles.userData}>{item.data}</Text>
        </View>

        <View style={styles.roleContainer}>
          <View style={styles.verticalLine} />

          <Text style={styles.roleText}>{item.cargo}</Text>

          <View style={styles.verticalLine} />
        </View>

        <Text style={styles.userCode}>{item.codigo}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Novo Cadastro</Text>
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

        <View style={styles.statsContainer}>
          <View style={styles.mainStatCard}>
            <Text style={styles.statLabelLink}>Contas Cadastradas</Text>

            <Text style={styles.statValueBig}>
              {usuarios.length + admins.length}
            </Text>
          </View>

          <View style={styles.secondaryStatsRow}>
            <View style={styles.subStat}>
              <View style={styles.subStatLabelRow}>
                <Feather name="external-link" size={14} color={Colors.text} />

                <Text style={styles.subStatLabel}>Usuários</Text>
              </View>

              <Text style={styles.subStatValue}>{usuarios.length}</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.subStat}>
              <View style={styles.subStatLabelRow}>
                <Feather name="corner-right-down" size={14} color={Colors.text} />

                <Text style={styles.subStatLabel}>Pendente Validação</Text>
              </View>

              <Text style={[styles.subStatValue, { color: Colors.info }]}>
                --
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtores Cadastrados</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} />
          ) : (
            <FlatList
              data={[...admins, ...usuarios]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderUserItem(item)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 180,
              }}
            />
          )}

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[
                styles.btnNewUser,
                {
                  bottom: insets.bottom + 20,
                },
              ]}
              onPress={() => router.push("/(admin)/novo-usuario")}
            >
              <Text style={styles.btnNewUserText}>Novo Cadastro</Text>
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


  statsContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  mainStatCard: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    alignItems: "center",
  },
  statValueBig: {
    fontSize: Typography.stat,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  statLabelLink: {
    color: Colors.text,
    textDecorationLine: "underline",
    fontWeight: FontWeight.bold,
  },
  secondaryStatsRow: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  subStat: {
    flex: 1,
    alignItems: "flex-start",
  },
  subStatLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  subStatLabel: {
    fontSize: Typography.small,
    color: Colors.text,
    marginLeft: 5,
  },
  subStatValue: {
    fontSize: Typography.stat,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  verticalDivider: {
    width: 1.5,
    height: 40,
    backgroundColor: Colors.white,
    opacity: 0.6,
    marginHorizontal: 15,
  },


  timeFilterContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F5F0",
    borderRadius: Radius.xxl,
    padding: 5,
    marginBottom: Spacing.xl,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.xl,
  },
  timeBtnActive: {
    backgroundColor: Colors.accent,
  },
  timeBtnText: {
    color: Colors.text,
    fontSize: Typography.body,
  },
  timeBtnTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    fontWeight: FontWeight.bold,
    color: "#1A2E35",
  },
  filterIconBtn: {
    backgroundColor: Colors.accent,
    padding: Spacing.xs,
    borderRadius: Radius.md,
  },


  userCard: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    },
  userIconContainer: {
    width: 50,
    height: 50,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1.5,
    marginLeft: Spacing.sm,
  },
  userName: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: "#1A2E35",
  },
  userData: {
    fontSize: Typography.caption,
    color: Colors.info,
    fontWeight: FontWeight.bold,
  },
  roleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: {
    fontSize: Typography.caption,
    color: Colors.muted,
  },
  userCode: {
    flex: 1,
    fontSize: Typography.medium,
    fontWeight: FontWeight.bold,
    color: Colors.info,
    textAlign: "right",
  },
  verticalLine: {
    width: 1.5,
    height: 35,
    backgroundColor: Colors.accent,
    opacity: 0.4,
    marginHorizontal: Spacing.sm,
  },


  buttonWrapper: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  btnNewUser: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 80,
    right: 80,
    bottom: 20, // Ajustado para evitar o marginBottom: 100 excessivo
  },
  btnNewUserText: {
    color: "#1A2E35",
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
});
