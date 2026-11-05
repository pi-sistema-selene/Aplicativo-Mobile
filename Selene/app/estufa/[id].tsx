import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_V1 } from "@/constants/api";

export default function DetalheEstufa() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [estufa, setEstufa] = useState<any>(null);
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

  const fetchDetalhes = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');

      const response = await axios.get(`${API_V1}/estufas/detalhes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEstufa(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados desta estufa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalhes();
  }, [id]);

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
              <Text style={styles.statValue}>{estufa?.quantidade_compostos || 0}</Text>
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


            <View style={styles.topInfoRow}>
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>
                    <MaterialCommunityIcons name="grid" size={14} /> Total Compostos
                  </Text>
                  <Text style={styles.statValue}>{estufa?.quantidade_compostos || 0}</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>
                    <MaterialCommunityIcons name="magnify" size={14} /> Analisados
                  </Text>
                  <Text style={[styles.statValue, { color: Colors.accent }]}>
                    {estufa?.quantidade_compostos || 0}
                  </Text>
                </View>
              </View>


              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: estufa?.endereco_camera || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400' }}
                  style={styles.estufaImage}
                />
              </View>
            </View>


            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
                <Text style={{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: Typography.caption }}>100% Completo</Text>
              </View>
              <View style={styles.progressCheck}>
                <Feather name="check-square" size={16} color={Colors.muted} />
                <Text style={styles.progressText}> Todos os compostos foram processados</Text>
              </View>
            </View>

            <Text style={styles.monthLabel}>Dados de Julho</Text>


            <SensorCard
              icon="alert-triangle"
              label="Risco de Pragas"
              value="56%"
              color="#FFB800"
              date="Atualizado agora"
            />
            <SensorCard
              icon="droplet"
              label="Umidade do Solo"
              value="10%"
              color={Colors.accent}
              date="Há 5 min"
            />
            <SensorCard
              icon="thermometer"
              label="Temperatura"
              value="21º C"
              color={Colors.primary}
              date="Sincronizado"
            />

          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function SensorCard({ icon, label, value, color, date }: any) {
  return (
    <View style={styles.sensorCard}>
      <View style={styles.sensorIconBg}>
        <Feather name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
        <Text style={styles.sensorLabel}>{label}</Text>
        <Text style={styles.sensorDate}>{date}</Text>
      </View>

      <View style={styles.vDivider} />
      <Text style={styles.sensorValue}>{value}</Text>
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
  topInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  statsContainer: { flex: 1 },
  statBox: { marginBottom: Spacing.lg },
  statLabel: { fontSize: Typography.caption, color: Colors.muted, marginBottom: Spacing.xxs },
  statValue: { fontSize: Typography.large, fontWeight: FontWeight.bold, color: Colors.text },

  imageWrapper: { borderWidth: 3, borderColor: Colors.info, borderRadius: Radius.xl, padding: 2 },
  estufaImage: { width: 140, height: 140, borderRadius: 18 },

  progressSection: { marginBottom: Spacing.xxl },
  progressBarBg: {
    height: 30, backgroundColor: Colors.accent,
    borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden'
  },
  progressBarFill: {
    position: 'absolute', left: 0, height: '100%',
    backgroundColor: Colors.accent, borderRadius: Radius.lg
  },
  progressCheck: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  progressText: { fontSize: Typography.small, color: Colors.muted },

  monthLabel: { fontSize: Typography.heading, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 15 },

  sensorCard: {
    padding: Spacing.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    marginBottom: Spacing.cardGap,
    elevation: 3,
    shadowColor: Colors.black, shadowOpacity: 0.05, shadowRadius: 5
  },
  sensorIconBg: {
    width: 45, height: 45, borderRadius: Radius.lg,
    backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center'
  },
  sensorLabel: { fontSize: Typography.medium, fontWeight: FontWeight.bold, color: Colors.text },
  sensorDate: { fontSize: Typography.footnote, color: Colors.info },
  vDivider: { width: 1, height: 30, backgroundColor: Colors.borderSubtle, marginHorizontal: 15 },
  sensorValue: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },
});