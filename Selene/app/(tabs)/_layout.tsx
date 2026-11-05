import React from "react";
import { Tabs } from "expo-router";
import { SimpleLineIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, FontWeight, Typography } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          height: 85,
          paddingBottom: 15,
          paddingTop: 10,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.tabBorder,
        },
        tabBarLabelStyle: { fontSize: Typography.caption, fontWeight: FontWeight.semibold },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <SimpleLineIcons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="estufas"
        options={{
          title: "Estufas",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="greenhouse" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="relatorios"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="file-eye-outline"
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => (
            <SimpleLineIcons name="settings" size={24} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
