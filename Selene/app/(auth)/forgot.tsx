import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { API_V1 } from "@/constants/api";

export default function ForgotPassword() {
  const router = useRouter();

  // ==========================================
  // ESTADOS (STATES)
  // ==========================================
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // LÓGICA DE RECUPERAÇÃO
  // ==========================================
  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert("Erro", "Por favor, informe seu e-mail.");
      return;
    }

    setLoading(true);

    const emailFormatado = email.trim().toLowerCase();

    try {
      // 🔹 1ª tentativa: usuário comum
      const response = await axios.post(
        `${API_V1}/auth/recuperar-senha`,
        { email: emailFormatado },
      );

      handleSuccess(response);
    } catch (errorUser: any) {
      try {
        // 🔹 2ª tentativa: admin (fallback)
        const responseAdmin = await axios.post(
          `${API_V1}/admin/recuperar-senha`,
          { email: emailFormatado },
        );

        handleSuccess(responseAdmin);
      } catch (errorAdmin: any) {
        const errorMsg =
          errorAdmin.response?.data?.message ||
          errorUser.response?.data?.message ||
          "Não foi possível recuperar a senha.";

        Alert.alert("Ops!", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Função separada só pra não duplicar código
  const handleSuccess = async (response: any) => {
    if (response.data.success || response.status === 200) {
      const senhaTemporaria = response?.data?.data?.nova_senha;
      const token = response?.data?.token;

      // 🔹 Caso USER (tem senha)
      if (senhaTemporaria) {
        Alert.alert(
          "Senha Gerada com Sucesso! 🛡️",
          `Sua nova senha temporária é: ${senhaTemporaria}\n\nDeseja copiar ela agora para facilitar o login?`,
          [
            {
              text: "Copiar e ir para Login",
              onPress: async () => {
                await Clipboard.setStringAsync(senhaTemporaria);
                router.back();
              },
            },
            {
              text: "Apenas Voltar",
              onPress: () => router.back(),
              style: "cancel",
            },
          ],
        );
        return;
      }

      // 🔹 Caso ADMIN (tem token)
      if (token) {
        Alert.alert(
          "Recuperação de Admin 🔐",
          "Foi gerado um token de recuperação. Use ele para redefinir sua senha.",
          [
            {
              text: "Copiar Token",
              onPress: async () => {
                await Clipboard.setStringAsync(token);
              },
            },
            {
              text: "OK",
              style: "cancel",
            },
          ],
        );
        return;
      }

      // 🔹 fallback
      Alert.alert("Erro", "Formato de resposta desconhecido.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------------------------------------------------------
            TOPO: TÍTULO DA PÁGINA (FUNDO CLARO)
        ---------------------------------------------------------- */}
        <View style={styles.topContainer}>
          <Text style={styles.mainTitle}>Esqueceu Sua Senha?</Text>
        </View>

        {/* ---------------------------------------------------------
            CORPO: FORMULÁRIO DE RESET (FUNDO VERDE)
        ---------------------------------------------------------- */}
        <View style={styles.bottomContainer}>
          <Text style={styles.resetTitle}>Nova Senha Temporária</Text>
          <Text style={styles.resetDescription}>
            Ao confirmar, nosso sistema irá gerar uma combinação segura de
            caracteres para você acessar o Selene imediatamente.
          </Text>

          {/* CAMPO DE E-MAIL */}
          <Text style={styles.label}>Endereço Email:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* BOTÕES DE AÇÃO */}
          <View style={styles.buttonActionContainer}>
            <TouchableOpacity
              style={[styles.buttonPrimary, loading && { opacity: 0.7 }]}
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonTextPrimary}>Gerar Nova Senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.buttonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL LOGIN FOOTER */}
          <View style={styles.socialContainer}>
            <Text style={styles.socialText}>Acessar com:</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIconButton}>
                <FontAwesome5 name="facebook-f" size={20} color="#2A3A56" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconButton}>
                <FontAwesome5 name="google" size={20} color="#2A3A56" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// ESTILIZAÇÃO (STYLES)
// ==========================================
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F5F5" },

  // Header fixo no topo
  topContainer: {
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    minHeight: 180,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2A3A56",
    textAlign: "center",
  },

  // Painel Verde Arredondado
  bottomContainer: {
    flex: 1,
    backgroundColor: "#95C159",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A3A56",
    marginBottom: 10,
  },
  resetDescription: {
    fontSize: 13,
    color: "#2A3A56",
    lineHeight: 18,
    marginBottom: 35,
  },
  label: {
    color: "#2A3A56",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },

  // Input de e-mail
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    marginBottom: 30,
    paddingHorizontal: 20,
    height: 50,
  },
  input: { flex: 1, color: "#333", fontSize: 16 },

  // Área dos Botões
  buttonActionContainer: { alignItems: "center", marginBottom: 40 },
  buttonPrimary: {
    backgroundColor: "#2A3A56",
    width: "80%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonTextPrimary: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  buttonSecondary: {
    backgroundColor: "#EDFCED",
    width: "80%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextSecondary: { color: "#2A3A56", fontWeight: "bold", fontSize: 16 },

  // Social Footer
  socialContainer: { alignItems: "center", marginTop: "auto" },
  socialText: { color: "#2A3A56", fontSize: 14, marginBottom: 15 },
  socialIconsRow: { flexDirection: "row" },
  socialIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#2A3A56",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});
