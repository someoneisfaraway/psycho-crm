import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, clientId, clientName, sessionDate, sessionTime, scheduledFor, message } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's telegram_chat_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_chat_id, telegram_reminders_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user.telegram_reminders_enabled) {
      console.log('Telegram reminders disabled for user:', userId);
      return new Response(JSON.stringify({ message: 'Reminders disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user.telegram_chat_id) {
      console.log('Telegram chat ID not found for user:', userId);
      return new Response(JSON.stringify({ error: 'Telegram not linked' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct message
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    let text = message;
    if (!text) {
        // Default message construction based on session details
        text = `📅 <b>Запланирована сессия</b>\n\n`;
        if (clientName) text += `👤 Клиент: <b>${clientName}</b>\n`;
        if (sessionDate && sessionTime) text += `⏰ Время: <b>${sessionDate}</b> в <b>${sessionTime}</b>\n`;
        
        // If scheduledFor is provided (which is reminder time), we might mention it?
        // But usually this function is called on creation/update.
    }

    // Send to Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text: text,
            parse_mode: 'HTML'
        })
    });

    if (!telegramRes.ok) {
        const errText = await telegramRes.text();
        console.error('Telegram API error:', errText);
        throw new Error(`Telegram API error: ${errText}`);
    }

    const telegramData = await telegramRes.json();

    return new Response(JSON.stringify(telegramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
