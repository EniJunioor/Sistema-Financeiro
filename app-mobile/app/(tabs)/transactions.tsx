import { useState, useCallback, useMemo, useRef } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Rect } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useTransactions } from "@/lib/store";
import { formatCurrency, formatCurrencyShort, getMonthName } from "@/lib/formatters";
import { CATEGORIES } from "@/lib/sample-data";
import { getMerchantOrCategoryFallback } from "@/lib/merchant-config";
import type { Transaction, TransactionType, TransactionFormData } from "@/lib/types";
import { AppColors } from "@/constants/colors";

type FilterType = "all" | "income" | "expense";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 40 - 32; // padding + card padding
const CHART_HEIGHT = 80;

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

// ─── Mini Sparkline Chart ────────────────────────────────────────────────────
function SparklineChart({
  data,
  color,
  width,
  height,
}: {
  data: number[];
  color: string;
  width: number;
  height: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height * 0.85 - height * 0.07,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${height} L 0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sparkGrad)" />
      <Path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Bar Chart (Receitas vs Despesas por mês) ────────────────────────────────
function MonthlyBarChart({
  months,
}: {
  months: { label: string; income: number; expense: number }[];
}) {
  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1);
  const barWidth = (CHART_WIDTH / months.length - 16) / 2;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT, gap: 4 }}>
      {months.map((m, i) => {
        const incH = Math.max((m.income / maxVal) * CHART_HEIGHT * 0.9, 4);
        const expH = Math.max((m.expense / maxVal) * CHART_HEIGHT * 0.9, 4);
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: CHART_HEIGHT - 18 }}>
              <View
                style={{
                  width: barWidth,
                  height: incH,
                  backgroundColor: "#22C55E",
                  borderRadius: 4,
                  opacity: 0.9,
                }}
              />
              <View
                style={{
                  width: barWidth,
                  height: expH,
                  backgroundColor: "#E8536A",
                  borderRadius: 4,
                  opacity: 0.9,
                }}
              />
            </View>
            <Text style={{ color: "#7B8CA3", fontSize: 10, fontWeight: "600" }}>{m.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Category Progress Bar ───────────────────────────────────────────────────
function CategoryBar({
  name,
  icon,
  color,
  value,
  total,
}: {
  name: string;
  icon: string;
  color: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <View style={catBarStyles.row}>
      <View style={[catBarStyles.iconWrap, { backgroundColor: color + "22" }]}>
        <MaterialIcons name={icon as any} size={14} color={color} />
      </View>
      <View style={catBarStyles.info}>
        <View style={catBarStyles.labelRow}>
          <Text style={catBarStyles.label}>{name}</Text>
          <Text style={catBarStyles.value}>{formatCurrencyShort(value)}</Text>
        </View>
        <View style={catBarStyles.track}>
          <View style={[catBarStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const catBarStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#CBD5E1", fontSize: 12, fontWeight: "600" },
  value: { color: "#7B8CA3", fontSize: 11 },
  track: { height: 5, backgroundColor: "#243447", borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, borderRadius: 3 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const { transactions, loading, addTransaction, deleteTransaction, reload } = useTransactions();
  const accounts: any[] = [];
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  // ── Métricas do mês atual ──────────────────────────────────────────────────
  const now = new Date();
  const monthTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }),
    [transactions]
  );

  const totalIncome = useMemo(
    () => monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const totalExpense = useMemo(
    () => monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : "0";

  // ── Dados dos últimos 6 meses para gráfico ─────────────────────────────────
  const monthlyData = useMemo(() => {
    const result: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      result.push({
        label: getMonthName(m),
        income: txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return result;
  }, [transactions]);

  // Sparkline: saldo líquido por mês
  const sparkData = useMemo(
    () => monthlyData.map((m) => m.income - m.expense),
    [monthlyData]
  );

  // ── Categorias de gastos do mês ────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const expTx = monthTx.filter((t) => t.type === "expense");
    const map = new Map<string, number>();
    expTx.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([id, amount]) => ({ id, amount, cat: CATEGORIES.find((c) => c.id === id) }))
      .filter((x) => x.cat)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthTx]);

  // ── Filtro e agrupamento ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          CATEGORIES.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, filter, search]);

  const flatData = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((tx) => {
      const dateKey = new Date(tx.date).toLocaleDateString("pt-BR");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(tx);
    });
    const items: ({ type: "header"; title: string } | { type: "item"; tx: Transaction })[] = [];
    map.forEach((data, title) => {
      items.push({ type: "header", title });
      data.forEach((tx) => items.push({ type: "item", tx }));
    });
    return items;
  }, [filtered]);

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

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
  ];

  const ListHeader = (
    <View>
      {/* ── Hero Card ─────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#FF4D8D", "#C2185B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Saldo do Mês</Text>
            <Text style={styles.heroValue}>{formatCurrency(balance)}</Text>
            <View style={styles.heroBadge}>
              <MaterialIcons
                name={balance >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color="#fff"
              />
              <Text style={styles.heroBadgeText}>
                {savingsRate}% de economia
              </Text>
            </View>
          </View>
          <View style={styles.sparklineWrap}>
            <SparklineChart
              data={sparkData}
              color="#fff"
              width={90}
              height={48}
            />
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <MaterialIcons name="arrow-upward" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroStatLabel}>Receitas</Text>
            <Text style={styles.heroStatValue}>{formatCurrencyShort(totalIncome)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <MaterialIcons name="arrow-downward" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroStatLabel}>Despesas</Text>
            <Text style={styles.heroStatValue}>{formatCurrencyShort(totalExpense)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <MaterialIcons name="receipt-long" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroStatLabel}>Transações</Text>
            <Text style={styles.heroStatValue}>{monthTx.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Cards de Métricas ─────────────────────────────────────────────── */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: "#22C55E" }]}>
          <View style={[styles.metricIcon, { backgroundColor: "#22C55E22" }]}>
            <MaterialIcons name="arrow-upward" size={16} color="#22C55E" />
          </View>
          <Text style={styles.metricLabel}>Receitas</Text>
          <Text style={[styles.metricValue, { color: "#22C55E" }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: "#E8536A" }]}>
          <View style={[styles.metricIcon, { backgroundColor: "#E8536A22" }]}>
            <MaterialIcons name="arrow-downward" size={16} color="#E8536A" />
          </View>
          <Text style={styles.metricLabel}>Despesas</Text>
          <Text style={[styles.metricValue, { color: "#E8536A" }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      {/* ── Gráfico Mensal ────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fluxo Mensal</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.legendText}>Receitas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#E8536A" }]} />
              <Text style={styles.legendText}>Despesas</Text>
            </View>
          </View>
        </View>
        <MonthlyBarChart months={monthlyData} />
      </View>

      {/* ── Categorias de Gastos ──────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Categorias de Gastos</Text>
            <Text style={styles.cardSubtitle}>{getMonthName(now.getMonth())}</Text>
          </View>
          {categoryBreakdown.map(({ id, amount, cat }) => (
            <CategoryBar
              key={id}
              name={cat!.name}
              icon={ICON_MAP[cat!.icon] || "receipt"}
              color={cat!.color}
              value={amount}
              total={totalExpense}
            />
          ))}
        </View>
      )}

      {/* ── Barra de Busca ────────────────────────────────────────────────── */}
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

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.txCount}>{filtered.length} registros</Text>
      </View>

      {/* ── Título da lista ───────────────────────────────────────────────── */}
      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>Histórico</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transações</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={22} color="#7B8CA3" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, idx) =>
          item.type === "header" ? `h-${item.title}` : `t-${item.tx.id}`
        }
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{item.title}</Text>
                <View style={styles.dateLine} />
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
              activeOpacity={0.7}
              style={styles.txRow}
            >
              <View
                style={[
                  styles.txIcon,
                  { backgroundColor: (cat?.color || "#5A6B80") + "22" },
                ]}
              >
                <Text style={[styles.txIconLetter as any, { color: merchant.color }]}>
                  {merchant.letter}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {tx.description}
                </Text>
                <View style={styles.txMeta}>
                  <Text style={styles.txCat}>{cat?.name || "Sem categoria"}</Text>
                  {tx.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <MaterialIcons name="repeat" size={10} color="#FF4D8D" />
                      <Text style={styles.recurringText}>Recorrente</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: isIncome ? "#22C55E" : "#E8536A" }]}>
                  {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="receipt-long" size={48} color="#243447" />
            <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.fab}>
        <LinearGradient
          colors={["#FF4D8D", "#C2185B"]}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
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

