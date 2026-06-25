import { Router } from "express";
import prisma from "../lib/prisma.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { ord: "asc" } });
  res.json(cats);
});

categoriesRouter.post("/", async (req, res) => {
  const { title, subtitle, emoji, image } = req.body;
  const count = await prisma.category.count();
  const cat = await prisma.category.create({
    data: { title, subtitle: subtitle || null, emoji, image: image || null, ord: count },
  });
  res.json(cat);
});

categoriesRouter.put("/:id", async (req, res) => {
  const { title, subtitle, emoji, image } = req.body;
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: { title, subtitle: subtitle || null, emoji, image: image || null },
  });
  res.json(cat);
});

categoriesRouter.delete("/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
