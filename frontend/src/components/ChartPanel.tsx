import { LiveMarketChart } from "./LiveMarketChart";
import { TradingViewChart } from "./TradingViewChart";
import { getAppCopy } from "../i18n/app-copy";
import type { Alert, Market, MarketPriceHistory } from "../types/api";

type Props = {
  markets: Market[];
  filteredMarkets: Market[];
  favoriteMarkets: Market[];
  favoriteSavingMarketId: string | null;
  marketSearch: string;
  setMarketSearch: (value: string) => void;
  activeMarket?: Market;
  alerts: Alert[];
  history: MarketPriceHistory[];
  setSelectedMarketId: (marketId: string) => void;
  onToggleFavorite: (marketId: string) => void;
  copy: ReturnType<typeof getAppCopy>;
};

export function ChartPanel({
  filteredMarkets,
  favoriteMarkets,
  favoriteSavingMarketId,
  marketSearch,
  setMarketSearch,
  activeMarket,
  alerts,
  history,
  setSelectedMarketId,
  onToggleFavorite,
  copy
}: Props) {
  const activeMarketIsFavorite = favoriteMarkets.some(
    (market) => market.id === activeMarket?.id
  );

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

        <div className="favorite-market-actions">
          <button
            type="button"
            className={
              activeMarketIsFavorite
                ? "favorite-toggle is-favorite"
                : "favorite-toggle"
            }
            aria-pressed={activeMarketIsFavorite}
            disabled={
              !activeMarket ||
              favoriteSavingMarketId === activeMarket.id
            }
            onClick={() => {
              if (activeMarket) {
                onToggleFavorite(activeMarket.id);
              }
            }}
          >
            <span aria-hidden="true">
              {activeMarketIsFavorite ? "★" : "☆"}
            </span>
            {activeMarketIsFavorite
              ? copy.removeFavorite
              : copy.addFavorite}
          </button>
        </div>
      </section>

      <div className="market-favorites-header">
        <span aria-hidden="true">★</span>
        <strong>{copy.favorites}</strong>
      </div>

      <section className="market-shortcuts">
        {favoriteMarkets.length === 0 ? (
          <span className="market-favorites-empty">
            {copy.noFavorites}
          </span>
        ) : (
          favoriteMarkets.map((market) => (
            <button
              key={market.id}
              type="button"
              className={
                market.id === activeMarket?.id
                  ? "market-shortcut active"
                  : "market-shortcut"
              }
              onClick={() => {
                setMarketSearch("");
                setSelectedMarketId(market.id);
              }}
            >
              {market.symbol}
            </button>
          ))
        )}
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
