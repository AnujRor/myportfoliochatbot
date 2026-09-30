import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import chatHandler from "./api/chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const isProduction = process.env.NODE_ENV === "production";
const app = express();

app.use(express.json({ limit: "128kb" }));
app.post("/api/chat", chatHandler);

if (isProduction) {
  const publicDir = path.join(__dirname, "dist/public");
  app.use(express.static(publicDir));
  app.use((_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(__dirname, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }

    try {
      const template = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Anuj's AI Assistant listening on port ${port}`);
});