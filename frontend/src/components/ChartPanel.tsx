import { LiveMarketChart } from "./LiveMarketChart";
import { TradingViewChart } from "./TradingViewChart";
import { getAppCopy } from "../i18n/app-copy";
import type { Alert, Market, MarketPriceHistory } from "../types/api";

type Props = {
  markets: Market[];
  filteredMarkets: Market[];
  marketSearch: string;
  setMarketSearch: (value: string) => void;
  activeMarket?: Market;
  alerts: Alert[];
  history: MarketPriceHistory[];
  setSelectedMarketId: (marketId: string) => void;
  copy: ReturnType<typeof getAppCopy>;
};

export function ChartPanel({
  markets,
  filteredMarkets,
  marketSearch,
  setMarketSearch,
  activeMarket,
  alerts,
  history,
  setSelectedMarketId,
  copy
}: Props) {
  return (
    <section>
      <section className="card chart-market-selector">
        <div className="form-grid create-alert-form">
          <label>
            {copy.searchMarket}
            <div className="field-with-icon">
              <span aria-hidden="true">⌕</span>
              <input
                value={marketSearch}
                onChange={(event) => setMarketSearch(event.target.value)}
                placeholder={copy.searchMarketPlaceholder}
              />
            </div>
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
        </div>
      </section>

      <section className="market-shortcuts">
        {markets.slice(0, 5).map((market) => (
          <button
            key={market.id}
            type="button"
            className={
              market.id === activeMarket?.id
                ? "market-shortcut active"
                : "market-shortcut"
            }
            onClick={() => setSelectedMarketId(market.id)}
          >
            {market.symbol}
          </button>
        ))}
      </section>

      <TradingViewChart market={activeMarket} />

      <LiveMarketChart
        market={activeMarket}
        alerts={alerts}
        history={history}
        directionLabels={copy.directions}
        title={copy.liveChart}
        emptyText={copy.noLatestPrice}
      />
    </section>
  );
}
