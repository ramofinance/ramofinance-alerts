import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";

export default function App() {
  const { status, lastMessage } = useWebSocket(frontendEnv.websocketUrl);

  return (
    <main>
      <h1>RAMOFINANCE Alerts</h1>

      <section>
        <h2>Realtime Connection</h2>
        <p>Status: {status}</p>
        <p>WebSocket URL: {frontendEnv.websocketUrl}</p>

        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : "No message yet"}</pre>
      </section>
    </main>
  );
}
