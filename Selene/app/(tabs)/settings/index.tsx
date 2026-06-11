import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

// ==========================================
// DEFINIÇÃO DOS ITENS DO MENU (MAP)
// ==========================================
const menuItems = [
  {
    id: "1",
    label: "Configurações Notificação",
    icon: "notifications-outline",
    route: "/settings/notifications",
  },
  {
    id: "2",
    label: "Configurações Senha",
    icon: "key-outline",
    route: "/settings/password",
  },
  {
    id: "3",
    label: "Suporte",
    icon: "help-circle-outline",
    route: "/support",
  },
  {
    id: "4",
    label: "Deletar Conta",
    icon: "person-remove-outline",
    route: "/settings/delete-account",
  },
];

export default function SettingsMenu() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [iniciais, setIniciais] = useState("US");
  const [loading, setLoading] = useState(true);
  const [loadingEstufas, setLoadingEstufas] = useState(true);

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* ---------------------------------------------------------
        INÍCIO DO HEADER (VERDE SELENE)
    ---------------------------------------------------------- */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Configurações</Text>
              <Text style={styles.subwelcomeText}>Suas Configurações</Text>
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
        {/* ---------------------------------------------------------
        FIM DO HEADER
    ---------------------------------------------------------- */}

        {/* ---------------------------------------------------------
        LISTA DE OPÇÕES (MENU)
    ---------------------------------------------------------- */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                {/* ÍCONE DENTRO DO CÍRCULO */}
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={20} color="#FFF" />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </View>

              {/* SETA PARA A DIREITA (CHEVRON) */}
              <Ionicons name="chevron-forward" size={20} color="#2A3A56" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* ---------------------------------------------------------
        FIM DA LISTA
    ---------------------------------------------------------- */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ==========================================
// ESTILIZAÇÃO (STYLES)
// ==========================================
const styles = StyleSheet.create({
  // Estrutura Principal
  container: { flex: 1, backgroundColor: "#95C159" },

  // Header Superior
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

  // Itens Individuais do Menu
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00D1A0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuText: { fontSize: 15, color: "#2A3A56", fontWeight: "600" },

  // Painel Branco Arredondado
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontWeight: "600",
  },
});
