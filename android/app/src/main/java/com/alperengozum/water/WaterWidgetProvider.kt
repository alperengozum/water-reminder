package com.alperengozum.water

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle

class WaterWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val appContext = context.applicationContext
    val snapshot = WaterWidgetStorage.read(appContext)
    for (id in appWidgetIds) {
      val views = WaterWidgetUpdater.buildRemoteViews(appContext, snapshot, id)
      appWidgetManager.updateAppWidget(id, views)
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
    val views = WaterWidgetUpdater.buildRemoteViews(appContext, snapshot, appWidgetId)
    appWidgetManager.updateAppWidget(appWidgetId, views)
  }
}
