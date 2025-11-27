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

  const now = new Date();
  const windowMinutes = Number(Deno.env.get("REMINDER_WINDOW_MINUTES") ?? "5");
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + windowMinutes * 60 * 1000);

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(`id, scheduled_at, user_id, clients(name)`) // relies on FK sessions.client_id -> clients.id
    .eq("status", "scheduled")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  for (const s of sessions ?? []) {
    try {
      const when = new Date((s as any).scheduled_at);
      const name = (s as any).clients?.name || "";
      const title = name ? `Сессия с ${name}` : "Сессия";
      const message = formatRuDateTime(when);
      const idempotencyKey = `${(s as any).id}-reminder-60m`;
      await supabase.functions.invoke("onesignal-push", {
        body: {
          externalId: (s as any).user_id,
          title,
          message,
          url: "/calendar",
          idempotencyKey,
        },
      } as any);
      processed += 1;
    } catch (_) {}
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { "Content-Type": "application/json" },
  });
});

