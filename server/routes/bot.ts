import { Router } from "express";

export const botRouter = Router();

const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
const APP_URL   = process.env.APP_URL   ?? "";

async function tg(method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

botRouter.post("/", async (req, res) => {
  const update = req.body;

  const msg  = update.message;
  const text = msg?.text ?? "";

  if (text.startsWith("/start")) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🛒 Добро пожаловать в MMSMOKE!\n\nЛучшие вейпы с доставкой. Открывай магазин:",
      reply_markup: {
        inline_keyboard: [[
          { text: "🛍 Открыть магазин", web_app: { url: APP_URL } },
        ]],
      },
    });
  }

  res.json({ ok: true });
});
