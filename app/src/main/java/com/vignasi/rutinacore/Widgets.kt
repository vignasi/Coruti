package com.vignasi.rutinacore

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.View
import android.widget.RemoteViews

/* Widgets con el diseño de D2 (C2, docs/diseno/2-sistema-de-diseno.md → Widget). Fondo A: `capa` de la app, claro u
   oscuro según el tema del móvil; los colores salen de res/values(-night)/widget.xml y las imágenes de la figura 3D de
   drawable(-night)-nodpi, así Android cambia de tema solo. Muestran la rutina de core o la favorita elegida. */

/** Widget grande: elige favorita o core, rondas y Empezar; durante la sesión, figura, cantidad, Pausa y Hecho. */
class RutinaWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        WidgetUpdater.refresh(context, force = true)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (Workout.active) return // durante la sesión no se cambia la configuración
        when (intent.action) {
            ACTION_SRC -> Store.setWidgetSource(context, intent.getStringExtra(EXTRA_SRC) ?: return)
            ACTION_PLUS, ACTION_MINUS -> {
                val d = if (intent.action == ACTION_PLUS) 1 else -1
                if (Store.widgetSource(context) == Store.SRC_FAV) Store.addWidgetFavRounds(context, d)
                else Store.config(context).let { it.rounds = (it.rounds + d).coerceIn(1, 6); Store.setConfig(context, it) }
            }
            else -> return
        }
        Workout.done = false
        WidgetUpdater.refresh(context, force = true)
    }

    companion object {
        const val ACTION_PLUS = "com.vignasi.rutinacore.PLUS"
        const val ACTION_MINUS = "com.vignasi.rutinacore.MINUS"
        const val ACTION_SRC = "com.vignasi.rutinacore.SOURCE"
        const val EXTRA_SRC = "src"
    }
}

/** Widget pequeño: figura, sesión y Empezar; durante la sesión, ejercicio, cantidad, Pausa y Hecho. */
class RutinaMini : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        WidgetUpdater.refresh(context, force = true)
    }
}

object WidgetUpdater {
    private var lastFig: String? = null
    private var lastSig: String? = null
    private val recursos = HashMap<String, Int>()

