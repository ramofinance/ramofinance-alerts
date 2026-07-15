import { LiveMarketChart } from "./LiveMarketChart";
import { getAppCopy } from "../i18n/app-copy";
import type { Alert, Market, MarketPriceHistory } from "../types/api";

type Props = {
  markets: Market[];
  activeMarket?: Market;
  alerts: Alert[];
  history: MarketPriceHistory[];
  setSelectedMarketId: (marketId: string) => void;
  copy: ReturnType<typeof getAppCopy>;
};

export function ChartPanel({
  markets,
  activeMarket,
  alerts,
  history,
  setSelectedMarketId,
  copy
}: Props) {
  return (
    <section>
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
