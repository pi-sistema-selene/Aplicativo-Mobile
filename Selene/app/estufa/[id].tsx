import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_V1, getApiAssetUrl } from "@/constants/api";

type DispositivoEstufa = {
  _id: string;
  nome?: string;
  tipo?: string;
  mac_address?: string;
  localizacao?: string;
  online?: boolean;
};

type LeituraDispositivo = {
  _id?: string;
  dispositivo?: string;
  tipo_leitura?: string;
  dados?: {
    temperatura?: number;
    umidade?: number;
    luminosidade?: number;
    foto_path?: string;
    foto?: string;
  };
  timestamp?: string;
  createdAt?: string;
};

type EstufaDetalhe = {
  _id: string;
  nome?: string;
  quantidade_compostos?: string | number;
  data_criacao?: string;
  observacoes?: string;
  status?: string;
  dispositivos?: DispositivoEstufa[];
};

export default function DetalheEstufa() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [estufa, setEstufa] = useState<EstufaDetalhe | null>(null);
  const [leituras, setLeituras] = useState<Record<string, LeituraDispositivo | null>>({});
  const [erroLeituras, setErroLeituras] = useState(false);
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

  const fetchDetalhes = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace("/(auth)");
        return;
      }

      const response = await axios.get(`${API_V1}/estufas/detalhes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Não foi possível carregar esta estufa.");
      }

      if (response.data.success) {
        const estufaCarregada = response.data.data as EstufaDetalhe;
        const dispositivos = Array.isArray(estufaCarregada.dispositivos)
          ? estufaCarregada.dispositivos
          : [];
        setEstufa({ ...estufaCarregada, dispositivos });
        setErroLeituras(false);

        const resultados = await Promise.all(
          dispositivos.map(async (dispositivo) => {
            try {
              const leituraResponse = await fetch(
                `${API_V1}/dispositivos/${dispositivo._id}/leituras?limite=40`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              const leituraJson = await leituraResponse.json();
              if (!leituraResponse.ok) {
                throw new Error(leituraJson?.message || "Falha ao carregar leitura.");
              }

              const leiturasDoTipo = Array.isArray(leituraJson?.data)
                ? leituraJson.data.filter((leitura: LeituraDispositivo) =>
                    dispositivo.tipo === "ESP32_CAM"
                      ? leitura.tipo_leitura === "CAMERA"
                      : leitura.tipo_leitura === "SENSORES",
                  )
                : [];
              const leituraRecente = leiturasDoTipo[0] || null;
              return [dispositivo._id, leituraRecente || null] as const;
            } catch {
              setErroLeituras(true);
              return [dispositivo._id, null] as const;
            }
          }),
        );
        setLeituras(Object.fromEntries(resultados));
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados desta estufa.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      fetchDetalhes();
    }, [fetchDetalhes]),
  );

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.muted }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>


        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>{estufa?.nome || "Estufa"}</Text>
              <Text style={styles.subwelcomeText}>{estufa?.data_criacao || "Detalhes da estufa"}</Text>
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>


            <View style={styles.summaryRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Compostos cadastrados</Text>
                <Text style={styles.statValue}>{estufa?.quantidade_compostos || 0}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Dispositivos vinculados</Text>
                <Text style={[styles.statValue, { color: Colors.accent }]}>
                  {estufa?.dispositivos?.length || 0}
                </Text>
              </View>
            </View>

            <Text style={styles.monthLabel}>Sensores da estufa</Text>
            {erroLeituras ? (
              <Text style={styles.readingError}>
                Algumas leituras não puderam ser carregadas. Tente atualizar mais tarde.
              </Text>
            ) : null}
            {estufa?.dispositivos?.length ? (
              estufa.dispositivos.map((dispositivo) => {
                const leitura = leituras[dispositivo._id];
                const camera = dispositivo.tipo === "ESP32_CAM";
                const foto = leitura?.dados?.foto_path || leitura?.dados?.foto;
                const timestamp = leitura?.timestamp || leitura?.createdAt;

                return (
                  <View key={dispositivo._id} style={styles.deviceCard}>
                    <View style={styles.deviceHeader}>
                      <View style={styles.sensorIconBg}>
                        <Feather
                          name={camera ? "camera" : "thermometer"}
                          size={20}
                          color={camera ? Colors.info : Colors.primary}
                        />
                      </View>
                      <View style={styles.deviceHeading}>
                        <Text style={styles.sensorLabel}>
                          {dispositivo.nome || (camera ? "Câmera" : "Sensor")}
                        </Text>
                        <Text style={styles.sensorDate}>
                          {camera ? "Câmera" : "Sensor"} · {dispositivo.mac_address || dispositivo.localizacao || ""}
                        </Text>
                      </View>
                      <View style={[styles.onlineDot, dispositivo.online ? styles.online : styles.offline]} />
                    </View>

                    {camera ? (
                      foto ? (
                        <Image
                          source={{
                            uri: /^https?:\/\//i.test(foto) || /^data:/i.test(foto)
                              ? foto
                              : getApiAssetUrl(foto),
                          }}
                          style={styles.cameraPreview}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.noReadingText}>
                          {leitura ? "A câmera ainda não enviou uma imagem." : "Nenhuma captura disponível."}
                        </Text>
                      )
                    ) : leitura?.dados ? (
                      <View style={styles.metricsList}>
                        <Metric
                          icon="droplet"
                          label="Umidade"
                          value={leitura.dados.umidade}
                          unit="%"
                          timestamp={timestamp}
                        />
                        <Metric
                          icon="thermometer"
                          label="Temperatura"
                          value={leitura.dados.temperatura}
                          unit="°C"
                          timestamp={timestamp}
                        />
                        <Metric
                          icon="sun"
                          label="Luminosidade"
                          value={leitura.dados.luminosidade}
                          unit="% relativo"
                          timestamp={timestamp}
                        />
                      </View>
                    ) : (
                      <Text style={styles.noReadingText}>Nenhuma leitura de sensor disponível.</Text>
                    )}
                    {timestamp ? (
                      <Text style={styles.readingTimestamp}>
                        Última atualização: {new Date(timestamp).toLocaleString("pt-BR")}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyDevices}>
                <Feather name="cpu" size={22} color={Colors.mutedLight} />
                <Text style={styles.noReadingText}>
                  Nenhum dispositivo foi vinculado a esta estufa.
                </Text>
              </View>
            )}

            {estufa?.observacoes ? (
              <View style={styles.observationsCard}>
                <Text style={styles.sensorLabel}>Observações</Text>
                <Text style={styles.observationsText}>{estufa.observacoes}</Text>
              </View>
            ) : null}

          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
  timestamp,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: number;
  unit: string;
  timestamp?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricIconBg}>
        <Feather name={icon} size={19} color={Colors.primary} />
      </View>
      <View style={styles.metricDetails}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricTimestamp}>
          {timestamp ? new Date(timestamp).toLocaleString("pt-BR") : "Aguardando leitura"}
        </Text>
      </View>
      <View style={styles.metricDivider} />
      <Text style={styles.metricValue}>
        {typeof value === "number"
          ? `${Number(value).toFixed(label === "Luminosidade" ? 0 : 1)} ${unit}`
          : "--"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },

  headerTitle: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.text },
  profileCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center'
  },
  profileText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: Typography.small },


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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F0F9F7",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  statBox: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: Typography.caption, color: Colors.muted, marginBottom: Spacing.xxs },
  statValue: { fontSize: Typography.large, fontWeight: FontWeight.bold, color: Colors.text },

  monthLabel: { fontSize: Typography.heading, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 15 },

  deviceCard: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    elevation: 3,
    shadowColor: Colors.black, shadowOpacity: 0.05, shadowRadius: 5
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceHeading: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  sensorIconBg: {
    width: 45, height: 45, borderRadius: Radius.lg,
    backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center'
  },
  sensorLabel: { fontSize: Typography.medium, fontWeight: FontWeight.bold, color: Colors.text },
  sensorDate: { fontSize: Typography.footnote, color: Colors.info },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: Spacing.xs,
  },
  online: { backgroundColor: Colors.success },
  offline: { backgroundColor: Colors.mutedLight },
  metricsList: {
    marginTop: Spacing.sm,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    minHeight: 66,
  },
  metricIconBg: {
    width: 42,
    height: 42,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  metricDetails: {
    flex: 1,
  },
  metricDivider: {
    height: 38,
    width: 1,
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.sm,
  },
  metricLabel: {
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  metricTimestamp: {
    color: Colors.info,
    fontSize: Typography.footnote,
    marginTop: Spacing.xxs,
  },
  metricValue: {
    color: Colors.text,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    minWidth: 78,
    textAlign: "right",
  },
  cameraPreview: {
    height: 180,
    width: "100%",
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    marginTop: Spacing.md,
  },
  noReadingText: {
    color: Colors.muted,
    fontSize: Typography.caption,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  readingTimestamp: {
    color: Colors.mutedLight,
    fontSize: Typography.footnote,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
  readingError: {
    color: Colors.danger,
    fontSize: Typography.caption,
    marginBottom: Spacing.sm,
  },
  emptyDevices: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
  },
  observationsCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  observationsText: {
    color: Colors.text,
    fontSize: Typography.body,
    lineHeight: 21,
    marginTop: Spacing.xs,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },
});