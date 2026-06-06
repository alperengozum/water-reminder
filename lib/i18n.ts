import { useWaterStore } from "@/store/use-water-store";

export type Language = "en" | "tr";

export interface Translations {
  // Screen titles
  screenWater: string;
  screenSettings: string;
  screenHistory: string;

  // Home - hero
  today: string;
  hydrationCheckIn: string;

  // Home - summary messages
  summaryMorningStreak: (day: number) => string;
  summaryMorningStart: string;
  summaryCalmSip: string;
  summaryBehindMany: (behind: number, suffix: string) => string;
  summaryBehind1: (suffix: string) => string;
  summaryAhead: string;
  summaryLastChance: string;
  summary1Glass: string;
  summaryGlasses: (n: number) => string;
  hLeftToday: (hours: number) => string;
  drinkUp: string;
  nearlyThere: string;

  // Home - tag line
  soFarGoal: (consumed: string, goal: string) => string;

  // Home - metric cards
  soFarLabel: string;
  leftTodayLabel: string;
  goalReachedSubtitle: string;
  glassesToGoSubtitle: (n: number) => string;
  doneLabel: string;

  // Home - sprint / pacing banners
  sprintTime: string;
  sprintBehindLine: (behind: number, hours: number) => string;
  logGlass: string;
  logGlassToCatchUp: string;
  glassesBehindCount: (n: number) => string;
  hLeftLabel: (h: number) => string;
  catchUpLabel: (interval: string) => string;

  // Home - section / undo
  dailyFlow: string;
  addedAmount: (amount: string) => string;

  // Settings
  dailyGoal: string;
  goalGlasses: (n: number) => string;
  quickAdd: string;
  customAmounts: string;
  glassSize: string;
  preset: (n: number) => string;
  addPreset: string;
  reminders: string;
  drinkReminders: string;
  reminderDesc: string;
  on: string;
  notifBlocked: string;
  notifBlockedTitle: string;
  notifBlockedBodyReminders: string;
  notifBlockedBodyStreak: string;
  notNow: string;
  openSettings: string;
  every: string;
  reminderHours: (n: number) => string;
  from: string;
  until: string;
  streakSection: string;
  streakAtRiskAlert: string;
  streakAlertDesc: string;
  statusBar: string;
  persistentNotif: string;
  persistentNotifDesc: string;
  language: string;
  langEnglish: string;
  langTurkish: string;

  // History
  months: string[];
  dayHeaders: string[];
  legendNone: string;
  legendPartial: string;
  legendGoal: string;
  bestStreak: string;
  daysEver: string;
  avgLabel: string;
  mlPerDay: string;
  goalDays: string;
  ofLast30: string;
  bestDay: string;
  mlEver: string;
  trendTitle: string;
  trendDesc: (goal: string) => string;
  noDataYet: string;
  recentLogs: string;
  todayLabel: string;
  yesterdayLabel: string;
  goalChartLabel: string;
  chartAmberHint: string;
  thisWeek: string;

  // Streak card
  streakLabel: string;
  streakDay: string;
  streakDays: string;
  streakMsg0: string;
  streakMsg1: string;
  streakMsgWeek: (n: number) => string;
  streakMsgMonth: string;
  streakMsgLong: string;
  streakGlassesLeft: (n: number) => string;
  streakMilestoneNext: (n: number) => string;
  streakMilestoneReached: (n: number) => string;

  // Log list
  noLogs: string;
  quickLabel: string;
  glassLogLabel: string;
  removeLabel: string;

  // Undo toast
  undo: string;

  // Onboarding
  onboardingTitle: string;
  onboardingBody: string;
  onboardingDismiss: string;
  removedAmount: (amount: string) => string;

  // Progress widget
  progressLabel: string;
  glassesUnit: (n: string) => string;
  goalReachedTitle: string;
  goalReachedDesc: string;
  ofLabel: (consumed: string, goal: string) => string;

  // Quick add row
  addGlassLabel: (label: string) => string;

  // Notifications
  notifHydrationTitle: string;
  notifHydrationBody: string;
  notifHydrationBodyContextual: (remaining: number) => string;
  notifStreakTitle: (streak: number) => string;
  notifStreakBody: (glasses: number) => string;
  notifChannelName: string;
}

