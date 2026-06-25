import type { Request, Response, NextFunction } from "express";
import { verifyInitData, parseInitData } from "../lib/telegram.js";

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  // Pass through GET requests — reading catalog is public
  if (req.method === "GET") return next();

  const adminIds = (process.env.ADMIN_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  // No ADMIN_IDS set → allow in dev, block in production
  if (adminIds.length === 0) {
    if (process.env.NODE_ENV !== "production") return next();
    return res.status(403).json({ error: "Admin access not configured" });
  }

  const initData = req.headers["x-telegram-init-data"] as string | undefined;
  const token    = process.env.BOT_TOKEN ?? "";

  if (!initData) return res.status(403).json({ error: "Forbidden" });

  if (!verifyInitData(initData, token)) return res.status(403).json({ error: "Forbidden" });

  const { user } = parseInitData(initData);
  if (!user || !adminIds.includes(String(user.id))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
