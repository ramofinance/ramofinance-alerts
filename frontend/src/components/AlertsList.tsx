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
    <section className="card alerts-card">
      <div className="alerts-card-header">
        <div className="section-title-group">
          <span className="section-icon" aria-hidden="true">
            🔔
          </span>

          <div>
            <p className="card-label">{props.copy.myAlerts}</p>
            <h2>
              {props.loading
                ? props.copy.loading
                : `${props.filteredAlerts.length} ${props.copy.alerts}`}
            </h2>
          </div>
        </div>

        <div className="alert-stats">
          <span className="alert-stat alert-stat--active">
            <i />
            {props.alertStats.active}
          </span>
          <span className="alert-stat alert-stat--paused">
            <i />
            {props.alertStats.paused}
          </span>
          <span className="alert-stat alert-stat--triggered">
            <i />
            {props.alertStats.triggered}
          </span>
        </div>
      </div>

      <div className="alerts-toolbar">
        <select
          value={props.alertStatusFilter}
          onChange={(event) =>
            props.setAlertStatusFilter(
              event.target.value as AlertStatus | "ALL"
            )
          }
        >
          <option value="ALL">{props.copy.allStatuses}</option>
          <option value="ACTIVE">{props.copy.statuses.ACTIVE}</option>
          <option value="PAUSED">{props.copy.statuses.PAUSED}</option>
          <option value="TRIGGERED">
            {props.copy.statuses.TRIGGERED}
          </option>
        </select>

        <div className="price-test-box">
          <input
            value={props.testPrice}
            onChange={(event) => props.setTestPrice(event.target.value)}
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
          <div className="empty-state alerts-empty-state">
            <span aria-hidden="true">🔕</span>
            <p>{props.copy.noAlerts}</p>
          </div>
        ) : null}

        {props.filteredAlerts.map((alert) => {
          const editing = props.editingAlertId === alert.id;

          if (editing) {
            return (
              <article
                className="alert-item alert-item--editing"
                key={alert.id}
              >
                <div className="alert-edit-form">
                  <input
                    value={props.editAlertTitle}
                    onChange={(event) =>
                      props.setEditAlertTitle(event.target.value)
                    }
                  />

                  <div className="form-grid form-grid--two">
                    <select
                      value={props.editAlertDirection}
                      onChange={(event) =>
                        props.setEditAlertDirection(
                          event.target.value as AlertDirection
                        )
                      }
                    >
                      <option value="ABOVE">
                        {props.copy.directions.ABOVE}
                      </option>
                      <option value="BELOW">
                        {props.copy.directions.BELOW}
                      </option>
                      <option value="CROSSING_UP">
                        {props.copy.directions.CROSSING_UP}
                      </option>
                      <option value="CROSSING_DOWN">
                        {props.copy.directions.CROSSING_DOWN}
                      </option>
                    </select>

                    <input
                      value={props.editAlertTargetPrice}
                      onChange={(event) =>
                        props.setEditAlertTargetPrice(event.target.value)
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <div className="alert-edit-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        props.handleSaveAlertUpdate(alert.id)
                      }
                    >
                      {props.copy.save}
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={props.handleCancelEditAlert}
                    >
                      {props.copy.cancel}
                    </button>
                  </div>
                </div>
              </article>
            );
          }

          const marketSymbol =
            alert.market?.symbol ?? alert.marketId;
          const formattedTarget = Number(
            alert.targetPrice
          ).toLocaleString();

          return (
            <article
              className={`alert-item alert-item--${alert.status.toLowerCase()}`}
              key={alert.id}
            >
              <div className="alert-item-main">
                <div className="alert-market-icon">
                  {marketSymbol.slice(0, 1)}
                </div>

                <div className="alert-item-content">
                  <div className="alert-title-row">
                    <h3>{alert.title ?? marketSymbol}</h3>

                    <span
                      className={`alert-status alert-status--${alert.status.toLowerCase()}`}
                    >
                      <i />
                      {props.copy.statuses[alert.status] ?? alert.status}
                    </span>
                  </div>

                  <p className="alert-market-symbol">{marketSymbol}</p>

                  <div className="alert-condition">
                    <span>
                      {props.copy.directions[
                        alert.direction as AlertDirection
                      ] ?? alert.direction}
                    </span>

                    <strong>{formattedTarget}</strong>
                  </div>
                </div>
              </div>

              <div className="alert-actions">
                {alert.status === "ACTIVE" ||
                alert.status === "PAUSED" ? (
                  <>
                    <button
                      className="alert-action-button"
                      type="button"
                      onClick={() =>
                        props.handleStartEditAlert(alert)
                      }
                    >
                      ✎
                      <span>{props.copy.edit}</span>
                    </button>

                    <button
                      className="alert-action-button"
                      type="button"
                      onClick={() =>
                        props.handleToggleAlertStatus(alert)
                      }
                    >
                      {alert.status === "PAUSED" ? "▶" : "Ⅱ"}
                      <span>
                        {alert.status === "PAUSED"
                          ? props.copy.resume
                          : props.copy.pause}
                      </span>
                    </button>
                  </>
                ) : null}

                <button
                  className="alert-action-button alert-action-button--danger"
                  type="button"
                  onClick={() => props.handleDeleteAlert(alert.id)}
                >
                  ×
                  <span>{props.copy.delete}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
