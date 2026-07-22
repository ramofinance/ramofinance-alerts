import { useEffect, useState } from "react";
import { getAlerts } from "./api/alerts";
import { getMarkets } from "./api/markets";
import {
  getTelegramAdminStats,
  getTelegramMe,
  sendTelegramActivity
} from "./api/telegram";
import { updateUserLanguage } from "./api/users";
import { frontendEnv } from "./config/env";
import { useWebSocket } from "./hooks/use-websocket";
import { useMarketPriceHistory } from "./hooks/useMarketPriceHistory";
import { useDashboardRealtime } from "./hooks/useDashboardRealtime";
import { AlertsList } from "./components/AlertsList";
import { BottomTabs } from "./components/BottomTabs";
import { CreateAlertCard } from "./components/CreateAlertCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { SplashScreen } from "./components/SplashScreen";
import { useAlerts } from "./hooks/useAlerts";
import { HomePanel } from "./components/HomePanel";
import { MarketOverviewCard } from "./components/MarketOverviewCard";
import { ChartPanel } from "./components/ChartPanel";
import { getAppCopy, getAppDirection } from "./i18n/app-copy";
import { initializeTelegramMiniApp } from "./services/telegram-mini-app";
import type {
  Alert,
  Market,
  MiniAppStats,
  PreferredLanguage,
  User
} from "./types/api";

export default function App() {
  const { status, lastMessage } = useWebSocket(frontendEnv.websocketUrl);
  const [telegramMiniApp, setTelegramMiniApp] = useState(() => initializeTelegramMiniApp());

  const [markets, setMarkets] = useState<Market[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [appLanguage, setAppLanguage] = useState<PreferredLanguage>(() => {
    const savedLanguage = window.localStorage.getItem(
      "ramofinance-app-language"
    );

    return savedLanguage === "FA" ? "FA" : "EN";
  });
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<MiniAppStats | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [adminStatsError, setAdminStatsError] = useState<string | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
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


  useEffect(() => {
    const firstFilteredMarket = filteredMarkets[0];

    if (
      marketSearch.trim() &&
      firstFilteredMarket &&
      !filteredMarkets.some((market) => market.id === selectedMarketId)
    ) {
      setSelectedMarketId(firstFilteredMarket.id);
    }
  }, [marketSearch, selectedMarketId, filteredMarkets]);

  const selectedMarket = markets.find((market) => market.id === selectedMarketId);
  const activeMarket = selectedMarket ?? filteredMarkets[0] ?? markets[0];
  const { priceHistory, setPriceHistory } =
    useMarketPriceHistory(activeMarket?.symbol);
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
    priceUpdateResult,
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
    handleCreateAlert,
    handleStartEditAlert,
    handleCancelEditAlert,
    handleSaveAlertUpdate,
    handleDeleteAlert,
    handleToggleAlertStatus,
    handlePriceUpdate
  } = alertState;

  useDashboardRealtime({
    lastMessage,
    userId: backendUser?.id,
    activeMarketId: activeMarket?.id,
    setMarkets,
    setAlerts,
    setPriceHistory,
    reload: loadDashboardData
  });

  const handleLanguageChange = async (
    nextLanguage: PreferredLanguage
  ) => {
    if (nextLanguage === appLanguage || languageSaving) {
      return;
    }

    const previousLanguage = appLanguage;

    setAppLanguage(nextLanguage);
    setLanguageError(null);
    window.localStorage.setItem(
      "ramofinance-app-language",
      nextLanguage
    );

    if (!backendUser) {
      return;
    }

    try {
      setLanguageSaving(true);

      const updatedUser = await updateUserLanguage(
        backendUser.id,
        nextLanguage
      );

      setBackendUser(updatedUser);
    } catch {
      setAppLanguage(previousLanguage);
      window.localStorage.setItem(
        "ramofinance-app-language",
        previousLanguage
      );
      setLanguageError(
        getAppCopy(previousLanguage).languageUpdateFailed
      );
    } finally {
      setLanguageSaving(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSplashVisible(false);
    }, 2750);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentTelegramMiniApp = initializeTelegramMiniApp();

    setTelegramMiniApp(currentTelegramMiniApp);

    if (currentTelegramMiniApp.initData) {
      getTelegramMe(currentTelegramMiniApp.initData)
        .then(async (data) => {
          setBackendUser(data.user);
          setAppLanguage(data.language);
          window.localStorage.setItem(
            "ramofinance-app-language",
            data.language
          );
          await loadDashboardData(data.user.id);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : copy.telegramUserFailed);
          void loadDashboardData();
        });

      return;
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    const initData = telegramMiniApp.initData;

    if (!initData || !backendUser) {
      return;
    }

    const sendActivity = () => {
      void sendTelegramActivity(initData).catch(() => undefined);
    };

    sendActivity();

    const timer = window.setInterval(sendActivity, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, [telegramMiniApp.initData, backendUser?.id]);

  useEffect(() => {
    const initData = telegramMiniApp.initData;

    if (!initData || backendUser?.role !== "ADMIN") {
      setAdminStats(null);
      setAdminStatsError(null);
      return;
    }

    let cancelled = false;

    const loadAdminStats = async () => {
      try {
        setAdminStatsLoading(true);
        setAdminStatsError(null);

        const stats = await getTelegramAdminStats(initData);

        if (!cancelled) {
          setAdminStats(stats);
        }
      } catch {
        if (!cancelled) {
          setAdminStatsError(copy.statsLoadFailed ?? "Failed to load statistics");
        }
      } finally {
        if (!cancelled) {
          setAdminStatsLoading(false);
        }
      }
    };

    void loadAdminStats();

    const timer = window.setInterval(() => {
      void loadAdminStats();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [telegramMiniApp.initData, backendUser?.role, appLanguage]);

  const telegramUserLabel = telegramMiniApp.user?.username
    ? `@${telegramMiniApp.user.username}`
    : telegramMiniApp.user?.first_name ?? copy.browser;

  const backendUserLabel = backendUser?.username
    ? `@${backendUser.username}`
    : backendUser?.firstName ?? copy.notConnected;

  return (
    <main className="app-shell" dir={appDirection}>
        <SplashScreen visible={splashVisible} />

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
        <MarketOverviewCard market={activeMarket} copy={copy} />
      ) : null}

      {activeTab === "CHART" ? (
        <ChartPanel
          markets={markets}
          filteredMarkets={filteredMarkets}
          marketSearch={marketSearch}
          setMarketSearch={setMarketSearch}
          activeMarket={activeMarket}
          alerts={alerts}
          history={priceHistory}
          setSelectedMarketId={setSelectedMarketId}
          copy={copy}
        />
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
        lastMessage={lastMessage}
        appLanguage={appLanguage}
        languageSaving={languageSaving}
        languageError={languageError}
        onLanguageChange={handleLanguageChange}
        isAdmin={backendUser?.role === "ADMIN"}
        adminStats={adminStats}
        adminStatsLoading={adminStatsLoading}
        adminStatsError={adminStatsError}
      />
      ) : null}
    </main>
  );
}
