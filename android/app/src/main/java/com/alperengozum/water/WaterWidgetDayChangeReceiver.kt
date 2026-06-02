package com.alperengozum.water

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Refreshes widgets and persistent notification after local midnight or TZ change. */
class WaterWidgetDayChangeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    WaterWidgetUpdater.refreshAllWidgets(context.applicationContext)
  }
}
