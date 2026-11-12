"""Crea los modelos 3D de la figura (hombre y mujer) a partir de MakeHuman (MPFB2, licencia CC0).

Qué sale: docs/diseno/figura/modelos/persona_m.glb y persona_f.glb
  - cuerpo de MakeHuman con esqueleto de nombres Mixamo (mixamorig:Hips, ...), el que mueve 3d.html
  - ropa de deporte PINTADA sobre el propio cuerpo (camiseta o tirantes, pantalón corto o mallas, zapatillas):
    así sigue cualquier deformación del cuerpo y nunca lo atraviesa
  - bordes de la ropa y del pelo pulidos con pulir_ropa.py (que también sirve sobre los .glb ya hechos)
  - pelo: el cuero cabelludo con volumen y, en ella, una coleta unida al hueso de la cabeza
  - deformaciones (morph targets) para personalizar más adelante (P8 del ROADMAP), sin usar todavía:
      complexion_mas / complexion_menos (más rellenito / más delgado)
      musculo_mas / musculo_menos (más fuerte / menos fuerte)
    El color de piel, de la ropa y del pelo son materiales separados: se cambian sin tocar la forma.

Cómo se ejecuta (Blender como módulo de Python, sin pantalla):
  pip install bpy==5.3.0
  git clone --depth 1 https://github.com/makehumancommunity/mpfb2
  cp -r mpfb2/src/mpfb ~/.config/blender/5.3/extensions/user_default/mpfb
  python3 crear_modelos.py
"""
import sys, os, math, importlib
import bpy, bmesh, addon_utils
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulir_ropa  # noqa: E402

OUT = os.path.dirname(os.path.abspath(__file__))
addon_utils.enable("bl_ext.user_default.mpfb", default_set=True)


def imp(path, key):
    for m in list(sys.modules):
        if m.endswith(path):
            return getattr(importlib.import_module(m), key)


HS = imp("mpfb.services.humanservice", "HumanService")
TS = imp("mpfb.services.targetservice", "TargetService")
HOP = imp("mpfb.entities.objectproperties", "HumanObjectProperties")

# Colores: los mismos que la figura dibujada (figura.js)
COL = {
    "piel_m": "#C98F68", "piel_f": "#DDA98A", "top": "#1E6B74", "abajo": "#323E3B",
    "zapa": "#F2F4F3", "suela": "#8C9996", "pelo_m": "#2E211B", "pelo_f": "#4A2C1F", "ojos": "#2B1D17",
}
# Cuerpo de partida de cada uno (escala 0–1 de MakeHuman). Edad 0.5 = unos 25 años
BASE = {
    "m": {"gender": 1.0, "age": 0.5, "muscle": 0.56, "weight": 0.48, "height": 0.5, "proportions": 0.7,
          "african": 0.15, "asian": 0.15, "caucasian": 0.7},
    "f": {"gender": 0.0, "age": 0.5, "muscle": 0.56, "weight": 0.45, "height": 0.45, "proportions": 0.7,
          "cupsize": 0.55, "firmness": 0.6, "african": 0.15, "asian": 0.15, "caucasian": 0.7},
}
# Cada deformación: qué se cambia en MakeHuman, cuánto se amplía (MakeHuman cambia poco hasta el extremo)
# y cuánto se aplica a los brazos (si adelgazan como el resto parecen de alambre).
# Más delgado también pierde algo de músculo: si no, queda pecho de culturista con cintura y brazos finos.
# Valores: número = absoluto; ("+", d) = relativo al cuerpo de partida.
# La ampliación de la complexión NO es fija: se calcula para que él y ella cambien lo MISMO de cintura
# (MakeHuman reparte el peso distinto: en ella va casi todo a barriga y caderas). En ella, el pecho crece con la complexión.
WAIST_CHANGE = {"complexion_mas": 0.13, "complexion_menos": -0.09}   # +13 % / −9 % de cintura (ancho + fondo)
MORPHS = {
    "complexion_mas":   ({"weight": 1.0, "cupsize": ("+", 0.1)}, None, 0.9),
    "complexion_menos": ({"weight": 0.15, "muscle": ("+", -0.2), "cupsize": ("+", -0.05)}, None, 0.45),
    "musculo_mas":      ({"muscle": 1.0}, 1.6, 1.0),
    "musculo_menos":    ({"muscle": 0.25}, 1.3, 0.6),
}


