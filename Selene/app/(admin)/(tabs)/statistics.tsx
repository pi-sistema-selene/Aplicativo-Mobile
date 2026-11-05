import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

type Atualizacao = {
  id: string;
  titulo: string;
  data: string;
  status: "Realizado" | "Em andamento";
};

export default function MenuAtualizacoes() {
  const [tab, setTab] = useState<"Realizadas" | "Andamento">("Realizadas");
  const [iniciais, setIniciais] = useState("US");

  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<Atualizacao[]>([]);

  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };

  useEffect(() => {
    carregarDadosUsuario();
    carregarCommits();
  }, []);

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
    } catch (e) { }
  };

  const carregarCommits = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);

      const response = await fetch(
        "https://api.github.com/repos/pi-sistema-selene/Aplicativo-Mobile/commits?per_page=10",
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "Expo-App",
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub respondeu ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        setCommits([]);
        return;
      }

      const commitsFormatados: Atualizacao[] = data.slice(0, 10).map((commit: any) => ({
        id: commit.sha,
        titulo: commit.commit?.message ?? "Sem mensagem",
        data: commit.commit?.author?.date
          ? new Date(commit.commit.author.date).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
          : "--",
        status: "Realizado",
      }));

      setCommits(commitsFormatados);
    } catch (error: any) {

      if (error.name === "AbortError") {
        Alert.alert("Erro", "Tempo de resposta do GitHub excedido");
      } else {
        Alert.alert("Erro", "Não foi possível carregar atualizações do GitHub");
      }

      setCommits([]);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };



  const renderItem = ({ item }: { item: Atualizacao }) => (
    <View style={styles.itemCard}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="source-commit" size={24} color={Colors.white} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.itemTitle}>{item.titulo}</Text>
        <Text style={styles.itemDate}>{item.data}</Text>
      </View>

      <Text style={styles.statusText}>{item.status}</Text>
    </View>
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
              <Text style={styles.welcomeText}>Menu Atualizações</Text>
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
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === "Realizadas" && styles.tabActive,
              ]}
              onPress={() => setTab("Realizadas")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "Realizadas" && styles.tabTextActive,
                ]}
              >
                Realizadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === "Andamento" && styles.tabActive,
              ]}
              onPress={() => setTab("Andamento")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "Andamento" && styles.tabTextActive,
                ]}
              >
                Em andamento
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} />
          ) : (
            <FlatList
              data={commits}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: Spacing.lg }}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    paddingBottom: 80,
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


  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.lg,
    padding: 5,
    marginBottom: Spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.text,
    fontWeight: FontWeight.medium
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold
  },


  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  monthText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text
  },
  calendarIcon: {
    backgroundColor: Colors.accent,
    padding: 6,
    borderRadius: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.cardGap,
  },
  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
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
    color: Colors.text
  },
  itemDate: {
    fontSize: Typography.caption,
    color: "#007BFF",
    marginTop: 2
  },
  statusText: {
    fontSize: Typography.body,
    color: "#007BFF",
    fontWeight: FontWeight.semibold,
  },
});