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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Svg, Path } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter, Link } from "expo-router";
import * as Haptics from "expo-haptics";

import { apiCall } from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/constants/oauth";

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const hasApi = !!getApiBaseUrl();

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

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
      setSuccessModalVisible(true);
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessModalVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar conta.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSuccessModalVisible(false);
    router.replace("/(tabs)");
  };

  const handleAppleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Apple", "Cadastro com Apple em desenvolvimento.");
  };

  const handleGoogleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Google", "Cadastro com Google em desenvolvimento.");
  };

  return (
    <View style={s.screen}>
      <StatusBar style="dark" />
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
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
              <Text style={s.backLinkText}>Voltar</Text>
            </TouchableOpacity>

            <View style={s.header}>
              <Text style={s.title}>Crie sua conta</Text>
              <Text style={s.subtitle}>
                Informe seu nome completo, email e senha para criar sua conta e começar.
              </Text>
            </View>

            {/* Social Signup - FIRST */}
            <View style={s.socialWrap}>
              <TouchableOpacity
                onPress={handleGoogleSignUp}
                style={s.socialBtn}
                activeOpacity={0.8}
              >
                <GoogleIcon size={20} />
                <Text style={s.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAppleSignUp}
                style={[s.socialBtn, s.socialBtnLight]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="apple" size={24} color="#111827" />
                <Text style={s.socialBtnLightText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={s.dividerWrap}>
              <View style={s.divider} />
              <Text style={s.dividerText}>ou</Text>
              <View style={s.divider} />
            </View>

            {/* Form */}
            <View style={s.form}>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Nome completo</Text>
                <TextInput
                  style={s.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

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
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Senha</Text>
                <View style={s.passwordWrap}>
                  <TextInput
                    style={[s.input, s.inputFlex]}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                    style={s.eyeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.checkboxWrap}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  style={s.checkboxRow}
                  activeOpacity={0.8}
                >
                  <View style={[s.checkbox, agreedToTerms && s.checkboxChecked]}>
                    {agreedToTerms && (
                      <MaterialIcons name="check" size={14} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={s.checkboxTextWrap}>
                  <Text style={s.checkboxText}>Concordo com os </Text>
                  <Link href="/terms" asChild>
                    <TouchableOpacity>
                      <Text style={s.link}>Termos</Text>
                    </TouchableOpacity>
                  </Link>
                  <Text style={s.checkboxText}> e </Text>
                  <Link href="/privacy" asChild>
                    <TouchableOpacity>
                      <Text style={s.link}>Política de Privacidade</Text>
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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.primaryBtnText}>Cadastrar</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.signInWrap}>
              <Text style={s.signInText}>Já tem uma conta? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={s.signInLink}>Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleBrowseHome}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {/* Success icon with green circle */}
            <View style={s.successIconWrap}>
              <MaterialCommunityIcons
                name="check"
                size={48}
                color="#FFFFFF"
              />
            </View>
            <Text style={s.modalTitle}>Sucesso!</Text>
            <Text style={s.modalSubtitle}>
              Sua conta foi criada com sucesso e está pronta para uso.
            </Text>
            <TouchableOpacity
              onPress={handleBrowseHome}
              style={s.modalBtn}
              activeOpacity={0.9}
            >
              <Text style={s.modalBtnText}>Acessar Início</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  backLinkText: {
    color: "#374151",
    fontSize: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  socialWrap: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 52,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  socialBtnText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  socialBtnLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  socialBtnLightText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: "#111827",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputFlex: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eyeBtn: {
    padding: 10,
  },
  checkboxWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkboxRow: {
    padding: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  checkboxTextWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkboxText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
  },
  link: {
    color: "#111827",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#111827",
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
  },
  signInText: {
    color: "#6B7280",
    fontSize: 15,
  },
  signInLink: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalBtn: {
    backgroundColor: "#111827",
    borderRadius: 14,
    height: 54,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
