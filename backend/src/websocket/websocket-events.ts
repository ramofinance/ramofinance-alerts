export const websocketEventTypes = {
  CONNECTION_READY: "connection.ready",
  MESSAGE_RECEIVED: "message.received",
  ALERT_CREATED: "alert.created",
  ALERT_TRIGGERED: "alert.triggered",
  PRICE_UPDATED: "price.updated",
  SYSTEM_HEARTBEAT: "system.heartbeat"
} as const;

export type WebSocketEventType =
  (typeof websocketEventTypes)[keyof typeof websocketEventTypes];

export type WebSocketEvent<TPayload = unknown> = {
  type: WebSocketEventType;
  payload: TPayload;
  timestamp: string;
};

export const createWebSocketEvent = <TPayload>(
  type: WebSocketEventType,
  payload: TPayload
): WebSocketEvent<TPayload> => ({
  type,
  payload,
  timestamp: new Date().toISOString()
});

export const serializeWebSocketEvent = <TPayload>(
  event: WebSocketEvent<TPayload>
) => JSON.stringify(event);
