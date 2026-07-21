import { useEffect, useMemo, useRef } from "react";

import type { Market } from "../types/api";

type Props = {
  market?: Market;
};

function getTradingViewSymbol(market?: Market): string {
  if (!market) {
    return "BINANCE:BTCUSDT";
  }

  if (market.type === "CRYPTO") {
    return `BINANCE:${market.symbol}`;
  }

  if (market.type === "FOREX") {
    return `OANDA:${market.symbol}`;
  }

  if (market.symbol === "XAUUSD") {
    return "OANDA:XAUUSD";
  }

  if (market.symbol === "US100") {
    return "OANDA:NAS100USD";
  }

  if (market.symbol === "SPX500") {
    return "OANDA:SPX500USD";
  }

  return market.symbol;
}

export function TradingViewChart({ market }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const symbol = useMemo(() => getTradingViewSymbol(market), [market]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      details: true,
      hotlist: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      save_image: false,
      support_host: "https://www.tradingview.com",
      withdateranges: true
    });

    container.appendChild(widget);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <section className="card tradingview-card">
      <div className="tradingview-card__header">
        <div>
          <p className="card-label">TRADINGVIEW</p>
          <h2>{market?.symbol ?? "BTCUSDT"}</h2>
        </div>

        <span className="market-badge">Candlestick</span>
      </div>

      <div
        ref={containerRef}
        className="tradingview-widget-container"
        aria-label="TradingView chart"
      />
    </section>
  );
}
