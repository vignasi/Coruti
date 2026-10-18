package com.vignasi.rutinacore

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface

/** Dibuja la figura del ejercicio (misma lógica que la página web) para el widget. */
object PoseRenderer {
    private const val BG = 0xFF1E6B74.toInt()
    private const val INK = 0xFFFFFFFF.toInt()
    private const val FAR = 0xFF86B9BF.toInt()
    private const val HL = 0xFFF0B04A.toInt()
    private const val ARROW = 0xFFBDF0F5.toInt()
    private const val GROUND = 0x66FFFFFF

    private val MARK = mapOf("gl" to "APRIETA EL CULO", "ab" to "OMBLIGO DENTRO")

    fun render(ex: Exercise, phaseIdx: Int, width: Int): Bitmap {
        val height = (width * 112f / 180f).toInt()
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
        val c = Canvas(bmp)
        c.drawColor(BG)
        c.scale(width / 180f, width / 180f)

        val ph = ex.phases[phaseIdx]
        val pose = ex.poses[ph.pose]
        val s = pose.getValue("s")
        val p = pose.getValue("p")
        val cpt = pose["c"] ?: floatArrayOf((s[0] + p[0]) / 2f, (s[1] + p[1]) / 2f)
        fun pt(k: String): FloatArray = if (k == "c") cpt else pose.getValue(k)

        val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        fun seg(a: String, b: String, color: Int, w: Float) {
            line.color = color; line.strokeWidth = w
            val pa = pt(a); val pb = pt(b)
            c.drawLine(pa[0], pa[1], pb[0], pb[1], line)
        }
        val sseg: List<String> = ex.stretchSeg ?: emptyList()
        val stretchOn = ph.stretch && sseg.size == 2
        fun limb(a: String, b: String, base: Int, w: Float) {
            val isStretch = stretchOn && sseg[0] == a && sseg[1] == b
            seg(a, b, if (isStretch) HL else base, w)
        }

        // suelo
        line.color = GROUND; line.strokeWidth = 1.5f
        c.drawLine(4f, 103.5f, 176f, 103.5f, line)

        // lado lejano
        limb("p", "k2", FAR, 4.5f); limb("k2", "a2", FAR, 4f)
        limb("s", "e2", FAR, 4f); limb("e2", "w2", FAR, 3.5f)

        // tronco curvo
        line.color = INK; line.strokeWidth = 6f
        val ctrlX = 2 * cpt[0] - (s[0] + p[0]) / 2f
        val ctrlY = 2 * cpt[1] - (s[1] + p[1]) / 2f
        val path = Path().apply { moveTo(s[0], s[1]); quadTo(ctrlX, ctrlY, p[0], p[1]) }
        c.drawPath(path, line)
        seg("s", "h", INK, 4f)

        // lado cercano
        limb("p", "k1", INK, 5f); limb("k1", "a1", INK, 4.5f)
        limb("s", "e1", INK, 4.5f); limb("e1", "w1", INK, 4f)

        val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL; color = INK }
        val h = pt("h")
        c.drawCircle(h[0], h[1], 7f, fill)

        // marcadores: qué se estira y qué se aprieta
        if (stretchOn) {
            val k1 = pt("k1")
            ex.lab["st"]?.let { label(c, it[0], it[1], (p[0] + k1[0]) / 2f, (p[1] + k1[1]) / 2f, "AQUÍ ESTIRA") }
        }
        for (k in ph.sq) {
            val off = (if (k == "gl") ex.gl else ex.ab) ?: continue
            val base = if (k == "gl") p else cpt
            val x = base[0] + off[0]
            val y = base[1] + off[1]
            fill.color = HL
            c.drawOval(RectF(x - 9f, y - 6f, x + 9f, y + 6f), fill)
            ex.lab[k]?.let { label(c, it[0], it[1], x, y, MARK[k] ?: "") }
        }

        // flecha de dirección
        ph.arrow?.let { a -> arrow(c, a[0], a[1], a[2], a[3]) }
        return bmp
    }

    private fun label(c: Canvas, lx: Float, ly: Float, tx: Float, ty: Float, text: String) {
        val dash = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE; color = HL; strokeWidth = 1.2f
            pathEffect = DashPathEffect(floatArrayOf(2f, 2f), 0f)
        }
        c.drawLine(lx, ly, tx, ty, dash)
        val tp = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = 7.5f; typeface = Typeface.DEFAULT_BOLD; textAlign = Paint.Align.CENTER
        }
        val w = tp.measureText(text) + 8f
        val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = HL; style = Paint.Style.FILL }
        c.drawRect(lx - w / 2f, ly - 6f, lx + w / 2f, ly + 5f, bg)
        tp.color = INK
        c.drawText(text, lx, ly + 2.5f, tp)
    }

    private fun arrow(c: Canvas, x1: Float, y1: Float, x2: Float, y2: Float) {
        val p = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE; color = ARROW; strokeWidth = 2.6f; strokeCap = Paint.Cap.ROUND
            pathEffect = DashPathEffect(floatArrayOf(4f, 3f), 0f)
        }
        c.drawLine(x1, y1, x2, y2, p)
        val ang = Math.atan2((y2 - y1).toDouble(), (x2 - x1).toDouble())
        val head = Path().apply {
            moveTo(x2, y2)
            lineTo((x2 - 7 * Math.cos(ang - 0.5)).toFloat(), (y2 - 7 * Math.sin(ang - 0.5)).toFloat())
            lineTo((x2 - 7 * Math.cos(ang + 0.5)).toFloat(), (y2 - 7 * Math.sin(ang + 0.5)).toFloat())
            close()
        }
        c.drawPath(head, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL; color = ARROW })
    }
}