// ─── Modal de Nova Transação ─────────────────────────────────────────────────
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

  const types: { key: TransactionType; label: string; color: string; icon: string }[] = [
    { key: "expense", label: "Despesa", color: "#E8536A", icon: "arrow-downward" },
    { key: "income", label: "Receita", color: "#22C55E", icon: "arrow-upward" },
    { key: "transfer", label: "Transf.", color: "#4D79FF", icon: "swap-horiz" },
  ];

  const incomeCategories = CATEGORIES.filter((c) => ["cat-8", "cat-9", "cat-10"].includes(c.id));
  const expenseCategories = CATEGORIES.filter((c) => !["cat-8", "cat-9"].includes(c.id));
  const shownCategories = type === "income" ? incomeCategories : expenseCategories;
  const activeType = types.find((t) => t.key === type)!;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#0D1B2A" }}
      >
        {/* Header */}
        <LinearGradient
          colors={[activeType.color + "22", "#0D1B2A"]}
          style={styles.modalHeader}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <MaterialIcons name="close" size={20} color="#7B8CA3" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Transação</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {/* Tipo */}
          <View style={styles.typeRow}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === t.key ? t.color + "22" : "#1B2838",
                    borderColor: type === t.key ? t.color : "#243447",
                  },
                ]}
              >
                <MaterialIcons
                  name={t.icon as any}
                  size={16}
                  color={type === t.key ? t.color : "#7B8CA3"}
                />
                <Text
                  style={{
                    color: type === t.key ? t.color : "#7B8CA3",
                    fontWeight: "700",
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Valor */}
          <Text style={styles.fieldLabel}>VALOR</Text>
          <View style={[styles.amountRow, { borderColor: activeType.color + "44" }]}>
            <Text style={[styles.currencyPrefix, { color: activeType.color }]}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: activeType.color }]}
              placeholder="0,00"
              placeholderTextColor="#5A6B80"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Descrição */}
          <Text style={styles.fieldLabel}>DESCRIÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado, Salário..."
            placeholderTextColor="#5A6B80"
            value={description}
            onChangeText={setDescription}
            returnKeyType="done"
          />

          {/* Categoria */}
          <Text style={styles.fieldLabel}>CATEGORIA</Text>
          <View style={styles.catGrid}>
            {shownCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: categoryId === cat.id ? cat.color + "22" : "#1B2838",
                    borderColor: categoryId === cat.id ? cat.color : "#243447",
                  },
                ]}
              >
                <MaterialIcons
                  name={(ICON_MAP[cat.icon] || "receipt") as any}
                  size={14}
                  color={categoryId === cat.id ? cat.color : "#7B8CA3"}
                />
                <Text
                  style={{
                    color: categoryId === cat.id ? cat.color : "#7B8CA3",
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 2,
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#7B8CA3", fontSize: 13, marginTop: 2 },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1B2838",
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  heroValue: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  sparklineWrap: { opacity: 0.9 },
  heroStats: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  heroStatItem: { flex: 1, alignItems: "center", gap: 3 },
  heroStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  heroStatValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  // Metric Cards
  metricsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#243447",
    borderLeftWidth: 3,
    gap: 6,
  },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricLabel: { color: "#7B8CA3", fontSize: 12, fontWeight: "600" },
  metricValue: { fontSize: 15, fontWeight: "800" },

  // Card genérico
  card: {
    marginHorizontal: 20,
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#243447",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  cardSubtitle: { color: "#7B8CA3", fontSize: 12 },
  chartLegend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#7B8CA3", fontSize: 11 },

  // Search
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "#243447",
  },
  searchInput: { flex: 1, marginLeft: 8, color: "#fff", fontSize: 14, height: 44 },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1B2838",
    borderWidth: 1,
    borderColor: "#243447",
  },
  filterActive: { backgroundColor: "rgba(255,77,141,0.15)", borderColor: "#FF4D8D" },
  filterText: { color: "#7B8CA3", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#FF4D8D" },
  txCount: { marginLeft: "auto", color: "#5A6B80", fontSize: 11 },

  // List title
  listTitleRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  listTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Date header
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: "#243447" },
  dateText: { color: "#7B8CA3", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  // Transaction row
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txIconLetter: { fontSize: 16, fontWeight: "700" },
  txInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  txDesc: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  txCat: { color: "#7B8CA3", fontSize: 12 },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FF4D8D18",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  recurringText: { color: "#FF4D8D", fontSize: 9, fontWeight: "700" },
  txRight: { alignItems: "flex-end", gap: 3 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txDate: { color: "#5A6B80", fontSize: 11 },

  // Empty
  emptyCard: {
    backgroundColor: "#1B2838",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#243447",
  },
  emptyText: { color: "#7B8CA3", fontSize: 14, marginTop: 8 },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#FF4D8D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1B2838",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  modalSaveBtn: {
    backgroundColor: "#FF4D8D22",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#FF4D8D55",
  },
  modalSave: { color: "#FF4D8D", fontSize: 14, fontWeight: "700" },
  typeRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 2,
  },
  fieldLabel: {
    color: "#7B8CA3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1.5,
  },
  currencyPrefix: { fontSize: 20, marginRight: 8, fontWeight: "700" },
  amountInput: { flex: 1, fontSize: 26, fontWeight: "800", height: 60 },
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
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 32 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
    minWidth: 80,
  },
});
