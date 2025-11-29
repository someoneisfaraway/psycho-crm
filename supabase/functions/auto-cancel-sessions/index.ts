import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

function startOfTodayUTC(): string {
  const now = new Date();
  const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return startUtc.toISOString();
}

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const cutoffISO = startOfTodayUTC();

  const { data, error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("status", "scheduled")
    .lt("scheduled_at", cutoffISO)
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const processed = Array.isArray(data) ? data.length : 0;
  return new Response(JSON.stringify({ processed, cutoffISO }), {
    headers: { "Content-Type": "application/json" },
  });
});