def waist_size(co):
    """Ancho + fondo del cuerpo a la altura del ombligo (sin brazos)."""
    top = max(c.z for c in co)
    zw = top * 0.6
    ring = [c for c in co if abs(c.z - zw) < 0.012 and abs(c.x) < 0.2]
    xs, ys = [c.x for c in ring], [c.y for c in ring]
    return (max(xs) - min(xs)) + (max(ys) - min(ys))


def srgb(hexc):
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


def material(name, hexc, rough=0.7):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb(hexc)
    bsdf.inputs["Roughness"].default_value = rough
    return m


def set_body(h, values):
    for k, v in values.items():
        HOP.set_value(k, v, entity_reference=h)
    TS.reapply_macro_details(h)


def mix_coords(h):
    """Posición de cada vértice con las deformaciones de MakeHuman aplicadas (sin esqueleto)."""
    dg = bpy.context.evaluated_depsgraph_get()
    k = h.shape_key_add(name="_tmp", from_mix=True)
    co = [Vector(v.co) for v in k.data]
    h.shape_key_remove(k)
    return co


def build(g):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    h = HS.create_human()
    base = BASE[g]
    set_body(h, base)
    final = mix_coords(h)
    morphs = {}
    w0 = waist_size(final)
    for name, (change, gain, _) in MORPHS.items():
        vals = {k: (min(1, max(0, base.get(k, 0.5) + v[1])) if isinstance(v, tuple) else v) for k, v in change.items()
                if k != "cupsize" or g == "f"}
        set_body(h, {**base, **vals})
        raw = mix_coords(h)
        if gain is None:   # misma cintura para los dos
            gain = WAIST_CHANGE[name] * w0 / (waist_size(raw) - w0)
        morphs[name] = [f + (c - f) * gain for f, c in zip(final, raw)]
        print("MORPH", g, name, "ampliación", round(gain, 2), "cintura", round(waist_size(morphs[name]) / w0 - 1, 3))
    set_body(h, base)
    rig = HS.add_builtin_rig(h, "mixamo")

    # Fuera las deformaciones de MakeHuman: la forma final pasa a ser la base y las nuestras se añaden encima
    h.shape_key_clear()
    for v, c in zip(h.data.vertices, final):
        v.co = c

    # Grupos útiles antes de borrar ayudas
    vg = {g_.name: g_.index for g_ in h.vertex_groups}

    def w(v, name):
        i = vg.get(name)
        if i is None:
            return 0.0
        for e in v.groups:
            if e.group == i:
                return e.weight
        return 0.0

    def center(name):
        pts = [v.co for v in h.data.vertices if w(v, name) > 0.5]
        return sum(pts, Vector()) / len(pts)

    eye = (center("joint-l-eye") + center("joint-r-eye")) / 2
    bone_names = [b.name for b in rig.data.bones]
    bone_idx = {n: vg[n] for n in bone_names if n in vg}

    def dominant(v):
        best, bw = None, 0
        for e in v.groups:
            for n, i in bone_idx.items():
                if e.group == i and e.weight > bw:
                    best, bw = n, e.weight
        return (best or "").replace("mixamorig:", "")

    # Qué es cada vértice: ropa, piel, pelo, ojos (Blender: z arriba, la cara mira a −y)
    keep_helper = {"helper-l-eye", "helper-r-eye"}
    knee = rig.data.bones["mixamorig:LeftLeg"].head_local.z
    WAIST = rig.data.bones["mixamorig:Spine"].head_local.z - 0.015      # cintura del pantalón
    UNDERBUST = rig.data.bones["mixamorig:Spine1"].head_local.z + 0.055  # borde del top de ella
    def rule(b, co):
        """Región de un punto del cuerpo según su hueso y su posición."""
        z, y, x = co.z, co.y, co.x
        if b in ("Head", "HeadTop_End", "Neck") and z > eye.z - 0.09:
            thr = eye.z + 0.045 - 0.62 * (y - (eye.y - 0.02))  # frente alta, nuca baja
            ear = abs(x) > 0.068 and z < eye.z + 0.035 and y < eye.y + 0.07
            return "pelo" if z > thr and not ear else "piel"
        if b in ("LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase") or (b in ("LeftLeg", "RightLeg") and z < 0.105):
            return "suela" if z < 0.022 else "zapa"
        torso = b in ("Spine", "Spine1", "Spine2", "LeftShoulder", "RightShoulder", "Neck", "Hips")
        legs = b in ("LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg")
        armish = "Arm" in b or "Hand" in b
        torso = torso or (not armish and not legs and z < WAIST)   # la cintura, por altura y sin dientes
        neck = eye.z - 0.205 - (0.025 if y < eye.y - 0.02 else 0)  # cuello redondo, algo más bajo delante
        if g == "m":
            if torso and WAIST <= z < neck:
                return "top"
            if b in ("LeftArm", "RightArm"):
                a_ = rig.data.bones["mixamorig:" + b]
                t = (co - a_.head_local).dot((a_.tail_local - a_.head_local).normalized()) / a_.length
                return "top" if t < 0.42 else "piel"
            if (torso and z < WAIST) or (legs and z > knee + 0.17):
                return "abajo"
        else:
            # camiseta de tirantes hasta la cintura: el borde de debajo del pecho salía dentado (malla irregular)
            if torso and WAIST <= z < neck - 0.015:
                return "top"
            if b in ("Spine2", "Neck", "LeftShoulder", "RightShoulder") and 0.045 < abs(x) < 0.1 and z < eye.z - 0.16:
                return "top"   # tirantes
            if (torso and z < WAIST) or legs:
                return "abajo"
        return "piel"

    vdom, delete, eyes = {}, set(), set()
    for v in h.data.vertices:
        if w(v, "HelperGeometry") > 0 or w(v, "JointCubes") > 0:
            (eyes if any(w(v, k) > 0 for k in keep_helper) else delete).add(v.index)
        else:
            vdom[v.index] = dominant(v)
    # La región se decide por cara, con su centro: los bordes de la ropa siguen una fila de la malla y salen rectos
    fregion = {}
    for p in h.data.polygons:
        vs = list(p.vertices)
        if any(i in delete for i in vs):
            continue
        if all(i in eyes for i in vs):
            fregion[p.index] = "ojos"
            continue
        bs = [vdom[i] for i in vs if i in vdom]
        b = max(set(bs), key=bs.count) if bs else ""
        fregion[p.index] = rule(b, sum((h.data.vertices[i].co for i in vs), Vector()) / len(vs))
    region = {}
    order = ["piel", "ojos", "abajo", "top", "suela", "zapa", "pelo"]   # un vértice de borde toma la región con más volumen
    for p in h.data.polygons:
        r = fregion.get(p.index)
        if r is None:
            continue
        for i in p.vertices:
            if i not in region or order.index(r) > order.index(region[i]):
                region[i] = r

    # Brazos: cada deformación les llega con su propio factor
    for name, (_, _, armf) in MORPHS.items():
        if armf != 1.0:
            morphs[name] = [final[i] + (c - final[i]) * (armf if ("Arm" in vdom.get(i, "") or "Hand" in vdom.get(i, "")) else 1.0)
                            for i, c in enumerate(morphs[name])]

    # Volumen: la ropa y el pelo, un poco por fuera de la piel (lo mismo en todas las deformaciones)
    push = {"top": 0.004, "abajo": 0.003, "zapa": 0.007, "suela": 0.006, "pelo": 0.009}
    h.data.update()
    offs = {v.index: v.normal * push[region[v.index]] for v in h.data.vertices if region.get(v.index) in push}
    for v in h.data.vertices:
        if v.index in offs:
            v.co += offs[v.index]
    for name in morphs:
        morphs[name] = [c + offs.get(i, Vector()) for i, c in enumerate(morphs[name])]

    # Deformaciones para personalizar (morph targets)
    h.shape_key_add(name="Basis", from_mix=False)
    for name, co in morphs.items():
        k = h.shape_key_add(name=name, from_mix=False)
        for i, c in enumerate(co):
            k.data[i].co = c
        k.value = 0.0

    # Materiales por cara (la cara toma la región que más se repite entre sus vértices)
    mats = {}
    for r in ("piel", "top", "abajo", "zapa", "suela", "pelo", "ojos"):
        key = "piel_" + g if r == "piel" else "pelo_" + g if r == "pelo" else r
        mats[r] = len(h.data.materials)
        h.data.materials.append(material(r, COL[key], 0.55 if r == "piel" else 0.8 if r in ("top", "abajo") else 0.6))
    for p in h.data.polygons:
        p.material_index = mats[fregion.get(p.index, "piel")]
        p.use_smooth = True

    # Borrar la geometría de ayuda de MakeHuman (dientes, pestañas, cubos de articulaciones…)
    bm = bmesh.new()
    bm.from_mesh(h.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in delete], context="VERTS")
    bm.to_mesh(h.data)
    bm.free()
    for m in [m for m in h.modifiers if m.type == "MASK"]:
        h.modifiers.remove(m)
    # Grupos de vértices que no son huesos: fuera (no hacen falta en el GLB)
    for gr in [gr for gr in h.vertex_groups if gr.name not in bone_names]:
        h.vertex_groups.remove(gr)

    # Bordes de la ropa y del pelo rectos: cortes por superficies suaves en vez de seguir las aristas (pulir_ropa.py)
    pulir_ropa.pulir(h, rig, g)

    objs = [h, rig]
    if g == "f":
        objs.append(ponytail(rig, eye))
    h.name = "persona_" + g
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f"persona_{g}.glb"), export_format="GLB", use_selection=True,
                              export_skins=True, export_morph=True, export_morph_normal=False, export_animations=False,
                              export_yup=True, export_apply=False, export_try_sparse_sk=True)


