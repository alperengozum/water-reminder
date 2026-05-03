package com.alperengozum.water

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WaterWidgetModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "WaterWidget"

  /** Legacy arity (3) — kept for older dev builds / TurboModule descriptor cache; weekly pace defaults to 0. */
  @ReactMethod
  fun updateWidget(todayMl: Double, goalMl: Double, glassMl: Double) {
    WaterWidgetUpdater.saveAndRefresh(reactContext, todayMl, goalMl, glassMl, 0.0)
  }

  /** Preferred: single map avoids arity mismatches when extending payload. */
  @ReactMethod
  fun syncWidget(config: ReadableMap) {
    val todayMl = config.getDouble("todayMl")
    val goalMl = config.getDouble("goalMl")
    val glassMl = config.getDouble("glassMl")
    val weeklyPaceMl =
      when {
        config.hasKey("weeklyPaceMl") && !config.isNull("weeklyPaceMl") -> config.getDouble("weeklyPaceMl")
        else -> 0.0
      }
    val dayTotalsJson = weeklyDayTotalsToJson(config)
    WaterWidgetUpdater.saveAndRefresh(reactContext, todayMl, goalMl, glassMl, weeklyPaceMl, dayTotalsJson)
  }

  private fun weeklyDayTotalsToJson(config: ReadableMap): String? {
    if (!config.hasKey("weeklyDayTotals") || config.isNull("weeklyDayTotals")) {
      return null
    }
    val m = config.getMap("weeklyDayTotals") ?: return null
    val o = org.json.JSONObject()
    val it = m.keySetIterator()
    while (it.hasNextKey()) {
      val k = it.nextKey()
      o.put(k, m.getDouble(k))
    }
    return if (o.length() == 0) null else o.toString()
  }

  @ReactMethod
  fun setPersistentNotificationEnabled(enabled: Boolean) {
    val app = reactContext.applicationContext
    WaterWidgetStorage.setPersistentNotificationEnabled(app, enabled)
    when {
      enabled -> WaterPersistentNotification.refresh(app)
      else -> WaterPersistentNotification.cancel(app)
    }
  }

  /** JSON array: `[{ "amountMl", "source", "timestamp" }, ...]` */
  @ReactMethod
  fun consumePendingWidgetAdds(promise: Promise) {
    try {
      val json = WaterWidgetStorage.drainPendingJson(reactContext.applicationContext)
      promise.resolve(json)
    } catch (e: Exception) {
      promise.reject("E_WIDGET_PENDING", e.message ?: "unknown", e)
    }
  }
}
