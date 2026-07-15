import { useMemo, useState } from "react";
import { createAlert, deleteAlert, updateAlert, updateAlertStatus } from "../api/alerts";
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
    handleDeleteAlert
  };
}
