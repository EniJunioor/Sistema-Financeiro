import { useCallback, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import {
  useTransactions,
  useAccounts,
  useGoals,
  useSettings,
} from "@/lib/store";
import { formatCurrency, getCurrentMonthYear } from "@/lib/formatters";
import { CATEGORIES } from "@/lib/sample-data";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.36;
const CARD_H = CARD_W * 1.35;

// ─── Avatars placeholder data ───
const CONTACTS = [
  { id: "1", initials: "AB", color: "#FF4D8D", hasNotification: true },
  { id: "2", initials: "SB", color: "#6B7280", hasNotification: false },
  { id: "3", initials: "MC", color: "#3B82F6", hasNotification: true },
  { id: "4", initials: "JD", color: "#22C55E", hasNotification: false },
];

// ─── Exchange rates (static demo) - formato da imagem ───
const EXCHANGE_RATES = [
  { code: "CAD", name: "Dólar Canadense", flag: "🇨🇦", buy: "1.3650", sell: "0.7325", trend: "up" as const },
  { code: "AUD", name: "Dólar Australiano", flag: "🇦🇺", buy: "1.5816", sell: "0.6322", trend: "up" as const },
];

// ─── Empréstimo pessoal (demo) ───
const LOAN_DATA = {
  amount: 6496,
  nextPaymentDays: 6,
};

export default function HomeScreen() {
  const { transactions, reload: reloadTx } = useTransactions();
  const { accounts, totalBalance, reload: reloadAcc } = useAccounts();
  const { goals, reload: reloadGoals } = useGoals();
  const { settings } = useSettings();

  useFocusEffect(
    useCallback(() => {
      reloadTx();
      reloadAcc();
      reloadGoals();
    }, [reloadTx, reloadAcc, reloadGoals])
  );

  // ─── Computed data ───
  const now = new Date();
  const monthName = getCurrentMonthYear();

  const monthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const totalExpenses = useMemo(
    () => monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );

  const totalIncome = useMemo(
    () => monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );

  // Category breakdown for expense bar
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        return { catId, amount, color: cat?.color || "#6B7280" };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthTx]);

  const activeGoal = goals.find((g) => g.isActive);
  const goalProgress = activeGoal
    ? Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)
    : 0;

  // Cashback (simulated as 1.5% of expenses)
  const cashback = totalExpenses * 0.015;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <MaterialIcons name="person" size={22} color="#fff" />
              </View>
              <View style={s.onlineDot} />
            </View>
            <TouchableOpacity style={s.nameRow}>
              <Text style={s.userName}>{settings.userName}</Text>
              <MaterialIcons name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerIcon}>
              <MaterialIcons name="search" size={22} color="#A0A7B5" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIcon}>
              <MaterialIcons name="notifications-none" size={22} color="#A0A7B5" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIconBg}>
              <MaterialIcons name="qr-code-scanner" size={18} color="#A0A7B5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════ TOTAL BALANCE + CARD ═══════════ */}
        <View style={s.balanceWrapper}>
          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>SALDO TOTAL</Text>
            <Text style={s.balanceValue}>{formatCurrency(totalBalance)}</Text>
            <TouchableOpacity style={s.cashbackBadge}>
              <View style={s.cashbackIcon}>
                <MaterialIcons name="monetization-on" size={14} color="#22C55E" />
              </View>
              <Text style={s.cashbackAmount}>{formatCurrency(cashback)}</Text>
              <Text style={s.cashbackText}>Cashback economizado</Text>
              <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Floating credit card - overlapping right side */}
          <View style={s.cardFloat}>
            <LinearGradient
              colors={["#FF4D8D", "#FF8A5B", "#C084FC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.creditCard}
            >
              <View style={s.cardChip}>
                <View style={s.chipCircle} />
                <View style={[s.chipCircle, { marginLeft: -8, opacity: 0.5 }]} />
              </View>
              <Text style={s.cardNumber}>•• {accounts.length > 0 ? "9567" : "0000"}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ═══════════ GRID: OPERATIONS + INCOME ═══════════ */}
        <View style={s.gridRow}>
          {/* All Operations */}
          <View style={s.gridCard}>
            <View style={s.gridIconWrap}>
              <MaterialIcons name="receipt-long" size={20} color="#A0A7B5" />
            </View>
            <Text style={s.gridTitle}>TODAS OPERAÇÕES</Text>
            <Text style={s.gridSub}>Despesas em {monthName.split(" ")[0]}</Text>
            <Text style={s.gridValue}>{formatCurrency(totalExpenses)}</Text>
            {/* Color bar */}
            <View style={s.colorBar}>
              {catBreakdown.length > 0 ? (
                catBreakdown.map((cat, i) => (
                  <View
                    key={cat.catId}
                    style={{
                      flex: cat.amount,
                      height: 6,
                      backgroundColor: cat.color,
                      borderTopLeftRadius: i === 0 ? 3 : 0,
                      borderBottomLeftRadius: i === 0 ? 3 : 0,
                      borderTopRightRadius: i === catBreakdown.length - 1 ? 3 : 0,
                      borderBottomRightRadius: i === catBreakdown.length - 1 ? 3 : 0,
                    }}
                  />
                ))
              ) : (
                <View style={{ flex: 1, height: 6, backgroundColor: "#2A2F3C", borderRadius: 3 }} />
              )}
            </View>
          </View>

          {/* Empréstimo Pessoal */}
          <View style={s.gridCardWrap}>
            <View style={s.gridCard}>
              <View style={s.gridIconWrap}>
                <MaterialIcons name="shopping-cart" size={20} color="#A0A7B5" />
              </View>
              <Text style={s.gridTitle}>EMPRÉSTIMO PESSOAL</Text>
              <Text style={[s.gridValue, { color: "#FFFFFF" }]}>
                -{formatCurrency(LOAN_DATA.amount)}
              </Text>
              <View style={s.loanBadge}>
                <Text style={s.loanBadgeText}>
                  Próximo pagamento em {LOAN_DATA.nextPaymentDays} dias
                </Text>
              </View>
            </View>
            {/* Card parcialmente visível atrás */}
            <View style={s.cardPeek}>
              <LinearGradient
                colors={["#FF4D8D", "#FF8A5B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.cardPeekGradient}
              >
                <Text style={s.cardPeekNumber}>••9567</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ═══════════ QUICK MONEY TRANSFERS ═══════════ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>TRANSFERÊNCIAS RÁPIDAS</Text>
            <TouchableOpacity style={s.seeMoreBtn}>
              <Text style={s.seeMoreText}>VER MAIS {'>'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.contactsRow}>
            {CONTACTS.map((c) => (
              <View key={c.id} style={s.contactWrap}>
                <View style={[s.contactAvatar, { backgroundColor: c.color + "30" }]}>
                  <Text style={[s.contactInitials, { color: c.color }]}>{c.initials}</Text>
                </View>
                {c.hasNotification && <View style={s.contactNotification} />}
              </View>
            ))}
            <TouchableOpacity style={s.addContact}>
              <MaterialIcons name="add" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ═══════════ EXCHANGE RATE ═══════════ */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>CÂMBIO</Text>
            <TouchableOpacity style={s.seeMoreBtn}>
              <Text style={s.seeMoreText}>VER MAIS {'>'}</Text>
            </TouchableOpacity>
          </View>
          {EXCHANGE_RATES.map((rate, idx) => (
            <View key={rate.code}>
              {idx > 0 && <View style={s.divider} />}
              <View style={s.exchangeRow}>
                <View style={s.exchangeLeft}>
                  <Text style={s.exchangeFlag}>{rate.flag}</Text>
                  <View>
                    <Text style={s.exchangeCode}>{rate.code}</Text>
                    <Text style={s.exchangeName}>{rate.name}</Text>
                  </View>
                </View>
                <View style={s.exchangeRight}>
                  <View style={s.rateCol}>
                    <Text style={s.rateValue}>${rate.buy}</Text>
                    <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                  </View>
                  <View style={s.rateCol}>
                    <Text style={s.rateValue}>${rate.sell}</Text>
                    <MaterialIcons name="trending-up" size={16} color="#F97316" />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ═══════════ FINANCIAL GOALS ═══════════ */}
        {activeGoal && (
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>METAS FINANCEIRAS</Text>
              <TouchableOpacity style={s.seeMoreBtn}>
                <Text style={s.seeMoreText}>VER MAIS {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.goalRow}>
              <View style={s.goalIconWrap}>
                <MaterialIcons name="flag" size={20} color="#FF4D8D" />
              </View>
              <View style={s.goalInfo}>
                <Text style={s.goalName} numberOfLines={1}>{activeGoal.name}</Text>
                <Text style={s.goalSub}>
                  {formatCurrency(activeGoal.currentAmount)} de {formatCurrency(activeGoal.targetAmount)}
                </Text>
              </View>
              <Text style={s.goalPct}>{goalProgress.toFixed(0)}%</Text>
            </View>
            <View style={s.goalBar}>
              <LinearGradient
                colors={["#FF4D8D", "#FF8A5B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.goalFill, { width: `${goalProgress}%` }]}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const s = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2F3C",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4D8D",
    borderWidth: 2,
    borderColor: "#0F1117",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1C1F2A",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Balance ──
  balanceWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
    position: "relative",
    minHeight: 170,
  },
  balanceCard: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    paddingRight: CARD_W + 10,
    zIndex: 2,
  },
  balanceLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 44,
  },
  cashbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  cashbackIcon: {
    marginRight: 2,
  },
  cashbackAmount: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cashbackText: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  // ── Credit Card ──
  cardFloat: {
    position: "absolute",
    right: -10,
    top: 0,
    width: CARD_W,
    height: CARD_H,
    zIndex: 1,
  },
  creditCard: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#FF4D8D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
  },
  chipCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  cardNumber: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    alignSelf: "flex-end",
  },

  // ── Grid ──
  gridRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#1C1F2A",
    borderRadius: 20,
    padding: 16,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2A2F3C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  gridTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  gridSub: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 4,
  },
  gridValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  colorBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 12,
  },
  gridCardWrap: {
    flex: 1,
    position: "relative",
  },
  loanBadge: {
    backgroundColor: "#22C55E",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  loanBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  cardPeek: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 70,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    transform: [{ rotate: "6deg" }],
  },
  cardPeekGradient: {
    flex: 1,
    padding: 8,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  cardPeekNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Section Card ──
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1C1F2A",
    borderRadius: 20,
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeMoreText: {
    color: "#FF4D8D",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Contacts ──
  contactsRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 4,
  },
  contactWrap: {
    position: "relative",
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: {
    fontSize: 16,
    fontWeight: "700",
  },
  contactNotification: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#1C1F2A",
  },
  addContact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2F3C",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Exchange ──
  divider: {
    height: 1,
    backgroundColor: "#2A2F3C",
    marginVertical: 12,
  },
  exchangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exchangeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  exchangeFlag: {
    fontSize: 28,
  },
  exchangeCode: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  exchangeName: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  exchangeRight: {
    flexDirection: "row",
    gap: 20,
  },
  rateCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rateValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Goals ──
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,77,141,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  goalSub: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  goalPct: {
    color: "#FF4D8D",
    fontSize: 16,
    fontWeight: "800",
  },
  goalBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A2F3C",
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 3,
  },
});
