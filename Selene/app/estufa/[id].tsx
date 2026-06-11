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

  // ==========================================
  // ESTADOS (STATES)
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [estufa, setEstufa] = useState<any>(null);
  const [iniciais, setIniciais] = useState("US");

  // ================= USER =================
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

  // ==========================================
  // BUSCA DE DADOS (API)
  // ==========================================
  const fetchDetalhes = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');

      // Chamada para sua API no Render
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

  // Tela de carregamento enquanto a API responde
  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#95C159" />
        <Text style={{ marginTop: 10, color: '#666' }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* ================= HEADER ================= */}
        <View style={styles.topContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={28} color="#2A3A56" />
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
                  color="#2A3A56"
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------
            CONTEÚDO PRINCIPAL
        ---------------------------------------------------------- */}
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

            {/* RESUMO DE ESTATÍSTICAS E CÂMERA */}
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
                  <Text style={[styles.statValue, { color: '#00D2B1' }]}>
                    {estufa?.quantidade_compostos || 0}
                  </Text>
                </View>
              </View>

              {/* FEED DA CÂMERA / IMAGEM */}
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: estufa?.endereco_camera || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400' }}
                  style={styles.estufaImage}
                />
              </View>
            </View>

            {/* BARRA DE PROGRESSO DE ANÁLISE */}
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>100% Completo</Text>
              </View>
              <View style={styles.progressCheck}>
                <Feather name="check-square" size={16} color="#666" />
                <Text style={styles.progressText}> Todos os compostos foram processados</Text>
              </View>
            </View>

            <Text style={styles.monthLabel}>Dados de Julho</Text>

            {/* LISTAGEM DE SENSORES DINÂMICOS */}
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
              color="#00D2B1"
              date="Há 5 min"
            />
            <SensorCard
              icon="thermometer"
              label="Temperatura"
              value="21º C"
              color="#95C159"
              date="Sincronizado"
            />

          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ==========================================================
// SUB-COMPONENTE: CARD DE SENSOR
// ==========================================================
function SensorCard({ icon, label, value, color, date }: any) {
  return (
    <View style={styles.sensorCard}>
      <View style={styles.sensorIconBg}>
        <Feather name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.sensorLabel}>{label}</Text>
        <Text style={styles.sensorDate}>{date}</Text>
      </View>

      <View style={styles.vDivider} />
      <Text style={styles.sensorValue}>{value}</Text>
    </View>
  );
}

// ==========================================================
// ESTILIZAÇÃO
// ==========================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#95C159' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },

  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2A3A56' },
  profileCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center'
  },
  profileText: { color: '#2A3A56', fontWeight: 'bold', fontSize: 13 },


  // Header Superior
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

  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#2A3A56" },
  subwelcomeText: { fontSize: 14, color: "#2A3A56", opacity: 0.8 },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#EDFCED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  avatarText: { fontSize: 16, fontWeight: "bold", color: "#2A3A56" },

  // Painel Branco Arredondado
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  topInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  statsContainer: { flex: 1 },
  statBox: { marginBottom: 20 },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#2A3A56' },

  imageWrapper: { borderWidth: 3, borderColor: '#007AFF', borderRadius: 20, padding: 2 },
  estufaImage: { width: 140, height: 140, borderRadius: 18 },

  progressSection: { marginBottom: 30 },
  progressBarBg: {
    height: 30, backgroundColor: '#00D2B1',
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden'
  },
  progressBarFill: {
    position: 'absolute', left: 0, height: '100%',
    backgroundColor: '#00D2B1', borderRadius: 15
  },
  progressCheck: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  progressText: { fontSize: 13, color: '#666' },

  monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#2A3A56', marginBottom: 15 },

  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  sensorIconBg: {
    width: 45, height: 45, borderRadius: 15,
    backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center'
  },
  sensorLabel: { fontSize: 15, fontWeight: 'bold', color: '#2A3A56' },
  sensorDate: { fontSize: 11, color: '#007AFF' },
  vDivider: { width: 1, height: 30, backgroundColor: '#EEE', marginHorizontal: 15 },
  sensorValue: { fontSize: 16, fontWeight: 'bold', color: '#2A3A56' },
  textContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },
});