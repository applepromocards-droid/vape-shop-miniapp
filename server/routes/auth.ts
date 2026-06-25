import { Router } from "express";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export const authRouter = Router();

authRouter.post("/verify", (req, res) => {
  const { initData } = req.body as { initData?: string };
  const token = process.env.BOT_TOKEN ?? "";

  if (!initData) return res.status(400).json({ ok: false, error: "no initData" });

  const valid = verifyInitData(initData, token);
  if (!valid) return res.status(401).json({ ok: false, error: "invalid" });

  const { user } = parseInitData(initData);
  return res.json({ ok: true, user });
});
