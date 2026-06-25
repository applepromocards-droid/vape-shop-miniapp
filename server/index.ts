import express from "express";
import cors from "cors";
import { join } from "path";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { heroRouter } from "./routes/hero.js";
import { resetRouter } from "./routes/reset.js";
import { botRouter } from "./routes/bot.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" })); // large enough for base64 images

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/hero", heroRouter);
app.use("/api/reset", resetRouter);
app.use("/api/bot", botRouter);
app.use("/api/auth", authRouter);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const distPath = join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(join(distPath, "index.html")));
}

app.listen(PORT, () => console.log(`Server on :${PORT}`));