    private fun pi(ctx: Context, req: Int, action: String): PendingIntent {
        val i = Intent(ctx, WorkoutService::class.java).setAction(action)
        return PendingIntent.getForegroundService(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun bc(ctx: Context, req: Int, action: String, src: String? = null): PendingIntent {
        val i = Intent(ctx, RutinaWidget::class.java).setAction(action)
        if (src != null) i.putExtra(RutinaWidget.EXTRA_SRC, src)
        return PendingIntent.getBroadcast(ctx, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun openApp(ctx: Context): PendingIntent {
        val i = Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(ctx, 20, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    /** Lo que se puede empezar (parado): la favorita elegida o la rutina de core, con sus pasos. */
    private class Sesion(val fav: FreeSession?, val steps: List<Step>, val titulo: String, val origen: String)

    private fun sesion(ctx: Context, data: Rutina): Sesion {
        val f = if (Store.widgetSource(ctx) == Store.SRC_FAV) Store.widgetFav(ctx) else null
        if (f != null) return Sesion(f, buildFree(data, f) { Store.bandOf(ctx, it) }, f.name, "Favorita")
        val cfg = Store.config(ctx)
        val mods = activeModules(data, cfg, Store.lastDay(ctx))
        val origen = if (cfg.auto) "Hoy toca el día ${if (Store.lastDay(ctx) == "A") "B" else "A"}" else modsLabel(mods)
        return Sesion(null, Store.plan(ctx, cfg), "Rutina de core", origen)
    }

    /** Qué figura se ve: ejercicio y fase (null = todas las fases, alternando; parado). */
    private class Fig(val k: String?, val fase: Int?) { val key = "$k-$fase" }

    private fun fig(data: Rutina, s: Sesion?): Fig {
        val st = Workout.current()
        if (!Workout.active || st == null) return Fig(s?.let { ejercicioFigura(it.steps, -1) }, null)
        val k = ejercicioFigura(Workout.steps, Workout.idx) ?: return Fig(null, null)
        if (st.rest || st.prep) return Fig(k, 0)
        val ex = data.ex(k)
        return Fig(k, ex.phaseAt(Workout.elapsedInStep(), clamp = ex.hold))
    }

    private fun genero(ctx: Context): String = if (Store.config(ctx).app.optString("fig") == "f") "f" else "m"

    private fun recurso(ctx: Context, nombre: String): Int =
        recursos.getOrPut(nombre) { ctx.resources.getIdentifier(nombre, "drawable", ctx.packageName) }

    /** Con «Quitar animaciones» del móvil, la figura no alterna: queda en la primera fase. */
    private fun sinMovimiento(ctx: Context): Boolean =
        try { Settings.Global.getFloat(ctx.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f } catch (e: Exception) { false }

    /** Pone las fases de la figura en el ViewFlipper (alternan solas cada 1,4 s si hay más de una). */
    private fun ponerFigura(ctx: Context, data: Rutina, rv: RemoteViews, f: Fig) {
        rv.removeAllViews(R.id.fig)
        val k = f.k
        val ex = k?.let { data.exercises[it] }
        if (k == null || ex == null) { rv.setViewVisibility(R.id.fig, View.GONE); return }
        val g = genero(ctx)
        val fases = when {
            f.fase != null -> listOf(f.fase)
            sinMovimiento(ctx) -> listOf(0)
            else -> ex.phases.indices.toList()
        }
        var n = 0
        for (i in fases) {
            val id = recurso(ctx, recursoFigura(g, k, i))
            if (id == 0) continue // ejercicio nuevo sin imágenes todavía (docs/diseno/figura/NOTAS.md): sin figura
            val hijo = RemoteViews(ctx.packageName, R.layout.w_fig)
            hijo.setImageViewResource(R.id.fig_img, id)
            rv.addView(R.id.fig, hijo)
            n++
        }
        rv.setViewVisibility(R.id.fig, if (n > 0) View.VISIBLE else View.GONE)
        rv.setContentDescription(R.id.fig, "Figura: ${ex.name}")
    }

    fun refresh(ctx: Context, force: Boolean = false) {
        val data = Rutina.get(ctx)
        val s = if (Workout.active) null else sesion(ctx, data)
        val f = fig(data, s)
        val st = Workout.current()
        // El servicio llama muy a menudo (para los tonos): solo se redibuja si cambia algo visible
        val sig = "${f.key}|${Workout.idx}|${Workout.leftSec()}|${Workout.running}|${Workout.active}|" +
            if (st != null && st.reps > 0 && Workout.active) cantidadTxt(st, Workout.elapsedInStep(), 0, data.ex(st.k).rep).second else ""
        if (!force && sig == lastSig) return
        lastSig = sig
        // La figura solo se manda al cambiar (si no, el ViewFlipper volvería a empezar en cada segundo)
        val conFig = force || f.key != lastFig
        lastFig = f.key

        val mgr = AppWidgetManager.getInstance(ctx)
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, RutinaWidget::class.java))) {
            val rv = grande(ctx, data, s, f, conFig)
            if (conFig) mgr.updateAppWidget(id, rv) else mgr.partiallyUpdateAppWidget(id, rv)
        }
        for (id in mgr.getAppWidgetIds(ComponentName(ctx, RutinaMini::class.java))) {
            val rv = pequeno(ctx, data, s, f, conFig)
            if (conFig) mgr.updateAppWidget(id, rv) else mgr.partiallyUpdateAppWidget(id, rv)
        }
    }

    /** Botón principal (icono + texto) y el de al lado (Pausa / Parar), según el estado de la sesión. */
    private fun botones(ctx: Context, rv: RemoteViews, main: Int, mainIc: Int, mainTxt: Int, alt: Int, st: Step?) {
        if (Workout.active && st != null) {
            val (ic, txt, desc) = when {
                !Workout.running -> Triple(R.drawable.w_ic_play, "Seguir", "Seguir")
                st.rest -> Triple(R.drawable.w_ic_check, "Saltar", "Terminar el descanso")
                st.prep -> Triple(R.drawable.w_ic_check, "Ya", "Empezar ya")
                else -> Triple(R.drawable.w_ic_check, "Hecho", "Hecho: pasar al siguiente")
            }
            rv.setImageViewResource(mainIc, ic)
            rv.setTextViewText(mainTxt, txt)
            rv.setContentDescription(main, desc)
            rv.setOnClickPendingIntent(main, if (Workout.running) pi(ctx, 11, WorkoutService.ACTION_SKIP) else pi(ctx, 10, WorkoutService.ACTION_TOGGLE))
            rv.setViewVisibility(alt, View.VISIBLE)
            // Parar está detrás de Pausa, como en la app: la sesión se guarda como incompleta
            rv.setImageViewResource(alt, if (Workout.running) R.drawable.w_ic_pausa else R.drawable.w_ic_parar)
            rv.setContentDescription(alt, if (Workout.running) "Pausa" else "Parar. Se guarda como incompleta")
            rv.setOnClickPendingIntent(alt, if (Workout.running) pi(ctx, 10, WorkoutService.ACTION_TOGGLE) else pi(ctx, 12, WorkoutService.ACTION_STOP))
        } else {
            rv.setImageViewResource(mainIc, R.drawable.w_ic_play)
            val otra = Workout.done || Store.doneToday(ctx)
            rv.setTextViewText(mainTxt, if (otra) "Hacer otra" else "Empezar")
            rv.setContentDescription(main, null)
            rv.setOnClickPendingIntent(main, pi(ctx, 10, WorkoutService.ACTION_TOGGLE))
            rv.setViewVisibility(alt, View.GONE)
        }
    }

    private fun grande(ctx: Context, data: Rutina, s: Sesion?, f: Fig, conFig: Boolean): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_player)
        val st = Workout.current()
        if (conFig) ponerFigura(ctx, data, rv, f)
        rv.setOnClickPendingIntent(R.id.textos, openApp(ctx))
        botones(ctx, rv, R.id.btn_main, R.id.btn_main_ic, R.id.btn_main_txt, R.id.btn_alt, st)

        if (Workout.active && st != null) {
            val ex = data.ex(st.k)
            rv.setViewVisibility(R.id.seg_box, View.GONE)
            rv.setViewVisibility(R.id.rondas_box, View.GONE)
            rv.setViewVisibility(R.id.top_box, View.VISIBLE)
            rv.setViewVisibility(R.id.progreso, View.VISIBLE)
            rv.setViewVisibility(R.id.cantidad, View.VISIBLE)
            rv.setTextViewText(R.id.pos, posTxt(Workout.steps, Workout.idx, Workout.roundWord))
            rv.setTextViewText(R.id.quedan, "Quedan ${fmt(Workout.remainingSec())}")
            rv.setTextViewText(R.id.nombre, if (st.rest) "Respira" else ex.name)
            val (cant, abajo) = cantidadTxt(st, Workout.elapsedInStep(), Workout.leftSec(), ex.rep)
            rv.setTextViewText(R.id.cantidad, cant)
            // Debajo: ritmo o tiempo, y la banda o los kilos de este ejercicio
            val sigue = if (st.prep) Workout.steps.getOrNull(Workout.idx + 1) else st
            val extra = if (st.rest || sigue == null) null else Store.bandOf(ctx, sigue.k)?.let { "Banda: $it" }
                ?: sigue.kg?.let { kg -> Store.weight(ctx, sigue.k)?.let { "${fmtKg(it)} kg" } ?: kgRange(kg) }
            rv.setTextViewText(R.id.linea1, listOfNotNull(abajo, extra).joinToString(" · "))
            rv.setTextViewText(R.id.linea2, luegoTxt(Workout.steps, Workout.idx))
            rv.setProgressBar(R.id.progreso, st.s * 10, (st.s * 10 - Workout.leftMs / 100).toInt().coerceAtLeast(0), false)
            return rv
        }

        s ?: return rv
        rv.setViewVisibility(R.id.top_box, View.GONE)
        rv.setViewVisibility(R.id.progreso, View.GONE)
        rv.setViewVisibility(R.id.cantidad, View.GONE)
        rv.setViewVisibility(R.id.rondas_box, View.VISIBLE)
        // Segmentos ★ Favorita · Core: solo si hay una favorita marcada en la app (C2b añadirá «Hoy», el plan de Claude)
        val fav = Store.widgetFav(ctx)
        if (fav == null) rv.setViewVisibility(R.id.seg_box, View.GONE) else {
            val enFav = s.fav != null
            rv.setViewVisibility(R.id.seg_box, View.VISIBLE)
            rv.setInt(R.id.seg_fav, "setBackgroundResource", if (enFav) R.drawable.w_seg_on else 0)
            rv.setInt(R.id.seg_core, "setBackgroundResource", if (enFav) 0 else R.drawable.w_seg_on)
            rv.setContentDescription(R.id.seg_fav, "Favorita: ${fav.name}" + if (enFav) ". Elegida" else "")
            rv.setContentDescription(R.id.seg_core, "Rutina de core" + if (!enFav) ". Elegida" else "")
            rv.setOnClickPendingIntent(R.id.seg_fav, bc(ctx, 57, RutinaWidget.ACTION_SRC, Store.SRC_FAV))
            rv.setOnClickPendingIntent(R.id.seg_core, bc(ctx, 58, RutinaWidget.ACTION_SRC, Store.SRC_RUTINA))
        }
        if (Workout.done) {
            rv.setTextViewText(R.id.nombre, if (s.fav != null) "¡Terminada!" else "¡Rutina terminada!")
            rv.setTextViewText(R.id.linea1, "Buen trabajo")
        } else {
            rv.setTextViewText(R.id.nombre, s.titulo)
            rv.setTextViewText(R.id.linea1, s.origen)
        }
        val racha = Store.streak(ctx)
        rv.setTextViewText(R.id.linea2, "${ejerciciosTxt(s.steps)} · ${minTxt(totalSeconds(s.steps))}" +
            if (racha > 1) " · racha de $racha días" else "")
        val n = s.fav?.rounds ?: Store.config(ctx).rounds
        val palabra = if (s.fav != null && !s.fav.isAlt) "Series" else "Rondas"
        rv.setTextViewText(R.id.rondas_txt, palabra)
        rv.setTextViewText(R.id.rondas_n, "$n")
        rv.setContentDescription(R.id.rondas_n, "$n ${palabra.lowercase()}")
        rv.setContentDescription(R.id.btn_menos, "Una ${if (palabra == "Series") "serie" else "ronda"} menos")
        rv.setContentDescription(R.id.btn_mas, "Una ${if (palabra == "Series") "serie" else "ronda"} más")
        rv.setOnClickPendingIntent(R.id.btn_menos, bc(ctx, 13, RutinaWidget.ACTION_MINUS))
        rv.setOnClickPendingIntent(R.id.btn_mas, bc(ctx, 14, RutinaWidget.ACTION_PLUS))
        return rv
    }

    private fun pequeno(ctx: Context, data: Rutina, s: Sesion?, f: Fig, conFig: Boolean): RemoteViews {
        val rv = RemoteViews(ctx.packageName, R.layout.widget_mini)
        val st = Workout.current()
        if (conFig) ponerFigura(ctx, data, rv, f)
        rv.setOnClickPendingIntent(R.id.mini_textos, openApp(ctx))
        botones(ctx, rv, R.id.mini_main, R.id.mini_main_ic, R.id.mini_main_txt, R.id.mini_alt, st)
        if (Workout.active && st != null) {
            val ex = data.ex(st.k)
            rv.setTextViewText(R.id.mini_nombre, if (st.rest) "Descanso" else ex.name)
            rv.setTextViewText(R.id.mini_cant, cantidadTxt(st, Workout.elapsedInStep(), Workout.leftSec(), ex.rep, corta = true).first)
            rv.setViewVisibility(R.id.mini_cant, View.VISIBLE)
        } else if (s != null) {
            val nombre = if (s.fav != null) "★ ${s.fav.name}" else "Core"
            rv.setTextViewText(R.id.mini_nombre, if (Workout.done) "¡Terminada!" else "$nombre · ${minTxt(totalSeconds(s.steps))}")
            rv.setViewVisibility(R.id.mini_cant, View.GONE)
        }
        return rv
    }
}
