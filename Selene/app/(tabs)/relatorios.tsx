import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";

// IMPORTANTE: Trocando os imports dinâmicos por imports estáticos no topo do arquivo
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { API_V1 } from "@/constants/api";

interface ExportHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  format: "CSV" | "PDF";
  type: "sensores" | "imagens";
}

export default function RelatoriosScreen() {
  const router = useRouter();
  const [iniciais, setIniciais] = useState("US");
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  const API_BASE = API_V1;

  const handleGoProfile = async () => {
    const role = await SecureStore.getItemAsync("userRole");
    const isAdmin = role === "admin" || role === "superadmin";
    router.push(isAdmin ? "/(admin)/profile-admin" : "/(tabs)/profile");
  };

  useEffect(() => {
    const inicializarDados = async () => {
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

        const historicoSalvo = await SecureStore.getItemAsync("selene_export_history");
        if (historicoSalvo) {
          setExportHistory(JSON.parse(historicoSalvo));
        }
      } catch (e) {
      }
    };

    inicializarDados();
  }, []);

  const registrarNovaExportacao = async (title: string, subtitle: string, format: "CSV" | "PDF", type: "sensores" | "imagens") => {
    try {
      const now = new Date();
      const novoItem: ExportHistoryItem = {
        id: now.getTime().toString(),
        title,
        subtitle,
        date: formatDateBR(now),
        format,
        type,
      };

      const novoHistorico = [novoItem, ...exportHistory].slice(0, 20);
      setExportHistory(novoHistorico);
      await SecureStore.setItemAsync("selene_export_history", JSON.stringify(novoHistorico));
    } catch (e) {
    }
  };

  const formatDateBR = (d: Date) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} - ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const fetchUserDevices = async (token: string) => {
    const res = await fetch(`${API_BASE}/dispositivos/meus`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const json = await res.json();
    return json.data || [];
  };

  const fetchDeviceLeituras = async (deviceId: string, token: string) => {
    const res = await fetch(`${API_BASE}/dispositivos/${deviceId}/leituras?limite=999999`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  };

  // EXPORTAR SENSORES (CSV)
  const exportSensorsCSV = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");

      const dispositivos = await fetchUserDevices(token);
      let rows: string[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const sensores = leituras.filter((l: any) => l.tipo_leitura === "SENSORES");
        sensores.forEach((s: any) => {
          const t = s.dados?.temperatura ?? "";
          const u = s.dados?.umidade ?? "";
          const lz = s.dados?.luminosidade ?? "";
          const time = s.createdAt || s.timestamp || "";
          const alerta =
            t > 30 ||
            t < 10 ||
            u > 85 ||
            u < 40 ||
            lz < 2;

          const status = alerta ? "ANOMALIA" : "NORMAL";

          rows.push([
            d.nome || d._id,
            `${t}°C`,
            `${u}%`,
            lz,
            status,
            new Date(time).toLocaleString("pt-BR")
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(";"));
        });
      }

      const header = [
        "Dispositivo",
        "Temperatura (°C)",
        "Umidade (%)",
        "Luminosidade",
        "Status",
        "Data/Hora"
      ].join(";");
      const csv =
        "\uFEFF" +
        `${header}\n${rows.join("\n")}`;
      const fileUri = `${(FileSystem as any).cacheDirectory}relatorios_sensores.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);

      // Verificação simplificada usando o import estático
      if (Sharing.isAvailableAsync && !(await Sharing.isAvailableAsync())) {
        return Alert.alert("Exportar", "Compartilhamento não disponível.");
      }

      await Sharing.shareAsync(fileUri, { mimeType: "text/csv" });
      await registrarNovaExportacao("Relatório de Sensores", `Dados de ${dispositivos.length} estufas exportados.`, "CSV", "sensores");
    } catch (e) {
      Alert.alert("Erro", "Falha ao gerar relatório de sensores.");
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAR IMAGENS (CSV)
  const exportImagesCSV = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");

      const dispositivos = await fetchUserDevices(token);
      let rows: string[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const imagens = leituras.filter((l: any) => l.tipo_leitura === "CAMERA" || l.dados?.foto_path);
        imagens.forEach((s: any) => {
          const foto = s.dados?.foto_path || s.dados?.foto || "";
          const time = s.createdAt || s.timestamp || "";
          rows.push([d.nome || d._id, foto, time].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
        });
      }

      const header = ["dispositivo", "foto_url", "timestamp"].join(",");
      const csv =
        "\uFEFF" +
        `${header}\n${rows.join("\n")}`;
      const fileUri = `${(FileSystem as any).cacheDirectory}relatorios_imagens.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);

      if (Sharing.isAvailableAsync && !(await Sharing.isAvailableAsync())) {
        return Alert.alert("Exportar", "Compartilhamento não disponível.");
      }

      await Sharing.shareAsync(fileUri, { mimeType: "text/csv" });
      await registrarNovaExportacao("Relatório de Fotos", `Links de capturas gerados em planilha.`, "CSV", "imagens");
    } catch (e) {
      Alert.alert("Erro", "Falha ao gerar relatório de imagens.");
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAR SENSORES (PDF)
  const exportSensorsPDF = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");
      const dispositivos = await fetchUserDevices(token);
      let htmlItems: string[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const sensores = leituras.filter((l: any) => l.tipo_leitura === "SENSORES");
        if (sensores.length === 0) continue;
        htmlItems.push(`<h2>Estufa: ${d.nome || d._id}</h2>`);
        sensores.forEach((s: any) => {
          const t = s.dados?.temperatura ?? "";
          const u = s.dados?.umidade ?? "";
          const lz = s.dados?.luminosidade ?? "";
          const time = s.createdAt ? new Date(s.createdAt).toLocaleString("pt-BR") : "";
          htmlItems.push(`<div style="padding: 6px; border-bottom: 1px solid #eee;"><b>T:</b> ${t}°C | <b>U:</b> ${u}% | <b>L:</b> ${lz} — <small>${time}</small></div>`);
        });
      }

      const html = `<html><head><style>body{font-family:sans-serif;color:#2A3A56;padding:20px;}h1{color:#95C159;}</style></head><body><h1>Relatório de Sensores Selene</h1>${htmlItems.join("\n")}</body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      await registrarNovaExportacao("Relatório de Sensores", "Documento PDF com leituras climáticas.", "PDF", "sensores");
    } catch (e) {
      Alert.alert("Erro", "Falha ao gerar PDF de sensores.");
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAR IMAGENS (PDF)
  const exportImagesPDF = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");
      const dispositivos = await fetchUserDevices(token);
      let htmlItems: string[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const imagens = leituras.filter((l: any) => l.tipo_leitura === "CAMERA" || l.dados?.foto_path);
        if (imagens.length === 0) continue;
        htmlItems.push(`<h2>Estufa: ${d.nome || d._id}</h2>`);
        imagens.forEach((s: any) => {
          const foto = s.dados?.foto_path || s.dados?.foto || "";
          const time = s.createdAt ? new Date(s.createdAt).toLocaleString("pt-BR") : "";
          htmlItems.push(`<div style="margin-bottom:20px; display:inline-block; margin-right:15px; text-align:center;"><img src="${foto}" style="width:200px;border-radius:8px;display:block;"/><small>${time}</small></div>`);
        });
      }

      const html = `<html><head><style>body{font-family:sans-serif;color:#2A3A56;padding:20px;}h1{color:#95C159;}</style></head><body><h1>Relatório de Monitoramento Visual</h1>${htmlItems.join("\n")}</body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      await registrarNovaExportacao("Relatório de Fotos", "Galeria de acompanhamento em PDF.", "PDF", "imagens");
    } catch (e) {
      Alert.alert("Erro", "Falha ao gerar PDF de imagens.");
    } finally {
      setLoading(false);
    }
  };

  const limparHistorico = () => {
    Alert.alert("Limpar Histórico", "Deseja apagar os registros locais de exportação?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, apagar", onPress: async () => {
          setExportHistory([]);
          await SecureStore.deleteItemAsync("selene_export_history");
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: ExportHistoryItem }) => (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: item.format === "PDF" ? "#FF4B4B" : "#10B981" }]}>
        <MaterialCommunityIcons
          name={item.format === "PDF" ? "file-pdf-box" : "file-excel-box"}
          size={24}
          color="white"
        />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <View style={[styles.badgeFormat, { borderColor: item.format === "PDF" ? "#FF4B4B" : "#10B981" }]}>
            <Text style={[styles.badgeFormatText, { color: item.format === "PDF" ? "#FF4B4B" : "#10B981" }]}>
              {item.format}
            </Text>
          </View>
        </View>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        <View style={styles.footerCardRow}>
          <View style={styles.tagTipo}>
            <MaterialCommunityIcons
              name={item.type === "sensores" ? "thermometer" : "image-filter-hdr"}
              size={12}
              color="#666"
            />
            <Text style={styles.tagTipoText}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.itemDate}>{item.date}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Relatórios</Text>
              <Text style={styles.subwelcomeText}>Exportação de Dados</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.avatarCircle} onPress={handleGoProfile}>
                <Text style={styles.avatarText}>{iniciais}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/alert")}>
                <Feather name="bell" size={24} color="#2A3A56" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* SEÇÃO NOVA: BOTÕES DE EXPORTAÇÃO SE COUBEREM ABAIXO EM DESIGN CLEAN */}
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Gerar Novo Relatório</Text>
          <View style={styles.exportActionsContainer}>
            <TouchableOpacity style={styles.exportActionCard} onPress={() => {
              Alert.alert("Exportar Sensores", "Escolha o formato do arquivo climático:", [
                { text: "CSV (Excel)", onPress: () => exportSensorsCSV() },
                { text: "PDF Impresso", onPress: () => exportSensorsPDF() },
                { text: "Cancelar", style: "cancel" },
              ]);
            }}>
              <View style={[styles.exportActionIconBg, { backgroundColor: "#E6F4EA" }]}>
                <MaterialCommunityIcons name="thermometer" size={24} color="#10B981" />
              </View>
              <Text style={styles.exportActionText}>Dados Climáticos</Text>
              <Text style={styles.exportActionSubtext}>Sensores</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportActionCard} onPress={() => {
              Alert.alert("Exportar Imagens", "Escolha o formato do relatório visual:", [
                { text: "CSV (Lista)", onPress: () => exportImagesCSV() },
                { text: "PDF Galeria", onPress: () => exportImagesPDF() },
                { text: "Cancelar", style: "cancel" },
              ]);
            }}>
              <View style={[styles.exportActionIconBg, { backgroundColor: "#E8F0FE" }]}>
                <MaterialCommunityIcons name="image" size={24} color="#1A73E8" />
              </View>
              <Text style={styles.exportActionText}>Monitoramento</Text>
              <Text style={styles.exportActionSubtext}>Imagens</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Histórico de Exportações Salvas</Text>
            {exportHistory.length > 0 && (
              <TouchableOpacity onPress={limparHistorico}>
                <Ionicons name="trash-outline" size={16} color="#FF4B4B" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#95C159" />
              <Text style={styles.loadingText}>Coletando dados da API e automatizando arquivo...</Text>
            </View>
          ) : exportHistory.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="folder-download-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateTitle}>Nenhum arquivo gerado</Text>
              <Text style={styles.emptyStateSubtitle}>
                Toque nos cartões acima de sensores ou imagens para compilar e baixar os dados em tempo real das suas estufas.
              </Text>
            </View>
          ) : (
            <FlatList
              data={exportHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#95C159" },
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
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#2A3A56" },
  subwelcomeText: { fontSize: 14, color: "#2A3A56", opacity: 0.8 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 4,
  },
  avatarText: { fontSize: 14, fontWeight: "bold", color: "#2A3A56" },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  exportActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 25,
  },
  exportActionCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F2F5",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  exportActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  exportActionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A3A56",
    textAlign: "center",
  },
  exportActionSubtext: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    color: "#2A3A56",
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: { fontSize: 15, fontWeight: "bold", color: "#2A3A56" },
  badgeFormat: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeFormatText: { fontSize: 10, fontWeight: "bold" },
  itemSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  footerCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  tagTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF0F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagTipoText: { fontSize: 9, fontWeight: "bold", color: "#666" },
  itemDate: { fontSize: 11, color: "#999" },
  separator: { height: 10 },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#2A3A56", textAlign: "center", opacity: 0.8 },
  emptyStateContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: "bold", color: "#2A3A56", marginTop: 15 },
  emptyStateSubtitle: { fontSize: 13, color: "#888", textAlign: "center", marginTop: 8, lineHeight: 18 },
});