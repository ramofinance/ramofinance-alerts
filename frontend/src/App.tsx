import { useEffect, useState } from "react";
import { createAlert, deleteAlert, getAlerts } from "./api/alerts";
import { getMarkets } from "./api/markets";
import { updatePrice } from "./api/prices";
import { getTelegramMe } from "./api/telegram";
import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";
import { initializeTelegramMiniApp } from "./services/telegram-mini-app";
import type { Alert, AlertDirection, Market, PreferredLanguage, User } from "./types/api";

const directionLabels: Record<AlertDirection, string> = {
  ABOVE: "Above",
  BELOW: "Below",
  CROSSING_UP: "Crossing Up",
  CROSSING_DOWN: "Crossing Down"
};

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
  const [deleteAlertResult, setDeleteAlertResult] = useState<string | null>(null);

  const activeMarket = markets[0];

  const loadDashboardData = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [marketsResponse, alertsResponse] = await Promise.all([
        getMarkets(),
        getAlerts(userId ? { userId } : undefined)
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

      if (!activeMarket) {
        setCreateAlertResult("No market available");
        return;
      }

      const alert = await createAlert({
        userId: backendUser.id,
        marketId: activeMarket.id,
        title: newAlertTitle,
        targetPrice: newAlertTargetPrice,
        direction: newAlertDirection
      });

      setCreateAlertResult(`Alert created: ${alert.title ?? alert.id}`);
      await loadDashboardData(backendUser.id);
    } catch (err) {
      setCreateAlertResult(err instanceof Error ? err.message : "Create alert failed");
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      setDeleteAlertResult(null);

      await deleteAlert(alertId);

      setDeleteAlertResult("Alert deleted");
      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setDeleteAlertResult(err instanceof Error ? err.message : "Delete alert failed");
    }
  };

  const handlePriceUpdate = async () => {
    try {
      setPriceUpdateResult(null);

      const result = await updatePrice("BTCUSDT", "78000");

      setPriceUpdateResult(
        `Price updated: ${result.market.symbol} = ${result.price}. Triggered alerts: ${result.triggeredAlerts.length}`
      );

      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setPriceUpdateResult(err instanceof Error ? err.message : "Price update failed");
    }
  };

  useEffect(() => {
    const currentTelegramMiniApp = initializeTelegramMiniApp();

    setTelegramMiniApp(currentTelegramMiniApp);

    if (currentTelegramMiniApp.initData) {
      getTelegramMe(currentTelegramMiniApp.initData)
        .then(async (data) => {
          setBackendUser(data.user);
          setAppLanguage(data.language);
          await loadDashboardData(data.user.id);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load Telegram user");
        });

      return;
    }

    loadDashboardData();
  }, []);

  const telegramUserLabel = telegramMiniApp.user?.username
    ? `@${telegramMiniApp.user.username}`
    : telegramMiniApp.user?.first_name ?? "Browser preview";

  const backendUserLabel = backendUser?.username
    ? `@${backendUser.username}`
    : backendUser?.firstName ?? "Not connected";

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">RAMOFINANCE</p>
          <h1>Alerts Mini App</h1>
          <p className="hero-text">
            Create, manage and test your market alerts directly inside Telegram.
          </p>
        </div>

        <div className="status-pill">
          <span className={`status-dot status-dot--${status}`} />
          {status}
        </div>
      </section>

      {error ? <div className="alert-box alert-box--error">{error}</div> : null}

      <section className="grid">
        <article className="card">
          <p className="card-label">Telegram User</p>
          <h2>{telegramUserLabel}</h2>
          <p>Mode: {telegramMiniApp.isTelegramMiniApp ? "Telegram" : "Browser"}</p>
          <p>Language: {telegramMiniApp.user?.language_code ?? "Not available"}</p>
        </article>

        <article className="card">
          <p className="card-label">Backend User</p>
          <h2>{backendUserLabel}</h2>
          <p>App Language: {appLanguage ?? "Not connected"}</p>
          <p>Alerts: {alerts.length}</p>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">Market</p>
            <h2>{activeMarket?.symbol ?? "No market"}</h2>
          </div>
          <span className="market-badge">{activeMarket?.type ?? "Market"}</span>
        </div>

        <p className="muted">{activeMarket?.name ?? "Market data is not available yet."}</p>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">Create Alert</p>
            <h2>New BTCUSDT Alert</h2>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Title
            <input
              value={newAlertTitle}
              onChange={(event) => setNewAlertTitle(event.target.value)}
              placeholder="Alert title"
            />
          </label>

          <label>
            Target Price
            <input
              value={newAlertTargetPrice}
              onChange={(event) => setNewAlertTargetPrice(event.target.value)}
              placeholder="Target price"
              inputMode="decimal"
            />
          </label>

          <label>
            Direction
            <select
              value={newAlertDirection}
              onChange={(event) => setNewAlertDirection(event.target.value as AlertDirection)}
            >
              <option value="ABOVE">Above</option>
              <option value="BELOW">Below</option>
              <option value="CROSSING_UP">Crossing Up</option>
              <option value="CROSSING_DOWN">Crossing Down</option>
            </select>
          </label>
        </div>

        <button className="primary-button" type="button" onClick={handleCreateAlert}>
          Create Alert
        </button>

        {createAlertResult ? <div className="alert-box">{createAlertResult}</div> : null}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">My Alerts</p>
            <h2>{loading ? "Loading..." : `${alerts.length} alerts`}</h2>
          </div>

          <button className="secondary-button" type="button" onClick={handlePriceUpdate}>
            Test Price
          </button>
        </div>

        {priceUpdateResult ? <div className="alert-box">{priceUpdateResult}</div> : null}
        {deleteAlertResult ? <div className="alert-box">{deleteAlertResult}</div> : null}

        <div className="alerts-list">
          {alerts.length === 0 && !loading ? (
            <p className="empty-state">No alerts yet. Create your first alert above.</p>
          ) : null}

          {alerts.map((alert) => (
            <article className="alert-item" key={alert.id}>
              <div>
                <h3>{alert.title ?? "Untitled alert"}</h3>
                <p>
                  {alert.market?.symbol ?? alert.marketId} · {directionLabels[alert.direction as AlertDirection] ?? alert.direction} ·{" "}
                  {alert.targetPrice}
                </p>
              </div>

              <div className="alert-actions">
                <span className="market-badge">{alert.status}</span>
                <button type="button" onClick={() => handleDeleteAlert(alert.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <details className="debug-box">
        <summary>Debug</summary>
        <p>API URL: {frontendEnv.apiUrl}</p>
        <p>WebSocket URL: {frontendEnv.websocketUrl}</p>
        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : "No message yet"}</pre>
      </details>
    </main>
  );
}
