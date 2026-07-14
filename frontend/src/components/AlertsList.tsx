import type { Alert, AlertDirection, AlertStatus } from "../types/api";

type Props = {
  filteredAlerts: Alert[];
  loading: boolean;
  alertStats: {
    active: number;
    paused: number;
    triggered: number;
  };
  alertStatusFilter: AlertStatus | "ALL";
  setAlertStatusFilter: (value: AlertStatus | "ALL") => void;
  testPrice: string;
  setTestPrice: (value: string) => void;
  priceUpdateResult: string | null;
  deleteAlertResult: string | null;
  copy: any;
  handlePriceUpdate: () => void;

  editingAlertId: string | null;
  editAlertTitle: string;
  setEditAlertTitle: (value: string) => void;
  editAlertTargetPrice: string;
  setEditAlertTargetPrice: (value: string) => void;
  editAlertDirection: AlertDirection;
  setEditAlertDirection: (value: AlertDirection) => void;

  handleSaveAlertUpdate: (id: string) => void;
  handleCancelEditAlert: () => void;
  handleStartEditAlert: (alert: Alert) => void;
  handleToggleAlertStatus: (alert: Alert) => void;
  handleDeleteAlert: (id: string) => void;
};

export function AlertsList(props: Props) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="card-label">{props.copy.myAlerts}</p>
          <h2>
            {props.loading
              ? props.copy.loading
              : `${props.filteredAlerts.length} ${props.copy.alerts}`}
          </h2>

          <div className="alert-stats">
            <span>🟢 {props.alertStats.active}</span>
            <span>⏸️ {props.alertStats.paused}</span>
            <span>🔔 {props.alertStats.triggered}</span>
          </div>
        </div>

        <div className="price-test-box">
          <select
            value={props.alertStatusFilter}
            onChange={(e) =>
              props.setAlertStatusFilter(e.target.value as AlertStatus | "ALL")
            }
          >
            <option value="ALL">{props.copy.allStatuses}</option>
            <option value="ACTIVE">{props.copy.statuses.ACTIVE}</option>
            <option value="PAUSED">{props.copy.statuses.PAUSED}</option>
            <option value="TRIGGERED">{props.copy.statuses.TRIGGERED}</option>
          </select>

          <input
            value={props.testPrice}
            onChange={(e) => props.setTestPrice(e.target.value)}
            placeholder={props.copy.testPricePlaceholder}
            inputMode="decimal"
          />

          <button
            className="secondary-button"
            type="button"
            onClick={props.handlePriceUpdate}
          >
            {props.copy.testPrice}
          </button>
        </div>
      </div>

      {props.priceUpdateResult ? (
        <div className="alert-box">{props.priceUpdateResult}</div>
      ) : null}

      {props.deleteAlertResult ? (
        <div className="alert-box">{props.deleteAlertResult}</div>
      ) : null}

      <div className="alerts-list">
        {props.filteredAlerts.length === 0 && !props.loading ? (
          <p className="empty-state">{props.copy.noAlerts}</p>
        ) : null}

        {props.filteredAlerts.map((alert) => {
          const editing = props.editingAlertId === alert.id;

          if (editing) {
            return (
              <article className="alert-item alert-item--editing" key={alert.id}>
                <input
                  value={props.editAlertTitle}
                  onChange={(e) => props.setEditAlertTitle(e.target.value)}
                />

                <select
                  value={props.editAlertDirection}
                  onChange={(e) =>
                    props.setEditAlertDirection(
                      e.target.value as AlertDirection
                    )
                  }
                >
                  <option value="ABOVE">{props.copy.directions.ABOVE}</option>
                  <option value="BELOW">{props.copy.directions.BELOW}</option>
                  <option value="CROSSING_UP">
                    {props.copy.directions.CROSSING_UP}
                  </option>
                  <option value="CROSSING_DOWN">
                    {props.copy.directions.CROSSING_DOWN}
                  </option>
                </select>

                <input
                  value={props.editAlertTargetPrice}
                  onChange={(e) =>
                    props.setEditAlertTargetPrice(e.target.value)
                  }
                />

                <button onClick={() => props.handleSaveAlertUpdate(alert.id)}>
                  {props.copy.save}
                </button>

                <button onClick={props.handleCancelEditAlert}>
                  {props.copy.cancel}
                </button>
              </article>
            );
          }

          return (
            <article className="alert-item" key={alert.id}>
              <div>
                <h3>{alert.title ?? "Untitled alert"}</h3>
                <p>
                  {alert.market?.symbol ?? alert.marketId} ·{" "}
                  {props.copy.directions[alert.direction as AlertDirection] ??
                    alert.direction}{" "}
                  · {alert.targetPrice}
                </p>
              </div>

              <div className="alert-actions">
                <span className="market-badge">
                  {props.copy.statuses[alert.status] ?? alert.status}
                </span>

                {alert.status === "ACTIVE" ||
                alert.status === "PAUSED" ? (
                  <>
                    <button onClick={() => props.handleStartEditAlert(alert)}>
                      {props.copy.edit}
                    </button>

                    <button
                      onClick={() =>
                        props.handleToggleAlertStatus(alert)
                      }
                    >
                      {alert.status === "PAUSED"
                        ? props.copy.resume
                        : props.copy.pause}
                    </button>
                  </>
                ) : null}

                <button onClick={() => props.handleDeleteAlert(alert.id)}>
                  {props.copy.delete}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
