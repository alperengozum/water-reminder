# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Start dev server (choose a target)
npx expo start          # interactive — scan QR for device/simulator
npx expo start --web    # web preview at http://localhost:8081
npx expo run:android    # build & launch on connected Android device/emulator
npx expo run:ios        # build & launch on iOS simulator (macOS only)

# Production build (Android, local)
npm run eas:build:android:local   # outputs ./dist/water-reminder.aab

# Deploy web
npm run deploy          # expo export -p web + eas deploy
```

There is no test suite and no lint script configured.

## Path alias

`@/` is aliased to the project root via `babel-plugin-module-resolver`. Use `@/components/...`, `@/lib/...`, `@/store/...` for all imports — never use relative paths that cross directory boundaries.

## Architecture

### State — `store/use-water-store.ts`

Single Zustand store persisted to `AsyncStorage` under the key `water-reminder-storage`. All water-logging logic lives here:

- `logs: WaterLog[]` — append-only (prepend on add, filter on remove), stored as ISO timestamp strings.
- `goalMl` / `glassMl` — user-configurable; `setGlassMl` recalculates `goalMl` proportionally so the number of goal glasses stays constant.
- `waitForWaterStoreHydration()` — must be awaited before reading store state outside of React (e.g. in `app/widget.tsx` and `lib/widget.ts`).

### Routing — `app/` (Expo Router file-system routes)

```
app/
  _layout.tsx          # root Stack; Android widget-sync bootstrap on mount
  index.tsx            # re-exports (home)/index — root URL is the home screen
  (home)/
    _layout.tsx        # Stack with two screens: index + settings
    index.tsx          # main dashboard (today's progress, weekly chart, quick-add)
    settings.tsx       # goal/glass steppers, Android persistent notification toggle, log list
  widget.tsx           # deep-link handler for Android home-screen widget actions
```

### Android widget bridge — `lib/widget.ts`

Bridges the JS store to a native Android module (`NativeModules.WaterWidget`). The native module exposes:

- `syncWidget(payload)` — full sync (today ml, goal, glass size, weekly pace + day totals, dayKey)
- `consumePendingWidgetAdds()` — drains taps recorded by the widget while the app was closed; returns JSON `[{amountMl}]`
- `setPersistentNotificationEnabled(bool)` — controls the always-on status-bar notification

`flushWidgetPendingAdds()` is called on app foreground (root layout + home screen) to apply any widget taps that happened offline. It serializes via a promise chain (`flushChain`) to prevent double-flush races.

`process.env.EXPO_OS` (not `Platform.OS`) is used inside `lib/widget.ts` for tree-shaking in the web/iOS builds.

### Components — `components/`

Presentational only; all state comes from `useWaterStore` or props. Key ones:

- `ProgressWidget` — progress bar + quick-add buttons (glass size tap or +100 ml tap)
- `WeeklyChart` — 7-day bar chart via `react-native-gifted-charts`
- `PulseOnChange` — animates its children whenever a watched value changes
- `MetricCard`, `SectionCard`, `Stepper`, `LogList` — layout / display primitives

### Styling

No style library. All styles are inline `StyleSheet`-style objects or direct `style` props. Colors are hardcoded hex literals; the palette switches between "cool" (blues/cyans, normal state) and "warm" (ambers/yellows, goal-reached state) based on `isComplete` in the home screen.
