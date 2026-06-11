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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { login, saveSession } from "@/services/authService";
import { Colors } from "@/constants/Colors";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const { token, userDetails, isAdmin } = await login(email, password);
      await saveSession(token, userDetails, isAdmin);

      if (isAdmin) {
        router.replace("/(admin)/(tabs)/home-admin");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "E-mail ou senha incorretos.";
      Alert.alert("Ops!", errorMsg);
    } finally {
      setLoading(false);
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
          <Image
            source={require("../../assets/images/logo_selene_login.svg")}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.label}>Email / Usuário:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite seu acesso"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Senha:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              autoCapitalize="none"
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#2A3A56"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot")}>
            <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },

  topContainer: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    minHeight: 180,
  },
  logo: { width: 250, height: 100 },

  bottomContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 50,
  },
  input: { flex: 1, color: "#333", fontSize: 16 },
  eyeIcon: { padding: 5 },

  button: {
    backgroundColor: Colors.text,
    height: 55,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: { color: Colors.white, fontWeight: "bold", fontSize: 18 },
  forgotPassword: {
    color: Colors.text,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 40,
  },

  socialContainer: { alignItems: "center", marginTop: "auto" },
  socialText: { color: Colors.text, fontSize: 14, marginBottom: 15 },
  socialIconsRow: { flexDirection: "row" },
  socialIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});
