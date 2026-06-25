import { Router } from "express";
import type { Request } from "express";
import prisma from "../lib/prisma.js";
import { verifyInitData, parseInitData } from "../lib/telegram.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { confirmReferral } from "./referrals.js";

export const ordersRouter = Router();

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID ?? process.env.ADMIN_IDS?.split(",")[0].trim() ?? "";
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
  promoCode: string | null;
  discount: number | null;
}) {
  type Item = { title: string; flavor?: string; qty: number; price: number; currency: string };
  const items = order.items as Item[];
  const currency = items[0]?.currency ?? "€";
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const freeDelivery = totalQty >= 3;
  const deliveryFee = order.delivery && !freeDelivery ? 10 : 0;
  const discount = order.discount ?? 0;
  const finalTotal = order.subtotal + deliveryFee - discount;

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

  const lines = [
    `🛍 Новый заказ! #${order.id.slice(-6).toUpperCase()}`,
    ``,
    `👤 ${who}`,
    ``,
    itemsText,
    ``,
    `─────────────────`,
    `📦 Товары: ${order.subtotal} ${currency}`,
    deliveryLine,
  ];
  if (discount > 0) lines.push(`🎟 Скидка (${order.promoCode}): −${discount} ${currency}`);
  lines.push(`💰 Итого: ${finalTotal} ${currency}`, paymentLabel, `─────────────────`);

  return lines.join("\n");
}

// GET /api/orders/address — saved addresses
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

// DELETE /api/orders/address — remove saved address
ordersRouter.delete("/address", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { address } = req.body as { address: string };
  await prisma.address.deleteMany({ where: { tgUserId: user.id, address } });
  return res.json({ ok: true });
});

// GET /api/orders/my — user's own orders
ordersRouter.get("/my", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const orders = await prisma.order.findMany({
    where: { tgUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return res.json(orders);
});

// GET /api/orders/all — admin: all orders
ordersRouter.get("/all", async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return res.json(orders);
});

// PUT /api/orders/:id/status — admin: update status
ordersRouter.put("/:id/status", adminOnly, async (req, res) => {
  const { status } = req.body as { status: "done" | "cancelled" };
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
  });

  // Notify user
  if (order.tgUserId !== "dev") {
    const statusText = status === "done"
      ? "✅ Ваш заказ выполнен! Спасибо за покупку 🙏"
      : "❌ Ваш заказ был отменён. Свяжитесь с нами для уточнения деталей.";
    await tg("sendMessage", { chat_id: order.tgUserId, text: statusText });
  }

  // On first completed order — confirm referral + possibly send reward
  if (status === "done") {
    const prevDone = await prisma.order.count({
      where: { tgUserId: order.tgUserId, status: "done", id: { not: order.id } },
    });
    if (prevDone === 0) {
      await confirmReferral(order.tgUserId);
    }
  }

  return res.json(order);
});

// POST /api/orders — place order
ordersRouter.post("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { items, subtotal, delivery, address, payment, promoCode, discount } = req.body as {
    items: { title: string; flavor?: string; qty: number; price: number; currency: string }[];
    subtotal: number;
    delivery: boolean;
    address?: string;
    payment: "cash" | "card";
    promoCode?: string;
    discount?: number;
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
      promoCode: promoCode ?? null,
      discount: discount ?? null,
    },
  });

  // Save address
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
      text: buildAdminMessage({ ...order, items: order.items as unknown }),
    });
  }

  // Confirm to user
  if (user.id !== "dev") {
    const currency = items[0]?.currency ?? "€";
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const deliveryFee = delivery && totalQty < 3 ? 10 : 0;
    const finalTotal = subtotal + deliveryFee - (discount ?? 0);
    await tg("sendMessage", {
      chat_id: user.id,
      text: `✅ Заказ принят!\n\nСумма: ${finalTotal} ${currency}\nАдминистратор свяжется с вами в ближайшее время.`,
    });
  }

  return res.json({ ok: true, id: order.id });
});
