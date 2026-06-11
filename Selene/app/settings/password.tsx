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

  // ==========================================
  // ESTADOS (STATES)
  // ==========================================
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [iniciais, setIniciais] = useState("AL");

  // Visibilidade das senhas independente
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleGoProfile = async () => {
    const role = await SecureStore.getItemAsync("userRole");
    const isAdmin = role === "admin" || role === "superadmin";

    router.push(isAdmin ? "/(admin)/profile-admin" : "/(tabs)/profile");
  };

  // ==========================================
  // LOGICA DE INICIAIS
  // ==========================================
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

  // ==========================================
  // CHAMADA API
  // ==========================================
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

      // 🔹 1ª tentativa: USER
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
        // 🔹 2ª tentativa: ADMIN
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
        {/* ---------------------------------------------------------
            INÍCIO DO HEADER (VERDE SELENE)
        ---------------------------------------------------------- */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
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
        {/* FORMULÁRIO EM CARD */}
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.cardInfo}>
              Mantenha sua conta segura atualizando sua senha regularmente.
            </Text>

            {/* Senha Atual */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Atual:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showSenhaAtual}
                  style={styles.input}
                  placeholderTextColor="#A0A0A0"
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
                    color="#2A3A56"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showNovaSenha}
                  style={styles.input}
                  placeholderTextColor="#A0A0A0"
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
                    color="#2A3A56"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nova Senha:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••••••"
                  secureTextEntry={!showConfirmarSenha}
                  style={styles.input}
                  placeholderTextColor="#A0A0A0"
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
                    color="#2A3A56"
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
                <ActivityIndicator color="#FFF" />
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
  // =========================
  // CONTAINER PRINCIPAL
  // =========================
  container: {
    flex: 1,
    backgroundColor: "#95C159",
  },

  // =========================
  // HEADER (TOPO VERDE)
  // =========================
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

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  subwelcomeText: {
    fontSize: 14,
    color: "#2A3A56",
    opacity: 0.8,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  // =========================
  // AVATAR
  // =========================
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

  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  // =========================
  // CONTEÚDO (PAINEL BRANCO)
  // =========================
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

  cardInfo: {
    fontSize: 13,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },

  // =========================
  // INPUTS / FORMULÁRIO
  // =========================
  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A3A56",
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBF8",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  input: {
    flex: 1,
    color: "#2A3A56",
    fontSize: 16,
  },

  eyeIcon: {
    padding: 5,
  },

  // =========================
  // BOTÕES
  // =========================
  mainButton: {
    backgroundColor: "#2A3A56",
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  confirmButton: {
    backgroundColor: "#00D1A0",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  btnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
