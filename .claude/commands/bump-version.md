Bump the app version across all version files in this Expo/Android project.

Usage: /bump-version [major|minor|patch|feature|fix|breaking]

If no argument provided, analyze recent git commits to decide bump type automatically.

---

## 1. Determine bump type

If `$ARGUMENTS` is provided:
- `major` or `breaking` → **major** (X.0.0)
- `minor` or `feature` → **minor** (1.X.0)
- `patch` or `fix` → **patch** (1.1.X)

If no argument, run:

```bash
git log --oneline $(git log --oneline | grep -m1 "versionCode\|bump.version\|bump-version" | awk '{print $1}')..HEAD 2>/dev/null || git log --oneline -15
```

Decide bump type from commits:
- Any `feat:` commit → **minor**
- Only `fix:` / `perf:` / `chore:` → **patch**
- Any `BREAKING CHANGE` or `!:` → **major**
- If ambiguous, default to **patch**

State which bump type was chosen and why.

---

## 2. Read current versions

Run in parallel:

```bash
cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['version'])"
```

```bash
cat app.json | python3 -c "import json,sys; d=json.load(sys.stdin); a=d['expo']; print(a['version'], a['android']['versionCode'])"
```

```bash
grep -E 'versionCode|versionName' android/app/build.gradle
```

---

## 3. Calculate new versions

From current semver (e.g. `1.2.3`) and versionCode (e.g. `7`):

- **major**: `2.0.0`, versionCode + 1
- **minor**: `1.3.0`, versionCode + 1
- **patch**: `1.2.4`, versionCode + 1

versionCode always increments by 1 regardless of bump type.

---

## 4. Update all version files

Update **package.json** — `version` field.

Update **app.json** — `expo.version` and `expo.android.versionCode`.

Update **android/app/build.gradle** — `versionCode` and `versionName` in `defaultConfig`.

Edit all three files with the new values.

---

## 5. Confirm

Print a summary table:

```
Bumped: [old] → [new] (versionCode [old] → [new])

  package.json          version: [new]
  app.json              version: [new], versionCode: [new]
  android/app/build.gradle  versionCode: [new], versionName: "[new]"
```

Do NOT commit. Let the user commit.
