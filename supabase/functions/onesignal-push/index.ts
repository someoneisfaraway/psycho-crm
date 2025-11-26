import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { externalId, title, message, url, sendAfter } = await req.json();

    if (!externalId || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing fields: externalId, title, message" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const restApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    if (!restApiKey || !appId) {
      return new Response(
        JSON.stringify({ error: "OneSignal env vars not set" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: Record<string, unknown> = {
      app_id: appId,
      include_aliases: { external_id: [externalId] },
      target_channel: "push",
      isAnyWeb: true,
      headings: { en: title, ru: title },
      contents: { en: message, ru: message },
    };
    if (url && typeof url === "string" && url.length > 0) {
      payload.url = url;
    }
    if (sendAfter && typeof sendAfter === "string" && sendAfter.length > 0) {
      payload.send_after = sendAfter;
    }

    const resp = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // OneSignal REST API expects Authorization with API key
        // Modern scheme: Authorization: Key <REST_API_KEY>
        // Legacy also accepts: Authorization: Basic <REST_API_KEY>
        "Authorization": `Key ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "OneSignal error", status: resp.status, body: bodyText }),
        { status: resp.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(bodyText, { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected", details: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
