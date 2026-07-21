import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type Time
} from "lightweight-charts";

import type { Alert, Market, MarketPriceHistory } from "../types/api";
import { formatPrice } from "../utils/formatPrice";

interface LiveMarketChartProps {
  market?: Market | null;
  alerts: Alert[];
  history: MarketPriceHistory[];
  directionLabels: Record<string, string>;
  title: string;
  emptyText: string;
}

function toChartTime(value: string): Time {
  return Math.floor(new Date(value).getTime() / 1000) as Time;
}

type ChartTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D";

const TIMEFRAME_SECONDS: Record<ChartTimeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1D": 86400
};

function normalizeChartData(
  items: LineData[],
  timeframe: ChartTimeframe
): LineData[] {
  const byTime = new Map<Time, LineData>();
  const bucketSeconds = TIMEFRAME_SECONDS[timeframe];

  for (const item of items) {
    if (Number.isFinite(item.value)) {
      const bucketTime = (
        Math.floor(Number(item.time) / bucketSeconds) * bucketSeconds
      ) as Time;

      byTime.set(bucketTime, {
        time: bucketTime,
        value: item.value
      });
    }
  }

  return [...byTime.values()]
    .sort((a, b) => Number(a.time) - Number(b.time))
    .slice(-120);
}

export function LiveMarketChart({
  market,
  alerts,
  history,
  directionLabels,
  title,
  emptyText
}: LiveMarketChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const hasFittedContentRef = useRef(false);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1m");

  const chartData = useMemo(() => {
    const points: LineData[] = history.map((item) => ({
      time: toChartTime(item.observedAt),
      value: Number(item.price)
    }));

    if (market?.latestPrice) {
      points.push({
        time: toChartTime(market.latestPrice.updatedAt),
        value: Number(market.latestPrice.price)
      });
    }

    return normalizeChartData(points, timeframe);
  }, [history, market?.latestPrice, timeframe]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      height: 220,
      layout: {
        background: { color: "transparent" },
        textColor: "#7f8da5"
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.055)" },
        horzLines: { color: "rgba(148, 163, 184, 0.07)" }
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        scaleMargins: {
          top: 0.16,
          bottom: 0.16
        }
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 8,
        barSpacing: 8
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(125, 211, 252, 0.34)",
          labelBackgroundColor: "#17233a"
        },
        horzLine: {
          color: "rgba(125, 211, 252, 0.34)",
          labelBackgroundColor: "#17233a"
        }
      },
      localization: {
        priceFormatter: (price: number) => formatPrice(price)
      }
    });

    const series = chart.addAreaSeries({
      lineColor: "#38bdf8",
      topColor: "rgba(56, 189, 248, 0.32)",
      bottomColor: "rgba(56, 189, 248, 0.01)",
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: true
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    seriesRef.current.setData(chartData);

    if (!hasFittedContentRef.current && chartData.length > 0) {
      chartRef.current?.timeScale().fitContent();
      hasFittedContentRef.current = true;
    }
  }, [chartData, market?.id]);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    for (const priceLine of priceLinesRef.current) {
      seriesRef.current.removePriceLine(priceLine);
    }

    priceLinesRef.current = alerts
      .filter((alert) => alert.marketId === market?.id)
      .filter((alert) => alert.status === "ACTIVE" || alert.status === "PAUSED")
      .map((alert) =>
        seriesRef.current!.createPriceLine({
          price: Number(alert.targetPrice),
          title: `${directionLabels[alert.direction] ?? alert.direction} ${formatPrice(alert.targetPrice)}`,
          axisLabelVisible: true,
          lineVisible: true,
          lineWidth: 2,
          lineStyle: alert.direction.includes("DOWN") ? 2 : 0,
          color: alert.status === "PAUSED" ? "#f59e0b" : "#38bdf8"
        })
      );
  }, [alerts, directionLabels, market?.id]);

  const marketAlertCount = alerts.filter(
    (alert) =>
      alert.marketId === market?.id &&
      (alert.status === "ACTIVE" || alert.status === "PAUSED")
  ).length;

  return (
    <section className="chart-card">
      <div className="chart-card-header">
        <div className="chart-market-heading">
          <div className="chart-market-icon" aria-hidden="true">
            {market?.symbol.slice(0, 1) ?? "↗"}
          </div>

          <div>
            <p className="card-label">{title}</p>
            <div className="chart-symbol-row">
              <h2>{market?.symbol ?? emptyText}</h2>

              {market ? (
                <span className="chart-market-type">{market.type}</span>
              ) : null}
            </div>

            <p className="chart-market-name">
              {market?.name ?? emptyText}
            </p>
          </div>
        </div>

        <div className="chart-price-summary">
          <span className="chart-live-label">
            <i />
            LIVE
          </span>

          {market?.latestPrice ? (
            <strong className="chart-current-price">
              {formatPrice(market.latestPrice.price)}
            </strong>
          ) : (
            <strong className="chart-current-price chart-current-price--empty">
              —
            </strong>
          )}

          <small>
            {market?.latestPrice?.source ?? emptyText}
          </small>
        </div>
      </div>

      <div className="chart-timeframes" aria-label="Chart timeframe">
        {(["1m", "5m", "15m", "1h", "4h", "1D"] as ChartTimeframe[]).map((item) => (
          <button
            key={item}
            type="button"
            className={
              timeframe === item
                ? "chart-timeframe active"
                : "chart-timeframe"
            }
            onClick={() => {
              setTimeframe(item);
              hasFittedContentRef.current = false;
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="chart-meta-row">
        <span>
          <i className="chart-meta-dot chart-meta-dot--price" />
          {chartData.length} points
        </span>

        <span>
          <i className="chart-meta-dot chart-meta-dot--alert" />
          {marketAlertCount} alerts
        </span>
      </div>

      <div className="chart-canvas-shell">
        {chartData.length === 0 ? (
          <div className="chart-empty-overlay">
            <span aria-hidden="true">⌁</span>
            <p>{emptyText}</p>
          </div>
        ) : null}

        <div ref={containerRef} className="chart-container" />
      </div>
    </section>
  );
}
