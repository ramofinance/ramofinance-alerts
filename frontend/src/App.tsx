import { useEffect, useState } from "react";
import { createAlert, getAlerts } from "./api/alerts";
import { getMarkets } from "./api/markets";
import { updatePrice } from "./api/prices";
import { getTelegramMe } from "./api/telegram";
import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";
import { initializeTelegramMiniApp } from "./services/telegram-mini-app";
import type { Alert, AlertDirection, Market, PreferredLanguage, User } from "./types/api";

export default function App() {
  const { status, lastMessage } = useWebSocket(frontendEnv.websocketUrl);
  const [telegramMiniApp, setTelegramMiniApp] = useState(() => initializeTelegramMiniApp());

  const [markets, setMarkets] = useState<Market[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceUpdateResult, setPriceUpdateResult] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [appLanguage, setAppLanguage] = useState<PreferredLanguage | null>(null);
  const [newAlertTitle, setNewAlertTitle] = useState("Mini App BTC Alert");
  const [newAlertTargetPrice, setNewAlertTargetPrice] = useState("80000");
  const [newAlertDirection, setNewAlertDirection] = useState<AlertDirection>("ABOVE");
  const [createAlertResult, setCreateAlertResult] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [marketsResponse, alertsResponse] = await Promise.all([
        getMarkets(),
        getAlerts()
      ]);

      setMarkets(marketsResponse.items);
      setAlerts(alertsResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      setCreateAlertResult(null);

      if (!backendUser) {
        setCreateAlertResult("Telegram backend user is not connected");
        return;
      }

      const market = markets[0];

      if (!market) {
        setCreateAlertResult("No market available");
        return;
      }

      const alert = await createAlert({
        userId: backendUser.id,
        marketId: market.id,
        title: newAlertTitle,
        targetPrice: newAlertTargetPrice,
        direction: newAlertDirection
      });

      setCreateAlertResult(`Alert created: ${alert.title ?? alert.id}`);
      await loadDashboardData();
    } catch (err) {
      setCreateAlertResult(err instanceof Error ? err.message : "Create alert failed");
    }
  };

  const handlePriceUpdate = async () => {
    try {
      setPriceUpdateResult(null);

      const result = await updatePrice("BTCUSDT", "78000");

      setPriceUpdateResult(
        `Price updated: ${result.market.symbol} = ${result.price}. Triggered alerts: ${result.triggeredAlerts.length}`
      );

      await loadDashboardData();
    } catch (err) {
      setPriceUpdateResult(err instanceof Error ? err.message : "Price update failed");
    }
  };

  useEffect(() => {
    const currentTelegramMiniApp = initializeTelegramMiniApp();

    setTelegramMiniApp(currentTelegramMiniApp);

    if (currentTelegramMiniApp.initData) {
      getTelegramMe(currentTelegramMiniApp.initData)
        .then((data) => {
          setBackendUser(data.user);
          setAppLanguage(data.language);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load Telegram user");
        });
    }

    loadDashboardData();
  }, []);

  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: 24 }}>
      <h1>RAMOFINANCE Alerts</h1>

      <section>
        <h2>Telegram Mini App</h2>
        <p>Mode: {telegramMiniApp.isTelegramMiniApp ? "Telegram" : "Browser"}</p>
        <p>User: {telegramMiniApp.user?.username ? `@${telegramMiniApp.user.username}` : telegramMiniApp.user?.first_name ?? "Not available"}</p>
        <p>Language: {telegramMiniApp.user?.language_code ?? "Not available"}</p>
        <p>Backend User: {backendUser?.username ? `@${backendUser.username}` : backendUser?.firstName ?? "Not connected"}</p>
        <p>App Language: {appLanguage ?? "Not connected"}</p>
      </section>

      <section>
        <h2>Realtime Connection</h2>
        <p>Status: {status}</p>
        <p>API URL: {frontendEnv.apiUrl}</p>
        <p>WebSocket URL: {frontendEnv.websocketUrl}</p>

        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : "No message yet"}</pre>
      </section>

      <section>
        <h2>Markets</h2>
        {loading ? <p>Loading...</p> : null}
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <ul>
          {markets.map((market) => (
            <li key={market.id}>
              {market.symbol} — {market.name ?? "No name"} — {market.type}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Create Alert</h2>

        <div>
          <input
            value={newAlertTitle}
            onChange={(event) => setNewAlertTitle(event.target.value)}
            placeholder="Alert title"
          />
        </div>

        <div>
          <input
            value={newAlertTargetPrice}
            onChange={(event) => setNewAlertTargetPrice(event.target.value)}
            placeholder="Target price"
          />
        </div>

        <div>
          <select
            value={newAlertDirection}
            onChange={(event) => setNewAlertDirection(event.target.value as AlertDirection)}
          >
            <option value="ABOVE">ABOVE</option>
            <option value="BELOW">BELOW</option>
            <option value="CROSSING_UP">CROSSING_UP</option>
            <option value="CROSSING_DOWN">CROSSING_DOWN</option>
          </select>
        </div>

        <button type="button" onClick={handleCreateAlert}>
          Create BTCUSDT Alert
        </button>

        {createAlertResult ? <p>{createAlertResult}</p> : null}
      </section>

      <section>
        <h2>Alerts</h2>

        <button type="button" onClick={handlePriceUpdate}>
          Test BTCUSDT Price Update
        </button>

        {priceUpdateResult ? <p>{priceUpdateResult}</p> : null}

        <ul>
          {alerts.map((alert) => (
            <li key={alert.id}>
              {alert.title ?? "Untitled alert"} — {alert.market?.symbol ?? alert.marketId} —{" "}
              {alert.direction} {alert.targetPrice} — {alert.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
