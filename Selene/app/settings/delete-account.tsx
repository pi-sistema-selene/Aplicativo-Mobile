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
              <Feather name="arrow-left" size={28} color="#2A3A56" />
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
                  color="#2A3A56"
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 30 }}
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
              placeholderTextColor="#A0A0A0"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#00D1A0"
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
  container: { flex: 1, backgroundColor: "#95C159" },

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

  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontWeight: "600",
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A3A56",
    textAlign: "center",
    marginBottom: 20,
  },

  infoBox: {
    backgroundColor: "#EDFCED",
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  infoText: {
    fontSize: 13,
    color: "#2A3A56",
    marginBottom: 10,
    lineHeight: 18,
  },
  bullet: { fontSize: 12, color: "#2A3A56", marginBottom: 5, paddingLeft: 5 },

  confirmLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2A3A56",
    textAlign: "center",
    marginBottom: 15,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDFCED",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  input: { flex: 1, color: "#2A3A56" },

  confirmButton: {
    backgroundColor: "#00D1A0",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "bold" },

  cancelButton: {
    backgroundColor: "#EDFCED",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: { color: "#2A3A56", fontWeight: "bold" },
});
