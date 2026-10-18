package com.vignasi.rutinacore

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class RutinaWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        ids.forEach { update(context, manager, it) }
    }

    companion object {
        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, RutinaWidget::class.java))
            ids.forEach { update(context, manager, it) }
        }

        private fun update(context: Context, manager: AppWidgetManager, id: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_rutina)
            val done = Store.doneToday(context)
            val streak = Store.streak(context)

            views.setTextViewText(R.id.status, if (done) "Hoy: ✓ hecha" else "Hoy: pendiente")
            views.setTextViewText(
                R.id.streak,
                when (streak) {
                    0 -> "Empieza tu racha hoy"
                    1 -> "Racha: 1 día"
                    else -> "Racha: $streak días seguidos"
                }
            )
            views.setTextViewText(R.id.btn_start, if (done) "▶  Hacer otra vez" else "▶  Empezar")

            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val start = Intent(context, MainActivity::class.java)
                .putExtra(MainActivity.EXTRA_AUTOSTART, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            val open = Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

            views.setOnClickPendingIntent(R.id.btn_start, PendingIntent.getActivity(context, 1, start, flags))
            views.setOnClickPendingIntent(R.id.root, PendingIntent.getActivity(context, 2, open, flags))

            manager.updateAppWidget(id, views)
        }
    }
}
