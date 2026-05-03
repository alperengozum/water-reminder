package com.alperengozum.water

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat

object WaterWidgetUpdater {
  private const val RC_OPEN_HOME = 200
  private const val RC_ADD_GLASS = 201
  private const val RC_ADD_QUICK = 202
  private const val RC_ANALYZE = 203

  fun saveAndRefresh(
    context: Context,
    todayMl: Double,
    goalMl: Double,
    glassMl: Double,
    weeklyPaceMl: Double,
    dayTotalsJson: String? = null,
  ) {
    WaterWidgetStorage.write(
      context.applicationContext,
      todayMl.toFloat().coerceAtLeast(0f),
      goalMl.toFloat().coerceAtLeast(0f),
      glassMl.toFloat().coerceAtLeast(1f),
      weeklyPaceMl.toFloat().coerceAtLeast(0f),
      dayTotalsJson,
    )
    refreshAllWidgets(context.applicationContext)
  }

  fun refreshAllWidgets(context: Context) {
    val snapshot = WaterWidgetStorage.read(context)
    val manager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, WaterWidgetProvider::class.java)
    val ids = manager.getAppWidgetIds(component)
    for (id in ids) {
      manager.updateAppWidget(id, buildRemoteViews(context, snapshot, id))
    }
    WaterPersistentNotification.refresh(context.applicationContext)
  }

  fun buildRemoteViews(context: Context, snapshot: WidgetSnapshot, appWidgetId: Int): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.water_widget)

    val pendingSum = WaterWidgetStorage.pendingAmountSum(context)
    val todayMl = snapshot.todayMl + pendingSum
    val goalMl = snapshot.goalMl
    val glassMl = snapshot.glassMl
    val weeklyPaceMl =
      WaterWidgetStorage.resolvedWeeklyPaceDisplay(
        context,
        snapshot.weeklyPaceMl,
        pendingSum,
      )

    val todayInt = todayMl.toInt()
    val goalInt = goalMl.toInt().coerceAtLeast(0)
    val glassInt = glassMl.toInt()
    val weeklyPaceInt = weeklyPaceMl.toInt()

    val goalForBar = goalInt.coerceAtLeast(1)
    val progressValue = todayInt.coerceIn(0, goalForBar)

    val isComplete = goalMl > 0f && todayMl >= goalMl
    val pct =
      when {
        goalMl <= 0f -> 0
        else -> ((todayMl / goalMl) * 100f).toInt().coerceIn(0, 100)
      }

    val manager = AppWidgetManager.getInstance(context)
    val options = manager.getAppWidgetOptions(appWidgetId)
    val minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 220)
    val showAnalyze = minW >= 200
    val showQuick = minW >= 170

    views.setInt(
      R.id.widget_root,
      "setBackgroundResource",
      if (isComplete) R.drawable.widget_root_bg_complete else R.drawable.widget_root_bg,
    )

    views.setTextViewText(
      R.id.widget_title,
      context.getString(if (isComplete) R.string.widget_goal_reached else R.string.widget_title),
    )
    views.setTextViewText(R.id.widget_pct_badge, context.getString(R.string.widget_pct_badge, pct))
    views.setTextColor(
      R.id.widget_title,
      ContextCompat.getColor(
        context,
        if (isComplete) R.color.widget_text_warm_dark else R.color.widget_text_primary,
      ),
    )
    views.setTextColor(
      R.id.widget_pct_badge,
      ContextCompat.getColor(
        context,
        if (isComplete) R.color.widget_text_warm else R.color.widget_text_cool,
      ),
    )

    when {
      isComplete -> {
        views.setViewVisibility(R.id.widget_progress_cool, View.GONE)
        views.setViewVisibility(R.id.widget_progress_warm, View.VISIBLE)
      }
      else -> {
        views.setViewVisibility(R.id.widget_progress_cool, View.VISIBLE)
        views.setViewVisibility(R.id.widget_progress_warm, View.GONE)
      }
    }

    views.setProgressBar(R.id.widget_progress_cool, goalForBar, progressValue, false)
    views.setProgressBar(R.id.widget_progress_warm, goalForBar, progressValue, false)

    views.setTextViewText(
      R.id.widget_primary,
      context.getString(R.string.widget_primary_line, todayInt, goalInt, glassInt),
    )
    views.setTextColor(
      R.id.widget_primary,
      ContextCompat.getColor(
        context,
        if (isComplete) R.color.widget_text_warm else R.color.widget_text_muted,
      ),
    )

    views.setViewVisibility(R.id.widget_analyze_row, if (showAnalyze) View.VISIBLE else View.GONE)
    views.setTextViewText(
      R.id.widget_analyze_text,
      context.getString(R.string.widget_analyze_line, weeklyPaceInt),
    )
    when {
      isComplete -> {
        views.setTextColor(
          R.id.widget_analyze_icon,
          ContextCompat.getColor(context, R.color.widget_analyze_icon_warm),
        )
        views.setTextColor(
          R.id.widget_analyze_text,
          ContextCompat.getColor(context, R.color.widget_text_warm),
        )
      }
      else -> {
        views.setTextColor(
          R.id.widget_analyze_icon,
          ContextCompat.getColor(context, R.color.widget_analyze_icon_cool),
        )
        views.setTextColor(
          R.id.widget_analyze_text,
          ContextCompat.getColor(context, R.color.widget_text_analyze),
        )
      }
    }

    views.setViewVisibility(R.id.widget_btn_quick, if (showQuick) View.VISIBLE else View.GONE)

    val chipBg =
      if (isComplete) {
        R.drawable.widget_chip_warm
      } else {
        R.drawable.widget_chip_cool
      }
    val btnTextColor =
      ContextCompat.getColor(
        context,
        if (isComplete) R.color.widget_btn_warm_text else R.color.widget_text_cool,
      )

    views.setInt(R.id.widget_btn_glass, "setBackgroundResource", chipBg)
    views.setInt(R.id.widget_btn_quick, "setBackgroundResource", chipBg)
    views.setTextViewText(R.id.widget_btn_glass, context.getString(R.string.widget_btn_glass, glassInt))
    views.setTextViewText(R.id.widget_btn_quick, context.getString(R.string.widget_btn_quick))
    views.setTextColor(R.id.widget_btn_glass, btnTextColor)
    views.setTextColor(R.id.widget_btn_quick, btnTextColor)

    val homePi =
      PendingIntent.getActivity(
        context,
        RC_OPEN_HOME,
        Intent(context, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    fun broadcastPi(action: String, requestCode: Int): PendingIntent {
      val i =
        Intent(action).apply {
          setPackage(context.packageName)
        }
      return PendingIntent.getBroadcast(
        context,
        requestCode,
        i,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    views.setOnClickPendingIntent(R.id.widget_root, homePi)
    views.setOnClickPendingIntent(
      R.id.widget_btn_glass,
      broadcastPi(WaterWidgetReceiver.ACTION_ADD_GLASS, RC_ADD_GLASS),
    )
    views.setOnClickPendingIntent(
      R.id.widget_btn_quick,
      broadcastPi(WaterWidgetReceiver.ACTION_ADD_QUICK, RC_ADD_QUICK),
    )
    views.setOnClickPendingIntent(
      R.id.widget_analyze_row,
      broadcastPi(WaterWidgetReceiver.ACTION_ANALYZE, RC_ANALYZE),
    )
    views.setOnClickPendingIntent(
      R.id.widget_analyze_text,
      broadcastPi(WaterWidgetReceiver.ACTION_ANALYZE, RC_ANALYZE),
    )

    return views
  }
}
