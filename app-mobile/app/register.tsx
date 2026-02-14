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
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, Link } from "expo-router";

import { apiCall } from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/constants/oauth";

const GREEN = "#22C55E";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const hasApi = !!getApiBaseUrl();

  const COUNTRIES = ["Brasil", "Portugal", "Estados Unidos", "Argentina", "México", "Chile", "Colômbia", "Peru", "Espanha", "Outro"];

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = businessName.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Campos obrigatórios", "Preencha email e senha.");
      return;
    }

    if (!agreedToTerms) {
      Alert.alert("Atenção", "Você precisa aceitar os Termos e Política de Privacidade.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Senha fraca", "A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!hasApi) {
      // Modo demonstração: simula registro e redireciona
      setLoading(true);
      await Auth.setUserInfo({
        id: 0,
        openId: trimmedEmail,
        name: trimmedName || null,
        email: trimmedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });
      setLoading(false);
      router.replace("/(tabs)");
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall<{
        access_token: string;
        user: { id: string; email: string; name?: string };
      }>("api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName || undefined,
          email: trimmedEmail,
          password,
        }),
      });

      await Auth.setSessionToken(result.access_token);
      await Auth.setUserInfo({
        id: parseInt(result.user.id, 10) || 0,
        openId: result.user.id,
        name: result.user.name ?? trimmedName,
        email: result.user.email ?? trimmedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar conta.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={s.title}>Create Account Now</Text>
            <Text style={s.subtitle}>
              Create An Account Now Start Managing Payments!
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, s.inputFlex]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={s.eyeBtn}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={22}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Business Name</Text>
              <TextInput
                style={s.input}
                placeholder="Business Name"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Country</Text>
              <TouchableOpacity
                style={s.countryWrap}
                onPress={() => setCountryModalVisible(true)}
                disabled={loading}
              >
                <TextInput
                  style={[s.input, s.inputFlex]}
                  placeholder="Country"
                  placeholderTextColor="#9CA3AF"
                  value={country}
                  onChangeText={setCountry}
                  editable={false}
                  pointerEvents="none"
                />
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#9CA3AF"
                  style={s.chevron}
                />
              </TouchableOpacity>
            </View>

            <Modal
              visible={countryModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setCountryModalVisible(false)}
            >
              <TouchableOpacity
                style={s.modalOverlay}
                activeOpacity={1}
                onPress={() => setCountryModalVisible(false)}
              >
                <View style={s.modalContent} onStartShouldSetResponder={() => true}>
                  <Text style={s.modalTitle}>Selecione o país</Text>
                  <FlatList
                    data={COUNTRIES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={s.modalItem}
                        onPress={() => {
                          setCountry(item);
                          setCountryModalVisible(false);
                        }}
                      >
                        <Text style={s.modalItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            <View style={s.checkboxWrap}>
              <TouchableOpacity
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                style={s.checkboxTouch}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, agreedToTerms && s.checkboxChecked]}>
                  {agreedToTerms && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <View style={s.checkboxTextWrap}>
                <Text style={s.checkboxText}>I agree to </Text>
                <Link href="/terms" asChild>
                  <TouchableOpacity>
                    <Text style={s.link}>Terms</Text>
                  </TouchableOpacity>
                </Link>
                <Text style={s.checkboxText}> and </Text>
                <Link href="/privacy" asChild>
                  <TouchableOpacity>
                    <Text style={s.link}>Privacy Policy.</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={s.primaryBtn}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.signInWrap}>
            <Text style={s.signInText}>Already Have Account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={s.signInLink}>Sign In</Text>
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
    marginBottom: 24,
  },
  backLinkText: {
    color: "#D1D5DB",
    fontSize: 16,
  },
  header: { marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
  },
  form: { marginBottom: 28 },
  fieldGroup: { marginBottom: 20 },
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
  inputFlex: {
    flex: 1,
    backgroundColor: "transparent",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 14,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  countryWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 14,
  },
  chevron: {
    paddingRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    padding: 20,
    textAlign: "center",
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalItemText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  checkboxWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkboxTouch: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  checkboxTextWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkboxText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 22,
  },
  link: {
    color: GREEN,
    textDecorationLine: "underline",
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
  signInWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  signInText: { color: "#9CA3AF", fontSize: 15 },
  signInLink: {
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
  errorText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  backBtn: { padding: 12 },
  backBtnText: { color: GREEN, fontWeight: "600" },
});
