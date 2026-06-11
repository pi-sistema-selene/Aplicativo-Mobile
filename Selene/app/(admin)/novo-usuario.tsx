import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_V1 } from "@/constants/api";

export default function NovoUsuario() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nivel, setNivel] = useState("user");

  const [iniciais, setIniciais] = useState("US");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // CARREGAR INICIAIS
  // ==========================================

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync("userName");

        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(/\s+/);

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();

          setIniciais(init);
        }
      } catch (e) {
      }
    };

    carregarDadosUsuario();
  }, []);

  // ==========================================
  // PERFIL
  // ==========================================

  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };

  // ==========================================
  // CRIAR USUÁRIO / ADMIN
  // ==========================================

  const handleSubmit = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Preencha os campos obrigatórios");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "Senha precisa ter no mínimo 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      // ==========================================
      // DEFINIR ENDPOINT
      // ==========================================

      const endpoint =
        nivel === "superadmin"
          ? `${API_V1}/admin/criar`
          : `${API_V1}/users`;

      // ==========================================
      // BODY ADMIN
      // ==========================================

      const body =
        nivel === "superadmin"
          ? {
            usuario: email.split("@")[0].trim().toLowerCase(),

            nome_completo: nome.trim(),

            email: email.trim().toLowerCase(),

            senha,

            telefone: telefone || "",

            nivel_acesso: "superadmin",
          }
          : {
            nome_completo: nome.trim(),

            email: email.trim().toLowerCase(),

            senha,

            telefone: telefone || "",

            data_nascimento: dataNascimento || null,

            tipo: "user",
          };

      // ==========================================
      // REQUEST
      // ==========================================

      const res = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao criar usuário");
      }

      Alert.alert(
        "Sucesso",
        nivel === "superadmin"
          ? "Administrador criado com sucesso!"
          : "Usuário criado com sucesso!",
      );

      router.back();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao criar cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace("/(admin)/(tabs)/users")}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Novo Cadastro</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handleGoProfile}
              >
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FORM */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Nome Completo *</Text>

          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Nome completo"
          />

          <Text style={styles.label}>Data Nascimento</Text>

          <TextInput
            style={styles.input}
            value={dataNascimento}
            onChangeText={setDataNascimento}
            placeholder="AAAA-MM-DD"
          />

          <Text style={styles.label}>Telefone</Text>

          <TextInput
            style={styles.input}
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(13) 99999-9999"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email *</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Senha *</Text>

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="********"
          />

          {/* FOTO */}
          <View style={styles.photoBox}>
            <Feather name="user" size={40} color="#fff" />

            <View style={styles.cameraIcon}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </View>

          {/* NIVEL */}
          <Text style={styles.label}>Nível de Acesso</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.radio, nivel === "user" && styles.radioActive]}
              onPress={() => setNivel("user")}
            >
              <Text>Produtor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radio,
                nivel === "superadmin" && styles.radioActive,
              ]}
              onPress={() => setNivel("superadmin")}
            >
              <Text>Administrador</Text>
            </TouchableOpacity>
          </View>

          {/* BOTÃO */}
          <TouchableOpacity
            style={[
              styles.btn,
              loading && {
                opacity: 0.6,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Criando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// -------------------
// Main Container & Layout
// -------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#95C159"
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 40,
  },

  // -------------------
  // Header Section
  // -------------------

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
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  textContainer: {
    flex: 1,
    marginLeft: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  // -------------------
  // Avatar Components
  // -------------------

  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  // -------------------
  // Media / Photo Selection
  // -------------------

  photoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00D2B1",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 20,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2A3A56",
    borderRadius: 10,
    padding: 3,
  },

  // -------------------
  // Form & Inputs
  // -------------------

  label: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#2A3A56",
  },
  input: {
    backgroundColor: "#E9F9EA",
    borderRadius: 15,
    padding: 10,
    marginTop: 5,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  // -------------------
  // Custom Radio Selectors
  // -------------------

  radio: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#95C159",
    borderRadius: 10,
    alignItems: "center",
  },
  radioActive: {
    backgroundColor: "#95C159",
  },

  // -------------------
  // Action Buttons
  // -------------------

  btn: {
    backgroundColor: "#00D2B1",
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
