import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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


  const handleGoProfile = () => {
    router.push("/(admin)/profile-admin");
  };


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


      const endpoint =
        nivel === "superadmin"
          ? `${API_V1}/admin/criar`
          : `${API_V1}/users`;


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

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace("/(admin)/(tabs)/users")}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
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


          <View style={styles.photoBox}>
            <Feather name="user" size={40} color={Colors.white} />

            <View style={styles.cameraIcon}>
              <Feather name="camera" size={14} color={Colors.white} />
            </View>
          </View>


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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary
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


  photoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: Spacing.lg,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.text,
    borderRadius: Radius.sm,
    padding: 3,
  },


  label: {
    fontWeight: FontWeight.bold,
    marginTop: 10,
    color: Colors.text,
  },
  input: {
    backgroundColor: "#E9F9EA",
    borderRadius: Radius.lg,
    padding: 10,
    marginTop: 5,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },


  radio: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  radioActive: {
    backgroundColor: Colors.primary,
  },


  btn: {
    backgroundColor: Colors.accent,
    padding: 15,
    borderRadius: Radius.xxl,
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  btnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
