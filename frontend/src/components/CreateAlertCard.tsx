import type { AlertDirection, Market } from "../types/api";

type Props = {
  activeMarket?: Market;
  filteredMarkets: Market[];
  marketSearch: string;
  setMarketSearch: (value: string) => void;
  setSelectedMarketId: (value: string) => void;
  newAlertDirection: AlertDirection;
  setNewAlertDirection: (value: AlertDirection) => void;
  newAlertTargetPrice: string;
  setNewAlertTargetPrice: (value: string) => void;
  newAlertTitle: string;
  setNewAlertTitle: (value: string) => void;
  createAlertResult: string | null;
  handleCreateAlert: () => void;
  copy: any;
};

export function CreateAlertCard(props: Props) {
  return (
    <section className="card create-alert-card">
      <div className="section-header create-alert-header">
        <div className="section-title-group">
          <span className="section-icon" aria-hidden="true">
            ＋
          </span>

          <div>
            <p className="card-label">{props.copy.createAlert}</p>
            <h2>{props.copy.newAlert}</h2>
          </div>
        </div>

        {props.activeMarket ? (
          <span className="selected-market-chip">
            <span className="selected-market-dot" />
            {props.activeMarket.symbol}
          </span>
        ) : null}
      </div>

      <div className="form-grid create-alert-form">
        <label>
          {props.copy.searchMarket}
          <div className="field-with-icon">
            <span aria-hidden="true">⌕</span>
            <input
              value={props.marketSearch}
              onChange={(event) => props.setMarketSearch(event.target.value)}
              placeholder={props.copy.searchMarketPlaceholder}
            />
          </div>
        </label>

        <label>
          {props.copy.selectMarket}
          <select
            value={props.activeMarket?.id ?? ""}
            onChange={(event) => props.setSelectedMarketId(event.target.value)}
            disabled={props.filteredMarkets.length === 0}
          >
            {props.filteredMarkets.length === 0 ? (
              <option value="">{props.copy.noMarketFound}</option>
            ) : null}

            {props.filteredMarkets.map((market) => (
              <option value={market.id} key={market.id}>
                {market.symbol} - {market.name ?? market.type}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid form-grid--two">
          <label>
            {props.copy.direction}
            <select
              value={props.newAlertDirection}
              onChange={(event) =>
                props.setNewAlertDirection(event.target.value as AlertDirection)
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
          </label>

          <label>
            {props.copy.targetPrice}
            <input
              value={props.newAlertTargetPrice}
              onChange={(event) =>
                props.setNewAlertTargetPrice(event.target.value)
              }
              placeholder={props.copy.targetPricePlaceholder}
              inputMode="decimal"
            />
          </label>
        </div>

        <label>
          {props.copy.titleLabel}
          <input
            value={props.newAlertTitle}
            onChange={(event) => props.setNewAlertTitle(event.target.value)}
            placeholder={props.copy.optionalTitlePlaceholder}
          />
        </label>

        <div className="alert-preview alert-preview--enhanced">
          <div className="alert-preview-icon" aria-hidden="true">
            🔔
          </div>

          <div>
            <span>{props.copy.preview}</span>
            <strong>
              {props.activeMarket?.symbol ?? props.copy.noMarket}
              <span className="preview-separator">·</span>
              {props.copy.directions[props.newAlertDirection]}
              <span className="preview-separator">·</span>
              {props.newAlertTargetPrice ||
                props.copy.targetPricePlaceholder}
            </strong>
          </div>
        </div>
      </div>

      <button
        className="primary-button create-alert-button"
        type="button"
        onClick={props.handleCreateAlert}
      >
        <span aria-hidden="true">＋</span>
        {props.copy.createButton}
      </button>

      {props.createAlertResult ? (
        <div className="alert-box">{props.createAlertResult}</div>
      ) : null}
    </section>
  );
}
