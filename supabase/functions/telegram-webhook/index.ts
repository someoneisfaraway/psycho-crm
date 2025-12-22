import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

const sendTelegramMessage = async (chatId: number | string, text: string) => {
  if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is missing');
      return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    })
  });
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('OK');
  
  try {
    const update = await req.json();
    const message = update.message;
    if (!message || !message.text) return new Response('OK');

    // /start client_id
    const parts = message.text.split(' ');
    const command = parts[0];
    const clientId = parts[1];

    if (command === '/start' && clientId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Сохранить chat_id клиента
      const { error } = await supabase
        .from('clients')
        .update({
          telegram_chat_id: String(message.chat.id),
          telegram_connected_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) {
        console.error('Error linking client:', error);
        await sendTelegramMessage(message.chat.id, '❌ Ошибка привязки аккаунта. Проверьте ссылку или обратитесь к специалисту.');
      } else {
        // Подтверждение клиенту
        await sendTelegramMessage(
          message.chat.id,
          '✓ Вы успешно подписаны на уведомления о сессиях!'
        );
      }
    }
  } catch (e) {
    console.error('Webhook error:', e);
  }

  return new Response('OK');
});
