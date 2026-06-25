import { Router } from "express";
import prisma from "../lib/prisma.js";

export const heroRouter = Router();

heroRouter.get("/", async (_req, res) => {
  let hero = await prisma.hero.findUnique({ where: { id: "singleton" } });
  if (!hero) {
    hero = await prisma.hero.create({
      data: { id: "singleton", visible: true, tag: "НОВИНКА", title: "Elf Bar\nSweet King", subtitle: "30 000 затяжек · 4 вкуса" },
    });
  }
  res.json({
    visible: hero.visible,
    tag: hero.tag,
    title: hero.title,
    subtitle: hero.subtitle,
    image: hero.image ?? undefined,
    imagePosition: hero.imagePosX != null ? { x: hero.imagePosX, y: hero.imagePosY } : undefined,
    imageZoom: hero.imageZoom ?? undefined,
  });
});

heroRouter.put("/", async (req, res) => {
  const { visible, tag, title, subtitle, image, imagePosition, imageZoom } = req.body;
  await prisma.hero.upsert({
    where: { id: "singleton" },
    update: {
      visible, tag, title, subtitle,
      image: image ?? null,
      imagePosX: imagePosition?.x ?? null,
      imagePosY: imagePosition?.y ?? null,
      imageZoom: imageZoom ?? null,
    },
    create: {
      id: "singleton", visible, tag, title, subtitle,
      image: image ?? null,
      imagePosX: imagePosition?.x ?? null,
      imagePosY: imagePosition?.y ?? null,
      imageZoom: imageZoom ?? null,
    },
  });
  res.json({ ok: true });
});
