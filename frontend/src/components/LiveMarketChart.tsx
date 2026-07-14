import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type Time
} from "lightweight-charts";

import type { Alert, Market, MarketPriceHistory } from "../types/api";

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

function normalizeChartData(items: LineData[]): LineData[] {
  const byTime = new Map<Time, LineData>();

  for (const item of items) {
    if (Number.isFinite(item.value)) {
      byTime.set(item.time, item);
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

    return normalizeChartData(points);
  }, [history, market?.latestPrice]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      height: 260,
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8"
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" }
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: {
          top: 0.15,
          bottom: 0.15
        }
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 8,
        barSpacing: 8
      },
      crosshair: {
        mode: 1
      },
      localization: {
        priceFormatter: (price: number) => price.toLocaleString()
      }
    });

    const series = chart.addAreaSeries({
      lineWidth: 2,
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
    chartRef.current?.timeScale().fitContent();
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
          title: `${directionLabels[alert.direction] ?? alert.direction} ${alert.targetPrice}`,
          axisLabelVisible: true,
          lineVisible: true,
          lineWidth: 1
        })
      );
  }, [alerts, directionLabels, market?.id]);

  return (
    <section className="chart-card">
      <div className="chart-card-header">
        <div>
          <h2>{title}</h2>
          <p>{market ? market.symbol : emptyText}</p>
        </div>
      </div>
      <div ref={containerRef} className="chart-container" />
    </section>
  );
}
