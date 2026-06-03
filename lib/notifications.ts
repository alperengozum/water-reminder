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

// iOS allows at most 64 scheduled notifications. With a 1-hour interval over a
// 14-hour window, 4 days × 14 slots = 56 — safely under the limit.
const SCHEDULE_DAYS = 4;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Schedule water reminders as one-shot DATE triggers for the next SCHEDULE_DAYS days.
 *
 * When lastDrinkAt is provided, today's first reminder fires at lastDrinkAt + intervalHours
 * instead of the fixed startHour — so drinking early pushes the next nudge out rather than
 * firing on a rigid clock.  Future days always start at startHour.
 */
export async function scheduleWaterReminders(
  intervalHours: number,
  startHour: number,
  endHour: number,
  lastDrinkAt?: Date,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    let firstHour: number;
    let firstMinute: number;

    if (dayOffset === 0 && lastDrinkAt) {
      const next = new Date(lastDrinkAt.getTime() + intervalHours * 60 * 60 * 1000);
      if (!isSameCalendarDay(next, now)) {
        // Next slot crosses midnight — nothing left to schedule today
        firstHour = endHour;
        firstMinute = 0;
      } else {
        firstHour = next.getHours();
        firstMinute = next.getMinutes();
        if (firstHour < startHour) {
          firstHour = startHour;
          firstMinute = 0;
        }
      }
    } else if (dayOffset === 0) {
      if (now.getHours() < startHour) {
        firstHour = startHour;
        firstMinute = 0;
      } else {
        const next = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
        if (!isSameCalendarDay(next, now)) {
          firstHour = endHour;
          firstMinute = 0;
        } else {
          firstHour = next.getHours();
          firstMinute = next.getMinutes();
        }
      }
    } else {
      firstHour = startHour;
      firstMinute = 0;
    }

    let totalMinutes = firstHour * 60 + firstMinute;
    const endMinutes = endHour * 60;

    while (totalMinutes < endMinutes) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      const fireDate = new Date(dayStart);
      fireDate.setHours(h, m, 0, 0);

      if (fireDate.getTime() > now.getTime()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to hydrate 💧",
            body: "Drink a glass of water to stay on track.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: "water-reminders",
          },
        });
      }

      totalMinutes += intervalHours * 60;
    }
  }
}

export async function cancelWaterReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