const en: Translations = {
  screenWater: "Water",
  screenSettings: "Settings",
  screenHistory: "History",

  today: "Today",
  hydrationCheckIn: "Hydration check-in",

  summaryMorningStreak: (day) => `Good morning — day ${day} starts now.`,
  summaryMorningStart: "Good morning — start your day with a glass.",
  summaryCalmSip: "Let's start with a calm sip.",
  summaryBehindMany: (behind, suffix) => `${behind} glasses behind — ${suffix}.`,
  summaryBehind1: (suffix) => `1 glass behind — ${suffix}.`,
  summaryAhead: "Ahead of schedule. Keep it up.",
  summaryLastChance: "Last chance to hit your goal tonight.",
  summary1Glass: "1 glass in. On pace.",
  summaryGlasses: (n) => `${n} glasses in the tank.`,
  hLeftToday: (hours) => `${hours}h left today`,
  drinkUp: "drink up",
  nearlyThere: "nearly there",

  soFarGoal: (consumed, goal) => `${consumed} so far · Goal ${goal}`,

  soFarLabel: "So far",
  leftTodayLabel: "Left today",
  goalReachedSubtitle: "goal reached",
  glassesToGoSubtitle: (n) => (n === 1 ? "glass to go" : "glasses to go"),
  doneLabel: "Done!",

  sprintTime: "Sprint time",
  sprintBehindLine: (behind, hours) => `${behind} glasses behind · ${hours}h left — drink up`,
  logGlass: "Log glass",
  logGlassToCatchUp: "Log a glass to catch up",
  glassesBehindCount: (n) => (n === 1 ? "1 glass behind" : `${n} glasses behind`),
  hLeftLabel: (h) => ` · ${h}h left`,
  catchUpLabel: (interval) => `Aim for 1 glass every ${interval} to catch up`,

  dailyFlow: "Daily flow",
  addedAmount: (amount) => `Added ${amount}`,

  dailyGoal: "Daily goal",
  goalGlasses: (n) => `${n} glass${n === 1 ? "" : "es"}`,
  quickAdd: "Quick add",
  customAmounts: "Custom amounts",
  glassSize: "Glass size",
  preset: (n) => `Preset ${n}`,
  addPreset: "Add preset",
  reminders: "Reminders",
  drinkReminders: "Drink reminders",
  reminderDesc: "Get a nudge at set intervals so you don't forget to drink.",
  on: "On",
  notifBlocked: "Notifications are blocked — tap to open Settings",
  notifBlockedTitle: "Notifications blocked",
  notifBlockedBodyReminders:
    "Enable notifications for Water Reminder in your device settings to receive reminders.",
  notifBlockedBodyStreak:
    "Enable notifications for Water Reminder in your device settings to receive the streak alert.",
  notNow: "Not now",
  openSettings: "Open Settings",
  every: "Every",
  reminderHours: (n) => `${n} ${n === 1 ? "hour" : "hours"}`,
  from: "From",
  until: "Until",
  streakSection: "Streak",
  streakAtRiskAlert: "Streak at risk alert",
  streakAlertDesc:
    "Get a notification 1 hour before your window ends when you have an active streak and haven't hit your goal.",
  statusBar: "Status bar",
  persistentNotif: "Persistent notification",
  persistentNotifDesc:
    "Always-on summary in the shade; tap actions to add your glass size or +100 ml (same as the home screen widget).",
  language: "Language",
  langEnglish: "English",
  langTurkish: "Türkçe",

  months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  dayHeaders: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  legendNone: "None",
  legendPartial: "Partial",
  legendGoal: "Goal",
  bestStreak: "Best streak",
  daysEver: "days ever",
  avgLabel: "30-day avg",
  mlPerDay: "ml per day",
  goalDays: "Goal days",
  ofLast30: "of last 30",
  bestDay: "Best day",
  mlEver: "ml ever",
  trendTitle: "30-day trend",
  trendDesc: (goal) => `Amber = goal hit · dashed line = ${goal} target`,
  noDataYet: "No data yet — start logging!",
  recentLogs: "Recent logs",
  todayLabel: "Today",
  yesterdayLabel: "Yesterday",
  goalChartLabel: "Goal",
  chartAmberHint: "amber = goal hit",
  thisWeek: "This week",

  streakLabel: "Streak",
  streakDay: "day",
  streakDays: "days",
  streakMsg0: "Hit your goal today to start a streak.",
  streakMsg1: "Great start — come back tomorrow.",
  streakMsgWeek: (n) => `${n} days strong. Keep going.`,
  streakMsgMonth: "Serious consistency. Don't break it.",
  streakMsgLong: "You're unstoppable.",
  streakGlassesLeft: (n) => n === 1 ? "1 glass left to extend it." : `${n} glasses left to extend it.`,
  streakMilestoneNext: (n) => `Next milestone: ${n} days`,
  streakMilestoneReached: (n) => `${n}+ days — you're unstoppable`,

  noLogs: "No logs yet. Add your first glass.",
  quickLabel: "Quick",
  glassLogLabel: "Glass",
  removeLabel: "Remove",

  undo: "Undo",
  removedAmount: (amount) => `Removed ${amount}`,

  onboardingTitle: "Set your goal & reminders",
  onboardingBody: "Tap the gear icon to choose your daily target and turn on drink reminders.",
  onboardingDismiss: "Got it",

  progressLabel: "Progress",
  glassesUnit: (n) => `${n} glasses`,
  goalReachedTitle: "Goal reached",
  goalReachedDesc: "You hit today's target. Celebrate the streak.",
  ofLabel: (consumed, goal) => `${consumed} of ${goal}`,

  addGlassLabel: (label) => `Add a glass (${label})`,

  notifHydrationTitle: "Time to hydrate 💧",
  notifHydrationBody: "Drink a glass of water to stay on track.",
  notifHydrationBodyContextual: (n) => n === 1 ? "1 glass left today — you've got this." : `${n} glasses left today. Keep going.`,
  notifStreakTitle: (streak) => `${streak}-day streak at risk 🔥`,
  notifStreakBody: (glasses) =>
    `${glasses} glass${glasses === 1 ? "" : "es"} left to protect it.`,
  notifChannelName: "Water Reminders",
};

