import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

type Usuario = {
  _id: string;
  nome: string;
  email: string;
};

export default function EditarSensor() {
  const { id } = useLocalSearchParams();

  const [nome, setNome] = useState("");
  const [mac, setMac] = useState("");
  const [localizacao, setLocalizacao] = useState("");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState("");

  const [tipo, setTipo] = useState<"ESP32_SENSORES" | "ESP32_CAM">(
    "ESP32_SENSORES",
  );

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(true);

  const [token, setToken] = useState<string | null>(null);

  // ==========================================
  // CARREGAR TOKEN
  // ==========================================
  useEffect(() => {
    const loadToken = async () => {
      try {
        const t = await SecureStore.getItemAsync("userToken");

        if (!t) {
          Alert.alert("Erro", "Token não encontrado");
          return;
        }

        setToken(t);
      } catch (err) {

        Alert.alert("Erro", "Falha ao carregar token");
      }
    };

    loadToken();
  }, []);

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  useEffect(() => {
    if (token) {
      fetchUsuarios(token);
      buscarDispositivo(token);
    }
  }, [token]);

  // ==========================================
  // BUSCAR USUÁRIOS
  // ==========================================
  const fetchUsuarios = async (authToken: string) => {
    try {
      setLoadingUsers(true);

      const res = await fetch(
        `${API_V1}/users`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const data = await res.json();

      let lista =
        data?.data?.usuarios ||
        data?.data ||
        data?.usuarios ||
        [];

      if (!Array.isArray(lista)) {
        lista = [];
      }

      const usuariosFormatados = lista.map((u: any) => ({
        _id: String(u._id || ""),
        nome: u.nome || u.nome_completo || "Usuário",
        email: u.email || "Sem email",
      }));

      setUsuarios(usuariosFormatados);
    } catch (err) {

      Alert.alert("Erro", "Não foi possível carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================
  // BUSCAR DISPOSITIVO
  // ==========================================
  const buscarDispositivo = async (authToken: string) => {
    try {
      setLoadingDevice(true);

      const sensorId = Array.isArray(id) ? id[0] : id;

      const res = await fetch(
        `${API_V1}/dispositivos/${sensorId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || "Erro ao buscar dispositivo",
        );
      }

      const dispositivo =
        data?.data?.dispositivo ||
        data?.data ||
        data?.dispositivo ||
        data;

      setNome(dispositivo?.nome || "");

      setMac(dispositivo?.mac_address || "");

      setLocalizacao(dispositivo?.localizacao || "");

      // 🔥 IMPORTANTE
      // backend retorna usuario e NÃO usuario_id
      setUsuarioId(
        String(
          dispositivo?.usuario?._id ||
          dispositivo?.usuario ||
          "",
        ),
      );

      setTipo(dispositivo?.tipo || "ESP32_SENSORES");
    } catch (err: any) {

      Alert.alert(
        "Erro",
        err.message || "Não foi possível carregar dispositivo",
      );
    } finally {
      setLoadingDevice(false);
    }
  };

  // ==========================================
  // EDITAR DISPOSITIVO
  // ==========================================
  const editarDispositivo = async () => {
    if (!nome || !mac || !usuarioId) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      const sensorId = Array.isArray(id) ? id[0] : id;

      const payload = {
        nome: nome.trim(),
        mac_address: mac.trim(),
        localizacao: localizacao.trim(),
        usuario_id: usuarioId,
        tipo,
      };

      const res = await fetch(
        `${API_V1}/dispositivos/${sensorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao editar");
      }

      Alert.alert("Sucesso", "Dispositivo atualizado!");

      router.replace("/(admin)/(tabs)/monitoring");
    } catch (err: any) {

      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loadingDevice) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#95C159" />
      </View>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                router.push("/(admin)/(tabs)/monitoring")
              }
            >
              <Feather
                name="arrow-left"
                size={28}
                color="#2A3A56"
              />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>
                Editar Sensor
              </Text>

              <Text style={styles.subwelcomeText}>
                Dispositivo
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Nome</Text>

          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>MAC</Text>

          <TextInput
            style={styles.input}
            value={mac}
            onChangeText={setMac}
          />

          <Text style={styles.label}>Localização</Text>

          <TextInput
            style={styles.input}
            value={localizacao}
            onChangeText={setLocalizacao}
          />

          <Text style={styles.label}>Usuário</Text>

          {loadingUsers ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={usuarioId}
                onValueChange={(value) =>
                  setUsuarioId(String(value))
                }
              >
                <Picker.Item
                  label="Selecione um usuário"
                  value=""
                />

                {usuarios.map((u) => (
                  <Picker.Item
                    key={u._id}
                    label={`${u.nome} (${u.email})`}
                    value={u._id}
                  />
                ))}
              </Picker>
            </View>
          )}

          <Text style={styles.label}>Tipo</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                tipo === "ESP32_SENSORES" &&
                styles.typeButtonActive,
              ]}
              onPress={() =>
                setTipo("ESP32_SENSORES")
              }
            >
              <Text>Sensor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                tipo === "ESP32_CAM" &&
                styles.typeButtonActive,
              ]}
              onPress={() => setTipo("ESP32_CAM")}
            >
              <Text>Câmera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={editarDispositivo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#95C159",
  },

  topContainer: {
    backgroundColor: "#95C159",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  textContainer: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2A3A56",
  },

  subwelcomeText: {
    color: "#2A3A56",
  },

  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 25,
  },

  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#95C159",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  typeButtonActive: {
    backgroundColor: "#95C159",
  },

  button: {
    backgroundColor: "#2A3A56",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});