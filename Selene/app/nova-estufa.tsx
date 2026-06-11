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

  // ==========================================
  // ESTADOS (STATES)
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [camera, setCamera] = useState("");
  const [obs, setObs] = useState("");
  const [data] = useState(new Date().toLocaleDateString("pt-BR"));
  const [iniciais, setIniciais] = useState("US");

  // ================= USER =================
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

  // ==========================================
  // LÓGICA DE CADASTRO
  // ==========================================
  const handleSalvar = async () => {
    // Validação básica
    if (!nome || !quantidade) {
      Alert.alert("Erro", "Por favor, preencha o nome e a quantidade.");
      return;
    }

    setLoading(true);

    try {
      // Recupera o token salvo no login para autenticar a requisição
      const token = await SecureStore.getItemAsync("userToken");

      const payload = {
        nome: nome,
        quantidade_compostos: quantidade,
        endereco_camera: camera,
        observacoes: obs,
        data_criacao: data,
        status: "Baixo", // Status inicial padrão para novas estufas
      };

      // Envio para o backend no Render
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
        {/* ================= HEADER ================= */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
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
                  color="#2A3A56"
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------
            FORMULÁRIO (CONTEÚDO BRANCO)
        ---------------------------------------------------------- */}
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* DATA DE CRIAÇÃO (SOMENTE LEITURA) */}
            <Text style={styles.label}>Data Criação</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={data} editable={false} />
              <TouchableOpacity style={styles.calendarIcon} disabled>
                <Feather name="calendar" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* NOME DA ESTUFA */}
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Estufa Setor Norte"
              placeholderTextColor="#A0A0A0"
            />

            {/* QUANTIDADE DE COMPOSTOS */}
            <Text style={styles.label}>Quantidade Compostos</Text>
            <TextInput
              style={styles.input}
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#A0A0A0"
            />

            {/* URL DA CÂMERA */}
            <Text style={styles.label}>Endereço Câmera (URL)</Text>
            <TextInput
              style={styles.input}
              value={camera}
              onChangeText={setCamera}
              placeholder="http://192.168.0.1"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
            />

            {/* OBSERVAÇÕES (TEXTAREA) */}
            <Text style={[styles.label, { color: "#00D2B1" }]}>
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
              placeholderTextColor="#A0A0A0"
            />

            {/* BOTÃO SALVAR */}
            <TouchableOpacity
              style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
              onPress={handleSalvar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
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

// ==========================================
// ESTILIZAÇÃO (STYLES)
// ==========================================
const styles = StyleSheet.create({
  // Estrutura Principal
  container: { flex: 1, backgroundColor: "#95C159" },

  // Header Superior
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

  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#2A3A56" },
  subwelcomeText: { fontSize: 14, color: "#2A3A56", opacity: 0.8 },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

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

  avatarText: { fontSize: 16, fontWeight: "bold", color: "#2A3A56" },

  // Painel Branco Arredondado
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A3A56",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: { position: "relative", justifyContent: "center" },

  input: {
    backgroundColor: "#E1F5E5",
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 20,
    marginBottom: 20,
    color: "#2A3A56",
    fontSize: 15,
  },
  calendarIcon: {
    position: "absolute",
    right: 15,
    top: 10,
    backgroundColor: "#00D2B1",
    borderRadius: 8,
    padding: 6,
  },
  textArea: { height: 120, paddingTop: 15, borderRadius: 25 },

  btnSalvar: {
    backgroundColor: "#95C159",
    height: 55,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  btnSalvarText: { color: "#FFF", fontWeight: "bold", fontSize: 18 },
  textContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },
});
