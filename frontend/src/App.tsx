import { useEffect, useState } from "react";
import { getAlerts } from "./api/alerts";
import { getMarkets } from "./api/markets";
import {
  getTelegramAdminStats,
  getTelegramMe,
  sendTelegramActivity
} from "./api/telegram";
import {
  addUserFavoriteMarket,
  getUserFavoriteMarkets,
  removeUserFavoriteMarket,
  updateUserAlertNotificationSettings,
  updateUserLanguage
} from "./api/users";
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
import { ServicesPanel } from "./components/ServicesPanel";
import { CryptoFlowPanel } from "./components/CryptoFlowPanel";
import { RadarPanel } from "./components/RadarPanel";
import { getRadarStatus } from "./api/radar";
import { getAppCopy, getAppDirection } from "./i18n/app-copy";
import { initializeTelegramMiniApp, useTelegramBackButton } from "./services/telegram-mini-app";
import type {
  Alert,
  AlertNotificationSettings,
  Market,
  MiniAppStats,
  PreferredLanguage,
  User
} from "./types/api";

export default function App() {
  type TabKey = "SERVICES" | "HOME" | "CHART" | "ALERTS" | "SETTINGS" | "CRYPTOFLOW" | "RADAR";
  const initialService = new URLSearchParams(window.location.search).get("service");
  const startsInAlerts = initialService === "alerts";
  const startsInRadar = initialService === "radar";
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

    return ["FA", "EN", "AR", "ES", "ZH"].includes(savedLanguage ?? "")
      ? savedLanguage as PreferredLanguage
      : "EN";
  });
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [notificationSettingsSaving, setNotificationSettingsSaving] =
    useState(false);
  const [notificationSettingsError, setNotificationSettingsError] =
    useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<MiniAppStats | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [adminStatsError, setAdminStatsError] = useState<string | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>(() => startsInAlerts ? "ALERTS" : "SERVICES");
  const [activeModule, setActiveModule] = useState<"hub" | "alerts">(() => startsInAlerts ? "alerts" : "hub");
  const [marketSearch, setMarketSearch] = useState("");
  const [favoriteMarkets, setFavoriteMarkets] = useState<Market[]>([]);
  const [favoriteSavingMarketId, setFavoriteSavingMarketId] =
    useState<string | null>(null);
  const [radarEnabled, setRadarEnabled] = useState(false);
  const isPrimaryRadarAdmin = Boolean(
    telegramMiniApp.user?.id === 111287296 ||
    telegramMiniApp.user?.username?.replace(/^@/, "").toLowerCase() === "ramoadmin" ||
    backendUser?.telegramId === "111287296" ||
    backendUser?.username?.replace(/^@/, "").toLowerCase() === "ramoadmin"
  );


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

  useEffect(() => useTelegramBackButton(
    activeTab === "CRYPTOFLOW" || activeTab === "RADAR" || activeModule === "alerts",
    () => {
      setActiveModule("hub");
      setActiveTab("SERVICES");
    }
  ), [activeTab, activeModule]);

  const openAlertsService = () => {
    setActiveModule("alerts");
    setActiveTab("HOME");
  };

  const openServices = () => {
    setActiveModule("hub");
    setActiveTab("SERVICES");
  };

  const cryptoFlowFrameUrl = (() => {
    const url = new URL(frontendEnv.cryptoFlowUrl);
    url.searchParams.set("embed", "ramo-finance");
    url.searchParams.set("lang", appLanguage.toLowerCase());
    return url.toString();
  })();

  const loadDashboardData = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [
        marketsResponse,
        alertsResponse,
        favoriteMarketsResponse
      ] = await Promise.all([
        getMarkets(),
        userId ? getAlerts({ userId }) : Promise.resolve({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
        userId ? getUserFavoriteMarkets(userId) : Promise.resolve([])
      ]);

      setMarkets(marketsResponse.items);
      setSelectedMarketId((currentMarketId) => currentMarketId || marketsResponse.items[0]?.id || "");
      setAlerts(alertsResponse.items);
      setFavoriteMarkets(favoriteMarketsResponse);
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

  const handleToggleFavorite = async (marketId: string) => {
    if (!backendUser || favoriteSavingMarketId) {
      return;
    }

    const isFavorite = favoriteMarkets.some(
      (market) => market.id === marketId
    );

    try {
      setFavoriteSavingMarketId(marketId);
      setError(null);

      if (isFavorite) {
        await removeUserFavoriteMarket(backendUser.id, marketId);
        setFavoriteMarkets((current) =>
          current.filter((market) => market.id !== marketId)
        );
      } else {
        const market = await addUserFavoriteMarket(
          backendUser.id,
          marketId
        );

        setFavoriteMarkets((current) =>
          current.some((item) => item.id === market.id)
            ? current
            : [...current, market]
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.favoriteUpdateFailed
      );
    } finally {
      setFavoriteSavingMarketId(null);
    }
  };

  const handleAlertNotificationSettingsChange = async (
    settings: AlertNotificationSettings
  ) => {
    if (!backendUser || notificationSettingsSaving) {
      return;
    }

    try {
      setNotificationSettingsSaving(true);
      setNotificationSettingsError(null);

      const updatedUser =
        await updateUserAlertNotificationSettings(
          backendUser.id,
          settings
        );

      setBackendUser(updatedUser);
    } catch {
      setNotificationSettingsError(
        copy.notificationSettingsUpdateFailed
      );
    } finally {
      setNotificationSettingsSaving(false);
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
          const radarStatus = data.radarStatus ?? await getRadarStatus(currentTelegramMiniApp.initData).catch(() => null);
          const canAccessRadar = Boolean(
            radarStatus?.enabled ||
            data.user.role === "ADMIN" ||
            data.user.radarPreviewAccess ||
            isPrimaryRadarAdmin
          );
          setRadarEnabled(canAccessRadar);
          if (startsInRadar && canAccessRadar) {
            setActiveTab("RADAR");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : copy.telegramUserFailed);
          if (startsInRadar) {
            setActiveTab("SERVICES");
          }
          void loadDashboardData();
        });

      return;
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab !== "SERVICES" || !telegramMiniApp.initData || !backendUser) {
      return;
    }

    void getRadarStatus(telegramMiniApp.initData)
      .then((status) => setRadarEnabled(Boolean(
        status.enabled ||
        backendUser.role === "ADMIN" ||
        backendUser.radarPreviewAccess ||
        isPrimaryRadarAdmin
      )))
      .catch(() => setRadarEnabled(
        backendUser.role === "ADMIN" || backendUser.radarPreviewAccess || isPrimaryRadarAdmin
      ));
  }, [activeTab, telegramMiniApp.initData, backendUser?.id, backendUser?.role, backendUser?.radarPreviewAccess]);

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

  const hasRadarAccess = Boolean(
    radarEnabled ||
    backendUser?.role === "ADMIN" ||
    backendUser?.radarPreviewAccess ||
    isPrimaryRadarAdmin
  );

  const telegramUserLabel = telegramMiniApp.user?.username
    ? `@${telegramMiniApp.user.username}`
    : telegramMiniApp.user?.first_name ?? copy.browser;

  const backendUserLabel = backendUser?.username
    ? `@${backendUser.username}`
    : backendUser?.firstName ?? copy.notConnected;

  return (
    <main className="app-shell" dir={appDirection}>
        <SplashScreen visible={splashVisible} />

      {activeTab !== "CRYPTOFLOW" && activeTab !== "RADAR" ? (
        <BottomTabs
          activeTab={activeTab}
          setActiveTab={(tab) => tab === "SERVICES" ? openServices() : setActiveTab(tab)}
          mode={activeModule}
          copy={copy}
        />
      ) : null}
      {activeTab === "SERVICES" ? (
        <ServicesPanel
          copy={copy}
          openCryptoFlow={() => setActiveTab("CRYPTOFLOW")}
          openAlerts={openAlertsService}
          openRadar={() => setActiveTab("RADAR")}
          radarEnabled={hasRadarAccess}
        />
      ) : null}
      {activeTab === "CRYPTOFLOW" ? (
        <CryptoFlowPanel
          copy={copy}
          src={cryptoFlowFrameUrl}
          onBack={openServices}
        />
      ) : null}
      {activeTab === "RADAR" && backendUser ? (
        <RadarPanel
          copy={copy}
          user={backendUser}
          initData={telegramMiniApp.initData}
          onBack={openServices}
          onUserUpdated={setBackendUser}
        />
      ) : null}
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
          favoriteMarkets={favoriteMarkets}
          favoriteSavingMarketId={favoriteSavingMarketId}
          onToggleFavorite={handleToggleFavorite}
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
        isAdmin={backendUser?.role === "ADMIN"}
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
        notificationRepeatCount={
          backendUser?.alertNotificationRepeatCount ?? 1
        }
        notificationIntervalSeconds={
          backendUser?.alertNotificationIntervalSeconds ?? 60
        }
        notificationSettingsSaving={notificationSettingsSaving}
        notificationSettingsError={notificationSettingsError}
        notificationSettingsEnabled={Boolean(backendUser)}
        onNotificationSettingsChange={
          handleAlertNotificationSettingsChange
        }
        isAdmin={backendUser?.role === "ADMIN"}
        adminStats={adminStats}
        adminStatsLoading={adminStatsLoading}
        adminStatsError={adminStatsError}
      />
      ) : null}
    </main>
  );
}
