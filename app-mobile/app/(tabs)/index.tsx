import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from "react-native";
import type { Account } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import {
  useTransactions,
  useAccounts,
  useSettings,
} from "@/lib/store";
import {
  formatCurrency,
  formatTransactionDateTime,
  formatHeaderDate,
} from "@/lib/formatters";
import { CATEGORIES } from "@/lib/sample-data";
import { getMerchantConfig } from "@/lib/merchant-config";
import { AppColors } from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");

// Assinaturas - extraídas de transações recorrentes ou conhecidas
function getSubscriptionsFromTransactions(transactions: { description: string; isRecurring?: boolean }[]) {
  const seen = new Set<string>();
  const subs: { id: string; name: string; letter: string; color: string }[] = [];
  const knownSubs = ["Netflix", "Spotify", "Amazon", "Apple", "Disney", "iFood", "99", "Uber"];
  for (const t of transactions) {
    const m = getMerchantConfig(t.description);
    if (m && (t.isRecurring || knownSubs.some((k) => m.name.toLowerCase().includes(k.toLowerCase())))) {
      const key = m.name;
      if (!seen.has(key)) {
        seen.add(key);
        subs.push({ id: key, name: m.name, letter: m.letter, color: m.color });
      }
    }
  }
  // fallback se não houver assinaturas nas transações
  if (subs.length === 0) {
    return [
      { id: "1", name: "Netflix", letter: "N", color: "#E50914" },
      { id: "2", name: "Spotify", letter: "S", color: "#1DB954" },
      { id: "3", name: "iFood", letter: "i", color: "#EA1D2C" },
      { id: "4", name: "99", letter: "99", color: "#FF6B00" },
    ];
  }
  return subs.slice(0, 6);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "U";
}

// Cores por banco (para os cartões na carteira)
const BANK_COLORS: Record<string, string> = {
  Nubank: "#820AD1",
  Inter: "#FF7A00",
  Caixa: "#0066B3",
  "Poupança Caixa": "#0066B3",
  Itaú: "#EC7000",
  Bradesco: "#CC092F",
  Santander: "#EC0000",
  default: "#243447",
};

function getCardLast4(id: string): string {
  const match = id.match(/\d+/);
  if (match) return match[0].padStart(4, "0").slice(-4);
  return id.slice(-4).padStart(4, "0");
}

