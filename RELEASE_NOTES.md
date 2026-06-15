# Release Notes

## 1.1.0 — 2026-06-15 (versionCode 6)

### New Features

- **Onboarding wizard** — first-launch flow guides new users through goal setup and language selection
- **Auto language detection** — app language defaults to device locale on first launch; 17 languages supported
- **Localization** — Turkish, Arabic, Bengali, Chinese, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese, Russian, Spanish, Thai, Vietnamese
- **Water Streak widget** — new Android home-screen widget showing current streak as a compact horizontal strip
- **Streak-at-risk alert** — banner warns when today's streak is in danger of breaking
- **Real-time widget events** — widget updates immediately on log actions without waiting for a sync cycle
- **Preset quick-add from notification** — tap a preset directly from the persistent notification action
- **Time-of-day context** — home screen summary message adapts to morning / afternoon / evening
- **Animated progress bar** — progress fill animates smoothly on each water log
- **Streak row in widget** — streak count displayed inside the main Android widget
- **Midnight widget refresh** — widget and app icon reset automatically at local midnight via alarm
- **Drink-aware reminders** — reminder schedule adjusts based on how much you've already drunk

### Improvements

- Home screen is now scrollable
- Widget UI compacted for better at-a-glance readability
- Performance: daily total calculations now O(1) via cached totals (was O(n) log scan)

### Bug Fixes

- Persistent notification restored correctly when dismissed by the user
- Widget pending adds flushed reliably on app foreground; race condition fixed
- Log ID collision in streak widget resolved

---

## 1.0.2 — versionCode 4

- Android widget with preset quick-add buttons
- Version baseline before 1.1.0 feature work
