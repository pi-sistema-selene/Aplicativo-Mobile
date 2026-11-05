import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

import { StyleSheet } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [iniciais, setIniciais] = useState("US");
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [userData, setUserData] = useState({
    nome: "",
    id: "",
    iniciais: "",
  });

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          setLoading(true);

          const nomeCompleto = await SecureStore.getItemAsync("userName");
          const userId = await SecureStore.getItemAsync("userId");
          const role = await SecureStore.getItemAsync("userRole");

          setIsAdmin(role === "admin" || role === "superadmin");

          if (nomeCompleto) {
            const partes = nomeCompleto.trim().split(/\s+/);

            const init =
              partes.length > 1
                ? (partes[0][0] + partes[1][0]).toUpperCase()
                : partes[0][0].toUpperCase();

            setIniciais(init);

            setUserData({
              nome: nomeCompleto,
              id: userId ? userId.substring(0, 8) : "--------",
              iniciais: init,
            });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      loadUserData();
    }, []),
  );

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userRole");
            await SecureStore.deleteItemAsync("userName");
            await SecureStore.deleteItemAsync("userEmail");
            await SecureStore.deleteItemAsync("userId");

            router.replace("/(auth)");
          } catch (e) {
            console.error(
              "Erro ao deslogar:",
              e instanceof Error ? e.message : e,
            );
          }
        },
      },
    ]);
  };

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
            </View>
          </View>
        </View>



        <View style={styles.content}>

          <View style={styles.imageContainer}>
            <Image
              source={
                fotoUri
                  ? { uri: fotoUri }
                  : require("../../assets/images/user-icon.png")
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

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                const userId = await SecureStore.getItemAsync("userId");

                router.push({
                  pathname: "/(admin)/edit-profile-admin",
                  params: { id: userId || "" },
                });
              }}
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
              onPress={() => router.push("/(admin)/(tabs)/reports")}
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
              onPress={handleLogout}
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
    paddingTop: 80,
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
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "left",
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
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
  menuItem: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.cardGap,
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
  sectionLabel: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    color: Colors.progressText,
    textTransform: "uppercase",
    marginBottom: 15,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
  adminSection: {
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 15,
  },
});
