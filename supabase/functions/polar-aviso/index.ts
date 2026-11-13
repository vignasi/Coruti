// Edge Function «polar-aviso»: Polar avisa aquí cada vez que una sesión del reloj llega a Polar Flow.
// Se comprueba la firma (HMAC-SHA256 con la clave que dio Polar al crear el aviso), se guarda la sesión
// y se revisa lo pendiente de esa persona (emparejar con la sesión de la app y subir a Strava).
// Se despliega con verify_jwt = false: Polar no manda JWT; lo que protege es la firma.
import { db, firmaPolar, igual, secretoServidor, polarGet, guardarPolar, procesar } from "../_shared/servidor.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const cuerpo = await req.text();
  const evento = req.headers.get("Polar-Webhook-Event") ?? "";
  let o: { event?: string; user_id?: number; entity_id?: string; url?: string } = {};
  try { o = JSON.parse(cuerpo); } catch { /* vacío */ }
  // Al crear el aviso, Polar manda un PING antes de dar la clave: se responde 200 sin comprobar nada
  if (evento === "PING" || o.event === "PING") return new Response("ok");

  const clave = await secretoServidor("polar_webhook");
  const firma = (req.headers.get("Polar-Webhook-Signature") ?? "").toLowerCase();
  if (!clave || !igual(firma, await firmaPolar(clave, cuerpo))) return new Response("firma no válida", { status: 401 });
  if (o.event !== "EXERCISE" || !o.user_id || !o.entity_id) return new Response("ok");

  const { data: c } = await db.from("connections").select("user_id").eq("provider", "polar").eq("external_id", String(o.user_id)).maybeSingle();
  if (!c) return new Response("ok");  // alguien que ya desconectó Polar

  const trabajo = (async () => {
    try {
      const r = await polarGet(c.user_id, o.url ?? `/exercises/${o.entity_id}`);
      if (!r.ok) throw new Error(`Polar no dio la sesión (${r.status})`);
      await guardarPolar(c.user_id, await r.json());
      await procesar(c.user_id);
    } catch (e) { console.error("polar-aviso", e); }
  })();
  // Se responde ya a Polar y el trabajo sigue en segundo plano
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(trabajo); else await trabajo;
  return new Response("ok");
});
