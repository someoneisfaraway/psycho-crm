import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

function formatRuDateTime(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const month = months[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd} ${month} в ${hh}:${min}`;
}

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const appId = Deno.env.get("ONESIGNAL_APP_ID")!;
  const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!;
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  const now = new Date();
  const windowMinutes = Number(Deno.env.get("REMINDER_WINDOW_MINUTES") ?? "5");
  const target = new Date(now.getTime() + 60 * 60 * 1000);
  const start = new Date(target.getTime() - windowMinutes * 60 * 1000);
  const end = new Date(target.getTime() + windowMinutes * 60 * 1000);

  // Updated query: fetch client's telegram_chat_id and user's name
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(`
        id, 
        scheduled_at, 
        user_id, 
        clients(id, name, source, telegram_chat_id), 
        users(name)
    `)
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
      const clientName = (s as any).clients?.name || "";
      const userName = (s as any).users?.name || "Психолог";
      
      const src: string | undefined = (s as any).clients?.source;
      const srcLabelMap: Record<string, string> = { private: 'личный', yasno: 'Ясно', zigmund: 'Зигмунд', alter: 'Alter', other: 'Другое' };
      const middleLine = src === 'private' ? 'с личным клиентом' : src ? `с клиентом ${srcLabelMap[src] || src}` : 'с клиентом';
      const userTitle = clientName
        ? `Напоминание о сессии\n${middleLine}\n${clientName}`
        : `Напоминание о сессии`;
      const messageTime = formatRuDateTime(when);
      
      let sentAny = false;

      // 1. OneSignal Push to USER (Psychologist)
      if (appId && restApiKey) {
        try {
            const idempotencyKey = String((s as any).id);
            const payload: Record<string, unknown> = {
                app_id: appId,
                include_aliases: { external_id: [(s as any).user_id] },
                target_channel: "push",
                isAnyWeb: true,
                headings: { ru: userTitle, en: userTitle },
                contents: { ru: messageTime, en: messageTime },
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
            if (resp.ok) {
                sentAny = true;
            } else {
                console.error("[reminders] onesignal error", resp.status, await resp.text());
            }
        } catch (e) {
            console.error("[reminders] onesignal exception", e);
        }
      }

      // 2. Telegram to CLIENT
      const clientChatId = (s as any).clients?.telegram_chat_id;
      if (botToken && clientChatId) {
          try {
              const tgText = `📅 <b>Напоминание о сессии</b>\n` +
                             `👤 <b>${userName}</b>\n` +
                             `⏰ <b>${messageTime}</b>`;
              
              const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      chat_id: clientChatId,
                      text: tgText,
                      parse_mode: 'HTML'
                  })
              });
              if (tgResp.ok) {
                  sentAny = true;
                  console.log(`[reminders] sent telegram to client ${clientChatId}`);
              } else {
                  console.error("[reminders] telegram error", await tgResp.text());
              }
          } catch (e) {
              console.error("[reminders] telegram exception", e);
          }
      }

      if (sentAny) {
        await supabase
            .from("sessions")
            .update({ reminder_sent: true })
            .eq("id", (s as any).id);
        processed += 1;
      }
      
    } catch (_) {}
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
