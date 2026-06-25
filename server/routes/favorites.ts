import { Router } from "express";
import type { Request } from "express";
import prisma from "../lib/prisma.js";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export const favoritesRouter = Router();

function getUser(req: Request) {
  const initData = req.headers["x-telegram-init-data"] as string | undefined;
  const token = process.env.BOT_TOKEN ?? "";
  if (!initData) {
    if (process.env.NODE_ENV !== "production") return { id: "dev" };
    return null;
  }
  if (!verifyInitData(initData, token)) return null;
  const { user } = parseInitData(initData);
  return user ? { id: String(user.id) } : null;
}

// GET /api/favorites — user's favorited productIds
favoritesRouter.get("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const favs = await prisma.favorite.findMany({
    where: { tgUserId: user.id },
    select: { productId: true },
  });
  return res.json(favs.map((f) => f.productId));
});

// POST /api/favorites/:productId — add
favoritesRouter.post("/:productId", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  await prisma.favorite.upsert({
    where: { tgUserId_productId: { tgUserId: user.id, productId: req.params.productId } },
    update: {},
    create: { tgUserId: user.id, productId: req.params.productId },
  });
  return res.json({ ok: true });
});

// DELETE /api/favorites/:productId — remove
favoritesRouter.delete("/:productId", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  await prisma.favorite.deleteMany({
    where: { tgUserId: user.id, productId: req.params.productId },
  });
  return res.json({ ok: true });
});
