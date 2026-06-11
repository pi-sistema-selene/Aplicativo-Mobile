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
import { IMAGES } from "@/constants/images";
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
  data: string;
  local: string;
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

            if (
              (leitura.tipo_leitura === "CAMERA" || leitura.dados?.foto_path) &&
              listaAnalisesGeradas.length < 10
            ) {
              listaAnalisesGeradas.push({
                id: leitura._id || `${dispositivo._id}_cam_${index}`,
                img:
                  leitura.dados?.foto_path ||
                  leitura.dados?.foto ||
                  IMAGES.placeholderGreenhouse,
                data: leitura.createdAt
                  ? `${formatDateBR(leitura.createdAt)}, ${formatTimeBR(leitura.createdAt)}`
                  : "Data indisponível",
                local: `${dispositivo.nome || "Estufa"} - ${leitura.dados?.setor || "Setor B"}`,
              });
            }
          });
        }

        if (listaAnalisesGeradas.length === 0) {
          listaAnalisesGeradas.push(
            {
              id: "mock1",
              img: IMAGES.placeholderGreenhouse,
              data: "05 de outubro, 16:25",
              local: "Estufa 2 - Setor B",
            },
            {
              id: "mock2",
              img: IMAGES.placeholderGreenhouse2,
              data: "05 de outubro, 12:15",
              local: "Estufa 5 - Setor A",
            },
          );
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
        {/* CABEÇALHO SUPERIOR */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={26} color="#1E2E4A" />
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
                <Feather name="bell" size={24} color="#1E2E4A" />
                {countAlta > 0 && <View style={styles.badgeNotificacaoVermelha} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CONTAINER BRANCO DO CONTEÚDO */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#94C11F" />
              <Text style={styles.loadingText}>Buscando anomalias registradas...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

              {/* COMPONENTE DE FILTRO (PÍLULA) */}
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

              {/* ITERAÇÃO DOS CARDS DE ANOMALIAS */}
              {alertasFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="check-circle-outline" size={48} color="#94C11F" />
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

              {/* SEÇÃO DO CARROSSEL DE ANÁLISES VISUAIS */}
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
            color={isAlta ? "#EF4444" : "#F59E0B"}
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
        <View style={styles.infoRow}>
          <Feather name="calendar" size={12} color="#7E8B9B" />
          <Text style={styles.imageDate} numberOfLines={1}>{data}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={12} color="#7E8B9B" />
          <Text style={styles.imageDate} numberOfLines={1}>{local}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#95C159" },
  topContainer: {
    backgroundColor: "#95C159",
    paddingBottom: 45,
    paddingTop: 15,
    paddingHorizontal: 25,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 15 },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#1E2E4A" },
  subwelcomeText: { fontSize: 14, color: "#1E2E4A", opacity: 0.8, marginTop: 1 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "bold", color: "#1E2E4A" },
  badgeNotificacaoVermelha: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9534F",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 25,
    marginTop: -25,
  },
  loadingCenter: { flex: 0.8, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#1E2E4A", fontSize: 14, fontWeight: "600" },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F3F5",
    borderRadius: 14,
    padding: 4,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  filterActive: { backgroundColor: "#1E2E4A" },
  filterText: { color: "#5A6E85", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#FFF" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { marginTop: 10, color: "#8A99AD", fontSize: 14, fontWeight: "500" },
  alertaCard: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
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
    marginRight: 12,
    marginTop: 2,
  },
  alertaTextColumn: { flex: 1, marginRight: 8 },
  alertaTitle: { fontSize: 16, fontWeight: "700", color: "#1E2E4A", marginBottom: 4 },
  alertaSub: { fontSize: 13, color: "#5A6E85", lineHeight: 18, marginBottom: 8 },
  alertaFooter: { fontSize: 11, color: "#A0AEC0", fontWeight: "500" },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start"
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  panelTitle: { fontSize: 18, fontWeight: "700", color: "#1E2E4A", marginBottom: 15, paddingLeft: 4 },
  analiseScroll: { paddingLeft: 4, paddingBottom: 15 },
  analiseCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  capturedImage: { width: "100%", height: 130, resizeMode: "cover" },
  cardInfoContainer: { padding: 12, backgroundColor: "#FFF" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  imageDate: { color: "#5A6E85", fontSize: 11, fontWeight: "500", flex: 1 },
});