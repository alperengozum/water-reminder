package com.alperengozum.water

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle

class WaterCompactWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val appContext = context.applicationContext
    val snapshot = WaterWidgetStorage.read(appContext)
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, WaterWidgetUpdater.buildCompactRemoteViews(appContext, snapshot, id))
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle?,
  ) {
    val appContext = context.applicationContext
    val snapshot = WaterWidgetStorage.read(appContext)
    appWidgetManager.updateAppWidget(
      appWidgetId,
      WaterWidgetUpdater.buildCompactRemoteViews(appContext, snapshot, appWidgetId),
    )
  }
}
