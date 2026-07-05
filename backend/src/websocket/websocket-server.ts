import { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../utils/logger";
import { setWebSocketServer } from "./websocket-broadcast";
import {
  createWebSocketEvent,
  serializeWebSocketEvent,
  websocketEventTypes
} from "./websocket-events";

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

  setWebSocketServer(wss);

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
      serializeWebSocketEvent(
        createWebSocketEvent(websocketEventTypes.CONNECTION_READY, {
          message: "RAMOFINANCE Alerts WebSocket connected"
        })
      )
    );

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (message) => {
      const messageText = message.toString();

      logger.debug(
        {
          message: messageText
        },
        "WebSocket message received"
      );

      socket.send(
        serializeWebSocketEvent(
          createWebSocketEvent(websocketEventTypes.MESSAGE_RECEIVED, {
            message: messageText
          })
        )
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
