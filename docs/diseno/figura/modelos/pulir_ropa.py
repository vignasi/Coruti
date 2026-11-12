"""Pule los bordes de la ropa y del pelo de los modelos 3D (persona_m.glb y persona_f.glb).

Problema: crear_modelos.py decide la ropa cara a cara y los bordes siguen las aristas de la malla, así que salen en
escalera (cuello, mangas, cintura, bajo del pantalón, zapatillas, tirantes, nacimiento del pelo).
Solución: cada borde es un plano. Se corta la malla por ese plano (solo en la zona del borde) y luego cada cara toma
su ropa con reglas hechas de los mismos planos. El borde queda recto y sigue el cuerpo en cualquier postura,
porque los vértices nuevos heredan huesos y deformaciones (morph targets) de los de al lado.

Se usa de dos formas:
  - crear_modelos.py lo llama antes de exportar (pulir(h, rig, g)).
  - Sobre los .glb ya hechos, sin MakeHuman (solo Blender como módulo de Python):
      pip install bpy==5.3.0
      python3 pulir_ropa.py            # los dos
      python3 pulir_ropa.py m          # solo él
"""
import os
import sys
import bpy
import bmesh
from mathutils import Vector

OUT = os.path.dirname(os.path.abspath(__file__))
ORDER = ["piel", "ojos", "abajo", "top", "suela", "zapa", "pelo"]   # un vértice de borde toma la región con más volumen
PUSH = {"top": 0.004, "abajo": 0.003, "zapa": 0.007, "suela": 0.006, "pelo": 0.009}   # igual que crear_modelos.py
TORSO = {"Spine", "Spine1", "Spine2", "LeftShoulder", "RightShoulder", "Neck", "Hips"}
LEGS = {"LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg"}
FEET = {"LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase"}
HEAD = {"Head", "HeadTop_End", "Neck"}
SHOE_TOP, SOLE_TOP = 0.105, 0.022
DEBUG = False
XI, XS = 0.065, 0.105      # tirantes de ella: borde de dentro y de fuera (x)
# Oreja: elipse (vista de lado) que la rodea con margen, respecto al centro de los ojos: (fondo y, alto z, radio y, radio z).
# Medida en los modelos: la oreja entera es piel y el pelo la rodea por una curva suave (antes, una caja: muescas y media oreja con pelo)
EAR = {"m": (0.09, -0.017, 0.03, 0.037), "f": (0.074, -0.018, 0.03, 0.036)}
NAPE = -0.075              # el pelo acaba por debajo en esta altura (respecto a los ojos): borde recto en la nuca


def ear_fn(g, eye):
    """< 0 dentro de la elipse de la oreja (piel). Medida en metros, aproximada, a lo largo del radio en y."""
    yc, zc, ry, rz = EAR[g]
    return lambda c: (((c.y - eye.y - yc) / ry) ** 2 + ((c.z - eye.z - zc) / rz) ** 2) ** 0.5 * ry - ry


def head_region(g, eye, hair, c):
    """Pelo o piel en la cabeza: por encima de la línea del pelo, fuera de la oreja y por encima de la nuca."""
    if abs(c.x) > 0.045 and ear_fn(g, eye)(c) < 0:
        return "piel"
    return "pelo" if hair(c) > 0 and c.z > eye.z + NAPE else "piel"


def ref_points(h, rig, g):
    """Medidas del cuerpo de las que salen las superficies de corte."""
    me = h.data
    mi = {m.name: i for i, m in enumerate(me.materials)}
    ev = {i for p in me.polygons if p.material_index == mi["ojos"] for i in p.vertices}
    eye = sum((me.vertices[i].co for i in ev), Vector()) / len(ev)
    bone = lambda n: rig.data.bones["mixamorig:" + n]
    r = {"eye": eye, "g": g}
    r["waist"] = bone("Spine").head_local.z - 0.015
    r["knee"] = bone("LeftLeg").head_local.z
    ring = [v.co for v in me.vertices if abs(v.co.z - (eye.z - 0.13)) < 0.006 and abs(v.co.x) < 0.07]
    yc = (min(c.y for c in ring) + max(c.y for c in ring)) / 2       # centro del cuello (de delante a detrás)
    # Escote: más bajo delante (k) y subiendo hacia los lados (q·x²), redondo; en ella, escote de camiseta de tirantes
    zc, q = (eye.z - 0.2175, 4.0) if g == "m" else (eye.z - 0.25, 6.0)
    r["neck"] = lambda c, yc=yc, zc=zc, q=q: c.z - (zc + 0.23 * (c.y - yc) + q * c.x * c.x)   # > 0: piel
    hp, hn = Vector((0, eye.y - 0.02, eye.z + 0.045)), Vector((0, 0.62, 1)).normalized()
    r["hair"] = lambda c: (c - hp).dot(hn)                                    # > 0: pelo (frente alta, nuca baja)
    for s, side in (("L", "Left"), ("R", "Right")):
        a = bone(side + "Arm")
        d = (a.tail_local - a.head_local).normalized()
        r["arm" + s] = (a.head_local.copy(), d, a.length)
        u = bone(side + "UpLeg")
        du = (u.tail_local - u.head_local).normalized()
        t = (r["knee"] + 0.17 - u.head_local.z) / (u.tail_local.z - u.head_local.z)
        r["hem" + s] = (u.head_local + (u.tail_local - u.head_local) * t, -du)   # lado positivo = hacia la cadera
        r["armpit" + s] = a.head_local.z - 0.085
        # línea del brazo (ella): lo que queda por fuera de esta línea, junto a la axila, es brazo
        sg = 1 if s == "L" else -1
        nper = Vector((sg * abs(d.z), 0, abs(d.x))).normalized()      # perpendicular al brazo, hacia fuera y arriba
        r["armline" + s] = lambda c, h0=a.head_local.copy(), n=nper: (c - h0).dot(n) + 0.055     # > 0: brazo
    return r


