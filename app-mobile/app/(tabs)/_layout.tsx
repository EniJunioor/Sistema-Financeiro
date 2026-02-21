import { useEffect } from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { AnimatedTabIcon } from "@/components/animated-tab-icon";
import { HapticTab } from "@/components/haptic-tab";
import { AppColors } from "@/constants/colors";
import { useSettings } from "@/lib/store";

const springConfig = { damping: 15, stiffness: 150 };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function AnimatedProfileIcon({ focused, initials }: { focused: boolean; initials: string }) {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, springConfig);
    borderWidth.value = withSpring(focused ? 2 : 0, springConfig);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
    borderColor: AppColors.lime,
  }));

  return (
    <Animated.View style={[styles.profileCircle, animatedStyle]}>
      <View style={styles.profilePhoto}>
        <Text style={styles.profileInitials}>{initials}</Text>
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.lime,
        tabBarInactiveTintColor: AppColors.gray400,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: AppColors.white,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="house.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Cards",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="creditcard.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Investimentos",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="chart.line.uptrend.xyaxis" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="bubble.left.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <AnimatedProfileIcon focused={focused} initials={getInitials(settings.userName || "Usuário")} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: AppColors.gray400,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileInitials: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
