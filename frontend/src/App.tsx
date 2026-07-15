import { useEffect, useState } from "react";
import { createAlert, deleteAlert, getAlerts, updateAlert, updateAlertStatus } from "./api/alerts";
import { getMarkets } from "./api/markets";
import { getPriceHistory, updatePrice } from "./api/prices";
import { getTelegramMe } from "./api/telegram";
import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";
import { LiveMarketChart } from "./components/LiveMarketChart";
import { AlertsList } from "./components/AlertsList";
import { BottomTabs } from "./components/BottomTabs";
import { CreateAlertCard } from "./components/CreateAlertCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { useAlerts } from "./hooks/useAlerts";
import { HomePanel } from "./components/HomePanel";
import { getAppCopy, getAppDirection } from "./i18n/app-copy";
import { initializeTelegramMiniApp } from "./services/telegram-mini-app";
import type { Alert, AlertDirection, AlertStatus, Market, PreferredLanguage, User, MarketPriceHistory } from "./types/api";

export default function App() {
  const { status, lastMessage } = useWebSocket(frontendEnv.websocketUrl);
  const [telegramMiniApp, setTelegramMiniApp] = useState(() => initializeTelegramMiniApp());

  const [markets, setMarkets] = useState<Market[]>([]);
  const [priceHistory, setPriceHistory] = useState<MarketPriceHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceUpdateResult, setPriceUpdateResult] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [appLanguage, setAppLanguage] = useState<PreferredLanguage | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [activeTab, setActiveTab] = useState<"HOME" | "CHART" | "ALERTS" | "SETTINGS">("HOME");
  const [marketSearch, setMarketSearch] = useState("");


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

  const alertState = useAlerts({
    alerts,
    userId: backendUser?.id,
    activeMarket,
    copy,
    reload: loadDashboardData
  });

  const {
    filteredAlerts,
    alertStats,
    newAlertTitle,
    setNewAlertTitle,
    newAlertTargetPrice,
    setNewAlertTargetPrice,
    newAlertDirection,
    setNewAlertDirection,
    testPrice,
    setTestPrice,
    alertStatusFilter,
    setAlertStatusFilter,
    createAlertResult,
    setCreateAlertResult,
    deleteAlertResult,
    setDeleteAlertResult,
    editingAlertId,
    setEditingAlertId,
    editAlertTitle,
    setEditAlertTitle,
    editAlertTargetPrice,
    setEditAlertTargetPrice,
    editAlertDirection,
    setEditAlertDirection,
    handleStartEditAlert,
    handleCancelEditAlert
  } = alertState;

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

  const handleSaveAlertUpdate = async (alertId: string) => {
    try {
      setDeleteAlertResult(null);

      if (!editAlertTargetPrice.trim() || Number.isNaN(Number(editAlertTargetPrice))) {
        setDeleteAlertResult(copy.invalidTargetPrice);
        return;
      }

      await updateAlert(alertId, {
        title: editAlertTitle.trim() || null,
        targetPrice: editAlertTargetPrice.trim(),
        direction: editAlertDirection
      });

      setDeleteAlertResult(copy.updateSuccess);
      handleCancelEditAlert();
      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setDeleteAlertResult(err instanceof Error ? err.message : copy.updateFailed);
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

  const handleToggleAlertStatus = async (alert: Alert) => {
    try {
      setDeleteAlertResult(null);

      const nextStatus: AlertStatus = alert.status === "PAUSED" ? "ACTIVE" : "PAUSED";

      await updateAlertStatus(alert.id, nextStatus);

      setDeleteAlertResult(nextStatus === "PAUSED" ? copy.pauseSuccess : copy.resumeSuccess);
      await loadDashboardData(backendUser?.id);
    } catch (err) {
      setDeleteAlertResult(err instanceof Error ? err.message : copy.statusUpdateFailed);
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
    let cancelled = false;

    if (!activeMarket?.symbol) {
      setPriceHistory([]);
      return () => {
        cancelled = true;
      };
    }

    getPriceHistory(activeMarket.symbol, 120)
      .then((result) => {
        if (!cancelled) {
          setPriceHistory(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceHistory([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeMarket?.symbol]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === "price.updated") {
      const payload = lastMessage.payload as {
        market?: Market;
        price?: number;
      };

      if (payload.market?.id) {
        setMarkets((currentMarkets) =>
          currentMarkets.map((market) =>
            market.id === payload.market?.id ? { ...market, ...payload.market } : market
          )
        );

        if (payload.market.id === activeMarket?.id) {
          if (payload.price !== undefined) {
            setPriceHistory((currentHistory) => [
              ...currentHistory.slice(-119),
              {
                id: `${Date.now()}`,
                marketId: payload.market!.id,
                price: String(payload.price),
                source: "websocket",
                observedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
              }
            ]);
          }
        }
      }
    }

    if (lastMessage.type === "alert.created" || lastMessage.type === "alert.updated") {
      const payload = lastMessage.payload as { alert?: Alert };

      if (payload.alert?.userId === backendUser?.id) {
        setAlerts((currentAlerts) => {
          const exists = currentAlerts.some((alert) => alert.id === payload.alert?.id);

          if (!exists && payload.alert) {
            return [payload.alert, ...currentAlerts];
          }

          return currentAlerts.map((alert) =>
            alert.id === payload.alert?.id && payload.alert ? payload.alert : alert
          );
        });
      }
    }

    if (lastMessage.type === "alert.deleted") {
      const payload = lastMessage.payload as { alert?: Alert };

      if (payload.alert?.userId === backendUser?.id) {
        setAlerts((currentAlerts) =>
          currentAlerts.filter((alert) => alert.id !== payload.alert?.id)
        );
      }
    }

    if (lastMessage.type === "alert.triggered") {
      void loadDashboardData(backendUser?.id);
    }
  }, [lastMessage, backendUser?.id]);

  const telegramUserLabel = telegramMiniApp.user?.username
    ? `@${telegramMiniApp.user.username}`
    : telegramMiniApp.user?.first_name ?? copy.browser;

  const backendUserLabel = backendUser?.username
    ? `@${backendUser.username}`
    : backendUser?.firstName ?? copy.notConnected;

  return (
    <main className="app-shell" dir={appDirection}>
      <BottomTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        copy={copy}
      />
      {activeTab === "HOME" ? (
      <>
      <HomePanel
        copy={copy}
        status={status}
        error={error}
        telegramUserLabel={telegramUserLabel}
        backendUserLabel={backendUserLabel}
        isTelegramMiniApp={telegramMiniApp.isTelegramMiniApp}
        telegramLanguageCode={telegramMiniApp.user?.language_code}
        appLanguage={appLanguage}
        alertsCount={alerts.length}
      />

      </>
      ) : null}

      {activeTab === "HOME" || activeTab === "CHART" ? (
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
      ) : null}

      {activeTab === "CHART" ? (
      <section>
      <section className="market-shortcuts">
        {markets.slice(0, 5).map((market) => (
          <button
            key={market.id}
            type="button"
            className={market.id === activeMarket?.id ? "market-shortcut active" : "market-shortcut"}
            onClick={() => setSelectedMarketId(market.id)}
          >
            {market.symbol}
          </button>
        ))}
      </section>

      <LiveMarketChart
        market={activeMarket}
        alerts={alerts}
        history={priceHistory}
        directionLabels={copy.directions}
        title={copy.liveChart}
        emptyText={copy.noLatestPrice}
      />
      </section>
      ) : null}

      {activeTab === "ALERTS" ? (
      <>
      <CreateAlertCard
        activeMarket={activeMarket}
        filteredMarkets={filteredMarkets}
        marketSearch={marketSearch}
        setMarketSearch={setMarketSearch}
        setSelectedMarketId={setSelectedMarketId}
        newAlertDirection={newAlertDirection}
        setNewAlertDirection={setNewAlertDirection}
        newAlertTargetPrice={newAlertTargetPrice}
        setNewAlertTargetPrice={setNewAlertTargetPrice}
        newAlertTitle={newAlertTitle}
        setNewAlertTitle={setNewAlertTitle}
        createAlertResult={createAlertResult}
        handleCreateAlert={handleCreateAlert}
        copy={copy}
      />

      <AlertsList
        filteredAlerts={filteredAlerts}
        loading={loading}
        alertStats={alertStats}
        alertStatusFilter={alertStatusFilter}
        setAlertStatusFilter={setAlertStatusFilter}
        testPrice={testPrice}
        setTestPrice={setTestPrice}
        priceUpdateResult={priceUpdateResult}
        deleteAlertResult={deleteAlertResult}
        copy={copy}
        handlePriceUpdate={handlePriceUpdate}
        editingAlertId={editingAlertId}
        editAlertTitle={editAlertTitle}
        setEditAlertTitle={setEditAlertTitle}
        editAlertTargetPrice={editAlertTargetPrice}
        setEditAlertTargetPrice={setEditAlertTargetPrice}
        editAlertDirection={editAlertDirection}
        setEditAlertDirection={setEditAlertDirection}
        handleSaveAlertUpdate={handleSaveAlertUpdate}
        handleCancelEditAlert={handleCancelEditAlert}
        handleStartEditAlert={handleStartEditAlert}
        handleToggleAlertStatus={handleToggleAlertStatus}
        handleDeleteAlert={handleDeleteAlert}
      />

      </>
      ) : null}

      {activeTab === "SETTINGS" ? (
      <SettingsPanel
        copy={copy}
        apiUrl={frontendEnv.apiUrl}
        websocketUrl={frontendEnv.websocketUrl}
        lastMessage={lastMessage}
      />
      ) : null}
    </main>
  );
}
