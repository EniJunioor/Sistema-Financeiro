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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Svg, Path } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Api from "../lib/_core/api";
import * as Auth from "../lib/_core/auth";
import { isBiometricAvailable, getBiometricType } from "../lib/biometric";
import { startOAuthLogin, getApiBaseUrl } from "../constants/oauth";

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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const hasApi = !!getApiBaseUrl();

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Campos obrigatórios", "Preencha email e senha.");
      return;
    }

    if (!hasApi) {
      Alert.alert(
        "Modo demonstração",
        "Configure EXPO_PUBLIC_API_BASE_URL para login real. Use login OAuth ou acesse pelo Perfil."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await Api.loginWithEmail(trimmedEmail, password);

      await Auth.setSessionToken(result.access_token);
      await Auth.setUserInfo({
        id: parseInt(result.user.id, 10) || 0,
        openId: result.user.id,
        name: result.user.name ?? null,
        email: result.user.email ?? null,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Perguntar se deseja habilitar reconhecimento facial/digital
      const biometricAvailable = await isBiometricAvailable();
      if (biometricAvailable) {
        const type = await getBiometricType();
        const label = type === "face" ? "reconhecimento facial" : type === "fingerprint" ? "impressão digital" : "biometria";
        Alert.alert(
          "Login rápido",
          `Deseja usar ${label} para entrar mais rápido na próxima vez?`,
          [
            {
              text: "Agora não",
              style: "cancel",
              onPress: () => router.replace("/(tabs)"),
            },
            {
              text: "Sim, habilitar",
              onPress: async () => {
                try {
                  await Auth.setSessionToken(result.access_token, { requireAuthentication: true });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (err) {
                  console.warn("[Login] Falha ao habilitar biometria:", err);
                }
                router.replace("/(tabs)");
              },
            },
          ]
        );
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : "Falha ao fazer login.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Apple", "Login com Apple em desenvolvimento.");
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await startOAuthLogin();
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar o login.");
    }
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
            {/* Back Button - topo esquerdo como na referência */}
            <View style={s.topBar}>
              <TouchableOpacity
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
                style={s.backBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Header - centralizado como na referência */}
            <View style={s.header}>
              <Text style={s.title}>Bem-vindo de volta</Text>
              <Text style={s.subtitle}>
                Mantenha-se conectado fazendo login com seu email e senha para acessar sua conta.
              </Text>
            </View>

            {/* Social Login - FIRST */}
            <View style={s.socialWrap}>
              <TouchableOpacity
                onPress={handleGoogleLogin}
                style={s.socialBtn}
                activeOpacity={0.8}
              >
                <GoogleIcon size={20} />
                <Text style={s.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAppleLogin}
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

            {/* Email/Password Form */}
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
                    autoComplete="password"
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

              <View style={s.optionsRow}>
                <View style={s.rememberRow}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: "#D1D5DB", true: "#34C759" }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={s.rememberLabel}>Lembrar de mim</Text>
                </View>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={s.forgotText}>Esqueceu a senha?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={loading}
                style={s.primaryBtn}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.primaryBtnText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={s.signUpWrap}>
              <Text style={s.signUpText}>Não tem uma conta? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={s.signUpLink}>Cadastre-se</Text>
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
    paddingTop: 16,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: "row",
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
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
  backBtn: {
    padding: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eyeBtn: {
    padding: 10,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rememberLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  forgotText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
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
  signUpWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signUpText: {
    color: "#6B7280",
    fontSize: 15,
  },
  signUpLink: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
});
