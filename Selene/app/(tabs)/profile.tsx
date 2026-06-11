import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { IMAGES } from "@/constants/images";
import { Colors } from "@/constants/Colors";
import { useLogout } from "@/hooks/useLogout";
import { getInitials } from "@/utils/initials";
import { isAdminRole } from "@/utils/role";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useLogout();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [iniciais, setIniciais] = useState("US");
  const [userData, setUserData] = useState({
    nome: "",
    id: "",
    iniciais: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const nomeCompleto = await SecureStore.getItemAsync(STORAGE_KEYS.USER_NAME);
        const userId = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
        const role = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);

        setIsAdmin(isAdminRole(role));

        if (nomeCompleto) {
          const init = getInitials(nomeCompleto);
          setIniciais(init);
          setUserData({
            nome: nomeCompleto,
            id: userId ? userId.substring(0, 8) : "--------",
            iniciais: init,
          });
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* ---------------------------------------------------------
                       INÍCIO DO HEADER (VERDE SELENE)
                   ---------------------------------------------------------- */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Perfil</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.avatarCircle}>
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

        {/* CONTEÚDO */}
        <View style={styles.content}>
          {/* FOTO */}
          <View style={styles.imageContainer}>
            <Image
              source={IMAGES.placeholderAvatar}
              style={styles.profileImage}
            />
          </View>

          {/* DADOS */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#95C159"
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              <Text style={styles.userName}>{userData.nome || "Usuário"}</Text>
              <Text style={styles.userId}>ID: {userData.id}</Text>
            </>
          )}

          {/* MENU */}
          <ScrollView
            style={styles.menuList}
            showsVerticalScrollIndicator={false}
          >
            {/* ADMIN */}
            {isAdmin && (
              <View style={styles.adminSection}>
                <Text style={styles.sectionLabel}>Administração</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/(admin)/(tabs)/users")}
                >
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: "#2A3A56" },
                    ]}
                  >
                    <Ionicons name="people-outline" size={22} color="#FFF" />
                  </View>
                  <Text style={styles.menuText}>Gerenciar Usuários</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/(admin)/sensors")}
                >
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: "#2A3A56" },
                    ]}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={22}
                      color="#FFF"
                    />
                  </View>
                  <Text style={styles.menuText}>Gerenciar Sensores</Text>
                </TouchableOpacity>

                <View style={styles.divider} />
              </View>
            )}

            {/* EDITAR PERFIL */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/edit-profile")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "#95C159" },
                ]}
              >
                <Ionicons name="person-outline" size={22} color="#FFF" />
              </View>
              <Text style={styles.menuText}>Editar Perfil</Text>
            </TouchableOpacity>

            {/* SEGURANÇA */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings/password")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "#95C159" },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#FFF"
                />
              </View>
              <Text style={styles.menuText}>Segurança</Text>
            </TouchableOpacity>

            {/* SUPORTE */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/support")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "#95C159" },
                ]}
              >
                <Ionicons name="headset-outline" size={22} color="#FFF" />
              </View>
              <Text style={styles.menuText}>Suporte</Text>
            </TouchableOpacity>

            {/* LOGOUT */}
            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 10 }]}
              onPress={logout}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "#FF4B4B" },
                ]}
              >
                <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
              </View>
              <Text style={[styles.menuText, { color: "#FF4B4B" }]}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ==========================================
// ESTILOS (STYLESHEET)
// ==========================================
const styles = StyleSheet.create({
  // ==========================================
  // ESTRUTURA PRINCIPAL
  // ==========================================
  container: { flex: 1, backgroundColor: "#95C159" },
  topContainer: {
    backgroundColor: "#95C159",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 60,
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
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
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

  textContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },

  // ==========================================
  // CARD DE PERFIL (BRANCO FLUTUANTE)
  // ==========================================
  profileCard: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 40,
    paddingTop: 70,
    marginBottom: 20,
    elevation: 5,
  },

  imageContainer: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    backgroundColor: "#FFF",
    padding: 5,
    borderRadius: 65,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56",
    textAlign: "center",
  },

  userId: {
    fontSize: 14,
    color: "#2A3A56",
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 25,
  },

  // ==========================================
  // MENU / LISTA
  // ==========================================
  menuList: {
    paddingHorizontal: 25,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#A0A0A0",
    textTransform: "uppercase",
    marginBottom: 15,
    marginLeft: 5,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A3A56",
  },

  // ==========================================
  // SEÇÃO ADMIN
  // ==========================================
  adminSection: {
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 15,
  },

  // ==========================================
  // ESTILOS COMPARTILHADOS (PODERIAM SER EXTERNOS)
  // ==========================================
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 80,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontWeight: "600",
  },
});
