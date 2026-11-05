import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [notificacoes, setNotificacoes] = useState(true);
  const [salvarLogin, setSalvarLogin] = useState(true);

  const [idExibicao, setIdExibicao] = useState("00000000");
  const [iniciais, setIniciais] = useState("US");
  const [fotoUri, setFotoUri] = useState<string | null>(null);


  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          Alert.alert("Erro", "Usuário não autenticado");
          return;
        }

        const role = await SecureStore.getItemAsync("userRole");

        const endpoint =
          role === "admin" || role === "superadmin"
            ? `${API_V1}/admin/perfil`
            : `${API_V1}/users/${id}`;

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Erro ao carregar usuário");
        }

        const user = data.data;

        setNome(user.nome_completo || "");
        setTelefone(user.telefone || "");
        setEmail(user.email || "");
        setEndereco(user.endereco || "");

        if (user._id) {
          setIdExibicao(user._id.substring(0, 8));
        }

        if (user.nome_completo) {
          const partes = user.nome_completo.trim().split(/\s+/);

          setIniciais(
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase(),
          );
        }
      } catch (error: any) {
        Alert.alert("Erro", error.message || "Erro ao carregar usuário");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id]);


  const handleSalvar = async () => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const res = await fetch(
        `${API_V1}/admin/perfil`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome_completo: nome,
            email,
            telefone,
            endereco,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {

        throw new Error(data.message || "Erro ao atualizar");
      }

      Alert.alert("Sucesso", "Usuário atualizado!");

      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro inesperado");
    } finally {
      setSaving(false);
    }
  };


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
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Editar Usuário</Text>
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

            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{nome}</Text>

          <Text style={styles.userId}>ID: {idExibicao}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingBottom: 150 }}>
              <Text style={styles.sectionTitle}>Configurações Usuário</Text>


              <Text style={styles.label}>Nome:</Text>

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome completo"
              />


              <Text style={styles.label}>Telefone:</Text>

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />


              <Text style={styles.label}>Email:</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="email@email.com"
              />


              <Text style={styles.label}>Endereço:</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                value={endereco}
                onChangeText={setEndereco}
                multiline
                placeholder="Endereço"
              />


              <View style={styles.switchRow}>
                <Text style={styles.label}>Ativar Notificações</Text>

                <Switch
                  value={notificacoes}
                  onValueChange={setNotificacoes}
                  trackColor={{
                    false: "#767577",
                    true: Colors.accent,
                  }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Salvar Login</Text>

                <Switch
                  value={salvarLogin}
                  onValueChange={setSalvarLogin}
                  trackColor={{
                    false: "#767577",
                    true: Colors.accent,
                  }}
                />
              </View>


              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSalvar}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: 60,
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

  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: Colors.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
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
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },

  label: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  input: {
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.md,
    minHeight: 45,
    paddingHorizontal: 15,
    marginBottom: Spacing.lg,
    color: Colors.text,
  },

  textArea: {
    height: 100,
    paddingTop: Spacing.sm,
    textAlignVertical: "top",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  saveBtn: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: Spacing.xxl,
  },

  saveBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
});
