import { Router } from "express";
import type { Request } from "express";
import prisma from "../lib/prisma.js";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export const referralsRouter = Router();

const REWARD_COUNT = 3;

const BOT_TOKEN = () => process.env.BOT_TOKEN ?? "";

async function tg(method: string, body: object) {
  const token = BOT_TOKEN();
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getUser(req: Request) {
  const initData = req.headers["x-telegram-init-data"] as string | undefined;
  const token = BOT_TOKEN();
  if (!initData) {
    if (process.env.NODE_ENV !== "production") return { id: "dev", username: "devuser", name: "Dev" };
    return null;
  }
  if (!verifyInitData(initData, token)) return null;
  const { user } = parseInitData(initData);
  if (!user) return null;
  return { id: String(user.id), username: user.username, name: [user.first_name, user.last_name].filter(Boolean).join(" ") };
}

async function upsertUser(id: string, username?: string, name?: string) {
  await prisma.tgUser.upsert({
    where: { id },
    update: { username: username ?? null, name: name ?? null },
    create: { id, username: username ?? null, name: name ?? null },
  });
}

// POST /api/referrals — set who invited me (one-time, only if not already set)
referralsRouter.post("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.id === "dev") return res.json({ ok: true });

  const { inviterUsername } = req.body as { inviterUsername: string };
  const cleaned = inviterUsername.replace(/^@/, "").trim().toLowerCase();
  if (!cleaned) return res.status(400).json({ error: "Username required" });

  // Don't let user refer themselves
  if (user.username?.toLowerCase() === cleaned) {
    return res.json({ ok: false, error: "Нельзя указать себя" });
  }

  // Already has a referral record
  const existing = await prisma.referral.findUnique({ where: { invitedUserId: user.id } });
  if (existing) return res.json({ ok: false, error: "Реферер уже указан" });

  await prisma.referral.create({
    data: { invitedUserId: user.id, inviterUsername: cleaned },
  });
  await upsertUser(user.id, user.username, user.name);

  return res.json({ ok: true });
});

// GET /api/referrals/my — stats for the current user
referralsRouter.get("/my", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Who invited me
  const myReferral = await prisma.referral.findUnique({ where: { invitedUserId: user.id } });

  if (!user.username) {
    return res.json({
      confirmed: 0, pending: 0, total: 0, rewardReady: false,
      invitedBy: myReferral?.inviterUsername ?? null,
    });
  }

  await upsertUser(user.id, user.username, user.name);

  const refs = await prisma.referral.findMany({
    where: { inviterUsername: user.username.toLowerCase() },
  });
  const confirmed = refs.filter(r => r.confirmed).length;
  const pending   = refs.filter(r => !r.confirmed).length;
  return res.json({
    confirmed, pending, total: refs.length,
    rewardReady: confirmed >= REWARD_COUNT,
    invitedBy: myReferral?.inviterUsername ?? null,
  });
});

// Called internally from orders route when order is completed
export async function confirmReferral(completedUserId: string) {
  const referral = await prisma.referral.findUnique({ where: { invitedUserId: completedUserId } });
  if (!referral || referral.confirmed) return;

  await prisma.referral.update({ where: { id: referral.id }, data: { confirmed: true } });

  // Count confirmed referrals for inviter
  const confirmed = await prisma.referral.count({
    where: { inviterUsername: referral.inviterUsername, confirmed: true },
  });

  if (confirmed >= REWARD_COUNT && !referral.rewardSent) {
    // Mark reward sent for ALL referrals by this inviter (to avoid duplicate rewards)
    await prisma.referral.updateMany({
      where: { inviterUsername: referral.inviterUsername },
      data: { rewardSent: true },
    });

    // Find inviter's Telegram ID
    const inviterUser = await prisma.tgUser.findFirst({
      where: { username: { equals: referral.inviterUsername, mode: "insensitive" } },
    });

    // Create unique promo code
    const promoCode = `FREE3-${referral.inviterUsername.toUpperCase().slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
    await prisma.promoCode.create({
      data: { code: promoCode, type: "free_delivery", value: 0, active: true },
    });

    if (inviterUser) {
      await tg("sendMessage", {
        chat_id: inviterUser.id,
        text: `🎁 Поздравляем! Ты привёл ${REWARD_COUNT} друга и заслужил бесплатную курилку!\n\nТвой промокод на бесплатную доставку:\n<b>${promoCode}</b>\n\nПрименяй при следующем заказе 🔥`,
        parse_mode: "HTML",
      });
    }
  }
}