def ponytail(rig, eye):
    """Coleta: un tubo que baja desde detrás de la coronilla, unido entero al hueso de la cabeza."""
    bm = bmesh.new()
    rings, seg = 9, 10
    start = Vector((0, eye.y + 0.105, eye.z + 0.055))
    path = [start + Vector((0, 0.035 * math.sin(t * 1.2), -0.20 * t)) for t in [i / (rings - 1) for i in range(rings)]]
    rad = [0.022, 0.028, 0.03, 0.029, 0.026, 0.022, 0.017, 0.011, 0.004]
    rows = []
    for c, r in zip(path, rad):
        rows.append([bm.verts.new(c + Vector((r * math.cos(a), r * 0.85 * math.sin(a), 0)))
                     for a in [2 * math.pi * j / seg for j in range(seg)]])
    for a, b in zip(rows, rows[1:]):
        for j in range(seg):
            bm.faces.new((a[j], a[(j + 1) % seg], b[(j + 1) % seg], b[j]))
    bm.faces.new(rows[0][::-1])
    me = bpy.data.meshes.new("coleta")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("coleta", me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(bpy.data.materials["pelo"])
    gr = ob.vertex_groups.new(name="mixamorig:Head")
    gr.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    ob.parent = rig
    mod = ob.modifiers.new("esqueleto", "ARMATURE")
    mod.object = rig
    return ob


if __name__ == "__main__":
    for g in (sys.argv[1:] or ["m", "f"]):
        build(g)
        print("HECHO", g)
