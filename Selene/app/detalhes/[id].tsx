import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function DetalhesEstufaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const dadosBarras = [
    { dia: 'Seg', valor: 40 },
    { dia: 'Ter', valor: 15 },
    { dia: 'Qua', valor: 65 },
    { dia: 'Qui', valor: 5 },
    { dia: 'Sex', valor: 90 },
    { dia: 'Sab', valor: 25 },
    { dia: 'Dom', valor: 35 },
  ];

  const renderCardSensor = (label: string, value: string, icon: any) => (
    <View style={styles.cardSensor}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        

        <View style={styles.topSection}>
          <SafeAreaView edges={['top']} style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Visão Detalhada</Text>
            
            <View style={styles.headerIcons}>
              <View style={styles.profileBadge}>
                <Text style={styles.profileText}>LB</Text>
              </View>
              <Feather name="bell" size={24} color="#FFF" style={{ marginLeft: 10 }} />
            </View>
          </SafeAreaView>


          <View style={styles.estufaTitleCard}>
            <Text style={styles.estufaTitle}>Estufa #{id || '2'}</Text>
          </View>


          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Feather name="trending-up" size={20} color="#00D2B1" />
              <Text style={styles.summaryLabel}>Análises</Text>
              <Text style={styles.summaryValue}>90</Text>
            </View>
            <View style={styles.summaryCard}>
              <Feather name="alert-triangle" size={20} color="#3B82F6" />
              <Text style={styles.summaryLabel}>Detecção</Text>
              <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>56%</Text>
            </View>
          </View>
        </View>


        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Relatório Monitoramento</Text>
          

          <View style={styles.timeFilter}>
            <TouchableOpacity style={[styles.timeBtn, styles.timeBtnActive]}>
              <Text style={styles.timeTextActive}>Dia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn}><Text style={styles.timeText}>Semana</Text></TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn}><Text style={styles.timeText}>Mês</Text></TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn}><Text style={styles.timeText}>Ano</Text></TouchableOpacity>
          </View>


          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Relatório Estufa #{id || '2'}</Text>
              <View style={styles.chartHeaderIcons}>
                <Feather name="search" size={20} color="#00D2B1" />
                <Feather name="calendar" size={20} color="#00D2B1" style={{ marginLeft: 10 }} />
              </View>
            </View>
            
            <View style={styles.barsArea}>
              {dadosBarras.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={[
                    styles.barInner, 
                    { 
                      height: item.valor, 
                      backgroundColor: index % 2 === 0 ? '#00D2B1' : '#3B82F6' 
                    }
                  ]} />
                  <Text style={styles.barLabel}>{item.dia}</Text>
                </View>
              ))}
            </View>
          </View>


          <View style={styles.pieContainer}>
             <MaterialCommunityIcons name="chart-donut" size={100} color="#00D2B1" />
             <Text style={styles.pieText}>79% Saudável</Text>
          </View>


          <View style={styles.sensorGrid}>
            {renderCardSensor('Temp.', '21° C', <MaterialCommunityIcons name="thermometer" size={18} color="#FFF" />)}
            {renderCardSensor('Umid.', '50%', <MaterialCommunityIcons name="water-percent" size={18} color="#FFF" />)}
            {renderCardSensor('Luz', '10H', <Feather name="sun" size={18} color="#FFF" />)}
            {renderCardSensor('CO2', '40', <MaterialCommunityIcons name="molecule-co2" size={18} color="#FFF" />)}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  
  topSection: { 
    backgroundColor: '#95C159', 
    paddingBottom: 60, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  profileBadge: { backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 8, paddingVertical: 4 },
  profileText: { color: '#2A3A56', fontWeight: 'bold', fontSize: 12 },

  estufaTitleCard: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 40, 
    borderRadius: 15, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginTop: 20, 
    elevation: 4 
  },
  estufaTitle: { fontSize: 20, fontWeight: 'bold', color: '#2A3A56' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 20 },
  summaryCard: { 
    backgroundColor: '#FFF', 
    width: '47%', 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center', 
    elevation: 2 
  },
  summaryLabel: { fontSize: 12, color: '#999', marginTop: 5 },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#2A3A56' },

  contentContainer: { 
    flex: 1, 
    marginTop: -30, 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    paddingHorizontal: 20, 
    paddingTop: 30 
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2A3A56', marginBottom: 15 },

  timeFilter: { 
    flexDirection: 'row', 
    backgroundColor: '#F0F9F0', 
    borderRadius: 20, 
    padding: 5, 
    marginBottom: 20 
  },
  timeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 18 },
  timeBtnActive: { backgroundColor: '#00D2B1' },
  timeTextActive: { color: '#FFF', fontWeight: 'bold' },
  timeText: { color: '#999' },

  chartContainer: { backgroundColor: '#F0F9F0', borderRadius: 25, padding: 20, marginBottom: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontWeight: 'bold', color: '#2A3A56' },
  chartHeaderIcons: { flexDirection: 'row' },
  barsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barColumn: { alignItems: 'center', width: 35 },
  barInner: { width: 12, borderRadius: 6, marginBottom: 5 },
  barLabel: { fontSize: 10, color: '#999' },

  pieContainer: { alignItems: 'center', marginVertical: 15 },
  pieText: { fontWeight: 'bold', color: '#2A3A56', marginTop: 5 },
  sensorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardSensor: { 
    width: width * 0.2, 
    backgroundColor: '#60A5FA', 
    borderRadius: 20, 
    padding: 10, 
    alignItems: 'center' 
  },
  iconCircle: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 5 
  },
  sensorValue: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  sensorLabel: { color: '#FFF', fontSize: 9 },
});