import { useMemo, useState } from "react";
import { createAlert, deleteAlert, updateAlert, updateAlertStatus } from "../api/alerts";
import type { Alert, AlertDirection, AlertStatus } from "../types/api";

type Props = {
  alerts: Alert[];
  userId?: string;
  activeMarket?: any;
  copy?: any;
  reload?: (userId?: string) => Promise<void>;
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
    handleStartEditAlert,
    handleCancelEditAlert
  };
}
