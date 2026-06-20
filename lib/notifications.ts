import * as Notifications from "expo-notifications";
import { getT } from "@/lib/i18n";
import { useWaterStore } from "@/store/use-water-store";

if (process.env.EXPO_OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function checkNotificationsPermission(): Promise<boolean> {
  if (process.env.EXPO_OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function requestNotificationsPermission(): Promise<boolean> {
  if (process.env.EXPO_OS === "web") return false;
  const t = getT(useWaterStore.getState().language);
  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync("water-reminders", {
      name: t.notifChannelName,
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
 *
 * When streakAlert is provided and the streak is live, a single notification is scheduled
 * 1 hour before endHour today — "your streak is at risk" — if that time is still in the future.
 */
export async function scheduleWaterReminders(
  intervalHours: number,
  startHour: number,
  endHour: number,
  lastDrinkAt?: Date,
  streakAlert?: { streak: number; remainingGlasses: number },
): Promise<void> {
  if (process.env.EXPO_OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const t = getT(useWaterStore.getState().language);

  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    let firstHour: number;
    let firstMinute: number;

    if (dayOffset === 0 && lastDrinkAt) {
      const next = new Date(lastDrinkAt.getTime() + intervalHours * 60 * 60 * 1000);
      if (!isSameCalendarDay(next, now)) {
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
        // For today, bake remaining-glasses context into the body so it varies per slot
        const remaining = dayOffset === 0 && streakAlert ? streakAlert.remainingGlasses : undefined;
        const body = remaining !== undefined && remaining > 0
          ? t.notifHydrationBodyContextual(remaining)
          : t.notifHydrationBody;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t.notifHydrationTitle,
            body,
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

  if (streakAlert) {
    await _doScheduleStreakAlert(streakAlert.streak, streakAlert.remainingGlasses, endHour, startHour, now);
  }
}

const STREAK_ALERT_ID = "water-streak-at-risk";

async function _doScheduleStreakAlert(
  streak: number,
  remainingGlasses: number,
  endHour: number,
  startHour: number,
  now: Date,
): Promise<void> {
  const alertHour = endHour - 1;
  if (streak <= 0 || remainingGlasses <= 0 || alertHour <= startHour) return;
  const alertDate = new Date(now);
  alertDate.setHours(alertHour, 0, 0, 0);
  if (alertDate.getTime() <= now.getTime()) return;
  const t = getT(useWaterStore.getState().language);
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_ALERT_ID,
    content: {
      title: t.notifStreakTitle(streak),
      body: t.notifStreakBody(remainingGlasses),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: alertDate,
      channelId: "water-reminders",
    },
  });
}

export async function scheduleStreakAtRiskAlert(
  streak: number,
  remainingGlasses: number,
  endHour: number,
  startHour: number,
): Promise<void> {
  if (process.env.EXPO_OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID);
  await _doScheduleStreakAlert(streak, remainingGlasses, endHour, startHour, new Date());
}

export async function cancelStreakAtRiskAlert(): Promise<void> {
  if (process.env.EXPO_OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID);
}

export async function cancelWaterReminders(): Promise<void> {
  if (process.env.EXPO_OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
