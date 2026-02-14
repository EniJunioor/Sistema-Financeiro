import { useState, useCallback } from "react";
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
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useAccounts } from "@/lib/store";
import { formatCurrency } from "@/lib/formatters";
import type { AccountType } from "@/lib/types";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  credit: "Cartão de Crédito",
  credit_card: "Cartão de Crédito",
  investment: "Investimento",
};

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  checking: "account-balance",
  savings: "savings",
  credit: "credit-card",
  credit_card: "credit-card",
  investment: "trending-up",
};

const BANK_THEMES: Record<string, { gradient: [string, string, string] }> = {
  nubank: { gradient: ["#8B11E0", "#6B0FB5", "#4A0A80"] },
  itau: { gradient: ["#FF6B00", "#E05500", "#B84500"] },
  itaú: { gradient: ["#FF6B00", "#E05500", "#B84500"] },
  bradesco: { gradient: ["#CC092F", "#A50727", "#80051E"] },
  "banco do brasil": { gradient: ["#FFCC00", "#E5B700", "#003366"] },
  bb: { gradient: ["#FFCC00", "#E5B700", "#003366"] },
  santander: { gradient: ["#EC0000", "#CC0000", "#A30000"] },
  caixa: { gradient: ["#005CA9", "#004B8A", "#003A6B"] },
  inter: { gradient: ["#FF7A00", "#E06B00", "#C05C00"] },
  c6: { gradient: ["#2A2A2A", "#1A1A1A", "#0A0A0A"] },
  picpay: { gradient: ["#21C25E", "#1AA34E", "#15843E"] },
};

const DEFAULT_GRADIENT: [string, string, string] = ["#E8536A", "#C44DFF", "#4D79FF"];

function getBankGradient(name: string): [string, string, string] {
  const lower = name.toLowerCase();
  for (const key of Object.keys(BANK_THEMES)) {
    if (lower.includes(key)) return BANK_THEMES[key].gradient;
  }
  return DEFAULT_GRADIENT;
}

export default function AccountsScreen() {
  const { accounts, loading, addAccount, deleteAccount, totalBalance, reload } = useAccounts();
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Excluir conta", `Excluir "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteAccount(id) },
    ]);
  };

  const handleAdd = async (data: { name: string; type: AccountType; balance: string }) => {
    await addAccount({
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance) || 0,
      currency: "BRL",
      isActive: true,
    });
    setModalVisible(false);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.title}>Contas</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#E8536A" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>PATRIMÔNIO TOTAL</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
        <Text style={styles.totalSub}>
          {accounts.length} conta{accounts.length !== 1 ? "s" : ""} ativa{accounts.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#243447" />
            <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Adicionar Conta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map((acc) => {
            const gradient = getBankGradient(acc.name);
            const typeLabel = ACCOUNT_TYPE_LABELS[acc.type] || acc.type;
            const typeIcon = ACCOUNT_TYPE_ICONS[acc.type] || "account-balance-wallet";
            return (
              <TouchableOpacity
                key={acc.id}
                onLongPress={() => handleDelete(acc.id, acc.name)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accountCard}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconWrap}>
                      <MaterialIcons name={typeIcon as any} size={22} color="rgba(255,255,255,0.9)" />
                    </View>
                    <View style={styles.cardChipDots}>
                      <View style={styles.chipDot} />
                      <View style={[styles.chipDot, { marginLeft: -6, opacity: 0.5 }]} />
                    </View>
                  </View>
                  <View style={styles.cardMiddle}>
                    <Text style={styles.cardName}>{acc.name}</Text>
                    <Text style={styles.cardType}>{typeLabel}</Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardBalance}>{formatCurrency(acc.balance)}</Text>
                    <Text style={styles.cardNumber}>
                      •• {String(acc.id).slice(-4).replace(/\D/g, "0").padEnd(4, "0").slice(0, 4)}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <AccountModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleAdd} />
    </ScreenContainer>
  );
}

function AccountModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: AccountType; balance: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("");

  const reset = () => { setName(""); setType("checking"); setBalance(""); };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Informe o nome da conta"); return; }
    onSave({ name: name.trim(), type, balance });
    reset();
  };

  const types: { key: AccountType; label: string; icon: string }[] = [
    { key: "checking", label: "Corrente", icon: "account-balance" },
    { key: "savings", label: "Poupança", icon: "savings" },
    { key: "credit_card", label: "Crédito", icon: "credit-card" },
    { key: "investment", label: "Investimento", icon: "trending-up" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#0D1B2A" }}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Conta</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>TIPO DE CONTA</Text>
          <View style={styles.typeGrid}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={[styles.typeCard, type === t.key && styles.typeCardActive]}
              >
                <MaterialIcons
                  name={t.icon as any}
                  size={24}
                  color={type === t.key ? "#E8536A" : "#7B8CA3"}
                />
                <Text style={[styles.typeLabel, type === t.key && { color: "#E8536A" }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>NOME DA CONTA</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Nubank, Itaú, Bradesco..."
            placeholderTextColor="#5A6B80"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>SALDO INICIAL</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={setBalance}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(232,83,106,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  totalCard: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 20,
    backgroundColor: "#1B2838", borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: "#243447",
  },
  totalLabel: { color: "#7B8CA3", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  totalValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", marginTop: 8, letterSpacing: -0.5 },
  totalSub: { color: "#5A6B80", fontSize: 13, marginTop: 6 },
  accountCard: {
    borderRadius: 20, padding: 22, marginBottom: 14, minHeight: 170,
    justifyContent: "space-between",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  cardChipDots: { flexDirection: "row" },
  chipDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.35)" },
  cardMiddle: { marginTop: 16 },
  cardName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardType: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 3 },
  cardBottom: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12,
  },
  cardBalance: { color: "#fff", fontSize: 24, fontWeight: "800" },
  cardNumber: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  emptyCard: {
    backgroundColor: "#1B2838", borderRadius: 20, padding: 40, alignItems: "center",
    marginTop: 20, borderWidth: 1, borderColor: "#243447",
  },
  emptyText: { color: "#7B8CA3", fontSize: 14, marginTop: 8 },
  emptyBtn: {
    marginTop: 16, backgroundColor: "#E8536A", borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  modalTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  modalSave: { color: "#E8536A", fontSize: 16, fontWeight: "700" },
  fieldLabel: { color: "#7B8CA3", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%", backgroundColor: "#1B2838", borderRadius: 16, padding: 16,
    alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#243447",
  },
  typeCardActive: { borderColor: "#E8536A", backgroundColor: "rgba(232,83,106,0.08)" },
  typeLabel: { color: "#7B8CA3", fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "#1B2838", borderRadius: 16, paddingHorizontal: 16, height: 52,
    color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#243447",
  },
  amountRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1B2838",
    borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: "#243447",
  },
  currencyPrefix: { color: "#7B8CA3", fontSize: 18, marginRight: 8 },
  amountInput: { flex: 1, color: "#fff", fontSize: 22, fontWeight: "700", height: 56 },
});
