import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { File as ExpoFile } from "expo-file-system";
import { API_V1, getApiAssetUrl } from "@/constants/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [notificacoes, setNotificacoes] = useState(true);
  const [salvarLogin, setSalvarLogin] = useState(true);
  const [idExibicao, setIdExibicao] = useState("00000000");
  const [iniciais, setIniciais] = useState("US");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoSelecionada, setFotoSelecionada] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");

        if (token) {
          const res = await fetch(
            `${API_V1}/auth/perfil`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = await res.json();

          if (res.ok && data.data) {
            const user = data.data;

            setNome(user.nome_completo || "");
            setEmail(user.email || "");
            setTelefone(user.telefone || "");
            if (user.foto_perfil) {
              setFotoUri(getApiAssetUrl(user.foto_perfil));
            }

            if (user.nome_completo) {
              const partes = user.nome_completo.trim().split(" ");
              setIniciais(
                partes.length > 1
                  ? (partes[0][0] + partes[1][0]).toUpperCase()
                  : partes[0][0].toUpperCase(),
              );
            }

            if (user._id) {
              setIdExibicao(user._id.substring(0, 8));
            }

            setLoading(false);
            return;
          }
        }

        const nomeSalvo = await SecureStore.getItemAsync("userName");
        const emailSalvo = await SecureStore.getItemAsync("userEmail");
        const idSalvo = await SecureStore.getItemAsync("userId");

        if (nomeSalvo) {
          setNome(nomeSalvo);
          const partes = nomeSalvo.trim().split(" ");
          setIniciais(
            partes.length > 1
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : partes[0][0].toUpperCase(),
          );
        }

        if (emailSalvo) setEmail(emailSalvo);
        if (idSalvo) setIdExibicao(idSalvo.substring(0, 8));
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const escolherFoto = async () => {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à galeria para escolher uma foto.",
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const foto = resultado.assets[0];
        setFotoSelecionada(foto);
        setFotoUri(foto.uri);
      }
    } catch (error) {
      console.error("Erro ao escolher foto:", error);
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      if (!nome.trim()) {
        Alert.alert("Erro", "Nome obrigatório");
        return;
      }

      const formData = new FormData();
      formData.append("nome_completo", nome);
      formData.append("email", email);
      formData.append("telefone", telefone);

      if (fotoSelecionada) {
        if (fotoSelecionada.file) {
          formData.append("foto_perfil", fotoSelecionada.file);
        } else {
          const foto = new ExpoFile(fotoSelecionada.uri);
          const filename =
            fotoSelecionada.fileName || foto.name || "perfil.jpg";
          formData.append("foto_perfil", foto, filename);
        }
      }

      const res = await fetch(
        `${API_V1}/auth/perfil`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const responseText = await res.text();
      let data: { message?: string; data?: { foto_perfil?: string } } | null =
        null;

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          if (res.ok) {
            throw new Error(
              `O servidor retornou uma resposta inválida (HTTP ${res.status}).`,
            );
          }
        }
      }

      if (!res.ok) {
        const responseDetails = responseText
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 240);
        throw new Error(
          data?.message ||
            (responseDetails
              ? `Erro ao atualizar perfil (HTTP ${res.status}): ${responseDetails}`
              : `Erro ao atualizar perfil (HTTP ${res.status}).`),
        );
      }

      if (!data) {
        throw new Error(
          `O servidor não confirmou a atualização (resposta vazia, HTTP ${res.status}).`,
        );
      }

      await SecureStore.setItemAsync("userName", nome);
      await SecureStore.setItemAsync("userEmail", email);

      const fotoSalva = data.data?.foto_perfil;
      if (fotoSalva) {
        setFotoUri(getApiAssetUrl(fotoSalva));
        setFotoSelecionada(null);
      }

      Alert.alert("Sucesso", "Perfil atualizado!");
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setSalvando(false);
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
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Editar Perfil</Text>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.avatarCircle}>
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
          <View style={styles.imageContainer}>
           <Image
              source={
                fotoUri
                  ? { uri: fotoUri }
                  : require("../assets/images/user-icon.png")
              }
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={escolherFoto}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto da galeria"
            >
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{nome}</Text>
          <Text style={styles.userId}>ID: {idExibicao}</Text>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Configurações Usuário</Text>

            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Telefone:</Text>
            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Ativar Notificações</Text>
              <Switch value={notificacoes} onValueChange={setNotificacoes} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Salvar Login</Text>
              <Switch value={salvarLogin} onValueChange={setSalvarLogin} />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, salvando && { opacity: 0.7 }]}
              onPress={handleSalvar}
              disabled={salvando}
            >
              <Text style={styles.saveBtnText}>
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
    paddingBottom: 60,
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
  avatarText: { fontSize: Typography.subtitle, fontWeight: FontWeight.bold, color: Colors.text },

  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: Spacing.screen,
    paddingTop: 80,
  },
  sectionTitle: {
    fontSize: Typography.sectionTitle,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
  imageContainer: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    backgroundColor: Colors.white,
    padding: 5,
    borderRadius: 65,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: Colors.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: "center",
  },
  userId: {
    fontSize: Typography.body,
    color: Colors.text,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: Spacing.lg,
  },
  form: { paddingHorizontal: Spacing.xl },
  label: {
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.md,
    height: 45,
    paddingHorizontal: 15,
    marginBottom: Spacing.lg,
    color: Colors.text,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: Radius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: Spacing.xxl,
  },
  saveBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: Typography.subtitle },
});
