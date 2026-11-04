import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";

const COLORS = {
  active: "#8bc34a",
  inactive: "#9E9E9E",
  background: "#FFFFFF",
  fabActive: "#8bc34a",
  fabInactive: "#2A3A56", // Um tom escuro para contrastar quando não estiver na home
};

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBackground}>
            <View style={styles.notch} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Feather name="file-text" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="monitoring"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="signal-cellular-alt" size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="home-admin"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabContainer}>
              <View
                style={[
                  styles.fab,
                  {
                    backgroundColor: focused
                      ? COLORS.fabActive
                      : COLORS.fabInactive,
                  },
                ]}
              >
                <Ionicons name="pie-chart" size={28} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name="bar-chart" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome5 name="user-alt" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 95 : 80, // Ajuste para iPhone
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  notch: {
    position: "absolute",
    alignSelf: "center",
    top: -35,
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: COLORS.background,
  },
  fabContainer: {
    top: Platform.OS === "ios" ? -25 : -30,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: COLORS.fabActive,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
});
