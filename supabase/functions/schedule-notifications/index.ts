// supabase/functions/schedule-notifications/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "" // Используем anon, так как это внутренний вызов
);

console.log("schedule-notifications function started");

serve(async (req) => {
  // Проверяем, является ли запрос CRON-ом (например, через заголовок)
  // Точное имя заголовка и значение зависят от настройки CRON в Supabase
  const cronSecret = req.headers.get("X-CL-SECRET");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) { // Убедитесь, что CRON_SECRET задан в env vars
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting scheduled notifications check...");

    // Определяем временной диапазон (например, следующие 24 часа)
    const now = new Date();
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 часа в миллисекундах
    const nowISO = now.toISOString();
    const futureISO = future.toISOString();

    // Запрашиваем сессии в этом диапазоне
    const { data: upcomingSessions, error: sessionsError } = await supabaseClient
      .from("sessions")
      .select("id, user_id, client_id, start_time, status") // Уточните поля
      .gte("start_time", nowISO)
      .lt("start_time", futureISO)
      .in("status", ["scheduled"]) // Уведомления только для запланированных сессий
      .is("user_id", "not", null); // Убедимся, что user_id не null

    if (sessionsError) {
      console.error("Error fetching upcoming sessions:", sessionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sessions", details: sessionsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!upcomingSessions || upcomingSessions.length === 0) {
      console.log("No upcoming sessions found for notification scheduling.");
      return new Response(
        JSON.stringify({ processed: 0, message: "No sessions to process" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${upcomingSessions.length} upcoming sessions.`);

    // Подсчитываем созданные уведомления
    let createdCount = 0;

    // Для каждой сессии создаём уведомление (или проверяем, что оно уже создано)
    // В реальном приложении может потребоваться более сложная логика, чтобы избежать дубликатов
    // или учитывать настройки уведомлений пользователя.
    for (const session of upcomingSessions) {
      // Пример: проверка, не создано ли уже уведомление для этой сессии в ближайшее время
      // Закомментировано для упрощения примера, но в продакшене это важно.
      /*
      const { count, error: countError } = await supabaseClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('type', 'session_reminder')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // За последний час
      if (countError) {
          console.error("Error checking for existing notification:", countError);
          continue; // Пропускаем создание, если не можем проверить
      }
      if (count && count > 0) {
          console.log(`Notification for session ${session.id} already exists recently, skipping.`);
          continue;
      }
      */

      const reminderMessage = `Напоминание: У вас запланирована сессия с ${session.client_id} ${new Date(session.start_time).toLocaleString('ru-RU')}.`; // client_id может быть заменён на имя клиента, если оно будет доступно

      const { error: insertError } = await supabaseClient
        .from("notifications")
        .insert([
          {
            user_id: session.user_id,
            client_id: session.client_id,
            session_id: session.id,
            type: "session_reminder", // Тип уведомления
            message: reminderMessage, // Текст уведомления
            // sent_at останется NULL
          },
        ]);

      if (insertError) {
        console.error(`Error inserting notification for session ${session.id}:`, insertError);
        // Можно решить, прерывать ли выполнение или продолжать с другими сессиями
        // Здесь - продолжаем с остальными
      } else {
        createdCount++;
        console.log(`Notification created for session ${session.id}.`);
      }
    }

    console.log(`Scheduled notifications check completed. Created ${createdCount} notifications.`);

    return new Response(
      JSON.stringify({ processed: upcomingSessions.length, created: createdCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error in schedule-notifications function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/* Пример вызова (обычно не делается вручную для CRON-функций):
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/schedule-notifications' \
--header 'X-CL-SECRET: your-cron-secret' \
--header 'Content-Type: application/json'
*/