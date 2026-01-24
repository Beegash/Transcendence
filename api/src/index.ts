import Fastify from "fastify";
import "./db/index.js";

// Import plugins
import fastifyCookie from "@fastify/cookie";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import gameRoutes from "./routes/game.js";
import tournamentRoutes from "./routes/tournament.js";
import statsRoutes from "./routes/stats.js";
import presenceRoutes from "./routes/presence.js";

const app = Fastify({ logger: true });

// Global error handler - prevents stack trace leaks and provides consistent error responses
app.setErrorHandler((error, request, reply) => {
  // Log the error for debugging
  app.log.error({
    err: error,
    requestId: request.id,
    url: request.url,
    method: request.method,
  });

  // Handle specific error types
  if (error.validation) {
    // Fastify validation error
    return reply.status(400).send({
      error: 'Validation error',
      details: error.validation.map(v => v.message).join(', '),
    });
  }

  // Handle known HTTP errors
  const statusCode = error.statusCode || 500;
  
  // Don't leak internal error messages in production
  const message = statusCode >= 500 
    ? 'Internal server error' 
    : error.message || 'An error occurred';

  return reply.status(statusCode).send({ error: message });
});

// 404 handler for undefined routes
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ error: 'Route not found' });
});

// Plugins
await app.register(import("@fastify/helmet"), {
  contentSecurityPolicy: false, // Disable for WebSocket compatibility
});
await app.register(import("@fastify/cors"), {
  origin: true,
  credentials: true,
});
await app.register(import("@fastify/rate-limit"), {
  max: 500,
  timeWindow: '1 minute'
});
await app.register(fastifyCookie, {
  secret: process.env.JWT_SECRET || 'cookie-secret',
});
await app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
});
await app.register(fastifyWebsocket);

// Routes
await app.register(authRoutes, { prefix: '/auth' });
await app.register(userRoutes, { prefix: '/users' });
await app.register(gameRoutes, { prefix: '/game' });
await app.register(tournamentRoutes, { prefix: '/tournaments' });
await app.register(statsRoutes, { prefix: '/stats' });
await app.register(presenceRoutes, { prefix: '/presence' });

// Serve static uploads - only for /uploads/ path
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
await app.register(import('@fastify/static'), {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// Health check endpoint
app.get("/", async () => {
  return { status: "ok", service: "ft_transcendence-api" };
});

app.get("/health", async () => {
  return { status: "healthy" };
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
