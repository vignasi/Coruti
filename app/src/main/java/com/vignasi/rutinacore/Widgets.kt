package com.vignasi.rutinacore

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews

/** Widget grande: el reproductor completo de la rutina y los ajustes de la sesión. */
class RutinaWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        WidgetUpdater.refresh(context, force = true)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (Workout.active) return // durante la sesión no se cambia la configuración
        val cfg = Store.config(context)
        when (intent.action) {
            ACTION_PLUS -> cfg.rounds = (cfg.rounds + 1).coerceAtMost(6)
            ACTION_MINUS -> cfg.rounds = (cfg.rounds - 1).coerceAtLeast(1)
            ACTION_INT -> cfg.intensity = INTENSITIES[(INTENSITIES.indexOf(cfg.intensity) + 1) % INTENSITIES.size]
            ACTION_AUTO -> cfg.auto = !cfg.auto
            ACTION_MOD -> {
                val m = intent.getStringExtra(EXTRA_MOD) ?: return
                if (cfg.auto) cfg.auto = false
                cfg.mods[m] = cfg.mods[m] != true
            }
            else -> return
        }
        Store.setConfig(context, cfg)
        WidgetUpdater.refresh(context, force = true)
    }

    companion object {
        const val ACTION_PLUS = "com.vignasi.rutinacore.PLUS"
        const val ACTION_MINUS = "com.vignasi.rutinacore.MINUS"
        const val ACTION_INT = "com.vignasi.rutinacore.INTENSITY"
        const val ACTION_AUTO = "com.vignasi.rutinacore.AUTO"
        const val ACTION_MOD = "com.vignasi.rutinacore.MODULE"
        const val EXTRA_MOD = "m"
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
    private var lastSig: String? = null

    private val CHIPS = listOf(
        "abdomen" to R.id.chip_abd, "pecho" to R.id.chip_pec, "espalda" to R.id.chip_esp, "brazos" to R.id.chip_bra
    )

    private fun pi(ctx: Context, req: Int, action: String): PendingIntent {
        val i = Intent(ctx, WorkoutService::class.java).setAction(action)
        return PendingIntent.getForegroundService(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun bc(ctx: Context, req: Int, action: String, mod: String? = null): PendingIntent {
        val i = Intent(ctx, RutinaWidget::class.java).setAction(action)
        if (mod != null) i.putExtra(RutinaWidget.EXTRA_MOD, mod)
        return PendingIntent.getBroadcast(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun openApp(ctx: Context): PendingIntent {
        val i = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(ctx, 20, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private class Frame(val key: String, val ex: Exercise, val phase: Int)

    private fun frame(data: Rutina): Frame {
        val st = Workout.current()
        if (!Workout.active || st == null) {
            val ex = data.ex(if (Workout.done) "gato" else "psoas")
            val ph = if (Workout.done) 0 else ex.phases.size - 1
            return Frame("idle-${ex.key}-$ph", ex, ph)
        }
        val ex = data.ex(st.k)
        val live = !st.prep && !st.rest
        val ph = ex.phaseAt(Workout.elapsedInStep(), clamp = live && ex.hold)
        return Frame("${Workout.idx}-$ph", ex, ph)
    }

    private fun statusLine(ctx: Context): String {
        val streak = Store.streak(ctx)
        val today = if (Store.doneToday(ctx)) "Hoy ✓" else "Hoy pendiente"
        return if (streak > 0) "$today · racha $streak" else today
    }

    private fun repNow(data: Rutina, st: Step): Int =
        minOf(st.reps, (Workout.elapsedInStep() / data.ex(st.k).rep).toInt() + 1)

    fun refresh(ctx: Context, force: Boolean = false) {
        val data = Rutina.get(ctx)
        val f = frame(data)
        val st = Workout.current()
        // El servicio llama muy a menudo (para los tonos): solo se redibuja si cambia algo visible
        val sig = "${f.key}|${Workout.leftSec()}|${Workout.running}|${if (st != null && st.reps > 0 && Workout.active) repNow(data, st) else 0}"
        if (!force && sig == lastSig) return
        lastSig = sig

        val mgr = AppWidgetManager.getInstance(ctx)
        val bigIds = mgr.getAppWidgetIds(ComponentName(ctx, RutinaWidget::class.java))
        val miniIds = mgr.getAppWidgetIds(ComponentName(ctx, RutinaMini::class.java))
        val withImage = force || f.key != lastFrame
        lastFrame = f.key

        if (bigIds.isNotEmpty()) {
            val img = if (withImage) PoseRenderer.render(data, f.ex, f.phase, 400) else null
            for (id in bigIds) {
                val rv = big(ctx, data, f, img)
                if (img != null) mgr.updateAppWidget(id, rv) else mgr.partiallyUpdateAppWidget(id, rv)
            }
        }
        for (id in miniIds) mgr.updateAppWidget(id, mini(ctx, data))
    }

    private fun big(ctx: Context, data: Rutina, f: Frame, img: android.graphics.Bitmap?): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_player)
        val st = Workout.current()

        rv.setTextViewText(R.id.status, statusLine(ctx))
        if (img != null) {
            rv.setImageViewBitmap(R.id.pose, img)
            rv.setContentDescription(R.id.pose, "Dibujo: " + f.ex.name + ". " + f.ex.phases[f.phase].cap)
        }

        if (Workout.active && st != null) {
            val ex = f.ex
            val live = !st.prep && !st.rest
            rv.setTextViewText(R.id.ex_name, if (st.prep) "Prepárate: ${ex.name}" else st.name)
            var cap = when {
                st.rest -> "Respira y bebe agua"
                st.prep -> st.sub.substringAfter(" · ", "")
                else -> ex.phases[f.phase].cap
            }
            st.kg?.let { kg ->
                val last = Store.weight(ctx, st.k)
                cap = kgRange(kg) + (if (last != null) " · último ${fmtKg(last)} kg" else "") + (if (cap.isNotEmpty()) " · $cap" else "")
            }
            rv.setTextViewText(R.id.ex_cap, cap)
            rv.setTextViewText(R.id.time, fmt(Workout.leftSec()))
            var info = "Ronda ${st.r}/${Workout.rounds}"
            if (live && st.reps > 0) info += " · ${ex.unit} ${repNow(data, st)}/${st.reps}"
            else if (live && st.hold) info += " · quieto"
            rv.setTextViewText(R.id.info, info)
            rv.setProgressBar(R.id.progress, st.s * 10, (st.s * 10 - Workout.leftMs / 100).toInt(), false)
            rv.setTextViewText(R.id.btn_play, if (Workout.running) "⏸  Pausa" else "▶  Seguir")
            rv.setViewVisibility(R.id.rounds_box, View.GONE)
            rv.setViewVisibility(R.id.config_box, View.GONE)
            rv.setViewVisibility(R.id.btn_skip, View.VISIBLE)
            rv.setViewVisibility(R.id.btn_stop, View.VISIBLE)
        } else {
            val cfg = Store.config(ctx)
            val mods = activeModules(data, cfg, Store.lastDay(ctx))
            val steps = Store.plan(ctx, cfg)
            if (Workout.done) {
                rv.setTextViewText(R.id.ex_name, "¡Rutina terminada!")
                rv.setTextViewText(R.id.ex_cap, "Apúntala en Polar como «Entrenamiento en circuito»")
            } else {
                rv.setTextViewText(R.id.ex_name, modsLabel(mods))
                rv.setTextViewText(R.id.ex_cap, if (cfg.auto) "Alterna sola: hoy toca el día ${if (Store.lastDay(ctx) == "A") "B" else "A"}" else "Toca los módulos para añadirlos o quitarlos")
            }
            rv.setTextViewText(R.id.time, fmt(totalSeconds(steps)))
            rv.setTextViewText(R.id.info, "${cfg.rounds} ${if (cfg.rounds == 1) "ronda" else "rondas"} · ${INT_NAME[cfg.intensity]}")
            rv.setProgressBar(R.id.progress, 100, if (Workout.done) 100 else 0, false)
            rv.setTextViewText(R.id.btn_play, if (Workout.done) "▶  Otra vez" else "▶  Empezar")
            rv.setTextViewText(R.id.rounds_lbl, "${cfg.rounds}")
            rv.setContentDescription(R.id.rounds_lbl, "${cfg.rounds} rondas")
            rv.setViewVisibility(R.id.rounds_box, View.VISIBLE)
            rv.setViewVisibility(R.id.config_box, View.VISIBLE)
            rv.setViewVisibility(R.id.btn_skip, View.GONE)
            rv.setViewVisibility(R.id.btn_stop, View.GONE)

            CHIPS.forEachIndexed { i, (key, id) ->
                val on = mods.any { it.key == key }
                val name = data.modules.firstOrNull { it.key == key }?.name ?: key
                chip(rv, id, (if (on) "✓ " else "") + name, on)
                rv.setContentDescription(id, "$name: ${if (on) "activado" else "desactivado"}")
                rv.setOnClickPendingIntent(id, bc(ctx, 50 + i, RutinaWidget.ACTION_MOD, key))
            }
            chip(rv, R.id.chip_auto, "A/B", cfg.auto)
            rv.setContentDescription(R.id.chip_auto, "Alternar automáticamente: ${if (cfg.auto) "activado" else "desactivado"}")
            chip(rv, R.id.chip_int, INT_NAME[cfg.intensity] ?: "Suave", false)
            rv.setContentDescription(R.id.chip_int, "Intensidad ${INT_NAME[cfg.intensity]}. Toca para cambiarla")
            rv.setOnClickPendingIntent(R.id.chip_auto, bc(ctx, 55, RutinaWidget.ACTION_AUTO))
            rv.setOnClickPendingIntent(R.id.chip_int, bc(ctx, 56, RutinaWidget.ACTION_INT))
        }

        rv.setOnClickPendingIntent(R.id.btn_play, pi(ctx, 10, WorkoutService.ACTION_TOGGLE))
        rv.setOnClickPendingIntent(R.id.btn_skip, pi(ctx, 11, WorkoutService.ACTION_SKIP))
        rv.setOnClickPendingIntent(R.id.btn_stop, pi(ctx, 12, WorkoutService.ACTION_STOP))
        rv.setOnClickPendingIntent(R.id.btn_minus, bc(ctx, 13, RutinaWidget.ACTION_MINUS))
        rv.setOnClickPendingIntent(R.id.btn_plus, bc(ctx, 14, RutinaWidget.ACTION_PLUS))
        rv.setOnClickPendingIntent(R.id.header, openApp(ctx))
        return rv
    }

    private fun chip(rv: RemoteViews, id: Int, text: String, on: Boolean) {
        rv.setTextViewText(id, text)
        rv.setInt(id, "setBackgroundResource", if (on) R.drawable.widget_btn else R.drawable.widget_btn_ghost)
        rv.setTextColor(id, if (on) 0xFF1E6B74.toInt() else 0xFFFFFFFF.toInt())
    }

    private fun mini(ctx: Context, data: Rutina): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_mini)
        val st = Workout.current()
        if (Workout.active && st != null) {
            val name = if (st.prep) "Prepárate: " + data.ex(st.k).name else st.name
            rv.setTextViewText(R.id.mini_title, name)
            var sub = "${fmt(Workout.leftSec())} · ronda ${st.r}/${Workout.rounds}"
            if (!st.prep && !st.rest && st.reps > 0) sub += " · ${repNow(data, st)}/${st.reps}"
            rv.setTextViewText(R.id.mini_sub, sub)
            rv.setTextViewText(R.id.mini_play, if (Workout.running) "⏸" else "▶")
            rv.setContentDescription(R.id.mini_play, if (Workout.running) "Pausa" else "Seguir")
        } else {
            val cfg = Store.config(ctx)
            val total = totalSeconds(Store.plan(ctx, cfg))
            rv.setTextViewText(R.id.mini_title, if (Workout.done) "¡Rutina terminada!" else "Rutina core · ${fmt(total)}")
            rv.setTextViewText(R.id.mini_sub, "${cfg.rounds} ${if (cfg.rounds == 1) "ronda" else "rondas"} · ${statusLine(ctx)}")
            rv.setTextViewText(R.id.mini_play, "▶")
            rv.setContentDescription(R.id.mini_play, "Empezar la rutina")
        }
        rv.setOnClickPendingIntent(R.id.mini_play, pi(ctx, 30, WorkoutService.ACTION_TOGGLE))
        rv.setOnClickPendingIntent(R.id.mini_root, openApp(ctx))
        return rv
    }
}
