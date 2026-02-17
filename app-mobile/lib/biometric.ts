import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/**
 * Verifica se o dispositivo suporta biometria (Face ID / impressão digital).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
    // SECRET = biometria cadastrada, NONE = nenhuma
    return enrolledLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ||
           enrolledLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
  } catch {
    return false;
  }
}

/**
 * Retorna o tipo de biometria disponível para mensagens amigáveis.
 */
export async function getBiometricType(): Promise<"face" | "fingerprint" | "unknown"> {
  if (Platform.OS === "web") return "unknown";

  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "face";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}
