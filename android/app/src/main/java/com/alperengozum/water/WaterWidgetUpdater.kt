package com.alperengozum.water

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat

object WaterWidgetUpdater {
  /** Separate ranges so PendingIntents from standard vs compact widgets never collide at the same numeric id. */
  private const val RC_STANDARD_HOME_OFFSET = 100_000
  private const val RC_STANDARD_GLASS_OFFSET = 101_000
  private const val RC_STANDARD_QUICK_OFFSET = 102_000
  private const val RC_STANDARD_ANALYZE_OFFSET = 103_000

  private const val RC_COMPACT_HOME_OFFSET = 200_000
  private const val RC_COMPACT_GLASS_OFFSET = 201_000

  private val widgetProviderClasses: Array<Class<out AppWidgetProvider>> =
    arrayOf(WaterWidgetProvider::class.java, WaterCompactWidgetProvider::class.java)

  /** Host-reported widget size (dp); prefers average of min/max bounds when launcher supplies both. */
  private fun compactHostSizeDp(opts: Bundle): Pair<Int, Int> {
    val minW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
    val maxW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0)
    val minH = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)
    val maxH = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)

    fun pickDim(lo: Int, hi: Int): Int =
      when {
        lo > 0 && hi > 0 -> (lo + hi) / 2
        lo > 0 -> lo
        hi > 0 -> hi
        else -> 0
      }

    var w = pickDim(minW, maxW)
    var h = pickDim(minH, maxH)
    if (w <= 0) {
      w = 200
    }
    if (h <= 0) {
      h = 260
    }
    return w to h
  }

  /**
   * Squared ring edge (dip) that fits under header + button + padding from the host-reported size.
   * Grows when the widget height grows (ch larger → more vertical budget). Clamped for stability.
   */
  private fun compactComputedRingDp(cw: Int, ch: Int): Int {
    // Keep in sync with compact widget XML padding / header / button / ring margins (tight layout).
    val padH = 16
    val padV = 10
    val headerBlock = 34
    val btnBlock = 27
    val ringMargins = 2
    val byW = cw - padH
    val byH = ch - padV - headerBlock - btnBlock - ringMargins
    return kotlin.math.min(byW, byH).coerceIn(132, 420)
  }

  private fun computeMetrics(context: Context, snapshot: WidgetSnapshot): WaterWidgetDisplayMetrics =
    WaterWidgetStorage.computeDisplayMetrics(context, snapshot)

  fun saveAndRefresh(
    context: Context,
    todayMl: Double,
    goalMl: Double,
    glassMl: Double,
    weeklyPaceMl: Double,
    dayTotalsJson: String? = null,
    snapshotDayKey: String = WaterWidgetStorage.localDayKeyNow(),
  ) {
    WaterWidgetStorage.write(
      context.applicationContext,
      todayMl.toFloat().coerceAtLeast(0f),
      goalMl.toFloat().coerceAtLeast(0f),
      glassMl.toFloat().coerceAtLeast(1f),
      weeklyPaceMl.toFloat().coerceAtLeast(0f),
      snapshotDayKey,
      dayTotalsJson,
    )
    refreshAllWidgets(context.applicationContext)
  }

  fun refreshAllWidgets(context: Context) {
    val snapshot = WaterWidgetStorage.read(context)
    val manager = AppWidgetManager.getInstance(context)
    for (providerClass in widgetProviderClasses) {
      val component = ComponentName(context, providerClass)
      val ids = manager.getAppWidgetIds(component)
      for (id in ids) {
        val views =
          when (providerClass) {
            WaterWidgetProvider::class.java -> buildRemoteViews(context, snapshot, id)
            WaterCompactWidgetProvider::class.java -> buildCompactRemoteViews(context, snapshot, id)
            else -> throw IllegalStateException("Unknown widget provider")
          }
        manager.updateAppWidget(id, views)
      }
    }
    WaterPersistentNotification.refresh(context.applicationContext)
  }

  fun buildRemoteViews(context: Context, snapshot: WidgetSnapshot, appWidgetId: Int): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.water_widget)
    val m = computeMetrics(context, snapshot)

    val manager = AppWidgetManager.getInstance(context)
    val options = manager.getAppWidgetOptions(appWidgetId)
    val minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 220)
    val showAnalyze = minW >= 200
    val showQuick = minW >= 170

    views.setInt(
      R.id.widget_root,
      "setBackgroundResource",
      if (m.isComplete) R.drawable.widget_root_bg_complete else R.drawable.widget_root_bg,
    )

    views.setTextViewText(
      R.id.widget_title,
      context.getString(if (m.isComplete) R.string.widget_goal_reached else R.string.widget_title),
    )
    views.setTextViewText(R.id.widget_pct_badge, context.getString(R.string.widget_pct_badge, m.pct))
    views.setTextColor(
      R.id.widget_title,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm_dark else R.color.widget_text_primary,
      ),
    )
    views.setTextColor(
      R.id.widget_pct_badge,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm else R.color.widget_text_cool,
      ),
    )

    when {
      m.isComplete -> {
        views.setViewVisibility(R.id.widget_progress_cool, View.GONE)
        views.setViewVisibility(R.id.widget_progress_warm, View.VISIBLE)
      }
      else -> {
        views.setViewVisibility(R.id.widget_progress_cool, View.VISIBLE)
        views.setViewVisibility(R.id.widget_progress_warm, View.GONE)
      }
    }

    views.setProgressBar(R.id.widget_progress_cool, m.goalForBar, m.progressValue, false)
    views.setProgressBar(R.id.widget_progress_warm, m.goalForBar, m.progressValue, false)

    views.setTextViewText(
      R.id.widget_primary,
      context.getString(R.string.widget_primary_line, m.todayInt, m.goalInt, m.glassInt),
    )
    views.setTextColor(
      R.id.widget_primary,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm else R.color.widget_text_muted,
      ),
    )

    views.setViewVisibility(R.id.widget_analyze_row, if (showAnalyze) View.VISIBLE else View.GONE)
    views.setTextViewText(
      R.id.widget_analyze_text,
      context.getString(R.string.widget_analyze_line, m.weeklyPaceInt),
    )
    when {
      m.isComplete -> {
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
      if (m.isComplete) {
        R.drawable.widget_chip_warm
      } else {
        R.drawable.widget_chip_cool
      }
    val btnTextColor =
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_btn_warm_text else R.color.widget_text_cool,
      )

    views.setInt(R.id.widget_btn_glass, "setBackgroundResource", chipBg)
    views.setInt(R.id.widget_btn_quick, "setBackgroundResource", chipBg)
    views.setTextViewText(R.id.widget_btn_glass, context.getString(R.string.widget_btn_glass, m.glassInt))
    views.setTextViewText(R.id.widget_btn_quick, context.getString(R.string.widget_btn_quick))
    views.setTextColor(R.id.widget_btn_glass, btnTextColor)
    views.setTextColor(R.id.widget_btn_quick, btnTextColor)

    val homePi =
      PendingIntent.getActivity(
        context,
        RC_STANDARD_HOME_OFFSET + appWidgetId,
        Intent(context, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    fun broadcastPi(action: String, offset: Int): PendingIntent =
      PendingIntent.getBroadcast(
        context,
        offset + appWidgetId,
        Intent(action).apply { setPackage(context.packageName) },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    views.setOnClickPendingIntent(R.id.widget_root, homePi)
    views.setOnClickPendingIntent(
      R.id.widget_btn_glass,
      broadcastPi(WaterWidgetReceiver.ACTION_ADD_GLASS, RC_STANDARD_GLASS_OFFSET),
    )
    views.setOnClickPendingIntent(
      R.id.widget_btn_quick,
      broadcastPi(WaterWidgetReceiver.ACTION_ADD_QUICK, RC_STANDARD_QUICK_OFFSET),
    )
    views.setOnClickPendingIntent(
      R.id.widget_analyze_row,
      broadcastPi(WaterWidgetReceiver.ACTION_ANALYZE, RC_STANDARD_ANALYZE_OFFSET),
    )
    views.setOnClickPendingIntent(
      R.id.widget_analyze_text,
      broadcastPi(WaterWidgetReceiver.ACTION_ANALYZE, RC_STANDARD_ANALYZE_OFFSET + 5000),
    )

    return views
  }

  private fun bindCompactRemoteViews(
    views: RemoteViews,
    context: Context,
    snapshot: WidgetSnapshot,
    appWidgetId: Int,
  ) {
    val m = computeMetrics(context, snapshot)

    views.setInt(
      R.id.widget_compact_root,
      "setBackgroundResource",
      when {
        m.isComplete -> R.drawable.widget_compact_card_bg_complete
        else -> R.drawable.widget_compact_card_bg
      },
    )

    views.setTextViewText(R.id.widget_compact_header, context.getString(R.string.widget_compact_header_water))
    views.setTextColor(
      R.id.widget_compact_header,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm_dark else R.color.widget_compact_title,
      ),
    )

    views.setTextViewText(R.id.widget_compact_pct, context.getString(R.string.widget_compact_pct, m.pct))
    views.setTextColor(
      R.id.widget_compact_pct,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm_dark else R.color.widget_compact_pct,
      ),
    )

    val statusRes =
      when {
        m.isComplete -> R.string.widget_compact_status_goal
        m.pct <= 0 -> R.string.widget_compact_status_empty
        else -> R.string.widget_compact_status_progress
      }
    views.setTextViewText(R.id.widget_compact_status, context.getString(statusRes))
    views.setTextColor(
      R.id.widget_compact_status,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_text_warm else R.color.widget_compact_status,
      ),
    )

    when {
      m.isComplete -> {
        views.setViewVisibility(R.id.widget_compact_ring_cool, View.GONE)
        views.setViewVisibility(R.id.widget_compact_ring_warm, View.VISIBLE)
      }
      else -> {
        views.setViewVisibility(R.id.widget_compact_ring_cool, View.VISIBLE)
        views.setViewVisibility(R.id.widget_compact_ring_warm, View.GONE)
      }
    }

    views.setProgressBar(R.id.widget_compact_ring_cool, m.goalForBar, m.progressValue, false)
    views.setProgressBar(R.id.widget_compact_ring_warm, m.goalForBar, m.progressValue, false)

    views.setInt(
      R.id.widget_compact_btn_log,
      "setBackgroundResource",
      if (m.isComplete) R.drawable.widget_compact_log_btn_bg_complete else R.drawable.widget_compact_log_btn_bg,
    )
    views.setTextColor(
      R.id.widget_compact_btn_log,
      ContextCompat.getColor(
        context,
        if (m.isComplete) R.color.widget_compact_log_text_warm else R.color.widget_compact_log_text,
      ),
    )

    val homePi =
      PendingIntent.getActivity(
        context,
        RC_COMPACT_HOME_OFFSET + appWidgetId,
        Intent(context, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    val glassPi =
      PendingIntent.getBroadcast(
        context,
        RC_COMPACT_GLASS_OFFSET + appWidgetId,
        Intent(WaterWidgetReceiver.ACTION_ADD_GLASS).apply { setPackage(context.packageName) },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    views.setOnClickPendingIntent(R.id.widget_compact_root, homePi)
    views.setOnClickPendingIntent(R.id.widget_compact_btn_log, glassPi)
  }

  fun buildCompactRemoteViews(context: Context, snapshot: WidgetSnapshot, appWidgetId: Int): RemoteViews {
    val appContext = context.applicationContext
    val mgr = AppWidgetManager.getInstance(appContext)
    val (cw, ch) = compactHostSizeDp(mgr.getAppWidgetOptions(appWidgetId))
    val sideDp = compactComputedRingDp(cw, ch)

    val useAdaptive = Build.VERSION.SDK_INT >= 31
    val layoutId =
      when {
        useAdaptive -> R.layout.water_widget_compact
        sideDp < 154 -> R.layout.water_widget_compact_s
        sideDp < 210 -> R.layout.water_widget_compact_m
        else -> R.layout.water_widget_compact_l
      }

    val views = RemoteViews(appContext.packageName, layoutId)
    bindCompactRemoteViews(views, appContext, snapshot, appWidgetId)

    if (useAdaptive && layoutId == R.layout.water_widget_compact) {
      views.setViewLayoutWidth(R.id.widget_compact_ring_cool, sideDp.toFloat(), TypedValue.COMPLEX_UNIT_DIP)
      views.setViewLayoutHeight(R.id.widget_compact_ring_cool, sideDp.toFloat(), TypedValue.COMPLEX_UNIT_DIP)
      views.setViewLayoutWidth(R.id.widget_compact_ring_warm, sideDp.toFloat(), TypedValue.COMPLEX_UNIT_DIP)
      views.setViewLayoutHeight(R.id.widget_compact_ring_warm, sideDp.toFloat(), TypedValue.COMPLEX_UNIT_DIP)
    }

    return views
  }
}
