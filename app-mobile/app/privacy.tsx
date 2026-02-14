import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
        <MaterialIcons name="arrow-back" size={24} color="#D1D5DB" />
        <Text style={s.backLinkText}>Voltar</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.subtitle}>Política de Privacidade</Text>
        <Text style={s.paragraph}>
          Sua privacidade é importante para nós. Esta política descreve como coletamos, usamos e protegemos suas informações:
        </Text>
        <Text style={s.sectionTitle}>Dados coletados</Text>
        <Text style={s.paragraph}>
          Coletamos informações que você fornece ao criar conta (nome, email), além de dados de transações e metas financeiras para o funcionamento do aplicativo.
        </Text>
        <Text style={s.sectionTitle}>Uso dos dados</Text>
        <Text style={s.paragraph}>
          Utilizamos seus dados apenas para oferecer e melhorar o serviço, personalizar a experiência e enviar comunicações relevantes (quando autorizado).
        </Text>
        <Text style={s.sectionTitle}>Segurança</Text>
        <Text style={s.paragraph}>
          Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado, alteração ou divulgação.
        </Text>
        <Text style={s.sectionTitle}>Seus direitos</Text>
        <Text style={s.paragraph}>
          Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, através das configurações do aplicativo ou contato com o suporte.
        </Text>
        <Text style={s.paragraph}>
          Ao utilizar o aplicativo, você concorda com esta Política de Privacidade.
        </Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  safeArea: { flex: 1, backgroundColor: "#000000" },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backLinkText: {
    color: "#D1D5DB",
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 26,
    marginBottom: 12,
  },
});
