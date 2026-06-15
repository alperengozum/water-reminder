Generate Play Store release notes for the current version.

---

## 1. Gather context

Run in parallel:

```bash
git log --oneline $(git log --oneline | grep -m1 "versionCode\|version bump\|bump version\|1\." | awk '{print $1}')..HEAD 2>/dev/null || git log --oneline -20
```

```bash
cat app.json | python3 -c "import json,sys; d=json.load(sys.stdin); a=d['expo']; print(a['version'], a['android']['versionCode'])"
```

---

## 2. Identify what changed

Determine the previous release tag/commit by finding the commit that bumped `versionCode`. Everything after that is this release.

Group commits into user-facing bullets:
- `feat:` → feature bullet
- `fix:` / `perf:` / user-visible `refactor:` → improvement bullet
- Skip: CI, `chore:`, version bumps, CLAUDE.md, internal-only refactors

Translate each into plain language. No file names, no function names, no jargon.

**Good:** `Streak widget — see your daily streak from the home screen.`
**Bad:** `streakWidgetComponent added to AndroidWidgetProvider.`

---

## 3. Format

Single block per locale with bullet points. Keep each block **under 500 characters** (Play Store limit).

```
<LOCALE>
What's new in X.Y.Z:

• New: [feature]
• New: [feature]
• [improvement or fix]
• Bug fixes and performance improvements
</LOCALE>
```

- Lead with "New:" for brand-new features
- Omit "New:" for fixes/improvements
- Always end with "Bug fixes and performance improvements" if there were any fixes
- Use natural phrasing per language — do not translate word-for-word from English

---

## 4. Locales

Output all 18 in this order:

`en-US` `tr-TR` `de-DE` `fr-FR` `es-ES` `it-IT` `pt-BR` `ru-RU` `ja-JP` `ko-KR` `ar` `hi-IN` `zh-CN` `zh-TW` `nl-NL` `pl-PL` `id` `vi`

RTL locales (`ar`): use right-to-left natural phrasing. For `zh-CN` / `zh-TW` use simplified / traditional characters respectively.

---

## 5. Output

Print version header, then all 18 locale blocks, ready to paste into Play Console.

```
<!-- Version X.Y.Z (versionCode N) -->

<en-US>
What's new in X.Y.Z:

• New: ...
• Bug fixes and performance improvements
</en-US>

<tr-TR>
X.Y.Z sürümündeki yenilikler:

• Yeni: ...
• Hata düzeltmeleri ve performans iyileştirmeleri
</tr-TR>

...
```

No commentary outside the header and locale blocks.
