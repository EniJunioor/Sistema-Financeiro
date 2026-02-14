import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function TermsScreen() {
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
        <Text style={s.title}>Terms of Service</Text>
        <Text style={s.subtitle}>Última atualização: {new Date().toLocaleDateString("pt-BR")}</Text>
        <Text style={s.paragraph}>
          Ao utilizar este aplicativo, você concorda com os seguintes termos:
        </Text>
        <Text style={s.paragraph}>
          1. O aplicativo é destinado ao gerenciamento de finanças pessoais e de pequenos negócios.
        </Text>
        <Text style={s.paragraph}>
          2. Você é responsável pela veracidade das informações cadastradas e pelo uso adequado da plataforma.
        </Text>
        <Text style={s.paragraph}>
          3. Os dados financeiros são tratados com confidencialidade, conforme nossa Política de Privacidade.
        </Text>
        <Text style={s.paragraph}>
          4. Reservamo-nos o direito de modificar estes termos a qualquer momento, com aviso prévio.
        </Text>
        <Text style={s.paragraph}>
          5. O uso indevido da plataforma pode resultar na suspensão ou encerramento da conta.
        </Text>
        <Text style={s.paragraph}>
          Em caso de dúvidas, entre em contato através do email de suporte disponível no aplicativo.
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
  paragraph: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 26,
    marginBottom: 16,
  },
});
