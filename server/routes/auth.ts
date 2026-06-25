import { Router } from "express";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export const authRouter = Router();

function getAdminIds(): string[] {
  return (process.env.ADMIN_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

authRouter.post("/verify", (req, res) => {
  const { initData } = req.body as { initData?: string };
  const token = process.env.BOT_TOKEN ?? "";

  if (!initData) return res.status(400).json({ ok: false, error: "no initData" });

  const valid = verifyInitData(initData, token);
  if (!valid) return res.status(401).json({ ok: false, error: "invalid" });

  const { user } = parseInitData(initData);
  return res.json({ ok: true, user });
});

authRouter.post("/is-admin", (req, res) => {
  const { initData } = req.body as { initData?: string };
  const token = process.env.BOT_TOKEN ?? "";
  const adminIds = getAdminIds();

  // No ADMIN_IDS configured → only allow in dev (local testing)
  if (adminIds.length === 0) {
    return res.json({ isAdmin: process.env.NODE_ENV !== "production" });
  }

  if (!initData) return res.json({ isAdmin: false });

  const valid = verifyInitData(initData, token);
  if (!valid) return res.json({ isAdmin: false });

  const { user } = parseInitData(initData);
  const isAdmin = user ? adminIds.includes(String(user.id)) : false;
  return res.json({ isAdmin, userId: user?.id });
});
