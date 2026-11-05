import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert("Erro", "Por favor, informe seu e-mail.");
      return;
    }

    setLoading(true);

    const emailFormatado = email.trim().toLowerCase();

    try {
      const response = await axios.post(
        `${API_V1}/auth/recuperar-senha`,
        { email: emailFormatado },
      );

      handleSuccess(response);
    } catch (errorUser: any) {
      try {
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

  const handleSuccess = async (response: any) => {
    if (response.data.success || response.status === 200) {
      const senhaTemporaria = response?.data?.data?.nova_senha;
      const token = response?.data?.token;

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

        <View style={styles.topContainer}>
          <Text style={styles.mainTitle}>Esqueceu Sua Senha?</Text>
        </View>


        <View style={styles.bottomContainer}>
          <Text style={styles.resetTitle}>Nova Senha Temporária</Text>
          <Text style={styles.resetDescription}>
            Ao confirmar, nosso sistema irá gerar uma combinação segura de
            caracteres para você acessar o Selene imediatamente.
          </Text>


          <Text style={styles.label}>Endereço Email:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.progressText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>


          <View style={styles.buttonActionContainer}>
            <TouchableOpacity
              style={[styles.buttonPrimary, loading && { opacity: 0.7 }]}
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
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


          <View style={styles.socialContainer}>
            <Text style={styles.socialText}>Acessar com:</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIconButton}>
                <FontAwesome5 name="facebook-f" size={20} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconButton}>
                <FontAwesome5 name="google" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },

  topContainer: {
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.screen,
    minHeight: 180,
  },
  mainTitle: {
    fontSize: Typography.large,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
  },

  bottomContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.section,
  },
  resetTitle: {
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 10,
  },
  resetDescription: {
    fontSize: Typography.small,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 35,
  },
  label: {
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    marginBottom: 5,
    marginLeft: 5,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    height: 50,
  },
  input: { flex: 1, color: Colors.mutedDark, fontSize: Typography.subtitle },

  buttonActionContainer: { alignItems: "center", marginBottom: Spacing.section },
  buttonPrimary: {
    backgroundColor: Colors.text,
    width: "80%",
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  buttonTextPrimary: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: Typography.subtitle },
  buttonSecondary: {
    backgroundColor: Colors.avatarBg,
    width: "80%",
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextSecondary: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: Typography.subtitle },

  socialContainer: { alignItems: "center", marginTop: "auto" },
  socialText: { color: Colors.text, fontSize: Typography.body, marginBottom: 15 },
  socialIconsRow: { flexDirection: "row" },
  socialIconButton: {
    width: 50,
    height: 50,
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    borderColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});
