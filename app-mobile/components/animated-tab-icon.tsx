import { useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const springConfig = {
  damping: 15,
  stiffness: 150,
};

const TAB_ICON_MAP: Record<string, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  "house.fill": "home",
  "creditcard.fill": "account-balance-wallet",
  "chart.line.uptrend.xyaxis": "trending-up",
  "bubble.left.fill": "chat-bubble",
};

export function AnimatedTabIcon({
  name,
  focused,
  color,
  size = 26,
}: {
  name: keyof typeof TAB_ICON_MAP;
  focused: boolean;
  color: string;
  size?: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, springConfig);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = TAB_ICON_MAP[name] || "help-outline";

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}
