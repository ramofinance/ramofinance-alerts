import { useMemo, useState } from "react";
import { createAlert, deleteAlert, updateAlert, updateAlertStatus } from "../api/alerts";
import { updatePrice } from "../api/prices";
import { getAppCopy } from "../i18n/app-copy";
import type { Alert, AlertDirection, AlertStatus, Market } from "../types/api";

type Props = {
  alerts: Alert[];
  userId?: string;
  activeMarket?: Market;
  copy: ReturnType<typeof getAppCopy>;
  reload: (userId?: string) => Promise<void>;
};

export function useAlerts({
  alerts,
  userId,
  activeMarket,
  copy,
  reload
}: Props) {
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertTargetPrice, setNewAlertTargetPrice] = useState("");
  const [newAlertDirection, setNewAlertDirection] =
    useState<AlertDirection>("ABOVE");

  const [testPrice, setTestPrice] = useState("");
  const [priceUpdateResult, setPriceUpdateResult] =
    useState<string | null>(null);

  const [alertStatusFilter, setAlertStatusFilter] =
    useState<AlertStatus | "ALL">("ALL");

  const [createAlertResult, setCreateAlertResult] =
    useState<string | null>(null);

  const [deleteAlertResult, setDeleteAlertResult] =
    useState<string | null>(null);

  const [editingAlertId, setEditingAlertId] =
    useState<string | null>(null);

  const [editAlertTitle, setEditAlertTitle] = useState("");
  const [editAlertTargetPrice, setEditAlertTargetPrice] = useState("");
  const [editAlertDirection, setEditAlertDirection] =
    useState<AlertDirection>("ABOVE");

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        alertStatusFilter === "ALL"
          ? true
          : alert.status === alertStatusFilter
      ),
    [alerts, alertStatusFilter]
  );

  const alertStats = {
    active: alerts.filter((alert) => alert.status === "ACTIVE").length,
    paused: alerts.filter((alert) => alert.status === "PAUSED").length,
    triggered: alerts.filter((alert) => alert.status === "TRIGGERED").length
  };

  const handleCreateAlert = async () => {
    try {
      setCreateAlertResult(null);

      if (!userId) {
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
        newAlertTitle.trim() ||
        `${activeMarket.symbol} ${copy.directions[newAlertDirection]}`;

      const alert = await createAlert({
        userId,
        marketId: activeMarket.id,
        title: cleanTitle,
        targetPrice: newAlertTargetPrice.trim(),
        direction: newAlertDirection
      });

      setCreateAlertResult(`${copy.createSuccess}: ${alert.title ?? alert.id}`);
      await reload(userId);
    } catch (err) {
      setCreateAlertResult(
        err instanceof Error ? err.message : copy.createFailed
      );
    }
  };

  const handleStartEditAlert = (alert: Alert) => {
    setEditingAlertId(alert.id);
    setEditAlertTitle(alert.title ?? "");
    setEditAlertTargetPrice(alert.targetPrice);
    setEditAlertDirection(alert.direction as AlertDirection);
  };

  const handleCancelEditAlert = () => {
    setEditingAlertId(null);
    setEditAlertTitle("");
    setEditAlertTargetPrice("");
    setEditAlertDirection("ABOVE");
  };

  const handleSaveAlertUpdate = async (alertId: string) => {
    try {
      setDeleteAlertResult(null);

      if (
        !editAlertTargetPrice.trim() ||
        Number.isNaN(Number(editAlertTargetPrice))
      ) {
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
      await reload(userId);
    } catch (err) {
      setDeleteAlertResult(
        err instanceof Error ? err.message : copy.updateFailed
      );
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      setDeleteAlertResult(null);

      await deleteAlert(alertId);

      setDeleteAlertResult(copy.deleteSuccess);
      await reload(userId);
    } catch (err) {
      setDeleteAlertResult(
        err instanceof Error ? err.message : copy.deleteFailed
      );
    }
  };

  const handleToggleAlertStatus = async (alert: Alert) => {
    try {
      setDeleteAlertResult(null);

      const nextStatus: AlertStatus =
        alert.status === "PAUSED" ? "ACTIVE" : "PAUSED";

      await updateAlertStatus(alert.id, nextStatus);

      setDeleteAlertResult(
        nextStatus === "PAUSED" ? copy.pauseSuccess : copy.resumeSuccess
      );

      await reload(userId);
    } catch (err) {
      setDeleteAlertResult(
        err instanceof Error ? err.message : copy.statusUpdateFailed
      );
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

      const result = await updatePrice(
        activeMarket.symbol,
        testPrice.trim()
      );

      setPriceUpdateResult(
        `${copy.priceUpdated}: ${result.market.symbol} = ${result.price}. ${copy.triggeredAlerts}: ${result.triggeredAlerts.length}`
      );

      await reload(userId);
    } catch (err) {
      setPriceUpdateResult(
        err instanceof Error ? err.message : copy.priceUpdateFailed
      );
    }
  };

  return {
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
  };
}
