import express from "express";
import cors from "cors";
import { join } from "path";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { heroRouter } from "./routes/hero.js";
import { resetRouter } from "./routes/reset.js";
import { botRouter } from "./routes/bot.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { promosRouter, applyPromo } from "./routes/promos.js";
import { favoritesRouter } from "./routes/favorites.js";
import { referralsRouter } from "./routes/referrals.js";
import { adminOnly } from "./middleware/adminOnly.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Public config endpoint
app.get("/api/config", (_req, res) => {
  const supportUrl = process.env.SUPPORT_URL ?? "";
  res.json({ supportUrl });
});

// Public promo check (must be before adminOnly promos router)
app.post("/api/promos/apply", applyPromo);

// Protected routes
app.use("/api/categories", adminOnly, categoriesRouter);
app.use("/api/products",   adminOnly, productsRouter);
app.use("/api/hero",       adminOnly, heroRouter);
app.use("/api/reset",      adminOnly, resetRouter);
app.use("/api/promos",     adminOnly, promosRouter);

// Semi-public (own auth per-route)
app.use("/api/orders",    ordersRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/bot",    botRouter);
app.use("/api/auth",   authRouter);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const distPath = join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(join(distPath, "index.html")));
}

app.listen(PORT, () => console.log(`Server on :${PORT}`));
