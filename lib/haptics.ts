import * as Haptics from "expo-haptics";

const swallow = () => undefined;

export function impactLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow);
}

export function impactMedium(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(swallow);
}

export function notifySuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(swallow);
}