def region(g, r, b, c):
    """Ropa de un punto c del cuerpo, con hueso dominante b. Los bordes son las mismas superficies que se cortan."""
    eye = r["eye"]
    x, y, z = c.x, c.y, c.z
    if b in HEAD and z > eye.z - 0.09:
        return head_region(g, eye, r["hair"], c)
    if (b in FEET or b in LEGS) and z < SHOE_TOP:
        return "suela" if z < SOLE_TOP else "zapa"
    armish = "Arm" in b or "Hand" in b
    legs = b in LEGS
    s = "L" if x > 0 else "R"
    waist = r["waist"]
    if g == "m":
        if b in ("LeftArm", "RightArm"):                           # manga
            h0, d, L = r["arm" + s]
            return "top" if (c - h0).dot(d) < 0.42 * L and r["neck"](c) < 0 else "piel"   # junto al cuello manda el escote
        if armish:
            return "piel"
        if z >= waist:                                             # camiseta (el cuello, piel)
            return "top" if r["neck"](c) < 0 else "piel"
        if legs:
            return "abajo" if (c - r["hem" + s][0]).dot(r["hem" + s][1]) > 0 else "piel"
        return "abajo"
    # ella: camiseta de tirantes hasta la cintura y mallas largas.
    # Junto a la axila manda la línea del brazo (no el hueso), para que la sisa no salga en escalera
    near_pit = abs(x) > XS and waist < z < r["armpit" + s] + 0.02
    arm = r["armline" + s](c) > 0 if near_pit else (armish and abs(x) > XS)   # sobre el hombro manda el tirante, no el hueso
    if arm:
        return "piel"
    if z >= waist:
        ax = abs(x)
        if ax < XI:
            return "top" if r["neck"](c) < 0 else "piel"
        if ax <= XS:
            return "top" if z < eye.z - 0.09 else "piel"            # tirantes: por encima del hombro, sin subir al cuello
        return "top" if z < r["armpit" + s] else "piel"            # sisa
    return "abajo"


def plane(co, no):
    no = no.normalized()
    return lambda c: (c - co).dot(no)


