import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { externalId, title, message, url } = await req.json();

    if (!externalId || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing fields: externalId, title, message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    if (!restApiKey || !appId) {
      return new Response(
        JSON.stringify({ error: "OneSignal env vars not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload: Record<string, unknown> = {
      app_id: appId,
      include_external_user_ids: [externalId],
      target_channel: "web_push",
      headings: { en: title, ru: title },
      contents: { en: message, ru: message },
    };
    if (url && typeof url === "string" && url.length > 0) {
      payload.url = url;
    }

    const resp = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "OneSignal error", status: resp.status, body: bodyText }),
        { status: resp.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(bodyText, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected", details: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

