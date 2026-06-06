package com.alperengozum.water

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.IconCompat

object WaterPersistentNotification {
  private const val CHANNEL_ID = "water_persistent"
  private const val NOTIFICATION_ID = 4101

  private const val RC_OPEN_APP = 300
  private const val RC_ADD_GLASS = 301
  private const val RC_ADD_QUICK = 302
  private const val RC_DELETE = 303

  const val ACTION_NOTIFICATION_DELETED = "com.alperengozum.water.action.NOTIF_DISMISSED"

  fun refresh(context: Context) {
    val app = context.applicationContext
    if (!WaterWidgetStorage.isPersistentNotificationEnabled(app)) {
      cancel(app)
      return
    }
    ensureChannel(app)
    val snap = WaterWidgetStorage.read(app)
    val m = WaterWidgetStorage.computeDisplayMetrics(app, snap)

    val accentColor =
      ContextCompat.getColor(
        app,
        when {
          m.isComplete -> R.color.notif_accent_warm
          else -> R.color.notif_accent_cool
        },
      )

    val headline =
      app.getString(
        when {
          m.isComplete -> R.string.notif_headline_complete
          else -> R.string.notif_headline
        },
      )
    val title = app.getString(R.string.notif_title, m.todayInt, m.goalInt)
    val summary = app.getString(R.string.notif_summary, m.pct, m.glassInt)
    val bigBody =
      when {
        m.isComplete -> app.getString(R.string.notif_big_body_complete)
        else -> app.getString(R.string.notif_big_body_progress, m.remainingMl, m.glassInt)
      }

    val openIntent =
      Intent(app, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
    val contentPi =
      PendingIntent.getActivity(
        app,
        RC_OPEN_APP,
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    fun broadcastPi(action: String, requestCode: Int): PendingIntent {
      val i =
        Intent(action).apply {
          setPackage(app.packageName)
        }
      return PendingIntent.getBroadcast(
        app,
        requestCode,
        i,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val style =
      NotificationCompat.BigTextStyle()
        .setBigContentTitle(title)
        .bigText(bigBody)

    val glassActionTitle = app.getString(R.string.notif_action_glass, m.glassInt)
    val glassAction =
      NotificationCompat.Action.Builder(
        IconCompat.createWithResource(app, R.drawable.ic_notif_action_glass),
        glassActionTitle,
        broadcastPi(WaterWidgetReceiver.ACTION_ADD_GLASS, RC_ADD_GLASS),
      ).build()
    val preset0 = snap.presets.firstOrNull()
    val quickAction = preset0?.let {
      NotificationCompat.Action.Builder(
        IconCompat.createWithResource(app, R.drawable.ic_notif_action_plus),
        app.getString(R.string.notif_action_glass, it.amountMl.toInt()),
        broadcastPi(WaterWidgetReceiver.ACTION_ADD_QUICK, RC_ADD_QUICK),
      ).build()
    }

    val deletePi =
      PendingIntent.getBroadcast(
        app,
        RC_DELETE,
        Intent(ACTION_NOTIFICATION_DELETED).apply { setPackage(app.packageName) },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    val builder =
      NotificationCompat.Builder(app, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_notification_water)
        .setColor(accentColor)
        .setColorized(true)
        .setSubText(headline)
        .setContentTitle(title)
        .setContentText(summary)
        .setProgress(m.goalForBar, m.progressValue, false)
        .setStyle(style)
        .setContentIntent(contentPi)
        .setDeleteIntent(deletePi)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_PROGRESS)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setShowWhen(false)
        .setSilent(true)
        .addAction(glassAction)
        .apply { if (quickAction != null) addAction(quickAction) }

    val nm = app.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIFICATION_ID, builder.build())
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val ch =
      NotificationChannel(
        CHANNEL_ID,
        context.getString(R.string.notif_channel_name),
        NotificationManager.IMPORTANCE_LOW,
      ).apply {
        description = context.getString(R.string.notif_channel_desc)
        setShowBadge(false)
        enableLights(true)
        lightColor = ContextCompat.getColor(context, R.color.notif_accent_cool)
      }
    nm.createNotificationChannel(ch)
  }

  fun cancel(context: Context) {
    val app = context.applicationContext
    val nm = app.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.cancel(NOTIFICATION_ID)
  }
}
