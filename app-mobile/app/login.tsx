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
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter, Link } from "expo-router";

import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { startOAuthLogin } from "@/constants/oauth";
import { getApiBaseUrl } from "@/constants/oauth";

const GREEN = "#22C55E";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasApi = !!getApiBaseUrl();

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("Campos obrigatórios", "Preencha email e senha.");
      return;
    }

    if (!hasApi) {
      Alert.alert(
        "Modo demonstração",
        "Configure EXPO_PUBLIC_API_BASE_URL para login real. Enquanto isso, use 'Entrar com OAuth' ou acesse pelo Perfil."
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

      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao fazer login.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert("Apple", "Login com Apple em desenvolvimento.");
  };

  const handleGoogleLogin = async () => {
    try {
      await startOAuthLogin();
    } catch (err) {
      Alert.alert("Erro", "Não foi possível iniciar o login.");
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
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>
              Welcome Back! Ready To Manage Payments?
            </Text>
          </View>

          {/* Formulário */}
          <View style={s.form}>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  placeholder="Narava9061@Downlor.Com"
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
                <Text style={s.label}>Password</Text>
                <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, s.inputFlex]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

              <Link href="/forgot-password" asChild>
                <TouchableOpacity style={s.forgotBtn}>
                  <Text style={s.forgotText}>Forget Password?</Text>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={loading}
                style={s.primaryBtn}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Login</Text>
                )}
              </TouchableOpacity>
          </View>

          {/* Divider Or */}
            <View style={s.dividerWrap}>
              <View style={s.divider} />
              <Text style={s.dividerText}>Or</Text>
              <View style={s.divider} />
          </View>

          {/* Social Login */}
          <View style={s.socialWrap}>
            <TouchableOpacity
              onPress={handleAppleLogin}
              style={s.socialBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="apple"
                size={24}
                color="#FFFFFF"
              />
              <Text style={s.socialBtnText}>Continue With Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              style={s.socialBtn}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="google" size={20} color="#FFFFFF" />
              <Text style={s.socialBtnText}>Continue With Google</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={s.signUpWrap}>
            <Text style={s.signUpText}>Don't Have Account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={s.signUpLink}>Sign Up</Text>
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
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 36,
  },
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
  form: {
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
  },
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#F59E0B",
    fontSize: 14,
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
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#374151",
  },
  dividerText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialWrap: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    borderRadius: 14,
    height: 54,
    gap: 12,
  },
  socialBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  signUpWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  signUpText: {
    color: "#9CA3AF",
    fontSize: 15,
  },
  signUpLink: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "600",
  },
});
