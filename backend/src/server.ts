import { createServer } from "./app";
import { env } from "./config/env";
import { prisma } from "./database/prisma";
import { logger } from "./utils/logger";
import { startPricePolling, stopPricePolling } from "./modules/price-engine/price-poller.service";
import { setupWebSocketServer } from "./websocket/websocket-server";

const app = createServer();
const port = env.PORT ?? env.BACKEND_PORT;

const server = app.listen(port, () => {
  logger.info(`Backend running on port ${port}`);
});

setupWebSocketServer(server);
startPricePolling();

const shutdown = async () => {
  logger.info("Shutting down backend server");

  stopPricePolling();

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
