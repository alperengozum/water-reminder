package com.alperengozum.water

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WaterWidgetReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) return
    val app = context.applicationContext
    when (intent.action) {
      ACTION_ADD_GLASS -> {
        val snap = WaterWidgetStorage.read(app)
        WaterWidgetStorage.appendPending(app, snap.glassMl, "glass")
      }
      ACTION_ADD_PRESET_0, ACTION_ADD_QUICK -> addPresetByIndex(app, 0)
      ACTION_ADD_PRESET_1 -> addPresetByIndex(app, 1)
      ACTION_ADD_PRESET_2 -> addPresetByIndex(app, 2)
      ACTION_ANALYZE -> {
        // No-op: keep stats on widget without launching the app.
      }
      WaterPersistentNotification.ACTION_NOTIFICATION_DELETED -> {
        WaterPersistentNotification.refresh(app)
        return
      }
      else -> return
    }
    WaterWidgetUpdater.refreshAllWidgets(app)
    WaterWidgetModule.emitPendingAdd()
  }

  private fun addPresetByIndex(context: Context, index: Int) {
    val presets = WaterWidgetStorage.read(context).presets
    val amount = presets.getOrNull(index)?.amountMl ?: if (index == 0) 100f else return
    WaterWidgetStorage.appendPending(context, amount, "quick")
  }

  companion object {
    const val ACTION_ADD_GLASS = "com.alperengozum.water.action.WIDGET_ADD_GLASS"
    const val ACTION_ADD_QUICK = "com.alperengozum.water.action.WIDGET_ADD_QUICK"
    const val ACTION_ADD_PRESET_0 = "com.alperengozum.water.action.WIDGET_ADD_PRESET_0"
    const val ACTION_ADD_PRESET_1 = "com.alperengozum.water.action.WIDGET_ADD_PRESET_1"
    const val ACTION_ADD_PRESET_2 = "com.alperengozum.water.action.WIDGET_ADD_PRESET_2"
    const val ACTION_ANALYZE = "com.alperengozum.water.action.WIDGET_ANALYZE"
  }
}
