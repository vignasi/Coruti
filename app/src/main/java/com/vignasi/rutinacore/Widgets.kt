package com.vignasi.rutinacore

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews

/** Widget grande: el reproductor completo de la rutina. */
class RutinaWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        WidgetUpdater.refresh(context, force = true)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_PLUS -> {
                Store.setRounds(context, Store.rounds(context) + 1)
                WidgetUpdater.refresh(context, force = true)
            }
            ACTION_MINUS -> {
                Store.setRounds(context, Store.rounds(context) - 1)
                WidgetUpdater.refresh(context, force = true)
            }
        }
    }

    companion object {
        const val ACTION_PLUS = "com.vignasi.rutinacore.PLUS"
        const val ACTION_MINUS = "com.vignasi.rutinacore.MINUS"
    }
}

/** Widget pequeño: ejercicio en curso, tiempo y botón de empezar. */
class RutinaMini : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        WidgetUpdater.refresh(context, force = true)
    }
}

object WidgetUpdater {
    private var lastFrame: String? = null

    private fun pi(ctx: Context, req: Int, action: String): PendingIntent {
        val i = Intent(ctx, WorkoutService::class.java).setAction(action)
        return PendingIntent.getForegroundService(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun bc(ctx: Context, req: Int, action: String): PendingIntent {
        val i = Intent(ctx, RutinaWidget::class.java).setAction(action)
        return PendingIntent.getBroadcast(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun openApp(ctx: Context): PendingIntent {
        val i = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(ctx, 20, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private class Frame(val key: String, val ex: Exercise, val phase: Int)

    private fun frame(): Frame {
        val st = Workout.current()
        if (!Workout.active || st == null) {
            val ex = EXERCISES.getValue(if (Workout.done) "gato" else "psoas")
            val ph = if (Workout.done) 0 else ex.phases.size - 1
            return Frame("idle-${ex.key}-$ph", ex, ph)
        }
        val ex = EXERCISES.getValue(st.k)
        val live = !st.prep && !st.rest
        val ph = ex.phaseAt(Workout.elapsedInStep(), clamp = live && ex.hold)
        return Frame("${Workout.idx}-$ph", ex, ph)
    }

    private fun statusLine(ctx: Context): String {
        val streak = Store.streak(ctx)
        val today = if (Store.doneToday(ctx)) "Hoy ✓" else "Hoy pendiente"
        return if (streak > 0) "$today · racha $streak" else today
    }

    fun refresh(ctx: Context, force: Boolean = false) {
        val mgr = AppWidgetManager.getInstance(ctx)
        val bigIds = mgr.getAppWidgetIds(ComponentName(ctx, RutinaWidget::class.java))
        val miniIds = mgr.getAppWidgetIds(ComponentName(ctx, RutinaMini::class.java))
        val f = frame()
        val withImage = force || f.key != lastFrame
        lastFrame = f.key

        if (bigIds.isNotEmpty()) {
            val img = if (withImage) PoseRenderer.render(f.ex, f.phase, 400) else null
            for (id in bigIds) {
                val rv = big(ctx, f, img)
                if (img != null) mgr.updateAppWidget(id, rv) else mgr.partiallyUpdateAppWidget(id, rv)
            }
        }
        for (id in miniIds) mgr.updateAppWidget(id, mini(ctx))
    }

    private fun big(ctx: Context, f: Frame, img: android.graphics.Bitmap?): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_player)
        val st = Workout.current()
        val rounds = if (Workout.active) Workout.rounds else Store.rounds(ctx)

        rv.setTextViewText(R.id.status, statusLine(ctx))
        if (img != null) rv.setImageViewBitmap(R.id.pose, img)

        if (Workout.active && st != null) {
            val ex = f.ex
            val live = !st.prep && !st.rest
            rv.setTextViewText(R.id.ex_name, if (st.prep) "Prepárate: ${ex.name}" else st.name)
            val cap = when {
                st.rest -> "Respira y bebe agua"
                st.prep -> st.sub.substringAfter(" · ", st.sub)
                else -> ex.phases[f.phase].cap
            }
            rv.setTextViewText(R.id.ex_cap, cap)
            rv.setTextViewText(R.id.time, fmt(Workout.leftSec()))
            var info = "Ronda ${st.r}/${Workout.rounds}"
            if (live && ex.reps > 0 && ex.rep > 0f) {
                val n = minOf(ex.reps, (Workout.elapsedInStep() / ex.rep).toInt() + 1)
                info += " · ${ex.unit} $n/${ex.reps}"
            } else if (live && ex.hold) {
                info += " · quieto"
            }
            rv.setTextViewText(R.id.info, info)
            rv.setProgressBar(R.id.progress, st.s * 10, (st.s * 10 - Workout.leftMs / 100).toInt(), false)
            rv.setTextViewText(R.id.btn_play, if (Workout.running) "⏸  Pausa" else "▶  Seguir")
            rv.setViewVisibility(R.id.rounds_box, View.GONE)
            rv.setViewVisibility(R.id.btn_skip, View.VISIBLE)
            rv.setViewVisibility(R.id.btn_stop, View.VISIBLE)
        } else {
            if (Workout.done) {
                rv.setTextViewText(R.id.ex_name, "¡Rutina terminada!")
                rv.setTextViewText(R.id.ex_cap, "Apúntala en Polar como «Entrenamiento en circuito»")
            } else {
                rv.setTextViewText(R.id.ex_name, "Rutina core")
                rv.setTextViewText(R.id.ex_cap, "Psoas · puente · dead bug · plancha · gato-camello")
            }
            rv.setTextViewText(R.id.time, fmt(totalSeconds(rounds)))
            rv.setTextViewText(R.id.info, "$rounds ${if (rounds == 1) "ronda" else "rondas"}")
            rv.setProgressBar(R.id.progress, 100, if (Workout.done) 100 else 0, false)
            rv.setTextViewText(R.id.btn_play, if (Workout.done) "▶  Otra vez" else "▶  Empezar")
            rv.setTextViewText(R.id.rounds_lbl, "$rounds")
            rv.setViewVisibility(R.id.rounds_box, View.VISIBLE)
            rv.setViewVisibility(R.id.btn_skip, View.GONE)
            rv.setViewVisibility(R.id.btn_stop, View.GONE)
        }

        rv.setOnClickPendingIntent(R.id.btn_play, pi(ctx, 10, WorkoutService.ACTION_TOGGLE))
        rv.setOnClickPendingIntent(R.id.btn_skip, pi(ctx, 11, WorkoutService.ACTION_SKIP))
        rv.setOnClickPendingIntent(R.id.btn_stop, pi(ctx, 12, WorkoutService.ACTION_STOP))
        rv.setOnClickPendingIntent(R.id.btn_minus, bc(ctx, 13, RutinaWidget.ACTION_MINUS))
        rv.setOnClickPendingIntent(R.id.btn_plus, bc(ctx, 14, RutinaWidget.ACTION_PLUS))
        rv.setOnClickPendingIntent(R.id.header, openApp(ctx))
        return rv
    }

    private fun mini(ctx: Context): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_mini)
        val st = Workout.current()
        if (Workout.active && st != null) {
            val name = if (st.prep) "Prepárate: " + EXERCISES.getValue(st.k).name else st.name
            rv.setTextViewText(R.id.mini_title, name)
            rv.setTextViewText(R.id.mini_sub, "${fmt(Workout.leftSec())} · ronda ${st.r}/${Workout.rounds}")
            rv.setTextViewText(R.id.mini_play, if (Workout.running) "⏸" else "▶")
        } else {
            val r = Store.rounds(ctx)
            rv.setTextViewText(R.id.mini_title, if (Workout.done) "¡Rutina terminada!" else "Rutina core")
            rv.setTextViewText(R.id.mini_sub, "$r ${if (r == 1) "ronda" else "rondas"} · ${statusLine(ctx)}")
            rv.setTextViewText(R.id.mini_play, "▶")
        }
        rv.setOnClickPendingIntent(R.id.mini_play, pi(ctx, 30, WorkoutService.ACTION_TOGGLE))
        rv.setOnClickPendingIntent(R.id.mini_root, openApp(ctx))
        return rv
    }
}
