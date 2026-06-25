import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";

export const promosRouter = Router();

// GET /api/promos — list all (admin)
promosRouter.get("/", async (_req, res) => {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(promos);
});

// POST /api/promos — create (admin, protected by adminOnly in index)
promosRouter.post("/", async (req, res) => {
  const { code, type, value, minOrder } = req.body as {
    code: string; type: string; value: number; minOrder?: number;
  };
  if (!code || !type) return res.status(400).json({ error: "code and type required" });
  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        value: Number(value) || 0,
        minOrder: minOrder ? Number(minOrder) : null,
      },
    });
    return res.json(promo);
  } catch {
    return res.status(400).json({ error: "Код уже существует" });
  }
});

// DELETE /api/promos/:id — delete (admin)
promosRouter.delete("/:id", async (req, res) => {
  await prisma.promoCode.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

// Standalone handler for POST /api/promos/apply (public — registered before adminOnly in index)
export async function applyPromo(req: Request, res: Response) {
  const { code, subtotal } = req.body as { code: string; subtotal: number };
  if (!code) return res.json({ valid: false, error: "Введите промокод" });

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!promo || !promo.active) {
    return res.json({ valid: false, error: "Промокод не найден или неактивен" });
  }
  if (promo.minOrder && subtotal < promo.minOrder) {
    return res.json({ valid: false, error: `Минимальная сумма заказа ${promo.minOrder} €` });
  }

  return res.json({
    valid: true,
    type: promo.type,
    value: promo.value,
    code: promo.code,
  });
}