def cuts(g, r):
    """(zona, función): se corta la malla por donde la función vale 0, solo en la zona de ese borde."""
    eye = r["eye"]
    C = [(lambda b, c: b in HEAD and c.z > eye.z + NAPE - 0.02, r["hair"])]
    ef = ear_fn(g, eye)
    C.append((lambda b, c: b in HEAD and abs(c.x) > 0.045 and abs(ef(c)) < 0.02, ef))
    C.append((lambda b, c: b in HEAD and abs(c.z - (eye.z + NAPE)) < 0.03, plane(Vector((0, 0, eye.z + NAPE)), Vector((0, 0, 1)))))
    low = lambda b, c: (b in FEET or b in LEGS) and c.z < 0.16
    C.append((low, plane(Vector((0, 0, SHOE_TOP)), Vector((0, 0, 1)))))
    C.append((low, plane(Vector((0, 0, SOLE_TOP)), Vector((0, 0, 1)))))
    body = lambda b, c: not ("Hand" in b or "ForeArm" in b)
    C.append((lambda b, c: body(b, c) and abs(c.z - r["waist"]) < 0.05 and abs(c.x) < 0.24, plane(Vector((0, 0, r["waist"])), Vector((0, 0, 1)))))
    C.append((lambda b, c: body(b, c) and abs(r["neck"](c)) < 0.05 and abs(c.x) < (0.16 if g == "m" else XI + 0.02) and c.z > r["waist"] + 0.2, r["neck"]))
    for s in ("L", "R"):
        sg = 1 if s == "L" else -1
        side = lambda c, sg=sg: c.x * sg > 0
        if g == "m":
            h0, d, L = r["arm" + s]
            p = h0 + d * (0.42 * L)

            def sleeve(b, c, h0=h0, d=d, p=p):
                v = c - h0
                return abs((c - p).dot(d)) < 0.06 and (v - d * v.dot(d)).length < 0.08
            C.append((sleeve, plane(p, d)))
            hp, hn = r["hem" + s]
            C.append((lambda b, c, hp=hp, hn=hn, side=side: b in LEGS and side(c) and abs((c - hp).dot(hn)) < 0.06, plane(hp, hn)))
        else:
            ap = r["armpit" + s]
            up = lambda b, c, side=side: body(b, c) and side(c) and c.z > r["waist"] + 0.15
            C.append((lambda b, c, f=up: f(b, c) and abs(abs(c.x) - XI) < 0.03 and c.z > eye.z - 0.32, plane(Vector((sg * XI, 0, 0)), Vector((1, 0, 0)))))
            C.append((lambda b, c, f=up: f(b, c) and abs(abs(c.x) - XS) < 0.03 and c.z > ap - 0.04, plane(Vector((sg * XS, 0, 0)), Vector((1, 0, 0)))))
            C.append((lambda b, c, f=up: f(b, c) and 0.04 < abs(c.x) < 0.13 and abs(c.z - (eye.z - 0.09)) < 0.04, plane(Vector((0, 0, eye.z - 0.09)), Vector((0, 0, 1)))))
            C.append((lambda b, c, f=up, ap=ap: f(b, c) and abs(c.x) > 0.08 and abs(c.z - ap) < 0.04, plane(Vector((0, 0, ap)), Vector((0, 0, 1)))))
            C.append((lambda b, c, f=up, ap=ap: f(b, c) and abs(c.x) > 0.08 and c.z < ap + 0.05 and abs(r["armline" + s](c)) < 0.05, r["armline" + s]))
    return C


def cut(bm, faces, f, snap=0.04):
    """Corta las caras por la curva f = 0. Si el corte cae muy cerca de un vértice, pasa por ese vértice
    (sin triángulos finísimos, que salen como grietas). Los vértices nuevos heredan huesos y deformaciones."""
    val = {}
    for fc in faces:
        for v in fc.verts:
            if v not in val:
                val[v] = f(v.co)
    on = set()
    for e in list({e for fc in faces for e in fc.edges}):
        a, b = e.verts
        if a not in val or b not in val:
            continue
        fa, fb = val[a], val[b]
        if fa * fb >= 0:
            if fa == 0:
                on.add(a)
            if fb == 0:
                on.add(b)
            continue
        t = fa / (fa - fb)
        if t < snap:
            on.add(a)
        elif t > 1 - snap:
            on.add(b)
        else:
            _, nv = bmesh.utils.edge_split(e, a, t)
            val[nv] = 0.0
            on.add(nv)
    stat = [0, 0, 0]
    for fc in list({fc for v in on for fc in v.link_faces}):
        vs = pair(fc, on, val)
        if vs is None or any(e for e in fc.edges if set(e.verts) == set(vs)):
            stat[1 if vs else 2] += 1
            continue
        bmesh.ops.connect_verts(bm, verts=vs)
        stat[0] += 1
    return stat


def pair(fc, on, val):
    """Los dos vértices del corte por donde hay que partir la cara: los que dejan a un lado solo valores >= 0 y al otro
    solo <= 0. Con tres o más vértices sobre la curva (uno pegado a ella por el ajuste) antes no se partía: dientes en el borde."""
    ring = list(fc.verts)
    n = len(ring)
    idx = [i for i, v in enumerate(ring) if v in on]
    sgn = lambda v: 0.0 if v in on else val.get(v, 0.0)
    for a in range(len(idx)):
        for b in range(a + 1, len(idx)):
            i, j = idx[a], idx[b]
            c1 = [sgn(ring[k % n]) for k in range(i + 1, j)]
            c2 = [sgn(ring[k % n]) for k in range(j + 1, i + n)]
            if not c1 or not c2:
                continue
            if (max(c1) <= 0 <= min(c2) and min(c1) < 0 < max(c2)) or (max(c2) <= 0 <= min(c1) and min(c2) < 0 < max(c1)):
                return [ring[i], ring[j]]
    return None


