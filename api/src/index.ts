import Fastify from "fastify";
import "./db/index.js";

const app = Fastify({ logger: true });

// Pluginler
await app.register(import("@fastify/helmet"));
await app.register(import("@fastify/cors"));
await app.register(import("@fastify/rate-limit"), {
  max: 100,
  timeWindow: '1 minute'
});

// Test endpoint
app.get("/", async () => {
    return { pong: "ok" };
});

const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";

try {
    await app.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }