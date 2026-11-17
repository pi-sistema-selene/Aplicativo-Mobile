import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  NotificationPreferences,
  PUSH_TOKEN_STORAGE_KEY,
  registerForPushNotifications,
  removePushToken,
  saveNotificationPreferences,
} from "@/services/notificationsService";
import { STORAGE_KEYS } from "@/constants/storageKeys";

export default function RelatoriosScreen() {
  const router = useRouter();
  const [iniciais, setIniciais] = useState("US");
  const [settings, setSettings] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

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

    const carregarPreferencias = async () => {
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        if (!token) return;
        const preferencias = await getNotificationPreferences(token);
        setSettings(preferencias);
        if (preferencias.geral && preferencias.celular) {
          const pushToken = await registerForPushNotifications(token);
          await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, pushToken);
        }
      } catch (error) {
        console.error("Erro ao carregar preferências de notificação:", error);
        Alert.alert(
          "Notificações",
          "Não foi possível carregar as configurações de notificação.",
        );
      }
    };

    carregarPreferencias();
  }, []);

  const toggle = async (key: keyof NotificationPreferences) => {
    const next = { ...settings, [key]: !settings[key] };
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        throw new Error("Faça login para alterar as notificações.");
      }

      const notificationsEnabled = next.geral && next.celular;
      let pushToken: string | null = null;
      if (
        notificationsEnabled &&
        (!settings.geral || !settings.celular)
      ) {
        pushToken = await registerForPushNotifications(token);
      }

      await saveNotificationPreferences(token, next);
      if (pushToken) {
        await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, pushToken);
      } else if (!notificationsEnabled) {
        const savedPushToken = await SecureStore.getItemAsync(
          PUSH_TOKEN_STORAGE_KEY,
        );
        if (savedPushToken) {
          await removePushToken(token, savedPushToken);
          await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
        }
      }

      setSettings(next);
      if (key === "vibrar" && next.vibrar) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error("Erro ao atualizar notificações:", error);
      Alert.alert(
        "Notificações",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notificações.",
      );
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
            <View>
              <Text style={styles.welcomeText}>Configurações</Text>
              <Text style={styles.subwelcomeText}>Notificações</Text>
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <NotificationRow
              label="Notificações Gerais"
              value={settings.geral}
              onToggle={() => toggle("geral")}
            />
            <NotificationRow
              label="Som"
              value={settings.som}
              onToggle={() => toggle("som")}
            />
            <NotificationRow
              label="Notificação no celular"
              value={settings.celular}
              onToggle={() => toggle("celular")}
            />
            <NotificationRow
              label="Vibrar"
              value={settings.vibrar}
              onToggle={() => toggle("vibrar")}
            />
            <NotificationRow
              label="Notificações Personalizadas"
              value={settings.personalizadas}
              onToggle={() => toggle("personalizadas")}
            />
            <NotificationRow
              label="Alertas de Nível Baixo"
              value={settings.baixos}
              onToggle={() => toggle("baixos")}
            />
            <Text style={styles.notificationHint}>
              Ative as notificações gerais e no celular para receber alertas
              mesmo com o aplicativo fechado. A opção Som controla o áudio.
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function NotificationRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#D1D1D1", true: Colors.accent }}
        thumbColor={Colors.white}
        ios_backgroundColor="#D1D1D1"
      />
    </View>
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

  contentCard: {
    padding: Spacing.card,
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: -30,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.cardGap, // Margem inferior para não colar na borda
    borderRadius: Radius.card,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xxs, // Melhora a área de toque
  },
  notificationHint: {
    color: Colors.textMuted,
    fontSize: Typography.small,
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  rowText: { fontSize: Typography.medium, color: Colors.text, fontWeight: FontWeight.medium },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
});
