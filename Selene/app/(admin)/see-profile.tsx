import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function PerfilUsuarioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [iniciaisLogado, setIniciaisLogado] = useState("US");

  const formatarData = (data: any) => {
    if (!data) return "N/A";

    const d = new Date(data);

    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("pt-BR");
  };

  useEffect(() => {
    const carregarIniciaisHeader = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync("userName");

        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(" ");

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();

          setIniciaisLogado(init);
        }
      } catch (e) {
        console.error(e);
      }
    };

    carregarIniciaisHeader();
  }, [id]);

  useEffect(() => {
    const buscarDadosUsuario = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          Alert.alert("Erro", "Usuário não autenticado");
          return;
        }

        const buscaId = id.toString().replace(/"/g, "").trim();

        let response = await fetch(
          `${API_V1}/users/${buscaId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        let json = await response.json();

        if (response.ok) {
          const usuario = json.data?.usuario || json.data || json.usuario;

          setUserData(usuario);
          return;
        }

        const resUsers = await fetch(
          `${API_V1}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const jsonUsers = await resUsers.json();

        const listaUsers = jsonUsers.data || jsonUsers.usuarios || [];

        const userEncontrado = listaUsers.find(
          (u: any) => (u._id || u.id)?.toString() === buscaId,
        );

        if (userEncontrado) {
          setUserData(userEncontrado);
          return;
        }

        const resAdmin = await fetch(
          `${API_V1}/admin/listar`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const jsonAdmin = await resAdmin.json();

        const listaAdmins = jsonAdmin.data || jsonAdmin.usuarios || [];

        const adminEncontrado = listaAdmins.find(
          (a: any) => (a._id || a.id)?.toString() === buscaId,
        );

        if (adminEncontrado) {
          setUserData(adminEncontrado);
          return;
        }

        Alert.alert("Erro", "Perfil não encontrado em nenhuma das rotas.");
      } catch (error) {
        console.error("Erro fatal na busca:", error);

        Alert.alert("Erro", "Falha ao carregar dados do usuário.");
      } finally {
        setLoading(false);
      }
    };

    buscarDadosUsuario();
  }, [id]);

  const handleExcluir = async () => {
    Alert.alert("Confirmar", "Deseja realmente excluir este usuário?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("userToken");

            if (!token) {
              Alert.alert("Erro", "Usuário não autenticado");
              return;
            }

            const buscaId = id?.toString().replace(/"/g, "").trim();

            const isAdmin =
              userData?.nivel_acesso === "admin" ||
              userData?.nivel_acesso === "superadmin" ||
              userData?.cargo;

            const endpoint = isAdmin
              ? `${API_V1}/admin/${buscaId}`
              : `${API_V1}/users/${buscaId}`;

            const res = await fetch(endpoint, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.message || "Erro ao excluir usuário");
            }

            Alert.alert("Sucesso", "Usuário excluído com sucesso!");

            router.replace("/(admin)/(tabs)/users");
          } catch (error: any) {

            Alert.alert("Erro", error.message || "Falha ao excluir usuário");
          }
        },
      },
    ]);
  };

  const nome =
    userData?.nome_completo ||
    userData?.nome ||
    userData?.usuario ||
    "Não informado";

  const email = userData?.email || "Não informado";

  const telefone =
    userData?.telefone || userData?.celular || userData?.phone || "N/A";

  const dataNascimento =
    userData?.data_nascimento ||
    userData?.dataNascimento ||
    userData?.nascimento ||
    null;

  const endereco = userData?.endereco || "Endereço não informado";

  const nivelAcesso =
    userData?.nivel_acesso || (userData?.cargo ? "admin" : "produtor");

  const nivelLabel =
    nivelAcesso === "superadmin"
      ? "Admin"
      : nivelAcesso === "admin"
        ? "Administrador"
        : "Produtor";

  const foto =
    userData?.foto_perfil ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nome,
    )}&background=00D2B1&color=fff`;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <View style={styles.topContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.replace("/(admin)/(tabs)/users")}
              >
                <Feather name="arrow-left" size={28} color={Colors.text} />
              </TouchableOpacity>

              <View style={styles.textContainer}>
                <Text style={styles.welcomeText}>Perfil Usuário</Text>
              </View>

              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => router.push("/(admin)/profile-admin")}
                >
                  <Text style={styles.avatarText}>{iniciaisLogado}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.topCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nome</Text>

                <Text style={styles.name}>{nome}</Text>

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Nível Acesso
                </Text>

                <Text style={styles.level}>{nivelLabel}</Text>
              </View>

              <Image source={{ uri: foto }} style={styles.image} />
            </View>

            <Text style={styles.sectionTitle}>Informações Cadastro</Text>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Feather name="mail" size={18} color={Colors.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Email</Text>

                <Text style={styles.infoText}>{email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Feather name="calendar" size={18} color={Colors.white} />
              </View>

              <View>
                <Text style={styles.infoLabel}>Data Nascimento</Text>

                <Text style={styles.infoText}>
                  {formatarData(dataNascimento)}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Feather name="phone" size={18} color={Colors.white} />
              </View>

              <View>
                <Text style={styles.infoLabel}>Telefone</Text>

                <Text style={styles.infoText}>{telefone}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <MaterialIcons name="home" size={18} color={Colors.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Endereço</Text>

                <Text style={styles.infoText}>{endereco}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/edit-profile",
                  params: { id },
                })
              }
            >
              <Text style={styles.btnEditText}>Editar Informações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDelete} onPress={handleExcluir}>
              <Text style={styles.btnDeleteText}>Excluir Usuário</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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


  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: Colors.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },


  topCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
  },
  name: {
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  label: {
    fontSize: Typography.caption,
    color: Colors.muted,
  },
  level: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },


  sectionTitle: {
    marginTop: Spacing.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  iconBox: {
    width: 35,
    height: 35,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: Typography.footnote,
    color: Colors.muted,
  },
  infoText: {
    fontSize: Typography.small,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },


  btnEdit: {
    backgroundColor: Colors.accentYellow,
    padding: 15,
    borderRadius: Radius.xxl,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  btnEditText: {
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  btnDelete: {
    backgroundColor: Colors.danger,
    padding: 15,
    borderRadius: Radius.xxl,
    alignItems: "center",
    marginTop: 10,
  },
  btnDeleteText: {
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
