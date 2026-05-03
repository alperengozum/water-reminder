package com.alperengozum.water

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WaterWidgetReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) {
      return
    }
    val app = context.applicationContext
    when (intent.action) {
      ACTION_ADD_GLASS -> {
        val snap = WaterWidgetStorage.read(app)
        WaterWidgetStorage.appendPending(app, snap.glassMl, "glass")
      }
      ACTION_ADD_QUICK -> {
        WaterWidgetStorage.appendPending(app, 100f, "quick")
      }
      ACTION_ANALYZE -> {
        // No-op: keep stats on widget without launching the app.
      }
      else -> return
    }
    WaterWidgetUpdater.refreshAllWidgets(app)
  }

  companion object {
    const val ACTION_ADD_GLASS = "com.alperengozum.water.action.WIDGET_ADD_GLASS"
    const val ACTION_ADD_QUICK = "com.alperengozum.water.action.WIDGET_ADD_QUICK"
    const val ACTION_ANALYZE = "com.alperengozum.water.action.WIDGET_ANALYZE"
  }
}