def pulir(h, rig, g, pushed=True):
    """Corta los bordes, reasigna la ropa de cada cara y ajusta el volumen solo donde la ropa ha cambiado.
    pushed=False (desde crear_modelos.py): la malla aún no tiene volumen y se le pone entero aquí."""
    me = h.data
    r = ref_points(h, rig, g)
    names = [m.name for m in me.materials]
    mi = {n: i for i, n in enumerate(names)}
    gname = {gr.index: gr.name.replace("mixamorig:", "") for gr in h.vertex_groups}
    bm = bmesh.new()
    bm.from_mesh(me)
    dl = bm.verts.layers.deform.active
    pl = bm.verts.layers.float.new("_push")       # volumen que ya tiene cada vértice (se reparte al cortar)

    def vregion(v):
        rr = "piel"
        for f in v.link_faces:
            n = names[f.material_index]
            if ORDER.index(n) > ORDER.index(rr):
                rr = n
        return rr
    for v in bm.verts:
        v[pl] = PUSH.get(vregion(v), 0.0) if pushed else 0.0

    def vpush(v):
        """Volumen de un vértice: el de la región con más volumen, pero en una esquina (la ropa o el pelo ocupan menos de
        media vuelta a su alrededor) solo en proporción. Si no, el vértice de la punta sale como un pico (detrás de la oreja)."""
        rr = vregion(v)
        tot = sum(lp.calc_angle() for lp in v.link_loops) or 1.0
        share = sum(lp.calc_angle() for lp in v.link_loops if names[lp.face.material_index] == rr) / tot
        return PUSH.get(rr, 0.0) * min(1.0, 2.0 * share)

    def dom(f):
        acc = {}
        for v in f.verts:
            for gi, w in v[dl].items():
                acc[gi] = acc.get(gi, 0) + w
        return gname.get(max(acc, key=acc.get), "") if acc else ""

    keep = {mi["ojos"]}
    n0 = len(bm.faces)
    for zone, fn in cuts(g, r):
        fs = [f for f in bm.faces if f.material_index not in keep and zone(dom(f), f.calc_center_median())]
        if fs:
            # en triángulos, el corte cruza cada cara una sola vez (un cuadrado podía quedar cruzado dos veces y sin partir:
            # eran los dientes del tirante). El .glb va en triángulos igualmente: no pesa más
            bmesh.ops.triangulate(bm, faces=[f for f in fs if len(f.verts) > 3])
            fs = [f for f in bm.faces if f.material_index not in keep and zone(dom(f), f.calc_center_median())]
            st = cut(bm, fs, fn)
            # segunda pasada: las caras que el primer corte no pudo partir (cruzadas por la curva más de una vez)
            fs = [f for f in bm.faces if f.material_index not in keep and zone(dom(f), f.calc_center_median())]
            cut(bm, fs, fn)
            if DEBUG:
                fs = [f for f in bm.faces if f.material_index not in keep and zone(dom(f), f.calc_center_median())]
                bad = sum(1 for f in fs if min(fn(v.co) for v in f.verts) < -1e-3 and max(fn(v.co) for v in f.verts) > 1e-3)
                print("  corte", len(fs), "caras: unidas", st[0], "ya en arista", st[1], "raras", st[2], "sin cortar", bad)
    changed = 0
    for f in bm.faces:
        if f.material_index in keep:
            continue
        m = mi[region(g, r, dom(f), f.calc_center_median())]
        changed += m != f.material_index
        f.material_index = m
    # volumen: ropa y pelo un poco por fuera de la piel (igual en todas las deformaciones); solo la diferencia.
    # Se aplica después, sobre la malla: dentro de bmesh Blender pasaría el cambio de la base a las deformaciones otra vez
    bm.verts.index_update()
    bm.normal_update()                           # las caras nuevas del corte aún no tienen normal
    delta = {}
    for v in bm.verts:
        d = vpush(v) - v[pl]
        if abs(d) < 1e-6:
            continue
        n = Vector()
        for f in v.link_faces:
            n += f.normal * f.calc_area()        # por área: las caras muy finas casi no cuentan
        if n.length > 0:
            delta[v.index] = n.normalized() * d
    bm.verts.layers.float.remove(pl)
    print("PULIR", g, "caras", n0, "→", len(bm.faces), "cambiadas", changed, "vértices movidos", len(delta))
    bm.to_mesh(me)
    bm.free()
    keys = me.shape_keys.key_blocks if me.shape_keys else []
    for i, o in delta.items():
        me.vertices[i].co += o
        for k in keys:
            k.data[i].co += o
    me.update()


def main(g):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    path = os.path.join(OUT, f"persona_{g}.glb")
    bpy.ops.import_scene.gltf(filepath=path, merge_vertices=True)   # glTF separa los vértices en cada borde de material
    rig = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig]
    h = max(meshes, key=lambda o: len(o.data.vertices))
    pulir(h, rig, g)
    bpy.ops.object.select_all(action="DESELECT")
    for o in [rig] + meshes:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_skins=True, export_morph=True, export_morph_normal=False, export_animations=False,
                              export_yup=True, export_apply=False, export_try_sparse_sk=True)


if __name__ == "__main__":
    for g in (sys.argv[1:] or ["m", "f"]):
        main(g)
        print("HECHO", g)
