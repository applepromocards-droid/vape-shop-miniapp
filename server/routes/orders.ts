import { Router } from "express";
import type { Request } from "express";
import prisma from "../lib/prisma.js";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export const ordersRouter = Router();

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID ?? process.env.ADMIN_IDS?.split(",")[0].trim() ?? "";
const BOT_TOKEN = () => process.env.BOT_TOKEN ?? "";
const APP_URL = () => process.env.APP_URL ?? "";

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
    if (process.env.NODE_ENV !== "production") return { id: "dev", username: "dev", name: "Dev User" };
    return null;
  }
  if (!verifyInitData(initData, token)) return null;
  const { user } = parseInitData(initData);
  if (!user) return null;
  return {
    id: String(user.id),
    username: user.username,
    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
  };
}

function buildAdminMessage(order: {
  id: string;
  tgName: string | null;
  tgUsername: string | null;
  tgUserId: string;
  items: unknown;
  subtotal: number;
  delivery: boolean;
  address: string | null;
  payment: string;
}) {
  type Item = { title: string; flavor?: string; qty: number; price: number; currency: string };
  const items = order.items as Item[];
  const currency = items[0]?.currency ?? "€";
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const freeDelivery = totalQty >= 3;
  const deliveryFee = order.delivery && !freeDelivery ? 10 : 0;
  const finalTotal = order.subtotal + deliveryFee;

  const who = [order.tgName, order.tgUsername ? `@${order.tgUsername}` : null, `ID: ${order.tgUserId}`]
    .filter(Boolean).join(" · ");

  const itemsText = items
    .map((it, idx) => {
      const line = [`${idx + 1}. ${it.title}`];
      if (it.flavor) line.push(`   Вкус: ${it.flavor}`);
      line.push(`   ${it.price} ${it.currency} × ${it.qty} = ${it.price * it.qty} ${it.currency}`);
      return line.join("\n");
    })
    .join("\n\n");

  const deliveryLine = order.delivery
    ? freeDelivery
      ? `🚚 Доставка: бесплатно (3+ товаров)\n📍 Адрес: ${order.address}`
      : `🚚 Доставка: 10 ${currency}\n📍 Адрес: ${order.address}`
    : "🏠 Самовывоз";

  const paymentLabel = order.payment === "cash" ? "💵 Наличными" : "💳 Картой";

  return [
    `🛍 Новый заказ!`,
    ``,
    `👤 ${who}`,
    ``,
    itemsText,
    ``,
    `─────────────────`,
    `📦 Товары: ${order.subtotal} ${currency}`,
    deliveryLine,
    `💰 Итого: ${finalTotal} ${currency}`,
    `${paymentLabel}`,
    `─────────────────`,
  ].join("\n");
}

// GET /api/orders/address — saved addresses for user (latest first)
ordersRouter.get("/address", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const saved = await prisma.address.findMany({
    where: { tgUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return res.json({ addresses: saved.map((a) => a.address) });
});

// POST /api/orders — place order
ordersRouter.post("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { items, subtotal, delivery, address, payment } = req.body as {
    items: { title: string; flavor?: string; qty: number; price: number; currency: string }[];
    subtotal: number;
    delivery: boolean;
    address?: string;
    payment: "cash" | "card";
  };

  const order = await prisma.order.create({
    data: {
      tgUserId: user.id,
      tgUsername: user.username ?? null,
      tgName: user.name ?? null,
      items: items as object[],
      subtotal,
      delivery,
      address: delivery ? (address ?? null) : null,
      payment,
    },
  });

  // Save address if new (keep last 5 per user)
  if (delivery && address) {
    const exists = await prisma.address.findFirst({ where: { tgUserId: user.id, address } });
    if (!exists) {
      await prisma.address.create({ data: { tgUserId: user.id, address } });
      const all = await prisma.address.findMany({
        where: { tgUserId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (all.length > 5) {
        await prisma.address.deleteMany({ where: { id: { in: all.slice(5).map((a) => a.id) } } });
      }
    }
  }

  // Notify admin
  if (ADMIN_CHAT_ID) {
    await tg("sendMessage", {
      chat_id: ADMIN_CHAT_ID,
      text: buildAdminMessage(order as typeof order & { items: unknown }),
      parse_mode: "HTML",
    });
  }

  // Confirm to user
  if (user.id !== "dev") {
    const currency = (items[0]?.currency) ?? "€";
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const deliveryFee = delivery && totalQty < 3 ? 10 : 0;
    await tg("sendMessage", {
      chat_id: user.id,
      text: `✅ Заказ принят!\n\nСумма: ${subtotal + deliveryFee} ${currency}\nАдминистратор свяжется с вами в ближайшее время.`,
    });
  }

  return res.json({ ok: true, id: order.id });
});
