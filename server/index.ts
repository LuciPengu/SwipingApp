import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { spawn } from "child_process";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use('/mcp', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: (path) => `/mcp${path}`,
  on: {
    error: (err, req, res) => {
      console.error('MCP Proxy Error:', err.message);
      if (res && 'writeHead' in res) {
        (res as any).writeHead(502, { 'Content-Type': 'application/json' });
        (res as any).end(JSON.stringify({ error: 'MCP Server unavailable' }));
      }
    }
  }
}));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function startMcpServer() {
  const mcpServerPath = path.resolve(process.cwd(), "mcp_server");
  
  const mcpProcess = spawn("python", ["main.py"], {
    cwd: mcpServerPath,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  mcpProcess.stdout?.on("data", (data) => {
    log(`${data.toString().trim()}`, "mcp-server");
  });

  mcpProcess.stderr?.on("data", (data) => {
    log(`${data.toString().trim()}`, "mcp-server");
  });

  mcpProcess.on("error", (error) => {
    log(`Failed to start MCP server: ${error.message}`, "mcp-server");
  });

  mcpProcess.on("exit", (code) => {
    log(`MCP server exited with code ${code}`, "mcp-server");
    if (code !== 0) {
      log("Restarting MCP server in 5 seconds...", "mcp-server");
      setTimeout(startMcpServer, 5000);
    }
  });

  return mcpProcess;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log("Starting MCP server...", "mcp-server");
  startMcpServer();
  
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
