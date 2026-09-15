import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { registerSockets } from "./sockets/index.js";
import logger from "./utils/logger.js";
import { schedulePendingDeliveryMessages } from "./services/order-automation.service.js";
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.clientUrl, credentials: true }
});
app.set("io", io);
registerSockets(io);
await connectDB();
await schedulePendingDeliveryMessages(io);
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${env.port} is already in use. npm run dev now frees the port automatically; if another non-FoodGo service owns it, stop that service or change PORT.`);
    process.exit(1);
  }
  logger.error(error);
  process.exit(1);
});
server.listen(env.port, () => {
  logger.info(`FoodGo API running on http://localhost:${env.port}`);
  logger.info(`Swagger docs: http://localhost:${env.port}/api/docs`);
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
