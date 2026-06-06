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
    val lctx = WaterWidgetUpdater.localizedContextFromStorage(context.applicationContext)
    val snapshot = WaterWidgetStorage.read(lctx)
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, WaterWidgetUpdater.buildCompactRemoteViews(lctx, snapshot, id))
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
    appWidgetManager.updateAppWidget(
      appWidgetId,
      WaterWidgetUpdater.buildCompactRemoteViews(lctx, snapshot, appWidgetId),
    )
  }
}
