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
    val lctx = WaterWidgetUpdater.localizedContextFromStorage(context.applicationContext)
    val snapshot = WaterWidgetStorage.read(lctx)
    for (id in appWidgetIds) {
      val views = WaterWidgetUpdater.buildRemoteViews(lctx, snapshot, id)
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle?,
  ) {
    val lctx = WaterWidgetUpdater.localizedContextFromStorage(context.applicationContext)
    val snapshot = WaterWidgetStorage.read(lctx)
    val views = WaterWidgetUpdater.buildRemoteViews(lctx, snapshot, appWidgetId)
    appWidgetManager.updateAppWidget(appWidgetId, views)
  }
}
