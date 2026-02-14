import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, Link } from "expo-router";

import { getApiBaseUrl } from "@/constants/oauth";

const GREEN = "#22C55E";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const hasApi = !!getApiBaseUrl();

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert("Campo obrigatório", "Informe seu email.");
      return;
    }

    if (!hasApi) {
      Alert.alert(
        "Modo demonstração",
        "Configure a API para recuperar senha. Por enquanto, entre em contato com o suporte."
      );
      return;
    }

    setLoading(true);
    try {
      // Chamada fictícia - o backend pode ter endpoint /auth/forgot-password
      await new Promise((r) => setTimeout(r, 1500));
      setSent(true);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível enviar o email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={s.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={s.safeArea}>
        <View style={s.centered}>
          <View style={s.successIcon}>
            <MaterialIcons name="mark-email-read" size={48} color={GREEN} />
          </View>
          <Text style={s.successTitle}>Email enviado!</Text>
          <Text style={s.successText}>
            Se existir uma conta com {email}, você receberá instruções para redefinir sua senha.
          </Text>
          <Link href="/login" asChild>
            <TouchableOpacity style={s.backBtn}>
              <Text style={s.backBtnText}>Voltar ao login</Text>
            </TouchableOpacity>
          </Link>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.keyboardView}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
            <MaterialIcons name="arrow-back" size={24} color="#D1D5DB" />
            <Text style={s.backLinkText}>Voltar</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <Text style={s.title}>Forget Password?</Text>
            <Text style={s.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              style={s.primaryBtn}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.loginWrap}>
            <Text style={s.loginText}>Remember your password? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={s.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  safeArea: { flex: 1, backgroundColor: "#000000" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  backLinkText: {
    color: "#D1D5DB",
    fontSize: 16,
  },
  header: { marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
  },
  form: { marginBottom: 28 },
  fieldGroup: { marginBottom: 24 },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: { color: "#9CA3AF", fontSize: 15 },
  loginLink: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#D1D5DB",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "600",
  },
});
