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
import axios, { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_V1 } from "@/constants/api";

type DispositivoDisponivel = {
  _id: string;
  nome?: string;
  mac_address?: string;
  tipo?: "ESP32_SENSORES" | "ESP32_CAM" | string;
  localizacao?: string;
  online?: boolean;
};

export default function CadastroEstufa() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceLoadError, setDeviceLoadError] = useState<string | null>(null);
  const [deviceRetry, setDeviceRetry] = useState(0);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [obs, setObs] = useState("");
  const [data] = useState(new Date().toLocaleDateString("pt-BR"));
  const [iniciais, setIniciais] = useState("US");
  const [dispositivos, setDispositivos] = useState<DispositivoDisponivel[]>([]);
  const [dispositivosSelecionados, setDispositivosSelecionados] = useState<string[]>([]);

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      setLoadingDevices(true);
      setDeviceLoadError(null);
      try {
        const [nomeSalvo, token] = await Promise.all([
          SecureStore.getItemAsync("userName"),
          SecureStore.getItemAsync("userToken"),
        ]);
        if (nomeSalvo) {
          const partes = nomeSalvo.trim().split(" ");

          const init =
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase();

          setIniciais(init);
        }
        if (!token) {
          Alert.alert("Sessão expirada", "Faça login novamente para cadastrar uma estufa.");
          router.replace("/(auth)");
          return;
        }

        const response = await fetch(`${API_V1}/dispositivos/meus`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.message || "Não foi possível carregar os dispositivos.");
        }

        const lista = Array.isArray(json?.data) ? json.data : [];
        setDispositivos(lista);
      } catch (error) {
        setDeviceLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dispositivos.",
        );
      } finally {
        setLoadingDevices(false);
      }
    };

    carregarDadosUsuario();
  }, [router, deviceRetry]);

  const alternarDispositivo = (id: string) => {
    setDispositivosSelecionados((selecionados) =>
      selecionados.includes(id)
        ? selecionados.filter((selecionado) => selecionado !== id)
        : [...selecionados, id],
    );
  };

  const handleSalvar = async () => {
    const quantidadeNumerica = Number(quantidade);
    if (!nome.trim() || !quantidade || !Number.isInteger(quantidadeNumerica) || quantidadeNumerica < 0) {
      Alert.alert("Dados inválidos", "Informe o nome da estufa e uma quantidade inteira válida de compostos.");
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Alert.alert("Sessão expirada", "Faça login novamente para cadastrar uma estufa.");
        router.replace("/(auth)");
        return;
      }

      const payload = {
        nome: nome.trim(),
        quantidade_compostos: String(quantidadeNumerica),
        observacoes: obs.trim(),
        data_criacao: data,
        dispositivos_ids: dispositivosSelecionados,
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
    } catch (error: unknown) {
      const erro = isAxiosError(error) ? error.response?.data?.message : undefined;
      const msg =
        erro || (error instanceof Error ? error.message : "Não foi possível salvar a estufa.");
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


            <Text style={styles.label}>Quantidade de compostos</Text>
            <TextInput
              style={styles.input}
              value={quantidade}
              onChangeText={(value) => setQuantidade(value.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.progressText}
            />

            <Text style={styles.label}>Dispositivos da estufa</Text>
            <Text style={styles.helperText}>
              Selecione os sensores e câmeras que o administrador já vinculou à sua conta.
            </Text>
            {loadingDevices ? (
              <ActivityIndicator
                style={styles.devicesLoading}
                size="small"
                color={Colors.primary}
              />
            ) : deviceLoadError ? (
              <View style={styles.emptyDevices}>
                <Feather name="alert-circle" size={18} color={Colors.danger} />
                <View style={styles.deviceLoadErrorContent}>
                  <Text style={styles.emptyDevicesText}>{deviceLoadError}</Text>
                  <TouchableOpacity onPress={() => setDeviceRetry((retry) => retry + 1)}>
                    <Text style={styles.retryText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : dispositivos.length === 0 ? (
              <View style={styles.emptyDevices}>
                <Feather name="info" size={18} color={Colors.muted} />
                <Text style={styles.emptyDevicesText}>
                  Nenhum dispositivo ativo foi atribuído à sua conta. Você pode cadastrar a estufa agora e vinculá-los depois.
                </Text>
              </View>
            ) : (
              <View style={styles.devicesList}>
                {dispositivos.map((dispositivo) => {
                  const selecionado = dispositivosSelecionados.includes(dispositivo._id);
                  const cameraDispositivo = dispositivo.tipo === "ESP32_CAM";
                  return (
                    <TouchableOpacity
                      key={dispositivo._id}
                      style={[
                        styles.deviceOption,
                        selecionado && styles.deviceOptionSelected,
                      ]}
                      onPress={() => alternarDispositivo(dispositivo._id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selecionado }}
                    >
                      <View
                        style={[
                          styles.deviceIcon,
                          cameraDispositivo ? styles.cameraDeviceIcon : styles.sensorDeviceIcon,
                        ]}
                      >
                        <Feather
                          name={cameraDispositivo ? "camera" : "thermometer"}
                          size={18}
                          color={cameraDispositivo ? Colors.info : Colors.success}
                        />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>
                          {dispositivo.nome || (cameraDispositivo ? "Câmera" : "Sensor")}
                        </Text>
                        <Text style={styles.deviceDetails}>
                          {cameraDispositivo ? "Câmera" : "Sensor"} · {dispositivo.mac_address || dispositivo.localizacao || "Dispositivo cadastrado"}
                        </Text>
                      </View>
                      <Feather
                        name={selecionado ? "check-circle" : "circle"}
                        size={21}
                        color={selecionado ? Colors.primary : Colors.border}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}


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
              disabled={loading || loadingDevices || Boolean(deviceLoadError)}
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
  helperText: {
    color: Colors.muted,
    fontSize: Typography.caption,
    lineHeight: 18,
    marginHorizontal: 5,
    marginTop: -Spacing.xxs,
    marginBottom: Spacing.sm,
  },
  devicesLoading: {
    marginVertical: Spacing.lg,
  },
  emptyDevices: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyDevicesText: {
    flex: 1,
    color: Colors.muted,
    fontSize: Typography.caption,
    lineHeight: 18,
  },
  deviceLoadErrorContent: {
    flex: 1,
  },
  retryText: {
    color: Colors.info,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  devicesList: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  deviceOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  deviceOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.greenSoft,
  },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sensorDeviceIcon: {
    backgroundColor: "#E6F4EA",
  },
  cameraDeviceIcon: {
    backgroundColor: "#E8F0FE",
  },
  deviceInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  deviceName: {
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  deviceDetails: {
    color: Colors.muted,
    fontSize: Typography.footnote,
    marginTop: 2,
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
