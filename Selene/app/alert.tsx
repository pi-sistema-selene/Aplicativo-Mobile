import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { useUserInitials } from "@/hooks/useUserInitials";
import { getMeusDispositivos, getLeituras } from "@/services/dispositivoService";
import {
  hasSensorAnomaly,
  buildAlertaScreenItem,
  formatAlertaTimeRelative,
} from "@/utils/anomaly";
import { formatDateBR, formatTimeBR } from "@/utils/formatDate";
import type { AlertaItem } from "@/types/alerta";

interface AnaliseItem {
  id: string;
  img: string;
  data?: string;
  local?: string;
}

export default function AlertasScreen() {
  const router = useRouter();
  const { iniciais } = useUserInitials();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [analises, setAnalises] = useState<AnaliseItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"Total" | "Alta" | "Média" | "Baixa">("Total");

  useEffect(() => {
    const carregarEProcessarAlertas = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        if (!token) return;

        const meusDispositivos = await getMeusDispositivos(token);
        const listaAlertasGerados: AlertaItem[] = [];
        const listaAnalisesGeradas: AnaliseItem[] = [];

        for (const dispositivo of meusDispositivos) {
          const listaLeituras = await getLeituras(dispositivo._id, token, 50);

          listaLeituras.forEach((leitura, index) => {
            if (leitura.tipo_leitura === "SENSORES" && leitura.dados && hasSensorAnomaly(leitura.dados)) {
              const alerta = buildAlertaScreenItem(leitura.dados);
              listaAlertasGerados.push({
                id: leitura._id || `${dispositivo._id}_sensor_${index}`,
                titulo: alerta.titulo,
                sub: alerta.sub,
                prioridade: alerta.prioridade,
                corPrioridade: alerta.corPrioridade,
                estufa: dispositivo.nome || "Principal",
                tempo: formatAlertaTimeRelative(leitura.createdAt),
                tipo: alerta.tipo,
              });
            }

            const imagem = leitura.dados?.foto_path || leitura.dados?.foto;
            if (
              leitura.tipo_leitura === "CAMERA" &&
              imagem?.trim() &&
              listaAnalisesGeradas.length < 10
            ) {
              const dataLeitura = leitura.createdAt || leitura.timestamp;
              const local = [dispositivo.nome, leitura.dados?.setor]
                .filter(Boolean)
                .join(" - ");

              listaAnalisesGeradas.push({
                id: leitura._id || `${dispositivo._id}_cam_${index}`,
                img: imagem,
                data: dataLeitura
                  ? `${formatDateBR(dataLeitura)}, ${formatTimeBR(dataLeitura)}`
                  : undefined,
                local: local || undefined,
              });
            }
          });
        }

        setAlertas(listaAlertasGerados);
        setAnalises(listaAnalisesGeradas);
      } catch (error) {
        console.error("Erro ao sincronizar dados na tela de alertas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarEProcessarAlertas();
  }, []);

  const countTotal = alertas.length;
  const countAlta = alertas.filter((a) => a.prioridade === "Alta").length;
  const countMedia = alertas.filter((a) => a.prioridade === "Média").length;
  const countBaixa = alertas.filter((a) => a.prioridade === "Baixa").length;

  const alertasFiltrados = useMemo(() => {
    if (activeFilter === "Total") return alertas;
    return alertas.filter((a) => a.prioridade === activeFilter);
  }, [activeFilter, alertas]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>

        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={26} color={Colors.textAlt} />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Alertas</Text>
              <Text style={styles.subwelcomeText}>Gerenciamento de Riscos</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push("/profile")}>
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Feather name="bell" size={24} color={Colors.textAlt} />
                {countAlta > 0 && <View style={styles.badgeNotificacaoVermelha} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={Colors.loading} />
              <Text style={styles.loadingText}>Buscando anomalias registradas...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.section }}>


              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "Total" && styles.filterActive]}
                  onPress={() => setActiveFilter("Total")}
                >
                  <Text style={[styles.filterText, activeFilter === "Total" && styles.filterTextActive]}>
                    Total({countTotal})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "Alta" && styles.filterActive]}
                  onPress={() => setActiveFilter("Alta")}
                >
                  <Text style={[styles.filterText, activeFilter === "Alta" && styles.filterTextActive]}>
                    Alta({countAlta})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "Média" && styles.filterActive]}
                  onPress={() => setActiveFilter("Média")}
                >
                  <Text style={[styles.filterText, activeFilter === "Média" && styles.filterTextActive]}>
                    Média({countMedia})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "Baixa" && styles.filterActive]}
                  onPress={() => setActiveFilter("Baixa")}
                >
                  <Text style={[styles.filterText, activeFilter === "Baixa" && styles.filterTextActive]}>
                    Baixo({countBaixa})
                  </Text>
                </TouchableOpacity>
              </View>


              {alertasFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="check-circle-outline" size={48} color={Colors.loading} />
                  <Text style={styles.emptyText}>Nenhuma irregularidade para este filtro.</Text>
                </View>
              ) : (
                alertasFiltrados.map((item) => (
                  <AlertaCard
                    key={item.id}
                    titulo={item.titulo}
                    sub={item.sub}
                    estufa={item.estufa}
                    tempo={item.tempo}
                    prioridade={item.prioridade}
                    corPrioridade={item.corPrioridade}
                    tipo={item.tipo}
                  />
                ))
              )}


              {analises.length > 0 && (
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.panelTitle}>Últimas Análises</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.analiseScroll}>
                    {analises.map((item) => (
                      <AnaliseCard key={item.id} img={item.img} data={item.data} local={item.local} />
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AlertaCard({ titulo, sub, estufa, tempo, prioridade, corPrioridade, tipo }: any) {
  const isAlta = prioridade === "Alta";
  return (
    <View style={styles.alertaCard}>
      <View style={styles.alertaHeaderRow}>
        <View style={[styles.alertaIconBg, { backgroundColor: isAlta ? "#FCE8E6" : "#FEF5E7" }]}>
          <Ionicons
            name={tipo === "risco" ? "close-circle-outline" : "warning-outline"}
            size={22}
            color={isAlta ? Colors.alertHigh : Colors.alertMedium}
          />
        </View>

        <View style={styles.alertaTextColumn}>
          <Text style={styles.alertaTitle} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.alertaSub}>{sub}</Text>
          <Text style={styles.alertaFooter}>
            {estufa}    {tempo}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: corPrioridade }]}>
          <Text style={styles.badgeText}>{prioridade}</Text>
        </View>
      </View>
    </View>
  );
}

