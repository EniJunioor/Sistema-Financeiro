import { useState, useCallback, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGoals, useSettings } from "@/lib/store";
import * as Auth from "@/lib/_core/auth";
import { formatCurrency } from "@/lib/formatters";
import { GOAL_TYPE_LABELS } from "@/lib/sample-data";
import type { GoalType, GoalFormData } from "@/lib/types";

const GOAL_COLORS: Record<string, string> = {
  savings: "#34C759",
  spending_limit: "#E8536A",
  investment: "#3B82F6",
};

const GOAL_ICONS: Record<string, string> = {
  savings: "savings",
  spending_limit: "warning",
  investment: "trending-up",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { goals, addGoal, deleteGoal, reload: reloadGoals } = useGoals();
  const { settings, updateSettings } = useSettings();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    Auth.getSessionToken().then((t) => setIsLoggedIn(!!t));
  }, []);

  useFocusEffect(
    useCallback(() => {
      Auth.getSessionToken().then((t) => setIsLoggedIn(!!t));
      reloadGoals();
    }, [reloadGoals])
  );

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await Auth.removeSessionToken();
          await Auth.clearUserInfo();
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert("Excluir meta", `Excluir "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  };

  const handleAddGoal = async (form: GoalFormData) => {
    await addGoal({
      name: form.name,
      description: form.description,
      type: form.type,
      targetAmount: parseFloat(form.targetAmount) || 0,
      currentAmount: parseFloat(form.currentAmount) || 0,
      targetDate: form.targetDate,
      isActive: true,
    });
    setModalVisible(false);
  };

  const handleSaveName = () => {
    updateSettings({ userName: nameInput.trim() || "Usuário" });
    setEditingName(false);
  };

  const activeGoals = goals.filter((g) => g.isActive);
  const completedGoals = goals.filter(
    (g) => !g.isActive || g.currentAmount >= g.targetAmount
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color="#E8536A" />
          </View>
          <View style={styles.userInfo}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <MaterialIcons name="check" size={22} color="#E8536A" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setNameInput(settings.userName);
                  setEditingName(true);
                }}
                style={styles.nameRow}
              >
                <Text style={styles.userName}>{settings.userName}</Text>
                <MaterialIcons name="edit" size={16} color="#7B8CA3" />
              </TouchableOpacity>
            )}
            <Text style={styles.userSub}>Conta pessoal</Text>
          </View>
        </View>

        {/* Login / Logout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => (isLoggedIn ? handleLogout() : router.push("/login"))}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: "rgba(255,77,141,0.12)" }]}>
                  <MaterialIcons
                    name={isLoggedIn ? "logout" : "login"}
                    size={18}
                    color="#FF4D8D"
                  />
                </View>
                <Text style={styles.settingLabel}>
                  {isLoggedIn ? "Sair da conta" : "Fazer login"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.divider} />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: "rgba(232,83,106,0.12)" }]}>
                  <MaterialIcons name="notifications" size={18} color="#E8536A" />
                </View>
                <Text style={styles.settingLabel}>Notificações</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(val) => updateSettings({ notifications: val })}
                trackColor={{ false: "#243447", true: "#E8536A" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                  <MaterialIcons name="language" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.settingLabel}>Moeda</Text>
              </View>
              <Text style={styles.settingValue}>{settings.currency}</Text>
            </View>
          </View>
        </View>

        {/* Active Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metas Ativas</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addBtn}
            >
              <MaterialIcons name="add" size={20} color="#E8536A" />
            </TouchableOpacity>
          </View>

          {activeGoals.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="flag" size={40} color="#243447" />
              <Text style={styles.emptyText}>Nenhuma meta ativa</Text>
            </View>
          ) : (
            activeGoals.map((goal) => {
              const progress = Math.min(
                (goal.currentAmount / goal.targetAmount) * 100,
                100
              );
              const goalColor = GOAL_COLORS[goal.type] || "#E8536A";
              const goalIcon = GOAL_ICONS[goal.type] || "flag";
              return (
                <TouchableOpacity
                  key={goal.id}
                  onLongPress={() => handleDeleteGoal(goal.id, goal.name)}
                  style={styles.goalCard}
                >
                  <View style={styles.goalTop}>
                    <View style={[styles.goalIcon, { backgroundColor: goalColor + "18" }]}>
                      <MaterialIcons name={goalIcon as any} size={20} color={goalColor} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                      <Text style={[styles.goalType, { color: goalColor }]}>
                        {GOAL_TYPE_LABELS[goal.type] || goal.type}
                      </Text>
                    </View>
                    <Text style={styles.goalPct}>{progress.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? "#34C759" : goalColor,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalAmount}>
                      {formatCurrency(goal.currentAmount)}
                    </Text>
                    <Text style={styles.goalAmount}>
                      {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metas Concluídas</Text>
            {completedGoals.map((goal) => (
              <View key={goal.id} style={styles.completedCard}>
                <MaterialIcons name="check-circle" size={20} color="#34C759" />
                <Text style={styles.completedName} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text style={styles.completedAmount}>
                  {formatCurrency(goal.targetAmount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Sistema Financeiro</Text>
            <Text style={styles.aboutSub}>App de gestão financeira pessoal v1.0.0</Text>
            <Text style={styles.aboutSub}>Desenvolvido com React Native + Expo</Text>
          </View>
        </View>
      </ScrollView>

      <GoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddGoal}
      />
    </ScreenContainer>
  );
}

function GoalModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (form: GoalFormData) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<GoalType>("savings");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  const reset = () => {
    setName("");
    setType("savings");
    setTargetAmount("");
    setCurrentAmount("");
  };

  const handleSave = () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert("Preencha nome e valor da meta");
      return;
    }
    onSave({ name, type, targetAmount, currentAmount });
    reset();
  };

  const goalTypes: { key: GoalType; label: string; color: string }[] = [
    { key: "savings", label: "Economia", color: "#34C759" },
    { key: "spending_limit", label: "Limite", color: "#E8536A" },
    { key: "investment", label: "Investimento", color: "#3B82F6" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#0D1B2A" }}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Meta</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>TIPO DE META</Text>
          <View style={styles.typeRow}>
            {goalTypes.map((gt) => (
              <TouchableOpacity
                key={gt.key}
                onPress={() => setType(gt.key)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === gt.key ? gt.color + "18" : "#1B2838",
                    borderColor: type === gt.key ? gt.color : "#243447",
                  },
                ]}
              >
                <Text
                  style={{
                    color: type === gt.key ? gt.color : "#fff",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {gt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>NOME DA META</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Reserva de emergência"
            placeholderTextColor="#5A6B80"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>VALOR ALVO</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>

          <Text style={styles.fieldLabel}>VALOR ATUAL (OPCIONAL)</Text>
          <View style={[styles.amountRow, { marginBottom: 32 }]}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={currentAmount}
              onChangeText={setCurrentAmount}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#1B2838",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#243447",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(232,83,106,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  userSub: {
    color: "#7B8CA3",
    fontSize: 13,
    marginTop: 2,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#E8536A",
    paddingVertical: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(232,83,106,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#243447",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  settingValue: {
    color: "#7B8CA3",
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#243447",
    marginLeft: 60,
  },
  goalCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#243447",
  },
  goalTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  goalType: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  goalPct: {
    color: "#E8536A",
    fontSize: 16,
    fontWeight: "800",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#243447",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  goalAmount: {
    color: "#7B8CA3",
    fontSize: 12,
  },
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#243447",
    gap: 10,
  },
  completedName: {
    flex: 1,
    color: "#7B8CA3",
    fontSize: 14,
    fontWeight: "500",
  },
  completedAmount: {
    color: "#34C759",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#1B2838",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#243447",
  },
  emptyText: {
    color: "#7B8CA3",
    fontSize: 14,
    marginTop: 8,
  },
  aboutCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#243447",
  },
  aboutTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  aboutSub: {
    color: "#7B8CA3",
    fontSize: 12,
    marginTop: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalSave: {
    color: "#E8536A",
    fontSize: 16,
    fontWeight: "700",
  },
  fieldLabel: {
    color: "#7B8CA3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  input: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#243447",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#243447",
  },
  currencyPrefix: {
    color: "#7B8CA3",
    fontSize: 18,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    height: 56,
  },
});
