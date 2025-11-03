// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("send-notification function started");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { to, subject, text, from } = await req.json(); // 'from' опционально, если NotiSend позволяет переопределить

    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Attempting to send email to: ${to}, subject: ${subject}`);

    const notisendApiKey = Deno.env.get("NOTISEND_API_KEY");
    // const notisendBaseUrl = Deno.env.get("NOTISEND_BASE_URL") || "https://api.notisend.ru"; // Используем переменную или стандартный URL

    if (!notisendApiKey) {
      console.error("NOTISEND_API_KEY not set in environment variables.");
      return new Response(
        JSON.stringify({ error: "Email service configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Формирование тела запроса для NotiSend
    // Структура может отличаться, проверь документацию NotiSend!
    const notisendPayload = {
      to: Array.isArray(to) ? to : [to], // NotiSend может ожидать массив получателей
      subject: subject,
      text: text,
      // from: from || 'default@yourdomain.com', // Уточни, нужно ли и как задавать 'from' в NotiSend
    };

    // Выполнение запроса к API NotiSend
    // Уточни точный URL эндпоинта отправки из документации NotiSend!
    const notisendResponse = await fetch(
      "https://app.notisend.ru/api/v1", // Пример URL, замени на правильный из документации
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${notisendApiKey}`, // Формат заголовка авторизации для NotiSend
        },
        body: JSON.stringify(notisendPayload),
      }
    );

    if (!notisendResponse.ok) {
      const errorText = await notisendResponse.text();
      console.error(`NotiSend API error: ${notisendResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `NotiSend API error: ${notisendResponse.statusText}`, details: errorText }),
        { status: notisendResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseData = await notisendResponse.json();
    console.log("Email sent successfully via NotiSend:", responseData);

    return new Response(
      JSON.stringify({ message: "Email sent successfully", details: responseData }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/* To invoke locally:
1. Run 'supabase start' (see: https://supabase.com/docs/reference/cli/supabase-start)
2. Make an HTTP request:

curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-notification' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.TxHq8r8jwcFHV3pY9bU3bR4mXkHq8r8jwcFHV3pY9bU' \
--header 'Content-Type: application/json' \
--data '{"to": "recipient@example.com", "subject": "Test Subject", "text": "Test Message"}'
*/