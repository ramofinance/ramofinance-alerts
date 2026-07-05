import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../utils/logger";

type AliveWebSocket = WebSocket & {
  isAlive?: boolean;
};

const WS_PATH = "/ws";
const HEARTBEAT_INTERVAL_MS = 30_000;

export const setupWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({
    server,
    path: WS_PATH
  });

  wss.on("connection", (socket: AliveWebSocket, request) => {
    socket.isAlive = true;

    logger.info(
      {
        path: request.url,
        clients: wss.clients.size
      },
      "WebSocket client connected"
    );

    socket.send(
      JSON.stringify({
        type: "connection.ready",
        payload: {
          message: "RAMOFINANCE Alerts WebSocket connected"
        }
      })
    );

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (message) => {
      logger.debug(
        {
          message: message.toString()
        },
        "WebSocket message received"
      );

      socket.send(
        JSON.stringify({
          type: "message.received",
          payload: {
            message: message.toString()
          }
        })
      );
    });

    socket.on("close", () => {
      logger.info(
        {
          clients: wss.clients.size
        },
        "WebSocket client disconnected"
      );
    });

    socket.on("error", (error) => {
      logger.error(
        {
          error
        },
        "WebSocket client error"
      );
    });
  });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const socket = client as AliveWebSocket;

      if (!socket.isAlive) {
        socket.terminate();
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  logger.info(
    {
      path: WS_PATH
    },
    "WebSocket server initialized"
  );

  return wss;
};
