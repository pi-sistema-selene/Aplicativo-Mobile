import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function CadastroEstufa() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [camera, setCamera] = useState("");
  const [obs, setObs] = useState("");
  const [data] = useState(new Date().toLocaleDateString("pt-BR"));
  const [iniciais, setIniciais] = useState("US");

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const nomeSalvo = await SecureStore.getItemAsync("userName");
        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(" ");

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();

          setIniciais(init);
        }
      } catch (e) {
        console.log(e);
      }
    };

    carregarDadosUsuario();
  }, []);

  const handleSalvar = async () => {
    if (!nome || !quantidade) {
      Alert.alert("Erro", "Por favor, preencha o nome e a quantidade.");
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");

      const payload = {
        nome: nome,
        quantidade_compostos: quantidade,
        endereco_camera: camera,
        observacoes: obs,
        data_criacao: data,
        status: "Baixo", // Status inicial padrão para novas estufas
      };

      const response = await axios.post(
        `${API_V1}/estufas/cadastrar`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        Alert.alert("Sucesso ✅", "Estufa cadastrada com sucesso!");
        router.replace("/(tabs)/estufas");
      }
    } catch (error: any) {
      console.log("Erro ao cadastrar:", error.response?.data || error.message);
      const msg =
        error.response?.data?.message || "Não foi possível salvar a estufa.";
      Alert.alert("Erro", msg);
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
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Estufas</Text>
              <Text style={styles.subwelcomeText}>Gerencie suas estufas</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => router.push("/profile")}
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
            contentContainerStyle={{ paddingBottom: Spacing.section }}
            keyboardShouldPersistTaps="handled"
          >

            <Text style={styles.label}>Data Criação</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={data} editable={false} />
              <TouchableOpacity style={styles.calendarIcon} disabled>
                <Feather name="calendar" size={18} color="white" />
              </TouchableOpacity>
            </View>


            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Estufa Setor Norte"
              placeholderTextColor={Colors.progressText}
            />


            <Text style={styles.label}>Quantidade Compostos</Text>
            <TextInput
              style={styles.input}
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.progressText}
            />


            <Text style={styles.label}>Endereço Câmera (URL)</Text>
            <TextInput
              style={styles.input}
              value={camera}
              onChangeText={setCamera}
              placeholder="http://192.168.0.1"
              placeholderTextColor={Colors.progressText}
              autoCapitalize="none"
            />


            <Text style={[styles.label, { color: Colors.accent }]}>
              Observações
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={obs}
              onChangeText={setObs}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Notas adicionais..."
              placeholderTextColor={Colors.progressText}
            />


            <TouchableOpacity
              style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
              onPress={handleSalvar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnSalvarText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

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

  welcomeText: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.text },
  subwelcomeText: { fontSize: Typography.body, color: Colors.text, opacity: 0.8 },

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

  avatarText: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },

  label: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginLeft: 5,
  },
  inputContainer: { position: "relative", justifyContent: "center" },

  input: {
    backgroundColor: "#E1F5E5",
    borderRadius: Radius.xl,
    height: 50,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    color: Colors.text,
    fontSize: Typography.medium,
  },
  calendarIcon: {
    position: "absolute",
    right: 15,
    top: 10,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 6,
  },
  textArea: { height: 120, paddingTop: 15, borderRadius: Radius.xxl },

  btnSalvar: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  btnSalvarText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: Typography.heading },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },
});
