import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/lib/i18n";

type OnboardingTooltipProps = {
  onDismiss: () => void;
};

export function OnboardingTooltip({ onDismiss }: OnboardingTooltipProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onDismiss}
      style={{
        position: "absolute",
        inset: 0,
        justifyContent: "flex-end",
        alignItems: "flex-end",
      }}
      accessibilityLabel={t.onboardingDismiss}
    >
      {/* Arrow pointing down-right toward the settings gear */}
      <View
        style={{
          marginRight: 12,
          marginBottom: 70,
          maxWidth: 220,
          backgroundColor: "#0F172A",
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 14,
          gap: 8,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="settings-outline" size={16} color="#67E8F9" />
          <Text selectable style={{ fontSize: 13, fontWeight: "700", color: "#F8FAFC" }}>
            {t.onboardingTitle}
          </Text>
        </View>
        <Text selectable style={{ fontSize: 12, color: "#94A3B8", lineHeight: 18 }}>
          {t.onboardingBody}
        </Text>
        <Text selectable style={{ fontSize: 11, fontWeight: "600", color: "#67E8F9" }}>
          {t.onboardingDismiss}
        </Text>
      </View>
    </Pressable>
  );
}
