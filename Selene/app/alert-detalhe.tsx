import {
  Colors,
  FontWeight,
  Radius,
  Spacing,
  Typography,
} from "@/constants/Colors";
import type { AlertaItem, HomeAlerta } from "@/types/alerta";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type AlertRouteData = AlertaItem | HomeAlerta;

function parseAlertData(value?: string | string[]): AlertRouteData | null {
  if (!value || Array.isArray(value)) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      "estufa" in parsed &&
      typeof parsed.estufa === "string" &&
      "tempo" in parsed &&
      typeof parsed.tempo === "string" &&
      (("titulo" in parsed && typeof parsed.titulo === "string") ||
        ("mensagem" in parsed && typeof parsed.mensagem === "string"))
    ) {
      return parsed as AlertRouteData;
    }
  } catch (error) {
    console.error("Não foi possível abrir os detalhes do alerta:", error);
  }
  return null;
}

export default function AlertaDetalheScreen() {
  const router = useRouter();
  const { alerta: alertaParam } = useLocalSearchParams<{ alerta?: string }>();
  const alerta = useMemo(() => parseAlertData(alertaParam), [alertaParam]);
  const [iniciais, setIniciais] = useState("US");

  const titulo = alerta
    ? "mensagem" in alerta
      ? alerta.titulo || alerta.mensagem
      : alerta.titulo
    : "Detalhes indisponíveis";
  const subtitulo = alerta
    ? "submensagem" in alerta
      ? alerta.submensagem
      : alerta.sub
    : "Não foi possível carregar as informações deste alerta.";
  const prioridade = alerta
    ? "gravidade" in alerta
      ? alerta.prioridade || alerta.gravidade
      : alerta.prioridade
    : undefined;
  const categoria = alerta?.categoria;
  const campos = alerta?.detalhes || [];
  const imagemUri = alerta?.imagemUri;
  const dataHora = alerta?.dataHora;
  const isAlta = prioridade === "Alta";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Editar Perfil</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.alertCard}>
            <View style={styles.alertTop}>
              <View
                style={[
                  styles.alertIcon,
                  { backgroundColor: isAlta ? "#FCE8E6" : "#FEF5E7" },
                ]}
              >
                <Ionicons
                  name={
                    alerta?.tipo === "risco"
                      ? "close-circle-outline"
                      : "warning-outline"
                  }
                  size={25}
                  color={isAlta ? Colors.alertHigh : Colors.alertMedium}
                />
              </View>
              {prioridade ? (
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: isAlta
                        ? Colors.alertHighAlt
                        : Colors.alertMedium,
                    },
                  ]}
                >
                  <Text style={styles.priorityText}>{prioridade}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.title}>{titulo}</Text>
            <Text style={styles.description}>{subtitulo}</Text>
            <View style={styles.metadata}>
              <Feather name="map-pin" size={15} color={Colors.textMuted} />
              <Text style={styles.metadataText}>
                {alerta?.estufa || "Estufa"}
              </Text>
            </View>
            {dataHora ? (
              <View style={styles.metadata}>
                <Feather name="clock" size={15} color={Colors.textMuted} />
                <Text style={styles.metadataText}>
                  {new Date(dataHora).toLocaleString("pt-BR")}
                </Text>
              </View>
            ) : alerta ? (
              <View style={styles.metadata}>
                <Feather name="clock" size={15} color={Colors.textMuted} />
                <Text style={styles.metadataText}>{alerta.tempo}</Text>
              </View>
            ) : null}
          </View>

          {imagemUri ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Imagem analisada</Text>
              <Image
                source={{ uri: imagemUri }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {campos.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {categoria === "CAMERA"
                  ? "Resultado da análise"
                  : "Leituras e referências"}
              </Text>
              <View style={styles.fieldsCard}>
                {campos.map((campo, index) => (
                  <View
                    key={`${campo.label}-${index}`}
                    style={[
                      styles.field,
                      index === campos.length - 1 && styles.lastField,
                    ]}
                  >
                    <Text style={styles.fieldLabel}>{campo.label}</Text>
                    <Text style={styles.fieldValue}>{campo.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.note}>
            <Feather name="info" size={17} color={Colors.info} />
            <Text style={styles.noteText}>
              {categoria === "CAMERA"
                ? "O resultado é uma estimativa do modelo de análise da imagem; confirme visualmente a condição do cultivo."
                : "Os limites são referências configuradas para o monitoramento da frutificação. Confirme as condições no ambiente e no sensor."}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: Spacing.xxl,
    paddingTop: 10,
    paddingHorizontal: Spacing.screen,
  },
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 1,
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    color: Colors.white,
    opacity: 0.85,
    fontSize: Typography.small,
    marginTop: 2,
  },
  welcomeText: {
    fontSize: Typography.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subwelcomeText: {
    fontSize: Typography.body,
    color: Colors.text,
    opacity: 0.8,
  },

  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.card,
    marginBottom: Spacing.lg,
  },
  backButton: { marginRight: Spacing.sm, paddingVertical: Spacing.xs },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },
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
  avatarText: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  alertTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityBadge: {
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  priorityText: { color: Colors.white, fontWeight: FontWeight.bold },
  title: {
    color: Colors.textAlt,
    fontSize: Typography.titleMedium,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.body,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metadataText: {
    color: Colors.textMuted,
    fontSize: Typography.small,
    flex: 1,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.textAlt,
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  image: {
    width: "100%",
    height: 230,
    borderRadius: Radius.lg,
    backgroundColor: Colors.borderSubtle,
  },
  fieldsCard: {
    borderRadius: Radius.card,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.card,
  },
  field: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  lastField: { borderBottomWidth: 0 },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: Typography.small,
    marginBottom: Spacing.xxs,
  },
  fieldValue: {
    color: Colors.textAlt,
    fontSize: Typography.body,
    fontWeight: FontWeight.semibold,
  },
  note: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: "#E8F0FE",
    borderRadius: Radius.md,
  },
  noteText: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.small,
    lineHeight: 19,
  },
});
