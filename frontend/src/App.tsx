import { useEffect, useState } from "react";
import { createAlert, deleteAlert, getAlerts } from "./api/alerts";
import { getMarkets } from "./api/markets";
import { updatePrice } from "./api/prices";
import { getTelegramMe } from "./api/telegram";
import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";
import { getAppCopy, getAppDirection } from "./i18n/app-copy";
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
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [marketSearch, setMarketSearch] = useState("");
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertTargetPrice, setNewAlertTargetPrice] = useState("");
  const [testPrice, setTestPrice] = useState("");
  const [newAlertDirection, setNewAlertDirection] = useState<AlertDirection>("ABOVE");
  const [createAlertResult, setCreateAlertResult] = useState<string | null>(null);
  const [deleteAlertResult, setDeleteAlertResult] = useState<string | null>(null);

  const filteredMarkets = markets.filter((market) => {
    const query = marketSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      market.symbol.toLowerCase().includes(query) ||
      (market.name?.toLowerCase().includes(query) ?? false)
    );
  });

  const selectedMarket = markets.find((market) => market.id === selectedMarketId);
  const activeMarket = selectedMarket ?? filteredMarkets[0] ?? markets[0];
  const copy = getAppCopy(appLanguage);
  const appDirection = getAppDirection(appLanguage);

  const loadDashboardData = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [marketsResponse, alertsResponse] = await Promise.all([
        getMarkets(),
        getAlerts(userId ? { userId } : undefined)
      ]);

      setMarkets(marketsResponse.items);
      setSelectedMarketId((currentMarketId) => currentMarketId || marketsResponse.items[0]?.id || "");
      setAlerts(alertsResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      setCreateAlertResult(null);

      if (!backendUser) {
        setCreateAlertResult(copy.telegramNotConnected);
        return;
      }

      if (!activeMarket) {
        setCreateAlertResult(copy.noMarketAvailable);
        return;
      }

      if (!newAlertTargetPrice.trim() || Number.isNaN(Number(newAlertTargetPrice))) {
        setCreateAlertResult(copy.invalidTargetPrice);
        return;
      }

      const cleanTitle =
        newAlertTitle.trim() || `${activeMarket.symbol} ${copy.directions[newAlertDirection]}`;

      const alert = await createAlert({
        userId: backendUser.id,
        marketId: activeMarket.id,
        title: cleanTitle,
        targetPrice: newAlertTargetPrice.trim(),
        direction: newAlertDirection
      });

      setCreateAlertResult(`${copy.createSuccess}: ${alert.title ?? alert.id}`);
      await loadDashboardData(backendUser.id);
    } catch (err) {
      setCreateAlertResult(err instanceof Error ? err.message : copy.createFailed);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      setDeleteAlertResult(null);

      await deleteAlert(alertId);

      setDeleteAlertResult(copy.deleteSuccess);
      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setDeleteAlertResult(err instanceof Error ? err.message : copy.deleteFailed);
    }
  };

  const handlePriceUpdate = async () => {
    try {
      setPriceUpdateResult(null);

      if (!activeMarket) {
        setPriceUpdateResult(copy.noMarketAvailable);
        return;
      }

      if (!testPrice.trim() || Number.isNaN(Number(testPrice))) {
        setPriceUpdateResult(copy.invalidTestPrice);
        return;
      }

      const result = await updatePrice(activeMarket.symbol, testPrice.trim());

      setPriceUpdateResult(
        `${copy.priceUpdated}: ${result.market.symbol} = ${result.price}. ${copy.triggeredAlerts}: ${result.triggeredAlerts.length}`
      );

      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setPriceUpdateResult(err instanceof Error ? err.message : copy.priceUpdateFailed);
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
          setError(err instanceof Error ? err.message : copy.telegramUserFailed);
        });

      return;
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === "price.updated") {
      const payload = lastMessage.payload as { market?: Market };

      if (payload.market?.id) {
        setMarkets((currentMarkets) =>
          currentMarkets.map((market) =>
            market.id === payload.market?.id ? { ...market, ...payload.market } : market
          )
        );
      }
    }

    if (lastMessage.type === "alert.triggered") {
      void loadDashboardData(backendUser?.id);
    }
  }, [lastMessage]);

  const telegramUserLabel = telegramMiniApp.user?.username
    ? `@${telegramMiniApp.user.username}`
    : telegramMiniApp.user?.first_name ?? copy.browser;

  const backendUserLabel = backendUser?.username
    ? `@${backendUser.username}`
    : backendUser?.firstName ?? copy.notConnected;

  return (
    <main className="app-shell" dir={appDirection}>
      <section className="hero-card">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="hero-text">{copy.subtitle}</p>
        </div>

        <div className="status-pill">
          <span className={`status-dot status-dot--${status}`} />
          {status}
        </div>
      </section>

      {error ? <div className="alert-box alert-box--error">{error}</div> : null}

      <section className="grid">
        <article className="card">
          <p className="card-label">{copy.telegramUser}</p>
          <h2>{telegramUserLabel}</h2>
          <p>
            {copy.mode}: {telegramMiniApp.isTelegramMiniApp ? copy.telegram : copy.browser}
          </p>
          <p>
            {copy.language}: {telegramMiniApp.user?.language_code ?? copy.notAvailable}
          </p>
        </article>

        <article className="card">
          <p className="card-label">{copy.backendUser}</p>
          <h2>{backendUserLabel}</h2>
          <p>
            {copy.appLanguage}: {appLanguage ?? copy.notConnected}
          </p>
          <p>
            {copy.alerts}: {alerts.length}
          </p>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">{copy.market}</p>
            <h2>{activeMarket?.symbol ?? copy.noMarket}</h2>
          </div>
          <span className="market-badge">{activeMarket?.type ?? copy.market}</span>
        </div>

        <p className="muted">{activeMarket?.name ?? copy.marketUnavailable}</p>

        {activeMarket?.latestPrice ? (
          <div className="latest-price-box">
            <span>{copy.latestPrice}</span>
            <strong>{activeMarket.latestPrice.price}</strong>
            <small>
              {copy.source}: {activeMarket.latestPrice.source}
            </small>
          </div>
        ) : (
          <div className="latest-price-box latest-price-box--empty">
            <span>{copy.latestPrice}</span>
            <strong>{copy.noLatestPrice}</strong>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">{copy.createAlert}</p>
            <h2>{copy.newAlert}</h2>
          </div>
        </div>

        <div className="form-grid">
          <label>
            {copy.searchMarket}
            <input
              value={marketSearch}
              onChange={(event) => setMarketSearch(event.target.value)}
              placeholder={copy.searchMarketPlaceholder}
            />
          </label>

          <label>
            {copy.selectMarket}
            <select
              value={activeMarket?.id ?? ""}
              onChange={(event) => setSelectedMarketId(event.target.value)}
              disabled={filteredMarkets.length === 0}
            >
              {filteredMarkets.length === 0 ? (
                <option value="">{copy.noMarketFound}</option>
              ) : null}

              {filteredMarkets.map((market) => (
                <option value={market.id} key={market.id}>
                  {market.symbol} - {market.name ?? market.type}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid form-grid--two">
            <label>
              {copy.direction}
              <select
                value={newAlertDirection}
                onChange={(event) => setNewAlertDirection(event.target.value as AlertDirection)}
              >
                <option value="ABOVE">{copy.directions.ABOVE}</option>
                <option value="BELOW">{copy.directions.BELOW}</option>
                <option value="CROSSING_UP">{copy.directions.CROSSING_UP}</option>
                <option value="CROSSING_DOWN">{copy.directions.CROSSING_DOWN}</option>
              </select>
            </label>

            <label>
              {copy.targetPrice}
              <input
                value={newAlertTargetPrice}
                onChange={(event) => setNewAlertTargetPrice(event.target.value)}
                placeholder={copy.targetPricePlaceholder}
                inputMode="decimal"
              />
            </label>
          </div>

          <label>
            {copy.titleLabel}
            <input
              value={newAlertTitle}
              onChange={(event) => setNewAlertTitle(event.target.value)}
              placeholder={copy.optionalTitlePlaceholder}
            />
          </label>

          <div className="alert-preview">
            <span>{copy.preview}</span>
            <strong>
              {activeMarket?.symbol ?? copy.noMarket} · {copy.directions[newAlertDirection]} ·{" "}
              {newAlertTargetPrice || copy.targetPricePlaceholder}
            </strong>
          </div>
        </div>

        <button className="primary-button" type="button" onClick={handleCreateAlert}>
          {copy.createButton}
        </button>

        {createAlertResult ? <div className="alert-box">{createAlertResult}</div> : null}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="card-label">{copy.myAlerts}</p>
            <h2>{loading ? copy.loading : `${alerts.length} ${copy.alerts}`}</h2>
          </div>

          <div className="price-test-box">
            <input
              value={testPrice}
              onChange={(event) => setTestPrice(event.target.value)}
              placeholder={copy.testPricePlaceholder}
              inputMode="decimal"
            />
            <button className="secondary-button" type="button" onClick={handlePriceUpdate}>
              {copy.testPrice}
            </button>
          </div>
        </div>

        {priceUpdateResult ? <div className="alert-box">{priceUpdateResult}</div> : null}
        {deleteAlertResult ? <div className="alert-box">{deleteAlertResult}</div> : null}

        <div className="alerts-list">
          {alerts.length === 0 && !loading ? (
            <p className="empty-state">{copy.noAlerts}</p>
          ) : null}

          {alerts.map((alert) => (
            <article className="alert-item" key={alert.id}>
              <div>
                <h3>{alert.title ?? "Untitled alert"}</h3>
                <p>
                  {alert.market?.symbol ?? alert.marketId} ·{" "}
                  {copy.directions[alert.direction as AlertDirection] ?? alert.direction} ·{" "}
                  {alert.targetPrice}
                </p>
              </div>

              <div className="alert-actions">
                <span className="market-badge">{alert.status}</span>
                <button type="button" onClick={() => handleDeleteAlert(alert.id)}>
                  {copy.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <details className="debug-box">
        <summary>{copy.debug}</summary>
        <p>
          {copy.apiUrl}: {frontendEnv.apiUrl}
        </p>
        <p>
          {copy.websocketUrl}: {frontendEnv.websocketUrl}
        </p>
        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : copy.noMessage}</pre>
      </details>
    </main>
  );
}