const tr: Translations = {
  screenWater: "Su",
  screenSettings: "Ayarlar",
  screenHistory: "Geçmiş",

  today: "Bugün",
  hydrationCheckIn: "Hidrasyon takibi",

  summaryMorningStreak: (day) => `Günaydın — ${day}. gün başlıyor.`,
  summaryMorningStart: "Günaydın — güne bir bardak suyla başla.",
  summaryCalmSip: "Sakin bir yudumla başlayalım.",
  summaryBehindMany: (behind, suffix) => `${behind} bardak geride — ${suffix}.`,
  summaryBehind1: (suffix) => `1 bardak geride — ${suffix}.`,
  summaryAhead: "Programın önündesin. Böyle devam.",
  summaryLastChance: "Bu gece hedefe ulaşmak için son şans.",
  summary1Glass: "1 bardak içildi. Yolundasın.",
  summaryGlasses: (n) => `${n} bardak tamamlandı.`,
  hLeftToday: (hours) => `bugün ${hours}s kaldı`,
  drinkUp: "iç",
  nearlyThere: "neredeyse tamam",

  soFarGoal: (consumed, goal) => `${consumed} şimdiye kadar · Hedef ${goal}`,

  soFarLabel: "Şimdiye kadar",
  leftTodayLabel: "Bugün kalan",
  goalReachedSubtitle: "hedefe ulaşıldı",
  glassesToGoSubtitle: (_n) => "bardak kaldı",
  doneLabel: "Bitti!",

  sprintTime: "Sprint zamanı",
  sprintBehindLine: (behind, hours) => `${behind} bardak geride · ${hours}s kaldı — iç`,
  logGlass: "Bardak kaydet",
  logGlassToCatchUp: "Yetişmek için bardak kaydet",
  glassesBehindCount: (n) => `${n} bardak geride`,
  hLeftLabel: (h) => ` · ${h}s kaldı`,
  catchUpLabel: (interval) => `Yetişmek için ${interval} arayla 1 bardak iç`,

  dailyFlow: "Günlük akış",
  addedAmount: (amount) => `${amount} eklendi`,

  dailyGoal: "Günlük hedef",
  goalGlasses: (n) => `${n} bardak`,
  quickAdd: "Hızlı ekle",
  customAmounts: "Özel miktarlar",
  glassSize: "Bardak boyutu",
  preset: (n) => `Ayar ${n}`,
  addPreset: "Ayar ekle",
  reminders: "Hatırlatıcılar",
  drinkReminders: "Su hatırlatıcıları",
  reminderDesc: "İçmeyi unutmamak için belirli aralıklarla uyarı alın.",
  on: "Açık",
  notifBlocked: "Bildirimler engellendi — açmak için dokun",
  notifBlockedTitle: "Bildirimler engellendi",
  notifBlockedBodyReminders:
    "Hatırlatıcı almak için cihaz ayarlarından Su Hatırlatıcısı bildirimlerini etkinleştir.",
  notifBlockedBodyStreak:
    "Seri uyarısı almak için cihaz ayarlarından Su Hatırlatıcısı bildirimlerini etkinleştir.",
  notNow: "Şimdi değil",
  openSettings: "Ayarları aç",
  every: "Her",
  reminderHours: (n) => `${n} saat`,
  from: "Başlangıç",
  until: "Bitiş",
  streakSection: "Seri",
  streakAtRiskAlert: "Seri tehlikede uyarısı",
  streakAlertDesc:
    "Aktif serin varsa ve hedefe ulaşmamışsan, pencerenin kapanmasına 1 saat kala bildirim alırsın.",
  statusBar: "Durum çubuğu",
  persistentNotif: "Kalıcı bildirim",
  persistentNotifDesc:
    "Bildirim çubuğunda her zaman görünen özet; bardak boyutu veya +100 ml eklemek için dokun (ana ekran widget'ı ile aynı).",
  language: "Dil",
  langEnglish: "English",
  langTurkish: "Türkçe",

  months: [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ],
  dayHeaders: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  legendNone: "Yok",
  legendPartial: "Kısmi",
  legendGoal: "Hedef",
  bestStreak: "En iyi seri",
  daysEver: "gün (rekor)",
  avgLabel: "30 gün ort.",
  mlPerDay: "ml/gün",
  goalDays: "Hedef günler",
  ofLast30: "son 30 günden",
  bestDay: "En iyi gün",
  mlEver: "ml (rekor)",
  trendTitle: "30 günlük trend",
  trendDesc: (goal) => `Amber = hedefe ulaşıldı · kesik çizgi = ${goal} hedefi`,
  noDataYet: "Henüz veri yok — kaydetmeye başla!",
  recentLogs: "Son kayıtlar",
  todayLabel: "Bugün",
  yesterdayLabel: "Dün",
  goalChartLabel: "Hedef",
  chartAmberHint: "sarı = hedef tamam",
  thisWeek: "Bu hafta",

  streakLabel: "Seri",
  streakDay: "gün",
  streakDays: "gün",
  streakMsg0: "Bugün hedefe ulaş ve seri başlat.",
  streakMsg1: "Harika başlangıç — yarın geri gel.",
  streakMsgWeek: (n) => `${n} gündür sürüyor. Devam et.`,
  streakMsgMonth: "Ciddi bir alışkanlık. Bozma.",
  streakMsgLong: "Durdurulamazsın.",
  streakGlassesLeft: (n) => n === 1 ? "Seriyi uzatmak için 1 bardak kaldı." : `Seriyi uzatmak için ${n} bardak kaldı.`,
  streakMilestoneNext: (n) => `Sonraki hedef: ${n} gün`,
  streakMilestoneReached: (n) => `${n}+ gün — kimse durduramaz seni`,

  noLogs: "Henüz kayıt yok. İlk bardağını ekle.",
  quickLabel: "Hızlı",
  glassLogLabel: "Bardak",
  removeLabel: "Kaldır",

  undo: "Geri al",
  removedAmount: (amount) => `${amount} kaldırıldı`,

  onboardingTitle: "Hedef ve hatırlatıcı kur",
  onboardingBody: "Günlük hedefini seçmek ve su hatırlatıcılarını açmak için dişli simgesine dokun.",
  onboardingDismiss: "Anladım",

  progressLabel: "İlerleme",
  glassesUnit: (n) => `${n} bardak`,
  goalReachedTitle: "Hedefe ulaşıldı",
  goalReachedDesc: "Günlük hedefe ulaştın. Hak ettin.",
  ofLabel: (consumed, goal) => `${consumed} / ${goal}`,

  addGlassLabel: (label) => `Bardak ekle (${label})`,

  notifHydrationTitle: "Hidrasyon zamanı 💧",
  notifHydrationBody: "Hedefinde kalmak için bir bardak su iç.",
  notifHydrationBodyContextual: (n) => n === 1 ? "Bugün 1 bardak kaldı — başarabilirsin." : `Bugün ${n} bardak kaldı. Devam et.`,
  notifStreakTitle: (streak) => `${streak} günlük seri tehlikede 🔥`,
  notifStreakBody: (glasses) => `Korumak için ${glasses} bardak kaldı.`,
  notifChannelName: "Su Hatırlatıcıları",
};

export const translations: Record<Language, Translations> = { en, tr };

export function getT(language: Language): Translations {
  return translations[language];
}

export function useTranslation(): { t: Translations; language: Language } {
  const language = useWaterStore((state) => state.language);
  return { t: translations[language], language };
}
