package com.alperengozum.water

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import java.util.Calendar

/** Refreshes widgets and icon after local midnight, TZ change, or device reboot. */
class WaterWidgetDayChangeReceiver : BroadcastReceiver() {

  companion object {
    private const val ACTION_MIDNIGHT = "com.alperengozum.water.MIDNIGHT_TICK"
    private const val RC_MIDNIGHT = 0x4D4944

    fun scheduleMidnightAlarm(context: Context) {
      val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pi = midnightPendingIntent(context)
      am.cancel(pi)

      val cal = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_MONTH, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 5)
        set(Calendar.MILLISECOND, 0)
      }
      am.setAndAllowWhileIdle(AlarmManager.RTC, cal.timeInMillis, pi)
    }

    private fun midnightPendingIntent(context: Context): PendingIntent {
      val intent = Intent(ACTION_MIDNIGHT).apply { setPackage(context.packageName) }
      return PendingIntent.getBroadcast(
        context,
        RC_MIDNIGHT,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }

  override fun onReceive(context: Context, intent: Intent?) {
    val app = context.applicationContext
    WaterWidgetUpdater.refreshAllWidgets(app)
    syncAppIcon(app)
    scheduleMidnightAlarm(app)
  }

  /** Reads today's computed metrics and sets the launcher icon alias to match. */
  private fun syncAppIcon(context: Context) {
    try {
      val snapshot = WaterWidgetStorage.read(context)
      val metrics = WaterWidgetStorage.computeDisplayMetrics(context, snapshot)
      val pm = context.packageManager
      val pkg = context.packageName
      val (enable, disable) = if (metrics.isComplete) {
        "$pkg.MainActivityComplete" to "$pkg.MainActivityDefault"
      } else {
        "$pkg.MainActivityDefault" to "$pkg.MainActivityComplete"
      }
      pm.setComponentEnabledSetting(
        ComponentName(pkg, enable),
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
        PackageManager.DONT_KILL_APP,
      )
      pm.setComponentEnabledSetting(
        ComponentName(pkg, disable),
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
        PackageManager.DONT_KILL_APP,
      )
    } catch (_: Exception) {}
  }
}
