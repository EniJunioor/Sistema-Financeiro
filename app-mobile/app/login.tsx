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
import * as Haptics from "expo-haptics";
import * as Api from "../lib/_core/api";
import * as Auth from "../lib/_core/auth";
import { isBiometricAvailable, authenticateWithBiometric } from "../lib/biometric";
import { startOAuthLogin, getApiBaseUrl } from "../constants/oauth";
import { AppColors } from "@/constants/colors";
import { Image } from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const hasApi = !!getApiBaseUrl();

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return "Campo obrigatório";
    if (!EMAIL_REGEX.test(v)) return "Email inválido";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Campo obrigatório";
    return "";
  };

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();
    const eErr = validateEmail(trimmedEmail);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Campos obrigatórios", eErr || pErr);
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

      // Só mostra o modal nativo (Face ID / biometria) se "Lembrar de mim" estiver marcado
      if (rememberMe) {
        const biometricAvailable = await isBiometricAvailable();
        if (biometricAvailable) {
          const authenticated = await authenticateWithBiometric();
          if (authenticated) {
            try {
              await Auth.setSessionToken(result.access_token, { requireAuthentication: true });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.warn("[Login] Falha ao habilitar biometria:", err);
            }
          }
        }
      }
      router.replace("/(tabs)");
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
            <View style={s.mainBlock}>
            {/* Header - centralizado */}
            <View style={s.header}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={s.logo}
                resizeMode="contain"
                accessibilityLabel="Logo do app"
              />
              <Text style={s.title}>Bem-vindo de volta</Text>
              <Text style={s.subtitle}>
                Mantenha-se conectado fazendo login com seu email e senha para acessar sua conta.
              </Text>
            </View>

            {/* Email/Password Form */}
            <View style={s.form}>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={AppColors.gray600}
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
                    placeholderTextColor={AppColors.gray600}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (passwordError) setPasswordError(validatePassword(v));
                    }}
                    onFocus={() => {
                      setPasswordFocused(true);
                      setPasswordError("");
                    }}
                    onBlur={() => {
                      setPasswordFocused(false);
                      setPasswordError(validatePassword(password));
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!loading}
                    accessibilityLabel="Campo de senha"
                    accessibilityHint="Digite sua senha"
                    accessibilityState={{ disabled: loading }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                    style={s.eyeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={22}
                      color={AppColors.gray600}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={s.errorText} accessibilityLiveRegion="polite">
                    {passwordError}
                  </Text>
                ) : null}
              </View>

              <View style={s.optionsRow}>
                <View style={s.rememberRow} accessible accessibilityLabel="Lembrar de mim">
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: AppColors.gray500, true: AppColors.lime }}
                    thumbColor={AppColors.white}
                  />
                  <Text style={s.rememberLabel}>Lembrar de mim</Text>
                </View>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={s.forgotText}>Esqueceu a senha?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* ou - abaixo de Lembrar de mim */}
              <View style={s.dividerWrap}>
                <View style={s.divider} />
                <Text style={s.dividerText}>ou</Text>
                <View style={s.divider} />
              </View>

              {/* Google e Apple */}
              <View style={s.socialWrap}>
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  style={s.socialBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Entrar com Google"
                  accessibilityRole="button"
                >
                  <GoogleIcon size={20} />
                  <Text style={s.socialBtnText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAppleLogin}
                  style={[s.socialBtn, s.socialBtnLight]}
                  activeOpacity={0.8}
                  accessibilityLabel="Entrar com Apple"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="apple" size={24} color={AppColors.black} />
                  <Text style={s.socialBtnLightText}>Apple</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={loading}
                style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
                activeOpacity={0.9}
                accessibilityLabel="Botão entrar"
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.black} size="small" />
                ) : (
                  <Text style={s.primaryBtnText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>

            {/* Não tem conta - em baixo */}
            <View style={s.signUpWrap}>
              <Text style={s.signUpText}>Não tem conta? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity accessibilityLabel="Criar conta" accessibilityRole="link">
                  <Text style={s.signUpLink}>Criar conta</Text>
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
    backgroundColor: AppColors.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  mainBlock: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.gray600,
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
    backgroundColor: AppColors.white,
    borderRadius: 14,
    height: 52,
    gap: 10,
    borderWidth: 1.5,
    borderColor: AppColors.lightGrey,
  },
  socialBtnText: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "600",
  },
  socialBtnLight: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.lightGrey,
  },
  socialBtnLightText: {
    color: AppColors.black,
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
    backgroundColor: AppColors.lightGrey,
  },
  dividerText: {
    color: AppColors.gray600,
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
    color: AppColors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: AppColors.black,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: AppColors.lightGrey,
  },
  inputFocused: {
    borderColor: AppColors.lime,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  inputFlex: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: AppColors.lightGrey,
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
    color: AppColors.gray600,
  },
  forgotText: {
    fontSize: 14,
    color: AppColors.black,
    fontWeight: "500",
  },
  primaryBtn: {
    backgroundColor: AppColors.lime,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "700",
  },
  signUpWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  signUpText: {
    color: AppColors.gray600,
    fontSize: 15,
  },
  signUpLink: {
    color: AppColors.lime,
    fontSize: 15,
    fontWeight: "600",
  },
});
