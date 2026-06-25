import { Router } from "express";
import prisma from "../lib/prisma.js";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: { flavors: { orderBy: { ord: "asc" } } },
    orderBy: { ord: "asc" },
  });
  res.json(products);
});

productsRouter.post("/", async (req, res) => {
  const { title, price, currency, emoji, categoryId, puffs, badge, inStock, image, flavors } = req.body;
  const count = await prisma.product.count();
  const product = await prisma.product.create({
    data: {
      title, price, currency, emoji, categoryId,
      puffs: puffs || null, badge: badge || null,
      inStock, image: image || null, ord: count,
      flavors: {
        create: (flavors ?? []).map((f: { id?: string; name: string; inStock: boolean }, i: number) => ({
          name: f.name, inStock: f.inStock, ord: i,
        })),
      },
    },
    include: { flavors: { orderBy: { ord: "asc" } } },
  });
  res.json(product);
});

productsRouter.put("/:id", async (req, res) => {
  const { title, price, currency, emoji, categoryId, puffs, badge, inStock, image, flavors } = req.body;
  await prisma.flavor.deleteMany({ where: { productId: req.params.id } });
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      title, price, currency, emoji, categoryId,
      puffs: puffs || null, badge: badge || null,
      inStock, image: image || null,
      flavors: {
        create: (flavors ?? []).map((f: { name: string; inStock: boolean }, i: number) => ({
          name: f.name, inStock: f.inStock, ord: i,
        })),
      },
    },
    include: { flavors: { orderBy: { ord: "asc" } } },
  });
  res.json(product);
});

productsRouter.delete("/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
