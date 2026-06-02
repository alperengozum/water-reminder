import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function checkNotificationsPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function requestNotificationsPermission(): Promise<boolean> {
  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync("water-reminders", {
      name: "Water Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleWaterReminders(
  intervalHours: number,
  startHour: number,
  endHour: number,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (let hour = startHour; hour < endHour; hour += intervalHours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to hydrate 💧",
        body: "Drink a glass of water to stay on track.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: "water-reminders",
        hour,
        minute: 0,
      },
    });
  }
}

export async function cancelWaterReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
