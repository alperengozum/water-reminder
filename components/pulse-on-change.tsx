import React from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

type PulseOnChangeProps = {
  watch: string | number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PulseOnChange({ watch, children, style }: PulseOnChangeProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [watch, scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
  );
}
