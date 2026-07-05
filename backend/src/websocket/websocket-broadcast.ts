import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../utils/logger";
import {
  createWebSocketEvent,
  serializeWebSocketEvent,
  type WebSocketEventType
} from "./websocket-events";

let websocketServer: WebSocketServer | null = null;

export const setWebSocketServer = (server: WebSocketServer) => {
  websocketServer = server;
};

export const getConnectedWebSocketClientsCount = () => {
  return websocketServer?.clients.size ?? 0;
};

export const broadcastWebSocketEvent = <TPayload>(
  type: WebSocketEventType,
  payload: TPayload
) => {
  if (!websocketServer) {
    logger.warn({ type }, "WebSocket broadcast skipped because server is not ready");
    return;
  }

  const message = serializeWebSocketEvent(createWebSocketEvent(type, payload));

  websocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  logger.debug(
    {
      type,
      clients: websocketServer.clients.size
    },
    "WebSocket event broadcasted"
  );
};
