import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const preencherCampos = (user: any) => {
      setNome(user.nome_completo || "");
      setUsuario(user.usuario || "");
      setEmail(user.email || "");
      setTelefone(user.telefone || "");
      setEndereco(user.endereco || "");

      setDataNascimento(
        user.data_nascimento || user.dataNascimento || user.nascimento || "",
      );
    };

    const carregarDadosParaEdicao = async () => {
      if (!id) {
        console.error("--- [DEBUG] ID não fornecido");
        setLoading(false);
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (!token) {
          Alert.alert("Erro", "Usuário não autenticado");
          return;
        }

        const buscaId = id.toString().trim().toLowerCase();

        // ==========================================
        // BUSCA DIRETA USERS
        // ==========================================

        let response = await fetch(
          `${API_V1}/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        let json = await response.json();

        if (response.ok) {
          setIsAdmin(false);

          preencherCampos(json.data || json.usuario || json);

          return;
        }

        // ==========================================
        // BUSCA LISTA USERS
        // ==========================================

        const resLista = await fetch(
          `${API_V1}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const jsonLista = await resLista.json();

        const lista = jsonLista.data || jsonLista.usuarios || [];

        const encontrado = lista.find(
          (u: any) => (u._id || u.id)?.toString().toLowerCase() === buscaId,
        );

        if (encontrado) {
          setIsAdmin(false);

          preencherCampos(encontrado);

          return;
        }

        // ==========================================
        // BUSCA ADMINS
        // ==========================================

        const resAdmins = await fetch(
          `${API_V1}/admin/listar`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const jsonAdmins = await resAdmins.json();

        const listaAdmins = jsonAdmins.data || jsonAdmins.usuarios || [];

        const adminEncontrado = listaAdmins.find(
          (a: any) => (a._id || a.id)?.toString().toLowerCase() === buscaId,
        );

        if (adminEncontrado) {
          setIsAdmin(true);

          preencherCampos(adminEncontrado);

          return;
        }

        Alert.alert(
          "Erro",
          "Não foi possível localizar este usuário no servidor.",
        );
      } catch (error) {
        console.error("--- [DEBUG] Erro de conexão:", error);

        Alert.alert("Erro", "Falha de conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    };

    carregarDadosParaEdicao();
  }, [id]);

  // ==========================================
  // SALVAR
  // ==========================================

  const handleSalvar = async () => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      // DEFINE ENDPOINT
      const endpoint = isAdmin
        ? `${API_V1}/admin/${id}`
        : `${API_V1}/users/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuario,
          nome_completo: nome,
          email,
          telefone,
          endereco,
          data_nascimento: dataNascimento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar");
      }

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");

      router.back();
    } catch (error: any) {

      Alert.alert("Erro", error.message || "Ocorreu um erro inesperado");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

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
        <ActivityIndicator size="large" color="#2A3A56" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={26} color="#2A3A56" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Editar Cadastro</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            {isAdmin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Usuário</Text>

                <TextInput
                  style={styles.input}
                  value={usuario}
                  onChangeText={setUsuario}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Endereço</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                value={endereco}
                onChangeText={setEndereco}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>

              <TextInput
                style={styles.input}
                value={dataNascimento}
                onChangeText={setDataNascimento}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnSave, saving && { opacity: 0.7 }]}
              onPress={handleSalvar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#2A3A56" />
              ) : (
                <Text style={styles.btnSaveText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#95C159",
  },

  scrollContent: {
    flexGrow: 1,
  },

  card: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 40,
    marginTop: 10,
  },

  // HEADER

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  backButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
  },

  // FORM

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    color: "#2A3A56",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  // BUTTON

  btnSave: {
    backgroundColor: "#F4C542",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },

  btnSaveText: {
    fontWeight: "bold",
    color: "#2A3A56",
    fontSize: 16,
  },
});