function AnaliseCard({ img, data, local }: any) {
  return (
    <View style={styles.analiseCard}>
      <Image source={{ uri: img }} style={styles.capturedImage} />
      <View style={styles.cardInfoContainer}>
        {data && (
          <View style={styles.infoRow}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.imageDate} numberOfLines={1}>{data}</Text>
          </View>
        )}
        {local && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={styles.imageDate} numberOfLines={1}>{local}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topContainer: {
    backgroundColor: Colors.primary,
    paddingBottom: 45,
    paddingTop: 15,
    paddingHorizontal: Spacing.screen,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 15 },
  welcomeText: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.textAlt },
  subwelcomeText: { fontSize: Typography.body, color: Colors.textAlt, opacity: 0.8, marginTop: 1 },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 27,
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
  badgeNotificacaoVermelha: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.alertHighAlt,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    marginTop: -25,
  },
  loadingCenter: { flex: 0.8, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: Spacing.sm, color: Colors.textAlt, fontSize: Typography.body, fontWeight: FontWeight.semibold },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F3F5",
    borderRadius: 14,
    padding: Spacing.xxs,
    marginBottom: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTab: { flex: 1, paddingVertical: Spacing.xs, alignItems: "center", borderRadius: Radius.sm },
  filterActive: { backgroundColor: Colors.textAlt },
  filterText: { color: Colors.textMuted, fontSize: Typography.small, fontWeight: FontWeight.semibold },
  filterTextActive: { color: Colors.white },
  emptyContainer: { padding: Spacing.section, alignItems: "center" },
  emptyText: { marginTop: 10, color: "#8A99AD", fontSize: Typography.body, fontWeight: FontWeight.medium },
  alertaCard: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
  },
  alertaHeaderRow: { flexDirection: "row", alignItems: "flex-start" },
  alertaIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  alertaTextColumn: { flex: 1, marginRight: Spacing.xs },
  alertaTitle: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.textAlt, marginBottom: Spacing.xxs },
  alertaSub: { fontSize: Typography.small, color: Colors.textMuted, lineHeight: 18, marginBottom: Spacing.xs },
  alertaFooter: { fontSize: Typography.footnote, color: "#A0AEC0", fontWeight: FontWeight.medium },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.md,
    alignSelf: "flex-start"
  },
  badgeText: { color: Colors.white, fontSize: Typography.footnote, fontWeight: FontWeight.bold },
  panelTitle: { fontSize: Typography.sectionTitle, fontWeight: FontWeight.bold, color: Colors.textAlt, marginBottom: 15, paddingLeft: Spacing.xxs },
  analiseScroll: { paddingLeft: Spacing.xxs, paddingBottom: 15 },
  analiseCard: {
    width: 200,
    marginRight: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  capturedImage: { width: "100%", height: 130, resizeMode: "cover" },
  cardInfoContainer: { padding: Spacing.sm, backgroundColor: Colors.white },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.xxs },
  imageDate: { color: Colors.textMuted, fontSize: Typography.footnote, fontWeight: FontWeight.medium, flex: 1 },
});