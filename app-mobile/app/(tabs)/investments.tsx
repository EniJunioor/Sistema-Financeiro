import { useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useInvestments } from "@/lib/store";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { INVESTMENT_TYPE_LABELS } from "@/lib/sample-data";
import type { InvestmentType, InvestmentFormData } from "@/lib/types";
import { AppColors } from "@/constants/colors";

const TYPE_COLORS: Record<string, string> = {
  stock: "#3B82F6",
  fund: "#A855F7",
  etf: "#06B6D4",
  crypto: "#FF9F0A",
  bond: "#34C759",
};

const TYPE_ICONS: Record<string, string> = {
  stock: "show-chart",
  fund: "pie-chart",
  etf: "stacked-line-chart",
  crypto: "currency-bitcoin",
  bond: "lock",
};

export default function InvestmentsScreen() {
  const {
    investments,
    addInvestment,
    deleteInvestment,
    totalInvested,
    totalCurrent,
    totalGain,
    totalGainPercent,
    reload,
  } = useInvestments();
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Excluir investimento", `Excluir "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteInvestment(id) },
    ]);
  };

  const handleAdd = async (form: InvestmentFormData) => {
    const avgPrice = parseFloat(form.averagePrice) || 0;
    await addInvestment({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      type: form.type,
      quantity: parseFloat(form.quantity) || 0,
      averagePrice: avgPrice,
      currentPrice: avgPrice,
      currency: "BRL",
      broker: form.broker,
    });
    setModalVisible(false);
  };

  return (
    <ScreenContainer containerClassName="bg-[#f2f3f5]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Investimentos</Text>
      </View>

      {/* Portfolio Card */}
      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>Patrimônio Total</Text>
        <Text style={styles.portfolioValue}>{formatCurrency(totalCurrent)}</Text>
        <View style={styles.gainRow}>
          <MaterialIcons
            name={totalGain >= 0 ? "arrow-upward" : "arrow-downward"}
            size={16}
            color={totalGain >= 0 ? "#34C759" : "#E8536A"}
          />
          <Text
            style={[
              styles.gainText,
              { color: totalGain >= 0 ? "#34C759" : "#E8536A" },
            ]}
          >
            {formatCurrency(Math.abs(totalGain))} ({formatPercentage(totalGainPercent)})
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Investido</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {formatCurrency(totalInvested)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ativos</Text>
          <Text style={styles.statValue}>{investments.length}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={investments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const gain = (item.currentPrice - item.averagePrice) * item.quantity;
          const gainPct =
            item.averagePrice > 0
              ? ((item.currentPrice - item.averagePrice) / item.averagePrice) * 100
              : 0;
          const typeColor = TYPE_COLORS[item.type] || "#C8FF00";
          const typeIcon = TYPE_ICONS[item.type] || "show-chart";

          return (
            <TouchableOpacity
              onLongPress={() => handleDelete(item.id, item.name)}
              style={styles.invCard}
            >
              <View style={styles.invTop}>
                <View
                  style={[styles.invIcon, { backgroundColor: typeColor + "18" }]}
                >
                  <MaterialIcons name={typeIcon as any} size={20} color={typeColor} />
                </View>
                <View style={styles.invInfo}>
                  <Text style={styles.invSymbol}>{item.symbol}</Text>
                  <Text style={styles.invName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.invValues}>
                  <Text style={styles.invTotal}>
                    {formatCurrency(item.currentPrice * item.quantity)}
                  </Text>
                  <Text
                    style={[
                      styles.invGain,
                      { color: gain >= 0 ? "#34C759" : "#FF453A" },
                    ]}
                  >
                    {formatPercentage(gainPct)}
                  </Text>
                </View>
              </View>
              <View style={styles.invBottom}>
                <View style={styles.invDetail}>
                  <Text style={styles.detailLabel}>Qtd</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
                <View style={styles.invDetail}>
                  <Text style={styles.detailLabel}>PM</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.averagePrice)}</Text>
                </View>
                <View style={styles.invDetail}>
                  <Text style={styles.detailLabel}>Atual</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.currentPrice)}</Text>
                </View>
                <View style={styles.invDetail}>
                  <Text style={styles.detailLabel}>Tipo</Text>
                  <Text style={[styles.detailValue, { color: typeColor }]}>
                    {INVESTMENT_TYPE_LABELS[item.type] || item.type}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="trending-up" size={48} color="#243447" />
            <Text style={styles.emptyText}>Nenhum investimento cadastrado</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.fab}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <InvestmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAdd}
      />
    </ScreenContainer>
  );
}

function InvestmentModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (form: InvestmentFormData) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<InvestmentType>("stock");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [broker, setBroker] = useState("");

  const reset = () => {
    setSymbol("");
    setName("");
    setType("stock");
    setQuantity("");
    setAveragePrice("");
    setBroker("");
  };

  const handleSave = () => {
    if (!symbol.trim() || !name.trim()) {
      Alert.alert("Preencha símbolo e nome");
      return;
    }
    onSave({ symbol, name, type, quantity, averagePrice, broker });
    reset();
  };

  const invTypes: { key: InvestmentType; label: string }[] = [
    { key: "stock", label: "Ação" },
    { key: "fund", label: "Fundo" },
    { key: "etf", label: "ETF" },
    { key: "crypto", label: "Cripto" },
    { key: "bond", label: "Renda Fixa" },
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
        style={{ flex: 1, backgroundColor: AppColors.lightGrey }}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={AppColors.black} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Novo Investimento</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {/* Type */}
          <Text style={styles.fieldLabel}>TIPO</Text>
          <View style={styles.typeGrid}>
            {invTypes.map((t) => {
              const tc = TYPE_COLORS[t.key] || "#C8FF00";
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setType(t.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: type === t.key ? tc + "20" : AppColors.white,
                      borderColor: type === t.key ? tc : AppColors.lightGrey,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: type === t.key ? tc : AppColors.black,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>SÍMBOLO / TICKER</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: PETR4, BTC..."
            placeholderTextColor="#5A6B80"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>NOME</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Petrobras PN"
            placeholderTextColor="#5A6B80"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>QUANTIDADE</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#5A6B80"
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.fieldLabel}>PREÇO MÉDIO</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={averagePrice}
              onChangeText={setAveragePrice}
            />
          </View>

          <Text style={styles.fieldLabel}>CORRETORA (OPCIONAL)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 32 }]}
            placeholder="Ex: XP, Rico, Binance..."
            placeholderTextColor="#5A6B80"
            value={broker}
            onChangeText={setBroker}
            returnKeyType="done"
          />
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
    color: AppColors.black,
    fontSize: 28,
    fontWeight: "800",
  },
  portfolioCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
  },
  portfolioLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  portfolioValue: {
    color: AppColors.black,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: -1,
  },
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  gainText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
  },
  statValue: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  invCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
    overflow: "hidden",
  },
  invTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  invIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  invInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invSymbol: {
    color: AppColors.black,
    fontSize: 16,
    fontWeight: "800",
  },
  invName: {
    color: "#7B8CA3",
    fontSize: 12,
    marginTop: 2,
  },
  invValues: {
    alignItems: "flex-end",
  },
  invTotal: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "700",
  },
  invGain: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  invBottom: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.lightGrey,
  },
  invDetail: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    color: "#6B7280",
    fontSize: 11,
  },
  detailValue: {
    color: AppColors.black,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.lime,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: AppColors.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: AppColors.black,
    fontSize: 18,
    fontWeight: "700",
  },
  modalSave: {
    color: AppColors.lime,
    fontSize: 16,
    fontWeight: "700",
  },
  fieldLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    color: AppColors.black,
    fontSize: 15,
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: AppColors.lightGrey,
  },
  currencyPrefix: {
    color: "#6B7280",
    fontSize: 18,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: AppColors.black,
    fontSize: 22,
    fontWeight: "700",
    height: 56,
  },
});
