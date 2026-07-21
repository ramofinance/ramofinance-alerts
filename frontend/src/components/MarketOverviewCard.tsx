import { getAppCopy } from "../i18n/app-copy";
import type { Market } from "../types/api";
import { formatPrice } from "../utils/formatPrice";

type Props = {
  market?: Market;
  copy: ReturnType<typeof getAppCopy>;
};

export function MarketOverviewCard({ market, copy }: Props) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="card-label">{copy.market}</p>
          <h2>{market?.symbol ?? copy.noMarket}</h2>
        </div>
        <span className="market-badge">{market?.type ?? copy.market}</span>
      </div>

      <p className="muted">{market?.name ?? copy.marketUnavailable}</p>

      {market?.latestPrice ? (
        <div className="latest-price-box">
          <span>{copy.latestPrice}</span>
          <strong>{formatPrice(market.latestPrice.price)}</strong>
          <small>
            {copy.source}: {market.latestPrice.source}
          </small>
        </div>
      ) : (
        <div className="latest-price-box latest-price-box--empty">
          <span>{copy.latestPrice}</span>
          <strong>{copy.noLatestPrice}</strong>
        </div>
      )}
    </section>
  );
}
