import { Colors, FontWeight, Radius, Spacing, Typography } from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function FAQScreen() {
  const router = useRouter();

  const [iniciais, setIniciais] = useState("US");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Geral");

  const [activeTab, setActiveTab] = useState("faq");

  const categories = ["Geral", "Sistema", "Plantio"];

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


  const faqs = [
    {
      id: "1",
      question: "Quais sensores são usados no monitoramento?",
      answer:
        "Os sensores utilizados incluem temperatura, umidade, CO2 e luminosidade.",
    },
    {
      id: "2",
      question: "Como os dados ajudam na produção?",
      answer:
        "Os dados fornecem insights em tempo real para otimizar o crescimento.",
    },
    {
      id: "3",
      question: "Para que servem os relatórios gerados?",
      answer: "Servem para histórico de produção e análise de eficiência.",
    },
    {
      id: "4",
      question: "O que acontece se o sistema falhar?",
      answer: "O sistema possui backups locais e envia alertas.",
    },
    {
      id: "5",
      question: "O sistema funciona em tempo real?",
      answer: "Sim, atualização ocorre a cada poucos segundos.",
    },
  ];

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpandedId(expandedId === id ? null : id);
  };


  const socialOptions = [
    {
      name: "Instagram",
      icon: "instagram",
      color: "#E1306C",
    },
    {
      name: "Twitter",
      icon: "twitter",
      color: "#1DA1F2",
    },
    {
      name: "Facebook",
      icon: "facebook",
      color: "#4267B2",
    },
    {
      name: "E-mail",
      icon: "envelope",
      color: Colors.accent,
    },
  ];

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


            <View style={styles.topToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  activeTab === "faq" && styles.toggleActive,
                ]}
                onPress={() => setActiveTab("faq")}
              >
                <Text
                  style={
                    activeTab === "faq"
                      ? styles.toggleTextActive
                      : styles.toggleText
                  }
                >
                  FAQ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  activeTab === "contato" && styles.toggleActive,
                ]}
                onPress={() => setActiveTab("contato")}
              >
                <Text
                  style={
                    activeTab === "contato"
                      ? styles.toggleTextActive
                      : styles.toggleText
                  }
                >
                  Nos Contate
                </Text>
              </TouchableOpacity>
            </View>



            {activeTab === "faq" && (
              <>


                <View style={styles.categoryRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catBtn,
                        activeCategory === cat && styles.catBtnActive,
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catText,
                          activeCategory === cat && styles.catTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>



                <View style={styles.searchBar}>
                  <TextInput
                    placeholder="Pesquisar dúvida..."
                    placeholderTextColor={Colors.progressText}
                    style={styles.searchInput}
                  />
                </View>



                <View style={styles.accordionList}>
                  {faqs.map((item) => (
                    <View key={item.id} style={styles.faqWrapper}>
                      <TouchableOpacity
                        style={styles.faqHeader}
                        onPress={() => toggleExpand(item.id)}
                      >
                        <Text style={styles.faqQuestion}>{item.question}</Text>

                        <Feather
                          name={
                            expandedId === item.id
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={Colors.text}
                        />
                      </TouchableOpacity>

                      {expandedId === item.id && (
                        <View style={styles.faqBody}>
                          <Text style={styles.faqAnswer}>{item.answer}</Text>
                        </View>
                      )}

                      <View style={styles.divider} />
                    </View>
                  ))}
                </View>
              </>
            )}



            {activeTab === "contato" && (
              <>
                <View style={styles.socialList}>
                  {socialOptions.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.socialItem}>
                      <View
                        style={[
                          styles.socialIcon,
                          {
                            backgroundColor: item.color + "20",
                          },
                        ]}
                      >
                        <FontAwesome5
                          name={item.icon}
                          size={20}
                          color={item.color}
                        />
                      </View>

                      <Text style={styles.socialName}>{item.name}</Text>

                      <Feather name="chevron-right" size={20} color={Colors.border} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.btnChat}
                  onPress={() => router.push("/support/lista")}
                >
                  <Text style={styles.btnText}>Suporte ao Produtor</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: Spacing.xl,
  },


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


  topToggle: {
    flexDirection: "row",
    backgroundColor: "#F0F7F0",
    borderRadius: Radius.lg,
    padding: 5,
    marginBottom: Spacing.lg,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
  },

  toggleActive: {
    backgroundColor: Colors.accent,
  },

  toggleTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  toggleText: {
    color: Colors.text,
  },


  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  catBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    marginHorizontal: 5,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    alignItems: "center",
  },

  catBtnActive: {
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  catText: {
    color: Colors.text,
    fontSize: Typography.caption,
  },

  catTextActive: {
    fontWeight: FontWeight.bold,
    color: "#4CAF50",
  },


  searchBar: {
    backgroundColor: "#F0FFF4",
    borderRadius: Radius.md,
    paddingHorizontal: 15,
    height: 48,
    justifyContent: "center",
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent,
  },

  searchInput: {
    color: Colors.text,
    fontSize: Typography.body,
  },


  accordionList: {
    paddingBottom: Spacing.lg,
  },

  faqWrapper: {
    marginBottom: 5,
  },

  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
  },

  faqQuestion: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
  },

  faqBody: {
    paddingBottom: 15,
  },

  faqAnswer: {
    color: Colors.muted,
    fontSize: Typography.small,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },


  socialList: {
    flex: 1,
    marginTop: 10,
  },

  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },

  socialIcon: {
    width: 45,
    height: 45,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  socialName: {
    flex: 1,
    fontSize: Typography.subtitle,
    color: Colors.text,
  },


  btnChat: {
    backgroundColor: Colors.accent,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },

  btnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: Typography.subtitle,
  },
});
