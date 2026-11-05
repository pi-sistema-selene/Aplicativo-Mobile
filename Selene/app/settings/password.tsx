import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function PasswordScreen() {
  const router = useRouter();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [iniciais, setIniciais] = useState("AL");

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleGoProfile = async () => {
    const role = await SecureStore.getItemAsync("userRole");
    const isAdmin = role === "admin" || role === "superadmin";

    router.push(isAdmin ? "/(admin)/profile-admin" : "/(tabs)/profile");
  };

  useEffect(() => {
    const carregarIniciais = async () => {
      const nome = await SecureStore.getItemAsync("userName");
      if (nome) {
        const partes = nome.trim().split(" ");
        const init =
          partes.length > 1
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : partes[0][0].toUpperCase();
        setIniciais(init);
      }
    };
    carregarIniciais();
  }, []);

  const handleUpdatePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Erro", "A nova senha e a confirmação não são iguais.");
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert(
          "Erro de Sessão",
          "Acesso não encontrado. Faça login novamente.",
        );
        return;
      }

      const body = JSON.stringify({
        senhaAtual,
        novaSenha,
      });

      try {
        const response = await fetch(
          `${API_V1}/auth/alterar-senha`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body,
          },
        );

        const data = await response.json();

        if (response.ok && data.success) {
          Alert.alert("Sucesso!", "Sua senha foi atualizada com segurança.");
          router.back();
          return;
        }

        throw new Error(data.message);
      } catch (errorUser: any) {
        try {
          const responseAdmin = await fetch(
            `${API_V1}/admin/alterar-senha`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body,
            },
          );

          const dataAdmin = await responseAdmin.json();

          if (responseAdmin.ok && dataAdmin.success) {
            Alert.alert("Sucesso!", "Senha de administrador atualizada.");
            router.back();
            return;
          }

          throw new Error(dataAdmin.message);
        } catch (errorAdmin: any) {
          Alert.alert(
            "Ops!",
            errorAdmin.message ||
              errorUser.message ||
              "Algo deu errado ao trocar a senha.",
          );
        }
      }
    } catch (error) {
      console.error("Erro geral:", error);
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Configurações</Text>
              <Text style={styles.subwelcomeText}>Senha</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handleGoProfile}
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.cardInfo}>
              Mantenha sua conta segura atualizando sua senha regularmente.
            </Text>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Atual:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showSenhaAtual}
                  style={styles.input}
                  placeholderTextColor={Colors.progressText}
                  value={senhaAtual}
                  autoCapitalize="none"
                  onChangeText={setSenhaAtual}
                />
                <TouchableOpacity
                  onPress={() => setShowSenhaAtual(!showSenhaAtual)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showSenhaAtual ? "eye" : "eye-off"}
                    size={20}
                    color={Colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showNovaSenha}
                  style={styles.input}
                  placeholderTextColor={Colors.progressText}
                  value={novaSenha}
                  autoCapitalize="none"
                  onChangeText={setNovaSenha}
                />
                <TouchableOpacity
                  onPress={() => setShowNovaSenha(!showNovaSenha)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showNovaSenha ? "eye" : "eye-off"}
                    size={20}
                    color={Colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nova Senha:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showConfirmarSenha}
                  style={styles.input}
                  placeholderTextColor={Colors.progressText}
                  value={confirmarSenha}
                  autoCapitalize="none"
                  onChangeText={setConfirmarSenha}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showConfirmarSenha ? "eye" : "eye-off"}
                    size={20}
                    color={Colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnText}>Salvar Nova Senha</Text>
              )}
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

  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },

  cardInfo: {
    fontSize: Typography.small,
    color: Colors.muted,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },

  inputGroup: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBF8",
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  input: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.subtitle,
  },

  eyeIcon: {
    padding: 5,
  },

  mainButton: {
    backgroundColor: Colors.text,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  confirmButton: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
  },

  btnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
