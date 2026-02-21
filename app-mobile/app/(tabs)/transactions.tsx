import { useState, useCallback, useMemo } from "react";
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
import { useTransactions, useAccounts } from "@/lib/store";
import { formatCurrency, formatDateRelative } from "@/lib/formatters";
import { CATEGORIES } from "@/lib/sample-data";
import { getMerchantOrCategoryFallback } from "@/lib/merchant-config";
import type { Transaction, TransactionType, TransactionFormData } from "@/lib/types";
import { AppColors } from "@/constants/colors";

type FilterType = "all" | "income" | "expense";

const ICON_MAP: Record<string, string> = {
  "fork.knife": "restaurant",
  "car.fill": "directions-car",
  "building.2.fill": "business",
  "heart.fill": "favorite",
  "graduationcap.fill": "school",
  "gamecontroller.fill": "sports-esports",
  "cart.fill": "shopping-cart",
  "banknote.fill": "payments",
  "star.fill": "star",
  "tag.fill": "local-offer",
};

export default function TransactionsScreen() {
  const { transactions, loading, addTransaction, deleteTransaction, reload } =
    useTransactions();
  const { accounts } = useAccounts();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          CATEGORIES.find((c) => c.id === t.categoryId)
            ?.name.toLowerCase()
            .includes(q)
      );
    }
    return list;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((tx) => {
      const dateKey = new Date(tx.date).toLocaleDateString("pt-BR");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(tx);
    });
    const sections: { title: string; data: Transaction[] }[] = [];
    map.forEach((data, title) => sections.push({ title, data }));
    return sections;
  }, [filtered]);

  const flatData = useMemo(() => {
    const items: ({ type: "header"; title: string } | { type: "item"; tx: Transaction })[] = [];
    grouped.forEach((section) => {
      items.push({ type: "header", title: section.title });
      section.data.forEach((tx) => items.push({ type: "item", tx }));
    });
    return items;
  }, [grouped]);

  const handleDelete = (id: string) => {
    Alert.alert("Excluir transação", "Tem certeza que deseja excluir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  const handleAdd = async (form: TransactionFormData) => {
    await addTransaction({
      type: form.type,
      amount: parseFloat(form.amount) || 0,
      description: form.description,
      date: form.date || new Date().toISOString(),
      categoryId: form.categoryId,
      accountId: form.accountId || accounts?.[0]?.id,
      tags: [],
      isRecurring: false,
    });
    setModalVisible(false);
  };

  const now = new Date();
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
  ];

  return (
    <ScreenContainer containerClassName="bg-[#f2f3f5]">
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <MaterialIcons name="arrow-upward" size={16} color="#34C759" />
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: "#34C759" }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialIcons name="arrow-downward" size={16} color="#E8536A" />
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: "#E8536A" }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#5A6B80" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transações..."
            placeholderTextColor="#5A6B80"
            value={search}
            onChangeText={setSearch}
            returnKeyType="done"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={18} color="#5A6B80" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, idx) =>
          item.type === "header" ? `h-${item.title}` : `t-${item.tx.id}`
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{item.title}</Text>
              </View>
            );
          }
          const tx = item.tx;
          const cat = CATEGORIES.find((c) => c.id === tx.categoryId);
          const isIncome = tx.type === "income";
          const merchant = getMerchantOrCategoryFallback(
            tx.description,
            cat?.color || "#5A6B80",
            cat?.name || "Outros"
          );
          return (
            <TouchableOpacity
              onLongPress={() => handleDelete(tx.id)}
              style={styles.txRow}
            >
              <View
                style={[
                  styles.txIcon,
                  { backgroundColor: merchant.color + "18" },
                ]}
              >
                <Text style={[styles.txIconLetter, { color: merchant.color }]}>
                  {merchant.letter}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {tx.description}
                </Text>
                <Text style={styles.txCat}>
                  {cat?.name || "Sem categoria"}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: isIncome ? "#34C759" : "#E8536A" },
                ]}
              >
                {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="receipt-long" size={48} color="#243447" />
            <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.fab}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAdd}
        defaultAccountId={accounts?.[0]?.id}
      />
    </ScreenContainer>
  );
}

