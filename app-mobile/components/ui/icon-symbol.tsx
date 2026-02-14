// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Tab icons
  "house.fill": "home",
  "arrow.left.arrow.right": "swap-horiz",
  "creditcard.fill": "account-balance-wallet",
  "chart.line.uptrend.xyaxis": "trending-up",
  "person.fill": "person",
  "chart.bar.fill": "bar-chart",
  // General icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "plus": "add",
  "xmark": "close",
  "magnifyingglass": "search",
  "trash.fill": "delete",
  "pencil": "edit",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  // Category icons
  "cart.fill": "shopping-cart",
  "fork.knife": "restaurant",
  "car.fill": "directions-car",
  "heart.fill": "favorite",
  "graduationcap.fill": "school",
  "gamecontroller.fill": "sports-esports",
  "banknote.fill": "payments",
  "building.2.fill": "business",
  "star.fill": "star",
  "tag.fill": "local-offer",
  "bubble.left.fill": "chat-bubble",
  "clock.fill": "history",
  "arrow.clockwise": "refresh",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
