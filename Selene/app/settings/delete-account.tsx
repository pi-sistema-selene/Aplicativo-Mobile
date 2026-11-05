import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, Octicons, Feather } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [iniciais, setIniciais] = useState("US");
  const [loading, setLoading] = useState(true);

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

  const handleDelete = () => {
    if (!password) {
      Alert.alert("Erro", "Por favor, insira sua senha para confirmar.");
      return;
    }

    Alert.alert(
      "Atenção!",
      "Você tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => console.log("Lógica de deleção aqui"),
        },
      ],
    );
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
              <Text style={styles.subwelcomeText}>Deletar Conta</Text>
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


        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.warningTitle}>
            Você Tem Certeza Que Deseja Deletar Sua Conta?
          </Text>


          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Esta ação excluirá permanentemente todos os seus dados e você não
              poderá recuperá-los. Por favor, tenha em mente o seguinte antes de
              prosseguir:
            </Text>
            <Text style={styles.bullet}>
              • Todas as suas informações serão deletadas.
            </Text>
            <Text style={styles.bullet}>
              • Você não poderá acessar sua conta nem qualquer informação
              relacionada.
            </Text>
            <Text style={styles.bullet}>
              • Esta ação não pode ser desfeita.
            </Text>
          </View>

          <Text style={styles.confirmLabel}>
            Por Favor Insira Sua Senha Para Confirmar:
          </Text>


          <View style={styles.inputWrapper}>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="••••••••••••"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={Colors.progressText}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.accent}
              />
            </TouchableOpacity>
          </View>


          <TouchableOpacity style={styles.confirmButton} onPress={handleDelete}>
            <Text style={styles.btnText}>Confirmar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
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
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },

  warningTitle: {
    fontSize: Typography.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  infoBox: {
    backgroundColor: Colors.avatarBg,
    padding: 15,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.small,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  bullet: { fontSize: Typography.caption, color: Colors.text, marginBottom: 5, paddingLeft: 5 },

  confirmLabel: {
    fontSize: Typography.small,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 15,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.avatarBg,
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: Spacing.lg,
  },
  input: { flex: 1, color: Colors.text },

  confirmButton: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: Colors.white, fontWeight: FontWeight.bold },

  cancelButton: {
    backgroundColor: Colors.avatarBg,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: { color: Colors.text, fontWeight: FontWeight.bold },
});
