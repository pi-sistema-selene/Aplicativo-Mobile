import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
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
              <Feather name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Visão Detalhada</Text>
            
            <View style={styles.headerIcons}>
              <View style={styles.profileBadge}>
                <Text style={styles.profileText}>LB</Text>
              </View>
              <Feather name="bell" size={24} color={Colors.white} style={{ marginLeft: 10 }} />
            </View>
          </SafeAreaView>


          <View style={styles.estufaTitleCard}>
            <Text style={styles.estufaTitle}>Estufa #{id || '2'}</Text>
          </View>


          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Feather name="trending-up" size={20} color={Colors.accent} />
              <Text style={styles.summaryLabel}>Análises</Text>
              <Text style={styles.summaryValue}>90</Text>
            </View>
            <View style={styles.summaryCard}>
              <Feather name="alert-triangle" size={20} color={Colors.info} />
              <Text style={styles.summaryLabel}>Detecção</Text>
              <Text style={[styles.summaryValue, { color: Colors.info }]}>56%</Text>
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
                <Feather name="search" size={20} color={Colors.accent} />
                <Feather name="calendar" size={20} color={Colors.accent} style={{ marginLeft: 10 }} />
              </View>
            </View>
            
            <View style={styles.barsArea}>
              {dadosBarras.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={[
                    styles.barInner, 
                    { 
                      height: item.valor, 
                      backgroundColor: index % 2 === 0 ? Colors.accent : Colors.info
                    }
                  ]} />
                  <Text style={styles.barLabel}>{item.dia}</Text>
                </View>
              ))}
            </View>
          </View>


          <View style={styles.pieContainer}>
             <MaterialCommunityIcons name="chart-donut" size={100} color={Colors.accent} />
             <Text style={styles.pieText}>79% Saudável</Text>
          </View>


          <View style={styles.sensorGrid}>
            {renderCardSensor('Temp.', '21° C', <MaterialCommunityIcons name="thermometer" size={18} color={Colors.white} />)}
            {renderCardSensor('Umid.', '50%', <MaterialCommunityIcons name="water-percent" size={18} color={Colors.white} />)}
            {renderCardSensor('Luz', '10H', <Feather name="sun" size={18} color={Colors.white} />)}
            {renderCardSensor('CO2', '40', <MaterialCommunityIcons name="molecule-co2" size={18} color={Colors.white} />)}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.white },
  
  topSection: { 
    backgroundColor: Colors.primary,
    paddingBottom: 60, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.lg,
    paddingTop: 10 
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: Typography.pageTitle, fontWeight: FontWeight.bold, color: Colors.white },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  profileBadge: { backgroundColor: Colors.white, borderRadius: Radius.lg, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xxs },
  profileText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: Typography.caption },

  estufaTitleCard: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.section,
    borderRadius: Radius.card,
    alignItems: 'center', 
    marginTop: Spacing.lg,
    elevation: 4 
  },
  estufaTitle: { fontSize: Typography.titleMedium, fontWeight: FontWeight.bold, color: Colors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.section, marginTop: Spacing.lg },
  summaryCard: {
    padding: Spacing.card,
    backgroundColor: Colors.white,
    width: '47%', 
    borderRadius: Radius.card,
    alignItems: 'center', 
    elevation: 2 
  },
  summaryLabel: { fontSize: Typography.caption, color: Colors.mutedLight, marginTop: 5 },
  summaryValue: { fontSize: Typography.title, fontWeight: FontWeight.bold, color: Colors.text },

  contentContainer: { 
    flex: 1, 
    marginTop: -30, 
    backgroundColor: Colors.white,
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xxl
  },
  sectionTitle: { fontSize: Typography.sectionTitle, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 15 },

  timeFilter: { 
    flexDirection: 'row', 
    backgroundColor: '#F0F9F0', 
    borderRadius: Radius.xl,
    padding: 5, 
    marginBottom: Spacing.lg
  },
  timeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 18 },
  timeBtnActive: { backgroundColor: Colors.accent },
  timeTextActive: { color: Colors.white, fontWeight: FontWeight.bold },
  timeText: { color: Colors.mutedLight },

  chartContainer: {
    padding: Spacing.card, backgroundColor: '#F0F9F0', borderRadius: Radius.card, marginBottom: Spacing.cardGap},
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  chartTitle: { fontWeight: FontWeight.bold, color: Colors.text },
  chartHeaderIcons: { flexDirection: 'row' },
  barsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barColumn: { alignItems: 'center', width: 35 },
  barInner: { width: 12, borderRadius: 6, marginBottom: 5 },
  barLabel: { fontSize: Typography.tiny, color: Colors.mutedLight },

  pieContainer: { alignItems: 'center', marginVertical: 15 },
  pieText: { fontWeight: FontWeight.bold, color: Colors.text, marginTop: 5 },
  sensorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardSensor: {
    padding: Spacing.cardCompact,
    width: width * 0.2, 
    backgroundColor: '#60A5FA', 
    borderRadius: Radius.card,
    alignItems: 'center' 
  },
  iconCircle: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 5 
  },
  sensorValue: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: Typography.small },
  sensorLabel: { color: Colors.white, fontSize: Typography.micro },
});
