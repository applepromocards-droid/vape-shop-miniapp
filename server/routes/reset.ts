import { Router } from "express";
import prisma from "../lib/prisma.js";
import { CATEGORIES, PRODUCTS } from "../../src/data/catalog.js";

export const resetRouter = Router();

resetRouter.post("/", async (_req, res) => {
  await prisma.flavor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.hero.deleteMany();

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.create({
      data: { id: c.id, title: c.title, subtitle: c.subtitle ?? null, emoji: c.emoji, image: c.image ?? null, ord: i },
    });
  }

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    await prisma.product.create({
      data: {
        id: p.id, categoryId: p.categoryId, title: p.title,
        price: p.price, currency: p.currency, emoji: p.emoji,
        image: p.image ?? null, puffs: p.puffs ?? null,
        badge: p.badge ?? null, inStock: p.inStock, ord: i,
        flavors: {
          create: (p.flavors ?? []).map((f, j) => ({ id: f.id, name: f.name, inStock: f.inStock, ord: j })),
        },
      },
    });
  }

  await prisma.hero.create({
    data: { id: "singleton", visible: true, tag: "НОВИНКА", title: "Elf Bar\nSweet King", subtitle: "30 000 затяжек · 4 вкуса" },
  });

  res.json({ ok: true });
});
