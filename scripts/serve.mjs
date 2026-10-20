import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const port = Number(process.env.PORT) || 4173;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, "." + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      try {
        if ((await stat(file)).isDirectory())
          file = path.join(file, "index.html");
      } catch {
        if (path.extname(file)) {
          res.writeHead(404);
          res.end("Không tìm thấy");
          return;
        }
        file = path.join(root, "index.html");
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("Chưa có bản build. Hãy chạy npm run build.");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Imposter: http://127.0.0.1:${port}/`),
  )
  .on("error", (e) => {
    if (e.code === "EADDRINUSE")
      console.log(`Cổng ${port} đang dùng. Thử mở http://127.0.0.1:${port}/`);
    else console.error(e.message);
  });
