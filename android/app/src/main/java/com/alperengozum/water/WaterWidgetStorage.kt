package com.alperengozum.water

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object WaterWidgetStorage {
  private const val PREFS_NAME = "water_widget_prefs"
  private const val KEY_TODAY_ML = "today_ml"
  private const val KEY_GOAL_ML = "goal_ml"
  private const val KEY_GLASS_ML = "glass_ml"
  private const val KEY_WEEKLY_PACE_ML = "weekly_pace_ml"
  private const val KEY_DAY_TOTALS_JSON = "day_totals_json"
  private const val KEY_PENDING_LOGS = "pending_logs_json"
  private const val KEY_PERSISTENT_NOTIFICATION = "persistent_notification_enabled"

  fun write(
    context: Context,
    todayMl: Float,
    goalMl: Float,
    glassMl: Float,
    weeklyPaceMl: Float,
    dayTotalsJson: String? = null,
  ) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
      putFloat(KEY_TODAY_ML, todayMl)
      putFloat(KEY_GOAL_ML, goalMl)
      putFloat(KEY_GLASS_ML, glassMl)
      putFloat(KEY_WEEKLY_PACE_ML, weeklyPaceMl.coerceAtLeast(0f))
      if (dayTotalsJson != null) {
        putString(KEY_DAY_TOTALS_JSON, dayTotalsJson)
      }
      apply()
    }
  }

  fun read(context: Context): WidgetSnapshot {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return WidgetSnapshot(
      todayMl = prefs.getFloat(KEY_TODAY_ML, 0f).coerceAtLeast(0f),
      goalMl = prefs.getFloat(KEY_GOAL_ML, 2000f).coerceAtLeast(0f),
      glassMl = prefs.getFloat(KEY_GLASS_ML, 250f).coerceAtLeast(1f),
      weeklyPaceMl = prefs.getFloat(KEY_WEEKLY_PACE_ML, 0f).coerceAtLeast(0f),
    )
  }

  fun appendPending(context: Context, amountMl: Float, source: String) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_PENDING_LOGS, "[]") ?: "[]"
    val arr = JSONArray(raw)
    val o =
      JSONObject().apply {
        put("amountMl", amountMl.toDouble().coerceAtLeast(0.0))
        put("source", source)
        put("timestamp", utcIsoNow())
      }
    arr.put(o)
    prefs.edit().putString(KEY_PENDING_LOGS, arr.toString()).apply()
  }

  private fun utcIsoNow(): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    fmt.timeZone = TimeZone.getTimeZone("UTC")
    return fmt.format(Date())
  }

  fun pendingAmountSum(context: Context): Float {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_PENDING_LOGS, "[]") ?: "[]"
    val arr = JSONArray(raw)
    var s = 0f
    for (i in 0 until arr.length()) {
      s += arr.getJSONObject(i).getDouble("amountMl").toFloat().coerceAtLeast(0f)
    }
    return s
  }

  /** Returns JSON array string, then clears the pending queue. */
  fun drainPendingJson(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_PENDING_LOGS, "[]") ?: "[]"
    prefs.edit().remove(KEY_PENDING_LOGS).apply()
    return raw
  }

  fun isPersistentNotificationEnabled(context: Context): Boolean =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(
      KEY_PERSISTENT_NOTIFICATION,
      false,
    )

  fun setPersistentNotificationEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
      putBoolean(KEY_PERSISTENT_NOTIFICATION, enabled)
      apply()
    }
  }

  /**
   * 7-day average from last synced per-day totals (keys yyyy-MM-dd) plus widget-only [pendingSum] for today.
   * Falls back to stored weekly pace + pending/7 when day totals are missing.
   */
  fun resolvedWeeklyPaceDisplay(
    context: Context,
    storedWeeklyPace: Float,
    pendingSum: Float,
  ): Float {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_DAY_TOTALS_JSON, null) ?: return (storedWeeklyPace + pendingSum / 7f).coerceAtLeast(0f)
    if (raw.isEmpty()) {
      return (storedWeeklyPace + pendingSum / 7f).coerceAtLeast(0f)
    }
    return try {
      val o = JSONObject(raw)
      if (o.length() == 0) {
        return (storedWeeklyPace + pendingSum / 7f).coerceAtLeast(0f)
      }
      var sum = 0.0
      val keys = o.keys()
      while (keys.hasNext()) {
        sum += o.getDouble(keys.next())
      }
      ((sum + pendingSum) / 7.0).toFloat().coerceAtLeast(0f)
    } catch (_: Exception) {
      (storedWeeklyPace + pendingSum / 7f).coerceAtLeast(0f)
    }
  }
}

data class WidgetSnapshot(
  val todayMl: Float,
  val goalMl: Float,
  val glassMl: Float,
  val weeklyPaceMl: Float,
)