function WalletCard({
  account,
  compact,
  hideBalance,
}: {
  account: Account;
  compact?: boolean;
  hideBalance?: boolean;
}) {
  const color = BANK_COLORS[account.name] || BANK_COLORS.default;
  const last4 = getCardLast4(account.id);
  const isCredit = account.type === "credit_card";
  const displayValue = hideBalance
    ? "••••"
    : account.balance >= 0
      ? formatCurrency(account.balance)
      : formatCurrency(Math.abs(account.balance));

  return (
    <View style={[s.cardSlot, { backgroundColor: color }]}>
      <View style={s.cardContent}>
        <Text style={s.cardBank} numberOfLines={1}>{account.name}</Text>
        <Text style={s.cardNumber}>•••• •••• •••• {last4}</Text>
        {!compact && (
          <View style={s.cardBalanceRow}>
            <Text style={s.cardBalanceLabel}>
              {isCredit ? "Fatura" : "Saldo"}
            </Text>
            <Text style={s.cardBalanceValue}>{displayValue}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { transactions, reload: reloadTx } = useTransactions();
  const { accounts, totalBalance, reload: reloadAcc } = useAccounts();
  const { settings, updateSettings } = useSettings();
  const [balanceVisible, setBalanceVisible] = useState(!settings.hideBalances);

  useFocusEffect(
    useCallback(() => {
      reloadTx();
      reloadAcc();
    }, [reloadTx, reloadAcc])
  );

  const toggleBalance = useCallback(() => {
    setBalanceVisible((v) => !v);
    updateSettings({ ...settings, hideBalances: !balanceVisible });
  }, [settings, balanceVisible, updateSettings]);

  const now = new Date();

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

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .slice(0, 5),
    [transactions]
  );

  const subscriptions = useMemo(
    () => getSubscriptionsFromTransactions(transactions),
    [transactions]
  );

  const displayName = settings.userName || "Usuário";

  return (
    <ScreenContainer containerClassName="bg-[#f2f3f5]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View>
              <Text style={s.headerDate}>{formatHeaderDate()}</Text>
              <Text style={s.greeting}>Hi, {displayName}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn}>
              <MaterialIcons name="search" size={24} color={AppColors.black} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn}>
              <MaterialIcons name="notifications-none" size={24} color={AppColors.black} />
              <View style={s.badge}>
                <Text style={s.badgeText}>7</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════ WALLET (carteira - cartões no risco) ═══════════ */}
        <View style={s.walletOuter}>
          <ImageBackground
            source={require("../../assets/images/carteira.png")}
            style={s.walletImage}
            imageStyle={s.walletImageStyle}
            resizeMode="cover"
          >
            {/* Slot/risco da carteira - cartões encaixados com borda tracejada */}
            <View style={s.riscoContainer}>
              <View style={s.cardsStack}>
                {accounts.length === 0 ? (
                  <View style={s.cardSlotWrapper}>
                    <View style={s.cardSlotEmpty}>
                      <MaterialIcons name="credit-card" size={28} color="rgba(255,255,255,0.5)" />
                      <Text style={s.cardSlotEmptyText}>Adicione uma conta</Text>
                    </View>
                  </View>
                ) : (
                  [accounts[0], accounts[1]].map((acc, i) =>
                    acc ? (
                      <View key={acc.id} style={[s.cardSlotWrapper, i === 1 && s.cardSlotOffset]}>
                        <WalletCard account={acc} hideBalance={!balanceVisible} />
                      </View>
                    ) : (
                      <View key={`empty-${i}`} style={[s.cardSlotWrapper, i === 1 && s.cardSlotOffset]}>
                        <View style={s.cardSlotEmpty}>
                          <MaterialIcons name="credit-card" size={22} color="rgba(255,255,255,0.4)" />
                          <Text style={s.cardSlotEmptyText}>Vazio</Text>
                        </View>
                      </View>
                    )
                  )
                )}
              </View>
            </View>
            {/* Saldo total + olho */}
            <View style={s.balanceRow}>
              <View>
                <Text style={s.totalBalanceLabel}>Total Balance</Text>
                <Text style={s.totalBalanceValue}>
                  {balanceVisible ? (
                    <>
                      <Text style={s.balanceCurrency}>R$ </Text>
                      <Text style={s.balanceNumber}>
                        {totalBalance.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </Text>
                    </>
                  ) : (
                    "••••••"
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleBalance}
                hitSlop={12}
                style={s.eyeButton}
              >
                <MaterialIcons
                  name={balanceVisible ? "visibility" : "visibility-off"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <View style={s.walletSpacer} />
            {/* Botões Send / Request / Menu */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionBtn}>
                <MaterialIcons name="arrow-upward" size={20} color="#fff" />
                <Text style={s.actionBtnText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn}>
                <MaterialIcons name="arrow-downward" size={20} color="#fff" />
                <Text style={s.actionBtnText}>Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnSmall}>
                <MaterialIcons name="apps" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* ═══════════ SPENDINGS + SUBSCRIPTIONS ═══════════ */}
        <View style={s.widgetsRow}>
          <TouchableOpacity style={s.widgetCard}>
            <View style={s.widgetHeader}>
              <Text style={s.widgetTitle}>Gastos</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </View>
            <Text style={s.widgetSub}>
              Você gastou {formatCurrency(totalExpenses)} este mês
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.widgetCard}>
            <View style={s.widgetHeader}>
              <Text style={s.widgetTitle}>Assinaturas</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </View>
            <View style={s.subscriptionLogos}>
              {subscriptions.map((sub) => (
                <View
                  key={sub.id}
                  style={[s.subLogo, { backgroundColor: sub.color }]}
                  accessibilityLabel={sub.name}
                >
                  <Text style={s.subLogoText}>{sub.letter}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════ RECENT TRANSACTIONS ═══════════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Transações recentes</Text>
            <TouchableOpacity>
              <MaterialIcons name="tune" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={s.transactionList}>
            {recentTransactions.map((tx, index) => {
              const cat = CATEGORIES.find((c) => c.id === tx.categoryId);
              const merchant = getMerchantConfig(tx.description);
              const displayLabel = tx.description.split(/[-–]/)[0].trim() || tx.description;
              const iconConfig = merchant || {
                name: displayLabel,
                letter: displayLabel.slice(0, 2).toUpperCase() || "?",
                color: cat?.color || "#6B7280",
              };
              return (
                <View
                  key={tx.id}
                  style={[
                    s.transactionRow,
                    index < recentTransactions.length - 1 && s.transactionRowBorder,
                  ]}
                >
                  <View style={[s.txIcon, { backgroundColor: iconConfig.color }]}>
                    <Text style={s.txIconText}>{iconConfig.letter}</Text>
                  </View>
                  <View style={s.txContent}>
                    <Text style={s.txName} numberOfLines={1}>{displayLabel}</Text>
                    <Text style={s.txDate}>{formatTransactionDateTime(tx.date)}</Text>
                  </View>
                  <View style={s.txRight}>
                    <Text style={s.txAmount}>{formatCurrency(tx.amount)}</Text>
                    <Text style={s.txCard}>Debit Card</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerDate: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 2,
  },
  greeting: {
    color: AppColors.black,
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Carteira (imagem carteira.png – dark, bordas arredondadas, costura) ──
  walletOuter: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  walletImage: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 20,
    paddingTop: 24,
    paddingBottom: 22,
    aspectRatio: 1.6,
    minHeight: 260,
  },
  riscoContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderStyle: "dashed",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  cardsStack: {
    gap: 12,
    flexDirection: "column",
  },
  cardSlotWrapper: {
    height: 68,
  },
  cardSlotOffset: {
    marginTop: -4,
  },
  cardSlot: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    overflow: "hidden",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardBank: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  cardNumber: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  cardBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBalanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
  },
  cardBalanceValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardSlotEmpty: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardSlotEmptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 4,
  },
  walletImageStyle: {
    borderRadius: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalBalanceLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 4,
  },
  totalBalanceValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 2,
  },
  balanceNumber: {
    fontSize: 26,
    fontWeight: "700",
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletSpacer: { flex: 1, minHeight: 8 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.28)",
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtnSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  widgetsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  widgetTitle: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  widgetSub: {
    color: "#6B7280",
    fontSize: 12,
  },
  subscriptionLogos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  subLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  subLogoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  section: {
    marginHorizontal: 20,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.black,
    fontSize: 17,
    fontWeight: "600",
  },
  transactionList: {},
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txIconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  txContent: {
    flex: 1,
  },
  txName: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  txDate: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    color: AppColors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  txCard: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
});
