import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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
  Modal,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";

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
  recordCount?: number;
}

interface ReportPreviewField {
  label: string;
  value: string;
}

interface ReportPreviewEntry {
  group: string;
  title: string;
  fields: ReportPreviewField[];
  imageUri?: string;
}

export default function RelatoriosScreen() {
  const router = useRouter();
  const [iniciais, setIniciais] = useState("US");
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [exportType, setExportType] = useState<"sensores" | "imagens" | null>(null);
  const [selectedReport, setSelectedReport] = useState<ExportHistoryItem | null>(null);
  const [previewEntries, setPreviewEntries] = useState<ReportPreviewEntry[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      } catch {
        Alert.alert("Erro", "Não foi possível carregar o histórico de exportações.");
      }
    };

    inicializarDados();
  }, []);

  const getReportsDirectory = async () => {
    if (!FileSystem.documentDirectory) {
      throw new Error("Armazenamento de documentos indisponível.");
    }

    const directory = `${FileSystem.documentDirectory}selene-reports/`;
    const directoryInfo = await FileSystem.getInfoAsync(directory);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    return directory;
  };

  const getReportFileUri = async (id: string, extension: string) =>
    `${await getReportsDirectory()}${id}.${extension}`;

  const removerArquivosExportacao = async (item: ExportHistoryItem) => {
    const fileUri = await getReportFileUri(item.id, item.format.toLowerCase());
    const previewUri = await getReportFileUri(item.id, "json");

    for (const uri of [fileUri, previewUri]) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
      }
    }
  };

  const createExportId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const salvarPreview = async (id: string, entries: ReportPreviewEntry[]) => {
    const uri = await getReportFileUri(id, "json");
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(entries));
  };

  const registrarNovaExportacao = async (
    title: string,
    subtitle: string,
    format: "CSV" | "PDF",
    type: "sensores" | "imagens",
    id: string,
    recordCount: number,
  ) => {
    const novoItem: ExportHistoryItem = {
      id,
      title,
      subtitle,
      date: formatDateBR(new Date()),
      format,
      type,
      recordCount,
    };

    const novoHistorico = [novoItem, ...exportHistory].slice(0, 20);
    await SecureStore.setItemAsync("selene_export_history", JSON.stringify(novoHistorico));
    setExportHistory(novoHistorico);

    const itensRemovidos = exportHistory.slice(19);
    await Promise.all(itensRemovidos.map((item) => removerArquivosExportacao(item)));
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

  const compartilharRelatorio = async (item: Pick<ExportHistoryItem, "id" | "format" | "title">) => {
    const uri = await getReportFileUri(item.id, item.format.toLowerCase());
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      Alert.alert("Arquivo indisponível", "Este relatório não está mais salvo neste dispositivo.");
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Abrir relatório", "Não há um aplicativo disponível para abrir ou compartilhar este arquivo.");
      return;
    }

    try {
      await Sharing.shareAsync(uri, {
        mimeType: item.format === "PDF" ? "application/pdf" : "text/csv",
        dialogTitle: item.title,
      });
    } catch {
      Alert.alert("Não foi possível abrir o arquivo", "O relatório continua salvo no histórico.");
    }
  };

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const exportSensorsCSV = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");

      const dispositivos = await fetchUserDevices(token);
      let rows: string[] = [];
      const preview: ReportPreviewEntry[] = [];

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
          const deviceName = d.nome || d._id;
          const date = time ? new Date(time).toLocaleString("pt-BR") : "Sem data";

          rows.push([
            deviceName,
            `${t}°C`,
            `${u}%`,
            lz,
            status,
            date
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(";"));
          preview.push({
            group: deviceName,
            title: `Leitura ${date}`,
            fields: [
              { label: "Temperatura", value: `${t}°C` },
              { label: "Umidade", value: `${u}%` },
              { label: "Luminosidade", value: String(lz) },
              { label: "Status", value: status },
            ],
          });
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
      const id = createExportId();
      const fileUri = await getReportFileUri(id, "csv");
      await FileSystem.writeAsStringAsync(fileUri, csv);
      await salvarPreview(id, preview);
      await registrarNovaExportacao(
        "Relatório de Sensores",
        `Dados de ${dispositivos.length} sensores exportados.`,
        "CSV",
        "sensores",
        id,
        preview.length,
      );

      await compartilharRelatorio({ id, format: "CSV", title: "Relatório de Sensores" });
    } catch {
      Alert.alert("Erro", "Falha ao gerar relatório de sensores.");
    } finally {
      setLoading(false);
    }
  };

  const exportImagesCSV = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");

      const dispositivos = await fetchUserDevices(token);
      let rows: string[] = [];
      const preview: ReportPreviewEntry[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const imagens = leituras.filter((l: any) => l.tipo_leitura === "CAMERA" || l.dados?.foto_path);
        imagens.forEach((s: any) => {
          const foto = s.dados?.foto_path || s.dados?.foto || "";
          const time = s.createdAt || s.timestamp || "";
          const deviceName = d.nome || d._id;
          const date = time ? new Date(time).toLocaleString("pt-BR") : "Sem data";
          rows.push([deviceName, foto, time].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
          preview.push({
            group: deviceName,
            title: `Captura ${date}`,
            fields: [
              { label: "Data", value: date },
              { label: "Arquivo ou link", value: foto || "Sem imagem disponível" },
            ],
            imageUri: /^https?:\/\//i.test(foto) ? foto : undefined,
          });
        });
      }

      const header = ["dispositivo", "foto_url", "timestamp"].join(",");
      const csv =
        "\uFEFF" +
        `${header}\n${rows.join("\n")}`;
      const id = createExportId();
      const fileUri = await getReportFileUri(id, "csv");
      await FileSystem.writeAsStringAsync(fileUri, csv);
      await salvarPreview(id, preview);
      await registrarNovaExportacao(
        "Relatório de Fotos",
        "Links de capturas gerados em planilha.",
        "CSV",
        "imagens",
        id,
        preview.length,
      );

      await compartilharRelatorio({ id, format: "CSV", title: "Relatório de Fotos" });
    } catch {
      Alert.alert("Erro", "Falha ao gerar relatório de imagens.");
    } finally {
      setLoading(false);
    }
  };

  const exportSensorsPDF = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");
      const dispositivos = await fetchUserDevices(token);
      let htmlItems: string[] = [];
      const preview: ReportPreviewEntry[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const sensores = leituras.filter((l: any) => l.tipo_leitura === "SENSORES");
        if (sensores.length === 0) continue;
        const deviceName = d.nome || d._id;
        htmlItems.push(`<h2>Estufa: ${escapeHtml(deviceName)}</h2>`);
        sensores.forEach((s: any) => {
          const t = s.dados?.temperatura ?? "";
          const u = s.dados?.umidade ?? "";
          const lz = s.dados?.luminosidade ?? "";
          const rawTime = s.createdAt || s.timestamp || "";
          const time = rawTime ? new Date(rawTime).toLocaleString("pt-BR") : "Sem data";
          const alerta = t > 30 || t < 10 || u > 85 || u < 40 || lz < 2;
          const status = alerta ? "ANOMALIA" : "NORMAL";
          htmlItems.push(`<div style="padding: 10px; border-bottom: 1px solid #eee;"><b>Temperatura:</b> ${escapeHtml(String(t))}°C | <b>Umidade:</b> ${escapeHtml(String(u))}% | <b>Luminosidade:</b> ${escapeHtml(String(lz))} | <b>Status:</b> ${status} — <small>${escapeHtml(time)}</small></div>`);
          preview.push({
            group: deviceName,
            title: `Leitura ${time}`,
            fields: [
              { label: "Temperatura", value: `${t}°C` },
              { label: "Umidade", value: `${u}%` },
              { label: "Luminosidade", value: String(lz) },
              { label: "Status", value: status },
            ],
          });
        });
      }

      const html = `<html><head><style>body{font-family:sans-serif;color:${Colors.text};padding:20px;}h1{color:${Colors.primary};}</style></head><body><h1>Relatório de Sensores Selene</h1>${htmlItems.join("\n")}</body></html>`;

      const { uri: temporaryUri } = await Print.printToFileAsync({ html });
      const id = createExportId();
      const fileUri = await getReportFileUri(id, "pdf");
      await FileSystem.copyAsync({ from: temporaryUri, to: fileUri });
      await salvarPreview(id, preview);
      await registrarNovaExportacao(
        "Relatório de Sensores",
        "Documento PDF com leituras climáticas.",
        "PDF",
        "sensores",
        id,
        preview.length,
      );
      await compartilharRelatorio({ id, format: "PDF", title: "Relatório de Sensores" });
    } catch {
      Alert.alert("Erro", "Falha ao gerar PDF de sensores.");
    } finally {
      setLoading(false);
    }
  };

  const exportImagesPDF = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return Alert.alert("Erro", "Usuário não autenticado.");
      const dispositivos = await fetchUserDevices(token);
      let htmlItems: string[] = [];
      const preview: ReportPreviewEntry[] = [];

      for (const d of dispositivos) {
        const leituras = await fetchDeviceLeituras(d._id, token);
        const imagens = leituras.filter((l: any) => l.tipo_leitura === "CAMERA" || l.dados?.foto_path);
        if (imagens.length === 0) continue;
        const deviceName = d.nome || d._id;
        htmlItems.push(`<h2>Estufa: ${escapeHtml(deviceName)}</h2>`);
        imagens.forEach((s: any) => {
          const foto = s.dados?.foto_path || s.dados?.foto || "";
          const rawTime = s.createdAt || s.timestamp || "";
          const time = rawTime ? new Date(rawTime).toLocaleString("pt-BR") : "Sem data";
          htmlItems.push(`<div style="margin-bottom:20px; display:inline-block; margin-right:15px; text-align:center;">${foto ? `<img src="${escapeHtml(String(foto))}" style="width:200px;border-radius:8px;display:block;"/>` : ""}<small>${escapeHtml(time)}</small></div>`);
          preview.push({
            group: deviceName,
            title: `Captura ${time}`,
            fields: [
              { label: "Data", value: time },
              { label: "Arquivo ou link", value: foto || "Sem imagem disponível" },
            ],
            imageUri: /^https?:\/\//i.test(foto) ? foto : undefined,
          });
        });
      }

      const html = `<html><head><style>body{font-family:sans-serif;color:${Colors.text};padding:20px;}h1{color:${Colors.primary};}</style></head><body><h1>Relatório de Monitoramento Visual</h1>${htmlItems.join("\n")}</body></html>`;

      const { uri: temporaryUri } = await Print.printToFileAsync({ html });
      const id = createExportId();
      const fileUri = await getReportFileUri(id, "pdf");
      await FileSystem.copyAsync({ from: temporaryUri, to: fileUri });
      await salvarPreview(id, preview);
      await registrarNovaExportacao(
        "Relatório de Fotos",
        "Galeria de acompanhamento em PDF.",
        "PDF",
        "imagens",
        id,
        preview.length,
      );
      await compartilharRelatorio({ id, format: "PDF", title: "Relatório de Fotos" });
    } catch {
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
          try {
            if (exportHistory.length > 0) {
              await getReportsDirectory();
            }
            await Promise.all(exportHistory.map(removerArquivosExportacao));
            await SecureStore.deleteItemAsync("selene_export_history");
            setExportHistory([]);
          } catch {
            Alert.alert("Erro", "Não foi possível apagar todos os arquivos do histórico.");
          }
        }
      }
    ]);
  };

  const abrirPrevia = async (item: ExportHistoryItem) => {
    setPreviewLoading(true);
    try {
      const fileUri = await getReportFileUri(item.id, item.format.toLowerCase());
      const previewUri = await getReportFileUri(item.id, "json");
      const [fileInfo, previewInfo] = await Promise.all([
        FileSystem.getInfoAsync(fileUri),
        FileSystem.getInfoAsync(previewUri),
      ]);

      if (!fileInfo.exists || !previewInfo.exists) {
        Alert.alert(
          "Relatório indisponível",
          "O arquivo deste relatório não está mais salvo. Gere uma nova exportação para abri-lo.",
        );
        return;
      }

      const data = JSON.parse(await FileSystem.readAsStringAsync(previewUri));
      if (!Array.isArray(data)) {
        throw new Error("Formato de prévia inválido.");
      }

      setPreviewEntries(data as ReportPreviewEntry[]);
      setSelectedReport(item);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a visualização deste relatório.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmarExclusao = (item: ExportHistoryItem) => {
    Alert.alert("Excluir relatório", `Deseja excluir "${item.title}" do histórico?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await removerArquivosExportacao(item);
            const novoHistorico = exportHistory.filter((entry) => entry.id !== item.id);
            await SecureStore.setItemAsync("selene_export_history", JSON.stringify(novoHistorico));
            setExportHistory(novoHistorico);
          } catch {
            Alert.alert("Erro", "Não foi possível excluir este relatório.");
          }
        },
      },
    ]);
  };

  const abrirArquivoOriginal = async () => {
    if (!selectedReport) return;

    try {
      await compartilharRelatorio(selectedReport);
    } catch {
      Alert.alert("Erro", "Não foi possível abrir ou compartilhar o arquivo.");
    }
  };

  const exportarFormato = (format: "CSV" | "PDF") => {
    const type = exportType;
    setExportType(null);

    if (type === "sensores") {
      if (format === "CSV") {
        void exportSensorsCSV();
      } else {
        void exportSensorsPDF();
      }
    } else if (type === "imagens") {
      if (format === "CSV") {
        void exportImagesCSV();
      } else {
        void exportImagesPDF();
      }
    }
  };

  const renderItem = ({ item }: { item: ExportHistoryItem }) => (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: item.format === "PDF" ? Colors.danger : Colors.success }]}>
        <MaterialCommunityIcons
          name={item.format === "PDF" ? "file-pdf-box" : "file-delimited-outline"}
          size={24}
          color="white"
        />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <View style={[styles.badgeFormat, { borderColor: item.format === "PDF" ? Colors.danger : Colors.success }]}>
            <Text style={[styles.badgeFormatText, { color: item.format === "PDF" ? Colors.danger : Colors.success }]}>
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
              color={Colors.muted}
            />
            <Text style={styles.tagTipoText}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.itemDate}>{item.date}</Text>
        </View>
        <View style={styles.historyActions}>
          <TouchableOpacity
            style={styles.historyOpenButton}
            onPress={() => void abrirPrevia(item)}
            disabled={previewLoading}
            accessibilityRole="button"
            accessibilityLabel={`Abrir prévia de ${item.title}`}
          >
            {previewLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Feather name="eye" size={15} color={Colors.white} />
            )}
            <Text style={styles.historyOpenText}>{previewLoading ? "Carregando" : "Abrir"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyDeleteButton}
            onPress={() => confirmarExclusao(item)}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${item.title}`}
          >
            <Feather name="trash-2" size={15} color={Colors.danger} />
            <Text style={styles.historyDeleteText}>Excluir</Text>
          </TouchableOpacity>
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
                <Feather name="bell" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Gerar Novo Relatório</Text>
          <View style={styles.exportActionsContainer}>
            <TouchableOpacity
              style={styles.exportActionCard}
              onPress={() => setExportType("sensores")}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Exportar relatório de sensores"
            >
              <View style={[styles.exportActionIconBg, { backgroundColor: "#E6F4EA" }]}>
                <MaterialCommunityIcons name="thermometer" size={24} color={Colors.success} />
              </View>
              <Text style={styles.exportActionText}>Dados Climáticos</Text>
              <Text style={styles.exportActionSubtext}>Sensores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportActionCard}
              onPress={() => setExportType("imagens")}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Exportar relatório de imagens"
            >
              <View style={[styles.exportActionIconBg, { backgroundColor: "#E8F0FE" }]}>
                <MaterialCommunityIcons name="image" size={24} color={Colors.info} />
              </View>
              <Text style={styles.exportActionText}>Monitoramento</Text>
              <Text style={styles.exportActionSubtext}>Imagens</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Histórico de Exportações Salvas</Text>
            {exportHistory.length > 0 && (
              <TouchableOpacity onPress={limparHistorico}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
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
              contentContainerStyle={{ paddingBottom: Spacing.section }}
            />
          )}
        </View>

        <Modal
          visible={exportType !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setExportType(null)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setExportType(null)}
              accessibilityRole="button"
              accessibilityLabel="Fechar opções de exportação"
            />
            <View style={styles.exportModal}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalIcon,
                    {
                      backgroundColor:
                        exportType === "sensores" ? "#E6F4EA" : "#E8F0FE",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={exportType === "sensores" ? "thermometer" : "image"}
                    size={24}
                    color={exportType === "sensores" ? Colors.success : Colors.info}
                  />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>
                    {exportType === "sensores" ? "Relatório de sensores" : "Relatório de imagens"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Escolha como deseja visualizar e compartilhar os dados.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.formatOption}
                onPress={() => exportarFormato("CSV")}
                disabled={loading}
                accessibilityRole="button"
              >
                <View style={[styles.formatIcon, styles.csvIcon]}>
                  <MaterialCommunityIcons
                    name="file-delimited-outline"
                    size={23}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.formatTextContainer}>
                  <Text style={styles.formatTitle}>
                    {exportType === "sensores" ? "Planilha CSV" : "Lista de imagens CSV"}
                  </Text>
                  <Text style={styles.formatDescription}>
                    {exportType === "sensores"
                      ? "Abra e organize os dados no Excel ou similar."
                      : "Exporte os links e datas das capturas."}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.mutedLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatOption}
                onPress={() => exportarFormato("PDF")}
                disabled={loading}
                accessibilityRole="button"
              >
                <View style={[styles.formatIcon, styles.pdfIcon]}>
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={23}
                    color={Colors.danger}
                  />
                </View>
                <View style={styles.formatTextContainer}>
                  <Text style={styles.formatTitle}>
                    {exportType === "sensores" ? "Relatório em PDF" : "Galeria em PDF"}
                  </Text>
                  <Text style={styles.formatDescription}>
                    {exportType === "sensores"
                      ? "Uma versão pronta para leitura e impressão."
                      : "Visualize as capturas em um documento organizado."}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.mutedLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setExportType(null)}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={selectedReport !== null}
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          <SafeAreaView style={styles.previewScreen} edges={["top", "bottom"]}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                style={styles.previewBackButton}
                onPress={() => setSelectedReport(null)}
                accessibilityRole="button"
                accessibilityLabel="Voltar ao histórico"
              >
                <Feather name="arrow-left" size={22} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.previewHeaderText}>
                <Text style={styles.previewTitle}>{selectedReport?.title}</Text>
                <Text style={styles.previewSubtitle}>
                  Prévia organizada · {selectedReport?.format} · {selectedReport?.date}
                </Text>
              </View>
            </View>

            <View style={styles.previewSummary}>
              <MaterialCommunityIcons
                name={selectedReport?.type === "sensores" ? "thermometer" : "image"}
                size={20}
                color={selectedReport?.type === "sensores" ? Colors.success : Colors.info}
              />
              <Text style={styles.previewSummaryText}>
                {previewEntries.length}
                {selectedReport?.recordCount && selectedReport.recordCount > previewEntries.length
                  ? ` de ${selectedReport.recordCount}`
                  : ""}{" "}
                {selectedReport?.type === "sensores" ? "leituras" : "capturas"}
              </Text>
              <View
                style={[
                  styles.previewFormatBadge,
                  {
                    backgroundColor:
                      selectedReport?.format === "PDF" ? "#FDECEC" : "#E6F4EA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.previewFormatText,
                    {
                      color:
                        selectedReport?.format === "PDF" ? Colors.danger : Colors.success,
                    },
                  ]}
                >
                  {selectedReport?.format}
                </Text>
              </View>
            </View>

            <FlatList
              data={previewEntries}
              keyExtractor={(item, index) => `${item.group}-${item.title}-${index}`}
              contentContainerStyle={styles.previewList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.previewEmpty}>
                  <Text style={styles.previewEmptyText}>
                    Este relatório não possui registros para exibir.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.previewEntry}>
                  <View style={styles.previewEntryHeading}>
                    <View style={styles.previewGroupIcon}>
                      <Feather
                        name={selectedReport?.type === "sensores" ? "home" : "camera"}
                        size={15}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.previewEntryHeadingText}>
                      <Text style={styles.previewGroup}>{item.group}</Text>
                      <Text style={styles.previewEntryTitle}>{item.title}</Text>
                    </View>
                  </View>

                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.previewFields}>
                    {item.fields.map((field) => (
                      <View key={`${field.label}-${field.value}`} style={styles.previewField}>
                        <Text style={styles.previewFieldLabel}>{field.label}</Text>
                        <Text style={styles.previewFieldValue}>{field.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            />

            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.openOriginalButton}
                onPress={() => void abrirArquivoOriginal()}
                accessibilityRole="button"
              >
                <Feather name="external-link" size={18} color={Colors.white} />
                <Text style={styles.openOriginalText}>
                  Abrir arquivo {selectedReport?.format}
                </Text>
              </TouchableOpacity>
              <Text style={styles.openOriginalHint}>
                O arquivo será aberto ou compartilhado com um aplicativo compatível.
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
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
  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },
  exportActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: Spacing.xl,
  },
  exportActionCard: {
    padding: Spacing.card,
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: Radius.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F2F5",
    elevation: 2,
    shadowColor: Colors.black,
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
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
  },
  exportActionSubtext: {
    fontSize: Typography.footnote,
    color: Colors.mutedLight,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 32, 48, 0.45)",
  },
  exportModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.round,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: Typography.caption,
    color: Colors.muted,
    marginTop: 3,
    lineHeight: 17,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
  },
  formatIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  csvIcon: {
    backgroundColor: "#E6F4EA",
  },
  pdfIcon: {
    backgroundColor: "#FDECEC",
  },
  formatTextContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  formatTitle: {
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  formatDescription: {
    fontSize: Typography.footnote,
    color: Colors.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.xxs,
  },
  modalCancelText: {
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
    color: Colors.muted,
  },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  historyOpenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xxs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  historyOpenText: {
    color: Colors.white,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semibold,
  },
  historyDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xxs,
    borderWidth: 1,
    borderColor: "#F5DADA",
    backgroundColor: "#FFF7F7",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  historyDeleteText: {
    color: Colors.danger,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semibold,
  },
  previewScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  previewBackButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.round,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  previewHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  previewTitle: {
    color: Colors.text,
    fontSize: Typography.heading,
    fontWeight: FontWeight.bold,
  },
  previewSubtitle: {
    color: Colors.muted,
    fontSize: Typography.footnote,
    marginTop: 3,
  },
  previewSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
  },
  previewSummaryText: {
    flex: 1,
    marginLeft: Spacing.xs,
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  previewFormatBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  previewFormatText: {
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
  },
  previewList: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  previewEntry: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  previewEntryHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  previewGroupIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEntryHeadingText: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  previewGroup: {
    color: Colors.text,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  previewEntryTitle: {
    color: Colors.muted,
    fontSize: Typography.footnote,
    marginTop: 2,
  },
  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    marginBottom: Spacing.sm,
  },
  previewFields: {
    gap: Spacing.xs,
  },
  previewField: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  previewFieldLabel: {
    flex: 1,
    color: Colors.muted,
    fontSize: Typography.caption,
  },
  previewFieldValue: {
    flex: 2,
    color: Colors.text,
    fontSize: Typography.caption,
    fontWeight: FontWeight.medium,
    textAlign: "right",
  },
  previewEmpty: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  previewEmptyText: {
    color: Colors.muted,
    fontSize: Typography.body,
    textAlign: "center",
  },
  previewFooter: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  openOriginalButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.text,
    minHeight: 50,
    borderRadius: Radius.lg,
  },
  openOriginalText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
  openOriginalHint: {
    color: Colors.muted,
    fontSize: Typography.footnote,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
  card: {
    padding: Spacing.card,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: Radius.card,
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
  itemTitle: { fontSize: Typography.medium, fontWeight: FontWeight.bold, color: Colors.text },
  badgeFormat: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeFormatText: { fontSize: Typography.tiny, fontWeight: FontWeight.bold },
  itemSubtitle: { fontSize: Typography.caption, color: Colors.muted, marginTop: 2 },
  footerCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  tagTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xxs,
    backgroundColor: "#EBF0F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagTipoText: { fontSize: Typography.micro, fontWeight: FontWeight.bold, color: Colors.muted },
  itemDate: { fontSize: Typography.footnote, color: Colors.mutedLight },
  separator: { height: 10 },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.lg },
  loadingText: { marginTop: Spacing.sm, color: Colors.text, textAlign: "center", opacity: 0.8 },
  emptyStateContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
  },
  emptyStateTitle: { fontSize: Typography.heading, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 15 },
  emptyStateSubtitle: { fontSize: Typography.small, color: Colors.mutedLight, textAlign: "center", marginTop: Spacing.xs, lineHeight: 18 },
});