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
import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import { API_V1, getApiAssetUrl } from "@/constants/api";
import { useLogout } from "@/hooks/useLogout";
import { getInitials } from "@/utils/initials";
import { isAdminRole } from "@/utils/role";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useLogout();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [iniciais, setIniciais] = useState("US");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
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
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);

        setIsAdmin(isAdminRole(role));

        if (token) {
          const response = await fetch(`${API_V1}/auth/perfil`, {
            headers: { Authorization: "Bearer " + token },
          });

          if (response.ok) {
            const profile = await response.json();
            if (profile.data?.foto_perfil) {
              setFotoUri(getApiAssetUrl(profile.data.foto_perfil));
            }
          }
        }

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

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
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
                  color={Colors.text}
                  style={{ marginLeft: Spacing.sm }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>



        <View style={styles.content}>

          <View style={styles.imageContainer}>
            <Image
              source={
                fotoUri
                  ? { uri: fotoUri }
                  : require("../assets/images/user-icon.png")
              }
              style={styles.profileImage}
            />
          </View>


          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: Spacing.lg }}
            />
          ) : (
            <>
              <Text style={styles.userName}>{userData.nome || "Usuário"}</Text>
              <Text style={styles.userId}>ID: {userData.id}</Text>
            </>
          )}


          <ScrollView
            style={styles.menuList}
            showsVerticalScrollIndicator={false}
          >

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
                      { backgroundColor: Colors.text },
                    ]}
                  >
                    <Ionicons name="people-outline" size={22} color={Colors.white} />
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
                      { backgroundColor: Colors.text },
                    ]}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={22}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.menuText}>Gerenciar Sensores</Text>
                </TouchableOpacity>

                <View style={styles.divider} />
              </View>
            )}


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/edit-profile")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: Colors.primary },
                ]}
              >
                <Ionicons name="person-outline" size={22} color={Colors.white} />
              </View>
              <Text style={styles.menuText}>Editar Perfil</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings/password")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: Colors.primary },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={Colors.white}
                />
              </View>
              <Text style={styles.menuText}>Segurança</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/support")}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: Colors.primary },
                ]}
              >
                <Ionicons name="headset-outline" size={22} color={Colors.white} />
              </View>
              <Text style={styles.menuText}>Suporte</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 10 }]}
              onPress={logout}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: Colors.danger },
                ]}
              >
                <MaterialCommunityIcons name="logout" size={22} color={Colors.white} />
              </View>
              <Text style={[styles.menuText, { color: Colors.danger }]}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topContainer: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 60,
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
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
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

  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },

  profileCard: {
    paddingHorizontal: Spacing.card,
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: -40,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.card,
    paddingTop: 70,
    marginBottom: Spacing.cardGap,
    elevation: 5,
  },

  imageContainer: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    backgroundColor: Colors.white,
    padding: 5,
    borderRadius: 65,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  userName: {
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
  },

  userId: {
    fontSize: Typography.body,
    color: Colors.text,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: Spacing.xl,
  },

  menuList: {
    paddingHorizontal: Spacing.xl,
  },

  sectionLabel: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.progressText,
    textTransform: "uppercase",
    marginBottom: 15,
    marginLeft: 5,
  },

  menuItem: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  menuText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },

  adminSection: {
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 15,
  },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: 80,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
});
