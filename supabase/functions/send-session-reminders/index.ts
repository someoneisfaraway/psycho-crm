import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

function formatRuDateTime(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
}

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const appId = Deno.env.get("ONESIGNAL_APP_ID")!;
  const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

  const now = new Date();
  const windowMinutes = Number(Deno.env.get("REMINDER_WINDOW_MINUTES") ?? "5");
  const target = new Date(now.getTime() + 60 * 60 * 1000);
  const start = new Date(target.getTime() - windowMinutes * 60 * 1000);
  const end = new Date(target.getTime() + windowMinutes * 60 * 1000);

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(`id, scheduled_at, user_id, clients(id, name, source)`) // relies on FK sessions.client_id -> clients.id
    .eq("status", "scheduled")
    .eq("reminder_sent", false)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  console.log("[reminders] window:", { start: start.toISOString(), end: end.toISOString(), count: sessions?.length || 0 });
  for (const s of sessions ?? []) {
    try {
      const when = new Date((s as any).scheduled_at);
      const name = (s as any).clients?.name || "";
      const src: string | undefined = (s as any).clients?.source;
      const srcLabelMap: Record<string, string> = { private: 'личный', yasno: 'Ясно', zigmund: 'Зигмунд', alter: 'Alter', other: 'Другое' };
      const middleLine = src === 'private' ? 'с личным клиентом' : src ? `с клиентом ${srcLabelMap[src] || src}` : 'с клиентом';
      const title = name
        ? `Напоминание о сессии\n${middleLine}\n${name}`
        : `Напоминание о сессии`;
      const message = formatRuDateTime(when);
      const idempotencyKey = String((s as any).id);
      const payload: Record<string, unknown> = {
        app_id: appId,
        include_aliases: { external_id: [(s as any).user_id] },
        target_channel: "push",
        isAnyWeb: true,
        headings: { ru: title, en: title },
        contents: { ru: message, en: message },
        url: "/calendar",
        idempotency_key: idempotencyKey,
      };
      const resp = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${restApiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const bodyText = await resp.text();
      if (!resp.ok) {
        console.error("[reminders] onesignal error", resp.status, bodyText);
        continue;
      }
      await supabase
        .from("sessions")
        .update({ reminder_sent: true })
        .eq("id", (s as any).id);
      processed += 1;
    } catch (_) {}
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
