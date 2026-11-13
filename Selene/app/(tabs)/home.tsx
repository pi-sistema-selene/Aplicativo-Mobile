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
import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import { useUserInitials } from "@/hooks/useUserInitials";
import {
  getMeusDispositivos,
  getLeituras,
  getResumo,
} from "@/services/dispositivoService";
import {
  hasSensorAnomaly,
  buildHomeAlerta,
  buildSensorDetailFields,
  buildImageDetailFields,
  hasImageAnomaly,
  buildImageAlert,
  formatAlertaTime,
} from "@/utils/anomaly";
import type { HomeAlerta } from "@/types/alerta";
import type { Leitura } from "@/types/dispositivo";
import { getApiAssetUrl } from "@/constants/api";

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
        const leiturasPorDispositivo = await Promise.all(
          sensores.map(async (dispositivo) => ({
            dispositivo,
            leituras:
              dispositivo._id === primeiroSensor._id
                ? lista
                : await getLeituras(dispositivo._id, token, 50),
          })),
        );
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
                titulo: alerta.mensagem,
                prioridade: alerta.gravidade,
                categoria: "SENSORES",
                detalhes: buildSensorDetailFields(leitura.dados),
                dataHora: leitura.createdAt || leitura.timestamp,
              });
            }
          }
        });

        leiturasPorDispositivo.forEach(({ dispositivo, leituras }) => {
          leituras.forEach((leitura, index) => {
            const predicao = leitura.dados?.predicao;
            if (
              leitura.tipo_leitura !== "CAMERA" ||
              !hasImageAnomaly(predicao)
            ) {
              return;
            }

            contadorDeteccoesGeral += 1;
            if (listaAlertasGerados.length < 4) {
              const alerta = buildImageAlert(predicao);
              listaAlertasGerados.push({
                id: leitura._id || `${dispositivo._id}_camera_${index}`,
                mensagem: alerta.titulo,
                submensagem: alerta.sub,
                gravidade: alerta.prioridade,
                estufa: dispositivo.nome || "Principal",
                tempo: formatAlertaTime(leitura.createdAt || leitura.timestamp),
                tipo: alerta.tipo,
                titulo: alerta.titulo,
                prioridade: alerta.prioridade,
                categoria: "CAMERA",
                detalhes: buildImageDetailFields(predicao),
                imagemUri: leitura.dados?.foto_path || leitura.dados?.foto
                  ? getApiAssetUrl(leitura.dados.foto_path || leitura.dados.foto || "")
                  : undefined,
                dataHora: leitura.createdAt || leitura.timestamp,
              });
            }
          });
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

        <View style={styles.topContainer}>
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.topContent}
          >
            <View style={styles.header}>
              <View>
                {loading || loadingUser ? (
                  <ActivityIndicator size="small" color={Colors.text} />
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
                    color={Colors.text}
                    style={{ marginLeft: Spacing.sm }}
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
                    color={Colors.text}
                  />
                  <Text style={styles.resumoLabel}>Total Detecções</Text>
                </View>
                <Text style={styles.resumoValue}>{totalAnomalias}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.resumoItem}>
                <View style={styles.resumoHeader}>
                  <Ionicons name="warning-outline" size={20} color={Colors.text} />
                  <Text style={styles.resumoLabel}>Total Análises</Text>
                </View>
                <Text style={[styles.resumoValue, { color: Colors.text }]}>
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
                color={Colors.text}
              />
              <Text style={styles.progressDescriptionText}>
                {porcentagem}% De Detecções
              </Text>
            </View>
          </SafeAreaView>
        </View>


        <View style={styles.bottomContainer}>
          <View style={styles.sectionHeaderGeral}>
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={24}
              color={Colors.text}
            />
            <Text style={styles.sectionTitle}>Visão Geral</Text>
          </View>

          <View style={styles.cardsGeralContainer}>
            {renderCardGeral(
              <MaterialCommunityIcons
                name="thermometer"
                size={16}
                color={Colors.text}
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
                color={Colors.text}
              />,
              "Umid.",
              ultimaLeitura?.dados?.umidade != null
                ? `${Number(ultimaLeitura.dados.umidade).toFixed(0)}%`
                : "--",
            )}
            {renderCardGeral(
              <Ionicons name="partly-sunny" size={16} color={Colors.text} />,
              "Luz",
              ultimaLeitura?.dados?.luminosidade != null
                ? `${Number(ultimaLeitura.dados.luminosidade).toFixed(0)}`
                : "--",
            )}
          </View>

          <View style={[styles.sectionHeaderGeral, { marginBottom: 15 }]}>
            <Ionicons name="warning-outline" size={24} color={Colors.text} />
            <Text style={styles.sectionTitle}>Alertas ({alertas.length})</Text>
          </View>

          {alertas.length === 0 ? (
            <View style={{ padding: 10, alignItems: "center" }}>
              <Text style={{ color: Colors.text, opacity: 0.6 }}>Nenhuma irregularidade recente pendente.</Text>
            </View>
          ) : (
            alertas.map((alerta) => (
              <TouchableOpacity
                key={alerta.id}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/alert-detalhe",
                    params: { alerta: JSON.stringify(alerta) },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes do alerta: ${alerta.mensagem}`}
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
                            alerta.gravidade === "Alta" ? Colors.alertHigh : Colors.alertMedium
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
                            alerta.gravidade === "Alta" ? Colors.alertHigh : Colors.alertMedium,
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
                  <Text style={styles.alertaDetailHint}>Toque para ver os detalhes</Text>
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
    paddingBottom: Spacing.section,
    paddingHorizontal: Spacing.screen,
  },
  topContent: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: Spacing.section,
  },
  welcomeText: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.text },
  subwelcomeText: { fontSize: Typography.body, color: Colors.text, opacity: 0.8 },
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
  avatarText: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },
  resumoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  resumoItem: { alignItems: "center" },
  resumoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 10,
  },
  resumoLabel: { fontSize: Typography.body, color: Colors.text, fontWeight: FontWeight.bold },
  resumoValue: { fontSize: Typography.metric, fontWeight: FontWeight.bold, color: Colors.background },
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
    borderRadius: Radius.lg,
    height: 35,
    padding: 3,
    marginBottom: 10,
  },
  progressBar: {
    backgroundColor: Colors.text,
    height: "100%",
    borderRadius: Radius.md,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  progressText: { color: Colors.white, fontSize: Typography.body, fontWeight: FontWeight.bold },
  progressValueText: {
    position: "absolute",
    right: 15,
    color: Colors.progressText,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  progressDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginLeft: 5,
  },
  progressDescriptionText: {
    fontSize: Typography.body,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  bottomContainer: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xxl },
  sectionHeaderGeral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: Typography.sectionTitle, fontWeight: FontWeight.bold, color: Colors.text },
  cardsGeralContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 35,
  },
  cardGeral: {
    padding: Spacing.cardCompact,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    width: "28%",
    alignItems: "center",
    elevation: 3,
  },
  cardHeaderGeral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 10,
  },
  cardLabelGeral: { fontSize: Typography.micro, color: Colors.text, fontWeight: FontWeight.bold },
  cardValueGeral: {
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 5,
  },
  cardStatusGeral: { fontSize: Typography.tiny, color: Colors.primary, fontWeight: FontWeight.bold },
  cardAlerta: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    elevation: 3,
  },
  cardAlertaMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  cardAlertaContentRow: { flexDirection: "row", gap: Spacing.sm, flex: 1 },
  alertaIconContainer: { width: 30, justifyContent: "center" },
  alertaTextContainer: { flex: 1 },
  alertaTitle: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },
  alertaSubtitle: { fontSize: Typography.small, color: Colors.text, opacity: 0.8 },
  alertaDetailHint: {
    color: Colors.info,
    fontSize: Typography.footnote,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
    marginLeft: 42,
  },
  badgeGravidade: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  badgeText: { fontSize: Typography.footnote, fontWeight: FontWeight.bold, color: Colors.white },
  alertaFooter: { flexDirection: "row", gap: Spacing.lg, marginLeft: 42, opacity: 0.6 },
  alertaFooterText: { fontSize: Typography.caption, color: Colors.text },
});