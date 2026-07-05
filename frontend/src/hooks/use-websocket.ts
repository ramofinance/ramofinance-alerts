import { useEffect, useState } from "react";

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

type WebSocketMessage = {
  type: string;
  payload?: unknown;
};

export const useWebSocket = (url: string) => {
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    setStatus("connecting");

    socket.addEventListener("open", () => {
      setStatus("connected");
      socket.send("frontend connected");
    });

    socket.addEventListener("message", (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage({
          type: "raw.message",
          payload: event.data
        });
      }
    });

    socket.addEventListener("close", () => {
      setStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setStatus("error");
    });

    return () => {
      socket.close();
    };
  }, [url]);

  return {
    status,
    lastMessage
  };
};
