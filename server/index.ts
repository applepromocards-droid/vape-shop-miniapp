import express from "express";
import cors from "cors";
import { join } from "path";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { heroRouter } from "./routes/hero.js";
import { resetRouter } from "./routes/reset.js";
import { botRouter } from "./routes/bot.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { promosRouter, applyPromo } from "./routes/promos.js";
import { favoritesRouter } from "./routes/favorites.js";
import { referralsRouter } from "./routes/referrals.js";
import { adminOnly } from "./middleware/adminOnly.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME ?? "mmsmokemanager";

// Public config endpoint
app.get("/api/config", (_req, res) => {
  const supportUrl = process.env.SUPPORT_URL ?? "";
  const adminIds = (process.env.ADMIN_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const supportUserId = process.env.SUPPORT_USER_ID ?? adminIds[0] ?? "";
  res.json({ supportUrl, supportUserId, supportUsername: SUPPORT_USERNAME });
});

// Support — bot sends user a message with support link
app.post("/api/support/contact", async (req, res) => {
  const token = process.env.BOT_TOKEN ?? "";
  const initData = req.headers["x-telegram-init-data"] as string | undefined;

  let userId: string | null = null;
  if (initData && token) {
    try {
      const { parseInitData, verifyInitData } = await import("./lib/telegram.js");
      if (verifyInitData(initData, token)) {
        const { user } = parseInitData(initData);
        if (user) userId = String(user.id);
      }
    } catch { /* ignore */ }
  }

  if (!userId && process.env.NODE_ENV !== "production") userId = "dev";

  if (!userId || userId === "dev") return res.json({ ok: true });

  if (token) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: userId,
        text: `💬 <b>Поддержка MMSMOKE</b>\n\nНапишите нам — мы ответим в ближайшее время 👇`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            { text: "✉️ Написать в поддержку", url: `https://t.me/${SUPPORT_USERNAME}` }
          ]]
        }
      }),
    }).catch(() => {});
  }

  return res.json({ ok: true });
});

// Public promo check (must be before adminOnly promos router)
app.post("/api/promos/apply", applyPromo);

// Protected routes
app.use("/api/categories", adminOnly, categoriesRouter);
app.use("/api/products",   adminOnly, productsRouter);
app.use("/api/hero",       adminOnly, heroRouter);
app.use("/api/reset",      adminOnly, resetRouter);
app.use("/api/promos",     adminOnly, promosRouter);

// Semi-public (own auth per-route)
app.use("/api/orders",    ordersRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/bot",    botRouter);
app.use("/api/auth",   authRouter);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const distPath = join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(join(distPath, "index.html")));
}

app.listen(PORT, () => console.log(`Server on :${PORT}`));