function TransactionModal({
  visible,
  onClose,
  onSave,
  defaultAccountId,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (form: TransactionFormData) => void;
  defaultAccountId?: string;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat-10");

  const reset = () => {
    setType("expense");
    setAmount("");
    setDescription("");
    setCategoryId("cat-10");
  };

  const handleSave = () => {
    if (!amount || !description) {
      Alert.alert("Preencha todos os campos");
      return;
    }
    onSave({
      type,
      amount,
      description,
      date: new Date().toISOString(),
      categoryId,
      accountId: defaultAccountId,
    });
    reset();
  };

  const types: { key: TransactionType; label: string; color: string }[] = [
    { key: "expense", label: "Despesa", color: "#E8536A" },
    { key: "income", label: "Receita", color: "#34C759" },
    { key: "transfer", label: "Transf.", color: "#4D79FF" },
  ];

  const incomeCategories = CATEGORIES.filter((c) =>
    ["cat-8", "cat-9", "cat-10"].includes(c.id)
  );
  const expenseCategories = CATEGORIES.filter(
    (c) => !["cat-8", "cat-9"].includes(c.id)
  );
  const shownCategories = type === "income" ? incomeCategories : expenseCategories;

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
          <Text style={styles.modalTitle}>Nova Transação</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.typeRow}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === t.key ? t.color + "18" : AppColors.white,
                    borderColor: type === t.key ? t.color : AppColors.lightGrey,
                  },
                ]}
              >
                <Text
                  style={{
                    color: type === t.key ? t.color : AppColors.black,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>VALOR</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <Text style={styles.fieldLabel}>DESCRIÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado, Salário..."
            placeholderTextColor="#5A6B80"
            value={description}
            onChangeText={setDescription}
            returnKeyType="done"
          />

          <Text style={styles.fieldLabel}>CATEGORIA</Text>
          <View style={styles.catGrid}>
            {shownCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      categoryId === cat.id ? cat.color + "18" : AppColors.white,
                    borderColor:
                      categoryId === cat.id ? cat.color : AppColors.lightGrey,
                  },
                ]}
              >
                <Text
                  style={{
                    color: categoryId === cat.id ? cat.color : AppColors.black,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { color: AppColors.black, fontSize: 28, fontWeight: "800" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 16, gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: AppColors.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: AppColors.lightGrey, gap: 4,
  },
  summaryLabel: { color: "#6B7280", fontSize: 12 },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  searchWrap: { paddingHorizontal: 20, marginTop: 16 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: AppColors.white,
    borderRadius: 16, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: AppColors.lightGrey,
  },
  searchInput: { flex: 1, marginLeft: 8, color: AppColors.black, fontSize: 14, height: 44 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 12, marginBottom: 4, gap: 8 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.lightGrey,
  },
  filterActive: { backgroundColor: AppColors.lime + "30", borderColor: AppColors.lime },
  filterText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: AppColors.lime },
  dateHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  dateText: { color: "#6B7280", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txIconLetter: { fontSize: 14, fontWeight: "800" },
  txInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  txDesc: { color: AppColors.black, fontSize: 15, fontWeight: "600" },
  txCat: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  emptyCard: {
    backgroundColor: AppColors.white, borderRadius: 20, padding: 40, alignItems: "center",
    marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: AppColors.lightGrey,
  },
  emptyText: { color: "#6B7280", fontSize: 14, marginTop: 8 },
  fab: {
    position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28,
    backgroundColor: AppColors.lime, alignItems: "center", justifyContent: "center",
    elevation: 8, shadowColor: AppColors.lime, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  modalTitle: { color: AppColors.black, fontSize: 18, fontWeight: "700" },
  modalSave: { color: AppColors.lime, fontSize: 16, fontWeight: "700" },
  typeRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  fieldLabel: { color: "#6B7280", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  amountRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: AppColors.white,
    borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: AppColors.lightGrey,
  },
  currencyPrefix: { color: "#6B7280", fontSize: 18, marginRight: 8 },
  amountInput: { flex: 1, color: AppColors.black, fontSize: 22, fontWeight: "700", height: 56 },
  input: {
    backgroundColor: AppColors.white, borderRadius: 16, paddingHorizontal: 16, height: 52,
    color: AppColors.black, fontSize: 15, borderWidth: 1, borderColor: AppColors.lightGrey,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 32 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
});
