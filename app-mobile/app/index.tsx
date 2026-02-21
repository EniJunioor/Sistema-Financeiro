import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Auth from "@/lib/_core/auth";
import { AppColors } from "@/constants/colors";

/**
 * Tela inicial do app: verifica se há sessão (token + usuário).
 * Se o token foi salvo com biometria, getSessionToken() dispara Face ID/impressão digital.
 * Se autenticado → redireciona para (tabs); senão → redireciona para login.
 */
export default function InitialScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const token = await Auth.getSessionToken();
        if (cancelled) return;

        if (!token) {
          router.replace("/login");
          setChecked(true);
          return;
        }

        const user = await Auth.getUserInfo();
        if (cancelled) return;

        if (user) {
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={AppColors.lime} />
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.gray600,
  },
});
