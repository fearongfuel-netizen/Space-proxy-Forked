import dotenv from "dotenv";
import fastifyHelmet from "@fastify/helmet";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import wisp from "wisp-server-node";
import { join } from "node:path";
import { access } from "node:fs/promises";
import { createBareServer } from "@tomphttp/bare-server-node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { bareModulePath } from "@mercuryworkshop/bare-as-module3";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { MasqrMiddleware } from "./masqr.js";

dotenv.config();

const port = process.env.PORT || 2345;
const bare = createBareServer("/seal/");
const app = Fastify({ logger: false });

// 1. Handle Bare and Wisp (The Proxy stuff)
app.addHook('onReady', () => {
  app.server.on("upgrade", (req, sock, head) => {
    if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, sock, head);
    } else if (req.url.endsWith("/wisp/")) {
      wisp.routeRequest(req, sock, head);
    } else {
      sock.end();
    }
  });

  app.server.on("request", (req, res) => {
    if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  });
});

// 2. Middleware & Security
await app.register(fastifyHelmet, { contentSecurityPolicy: false });
await app.register(fastifyCookie);

if (process.env.MASQR === "true") {
  app.addHook("onRequest", MasqrMiddleware);
}

// 3. Static Files
const staticRoutes = [
  { root: join(import.meta.dirname, "public"), prefix: "/" },
  { root: libcurlPath, prefix: "/libcurl/" },
  { root: epoxyPath, prefix: "/epoxy/" },
  { root: baremuxPath, prefix: "/baremux/" },
  { root: bareModulePath, prefix: "/baremod/" },
  { root: uvPath, prefix: "/_uv/" }
];

for (const r of staticRoutes) {
  await app.register(fastifyStatic, { ...r, decorateReply: false });
}

// 4. Routes
app.get("/", async (req, reply) => reply.sendFile("index.html"));
app.get("/&", async (req, reply) => reply.sendFile("&.html"));
app.get("/~", async (req, reply) => reply.sendFile("~.html"));
app.get("/g", async (req, reply) => reply.sendFile("g.html"));
app.get("/a", async (req, reply) => reply.sendFile("a.html"));
app.get("/c", async (req, reply) => reply.sendFile("chat.html"));
app.get("/password", async (req, reply) => reply.sendFile("password.html"));

// 5. Start the server the "Fastify Way"
app.listen({ port: port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on ${address}`);
});
