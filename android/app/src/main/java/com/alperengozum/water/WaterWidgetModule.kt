package com.alperengozum.water

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class WaterWidgetModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    instance = this
  }

  override fun getName(): String = "WaterWidget"

  companion object {
    private const val EVENT_PENDING_ADD = "waterWidgetPendingAdd"
    private var instance: WaterWidgetModule? = null

    fun emitPendingAdd() {
      val ctx = instance?.reactContext ?: return
      try {
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit(EVENT_PENDING_ADD, null)
      } catch (_: Exception) {}
    }
  }

  /** Legacy arity (3) — kept for older dev builds / TurboModule descriptor cache; weekly pace defaults to 0. */
  @ReactMethod
  fun updateWidget(todayMl: Double, goalMl: Double, glassMl: Double) {
    WaterWidgetUpdater.saveAndRefresh(
      reactContext,
      todayMl,
      goalMl,
      glassMl,
      0.0,
      snapshotDayKey = WaterWidgetStorage.localDayKeyNow(),
    )
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
    val snapshotDayKey =
      when {
        config.hasKey("dayKey") && !config.isNull("dayKey") ->
          config.getString("dayKey") ?: WaterWidgetStorage.localDayKeyNow()
        else -> WaterWidgetStorage.localDayKeyNow()
      }
    val presetsJson = presetsToJson(config)
    val glassIcon =
      if (config.hasKey("glassIcon") && !config.isNull("glassIcon")) config.getString("glassIcon") else null
    val streakDays =
      if (config.hasKey("streakDays") && !config.isNull("streakDays")) config.getInt("streakDays") else 0
    val language =
      if (config.hasKey("language") && !config.isNull("language")) config.getString("language") ?: "en" else "en"
    WaterWidgetUpdater.saveAndRefresh(
      reactContext,
      todayMl,
      goalMl,
      glassMl,
      weeklyPaceMl,
      dayTotalsJson,
      snapshotDayKey,
      presetsJson,
      glassIcon,
      streakDays,
      language,
    )
  }

  private fun presetsToJson(config: ReadableMap): String? {
    if (!config.hasKey("presets") || config.isNull("presets")) return null
    val arr = config.getArray("presets") ?: return null
    val jsonArr = org.json.JSONArray()
    for (i in 0 until arr.size()) {
      val item = arr.getMap(i) ?: continue
      if (!item.hasKey("amountMl")) continue
      val obj = org.json.JSONObject()
      obj.put("amountMl", item.getDouble("amountMl"))
      if (item.hasKey("icon") && !item.isNull("icon")) {
        obj.put("icon", item.getString("icon"))
      }
      jsonArr.put(obj)
    }
    return jsonArr.toString()
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

  @ReactMethod
  fun setIconComplete(isComplete: Boolean) {
    val ctx = reactContext.applicationContext
    val pm = ctx.packageManager
    val pkg = ctx.packageName
    val defaultComp = ComponentName(pkg, "$pkg.MainActivityDefault")
    val completeComp = ComponentName(pkg, "$pkg.MainActivityComplete")
    val (enable, disable) = if (isComplete) completeComp to defaultComp else defaultComp to completeComp
    pm.setComponentEnabledSetting(enable, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
    pm.setComponentEnabledSetting(disable, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
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
