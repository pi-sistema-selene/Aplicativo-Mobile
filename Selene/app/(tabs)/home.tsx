import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { Colors } from "@/constants/Colors";
import { useUserInitials } from "@/hooks/useUserInitials";
import {
  getMeusDispositivos,
  getLeituras,
  getResumo,
} from "@/services/dispositivoService";
import {
  hasSensorAnomaly,
  buildHomeAlerta,
  formatAlertaTime,
} from "@/utils/anomaly";
import type { HomeAlerta } from "@/types/alerta";
import type { Leitura } from "@/types/dispositivo";

export default function HomeScreen() {
  const router = useRouter();
  const { iniciais, nomeUsuario, loading: loadingUser } = useUserInitials();
  const [loading, setLoading] = useState(true);
  const [ultimaLeitura, setUltimaLeitura] = useState<Leitura | null>(null);
  const [totalAnomalias, setTotalAnomalias] = useState(0);
  const [totalImagens, setTotalImagens] = useState(0);
  const [totalDadosSensor, setTotalDadosSensor] = useState(0);
  const [alertas, setAlertas] = useState<HomeAlerta[]>([]);

  const carregarDados = async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
      if (!token) return;

      const sensores = await getMeusDispositivos(token);
      const primeiroSensor = sensores[0];

      if (sensores.length > 0) {
        const resumos = await Promise.all(
          sensores.map((dispositivo) => getResumo(dispositivo._id, token)),
        );

        const totals = resumos.reduce<{ totalCapturas: number; totalGeral: number }>(
          (acc, resumo) => {
            const totalCapturas = Number(resumo.totalCapturas || 0);
            const totalSensores = Number(resumo.totalSensores || 0);
            const totalGeral = Number(
              resumo.totalGeral || totalCapturas + totalSensores,
            );

            return {
              totalCapturas: acc.totalCapturas + totalCapturas,
              totalGeral: acc.totalGeral + totalGeral,
            };
          },
          { totalCapturas: 0, totalGeral: 0 },
        );

        setTotalDadosSensor(totals.totalGeral);
        setTotalImagens(totals.totalCapturas);

        const lista = await getLeituras(primeiroSensor._id, token, 999999);
        const leiturasSensores = lista.filter(
          (item) => item.tipo_leitura === "SENSORES",
        );
        setUltimaLeitura(leiturasSensores[0] || null);

        let contadorDeteccoesGeral = 0;
        const listaAlertasGerados: HomeAlerta[] = [];

        leiturasSensores.forEach((leitura, index) => {
          if (leitura?.dados && hasSensorAnomaly(leitura.dados)) {
            contadorDeteccoesGeral += 1;

            if (listaAlertasGerados.length < 4) {
              const alerta = buildHomeAlerta(leitura.dados);
              listaAlertasGerados.push({
                id: leitura._id || index.toString(),
                mensagem: alerta.mensagem,
                submensagem: alerta.submensagem,
                gravidade: alerta.gravidade,
                estufa: primeiroSensor.nome || "Principal",
                tempo: formatAlertaTime(leitura.createdAt),
                tipo: alerta.tipo,
              });
            }
          }
        });

        setTotalAnomalias(contadorDeteccoesGeral);
        setAlertas(listaAlertasGerados);
      }
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    carregarDados();

    const UM_MINUTO_E_TRINTA = 90 * 1000;

    const intervalo = setInterval(() => {
      carregarDados();
    }, UM_MINUTO_E_TRINTA);

    return () => clearInterval(intervalo);
  }, []);

  const porcentagem =
    totalDadosSensor > 0
      ? Math.round((totalAnomalias / totalDadosSensor) * 100)
      : 0;

  const renderCardGeral = (icon: React.ReactNode, label: string, value: string) => (
    <View style={styles.cardGeral}>
      <View style={styles.cardHeaderGeral}>
        <Text style={styles.cardLabelGeral}>{label}</Text>
        {icon}
      </View>
      <Text style={styles.cardValueGeral}>{value}</Text>
      <Text style={styles.cardStatusGeral}>Estável</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER (VERDE) */}
        <View style={styles.topContainer}>
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.topContent}
          >
            <View style={styles.header}>
              <View>
                {loading || loadingUser ? (
                  <ActivityIndicator size="small" color="#2A3A56" />
                ) : (
                  <>
                    <Text style={styles.welcomeText}>Olá, {nomeUsuario}</Text>
                    <Text style={styles.subwelcomeText}>
                      Bem-vindo novamente!
                    </Text>
                  </>
                )}
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

            <View style={styles.resumoContainer}>
              <View style={styles.resumoItem}>
                <View style={styles.resumoHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#2A3A56"
                  />
                  <Text style={styles.resumoLabel}>Total Detecções</Text>
                </View>
                <Text style={styles.resumoValue}>{totalAnomalias}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.resumoItem}>
                <View style={styles.resumoHeader}>
                  <Ionicons name="warning-outline" size={20} color="#2A3A56" />
                  <Text style={styles.resumoLabel}>Total Análises</Text>
                </View>
                <Text style={[styles.resumoValue, { color: "#2A3A56" }]}>
                  {totalDadosSensor}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${porcentagem}%` }]}>
                <Text style={styles.progressText}>{porcentagem}%</Text>
              </View>
              <Text style={styles.progressValueText}>{totalImagens}</Text>
            </View>

            <View style={styles.progressDescriptionRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#2A3A56"
              />
              <Text style={styles.progressDescriptionText}>
                {porcentagem}% De Detecções
              </Text>
            </View>
          </SafeAreaView>
        </View>

        {/* CONTEÚDO (ÁREA BRANCA) */}
        <View style={styles.bottomContainer}>
          <View style={styles.sectionHeaderGeral}>
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={24}
              color="#2A3A56"
            />
            <Text style={styles.sectionTitle}>Visão Geral</Text>
          </View>

          <View style={styles.cardsGeralContainer}>
            {renderCardGeral(
              <MaterialCommunityIcons
                name="thermometer"
                size={16}
                color="#2A3A56"
              />,
              "Temp.",
              ultimaLeitura?.dados?.temperatura != null
                ? `${Number(ultimaLeitura.dados.temperatura).toFixed(0)}° C`
                : "--",
            )}
            {renderCardGeral(
              <MaterialCommunityIcons
                name="water-percent"
                size={16}
                color="#2A3A56"
              />,
              "Umid.",
              ultimaLeitura?.dados?.umidade != null
                ? `${Number(ultimaLeitura.dados.umidade).toFixed(0)}%`
                : "--",
            )}
            {renderCardGeral(
              <Ionicons name="partly-sunny" size={16} color="#2A3A56" />,
              "Luz",
              ultimaLeitura?.dados?.luminosidade != null
                ? `${Number(ultimaLeitura.dados.luminosidade).toFixed(0)}`
                : "--",
            )}
          </View>

          <View style={[styles.sectionHeaderGeral, { marginBottom: 15 }]}>
            <Ionicons name="warning-outline" size={24} color="#2A3A56" />
            <Text style={styles.sectionTitle}>Alertas ({alertas.length})</Text>
          </View>

          {alertas.length === 0 ? (
            <View style={{ padding: 10, alignItems: "center" }}>
              <Text style={{ color: "#2A3A56", opacity: 0.6 }}>Nenhuma irregularidade recente pendente.</Text>
            </View>
          ) : (
            alertas.map((alerta) => (
              <TouchableOpacity
                key={alerta.id}
                activeOpacity={0.8}
              >
                <View style={styles.cardAlerta}>
                  <View style={styles.cardAlertaMain}>
                    <View style={styles.cardAlertaContentRow}>
                      <View style={styles.alertaIconContainer}>
                        <Ionicons
                          name={
                            alerta.tipo === "risco"
                              ? "close-circle-outline"
                              : "warning-outline"
                          }
                          size={28}
                          color={
                            alerta.gravidade === "Alta" ? "#EF4444" : "#F59E0B"
                          }
                        />
                      </View>
                      <View style={styles.alertaTextContainer}>
                        <Text style={styles.alertaTitle}>{alerta.mensagem}</Text>
                        <Text style={styles.alertaSubtitle}>
                          {alerta.submensagem}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.badgeGravidade,
                        {
                          backgroundColor:
                            alerta.gravidade === "Alta" ? "#EF4444" : "#F59E0B",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{alerta.gravidade}</Text>
                    </View>
                  </View>
                  <View style={styles.alertaFooter}>
                    <Text style={styles.alertaFooterText}>
                      Estufa {alerta.estufa}
                    </Text>
                    <Text style={styles.alertaFooterText}>{alerta.tempo}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  topContainer: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  topContent: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  welcomeText: { fontSize: 22, fontWeight: "bold", color: Colors.text },
  subwelcomeText: { fontSize: 14, color: Colors.text, opacity: 0.8 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
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
  avatarText: { fontSize: 16, fontWeight: "bold", color: Colors.text },
  resumoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 25,
  },
  resumoItem: { alignItems: "center" },
  resumoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  resumoLabel: { fontSize: 14, color: Colors.text, fontWeight: "bold" },
  resumoValue: { fontSize: 48, fontWeight: "bold", color: Colors.background },
  verticalDivider: {
    width: 1.5,
    height: 60,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.avatarBg,
    borderRadius: 15,
    height: 35,
    padding: 3,
    marginBottom: 10,
  },
  progressBar: {
    backgroundColor: Colors.text,
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  progressText: { color: Colors.white, fontSize: 14, fontWeight: "bold" },
  progressValueText: {
    position: "absolute",
    right: 15,
    color: Colors.progressText,
    fontSize: 14,
    fontWeight: "bold",
  },
  progressDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 5,
  },
  progressDescriptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "bold",
  },
  bottomContainer: { paddingHorizontal: 20, paddingTop: 30 },
  sectionHeaderGeral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  cardsGeralContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 35,
  },
  cardGeral: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    width: "28%",
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: "center",
    elevation: 3,
  },
  cardHeaderGeral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 10,
  },
  cardLabelGeral: { fontSize: 9, color: Colors.text, fontWeight: "bold" },
  cardValueGeral: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 5,
  },
  cardStatusGeral: { fontSize: 10, color: Colors.primary, fontWeight: "bold" },
  cardAlerta: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  cardAlertaMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  cardAlertaContentRow: { flexDirection: "row", gap: 12, flex: 1 },
  alertaIconContainer: { width: 30, justifyContent: "center" },
  alertaTextContainer: { flex: 1 },
  alertaTitle: { fontSize: 16, fontWeight: "bold", color: Colors.text },
  alertaSubtitle: { fontSize: 13, color: Colors.text, opacity: 0.8 },
  badgeGravidade: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "bold", color: Colors.white },
  alertaFooter: { flexDirection: "row", gap: 20, marginLeft: 42, opacity: 0.6 },
  alertaFooterText: { fontSize: 12, color: Colors.text },
});