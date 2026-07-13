import { useEffect, useRef } from "react";
import { ColorType, createChart, type IChartApi, type ISeriesApi, type LineData, type Time } from "lightweight-charts";
import type { Market } from "../types/api";

type LiveMarketChartProps = {
  market: Market | undefined;
  title: string;
  emptyText: string;
};

const toChartTime = (value: string): Time => {
  return Math.floor(new Date(value).getTime() / 1000) as Time;
};

export const LiveMarketChart = ({ market, title, emptyText }: LiveMarketChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const dataRef = useRef<LineData[]>([]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#cbd5e1"
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" }
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)"
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: true,
        secondsVisible: false
      }
    });

    const series = chart.addLineSeries({
      color: "#38bdf8",
      lineWidth: 2
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeChart = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    resizeChart();
    window.addEventListener("resize", resizeChart);

    return () => {
      window.removeEventListener("resize", resizeChart);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      dataRef.current = [];
    };
  }, []);

  useEffect(() => {
    dataRef.current = [];
    seriesRef.current?.setData([]);
  }, [market?.id]);

  useEffect(() => {
    if (!market?.latestPrice || !seriesRef.current) {
      return;
    }

    const price = Number(market.latestPrice.price);

    if (!Number.isFinite(price)) {
      return;
    }

    const point: LineData = {
      time: toChartTime(market.latestPrice.updatedAt),
      value: price
    };

    const currentData = dataRef.current;
    const lastPoint = currentData[currentData.length - 1];

    const nextData =
      lastPoint?.time === point.time
        ? [...currentData.slice(0, -1), point]
        : [...currentData, point].slice(-80);

    dataRef.current = nextData;
    seriesRef.current.setData(nextData);
    chartRef.current?.timeScale().fitContent();
  }, [market?.latestPrice?.price, market?.latestPrice?.updatedAt, market?.id]);

  return (
    <section className="card chart-card">
      <div className="section-header">
        <div>
          <p className="card-label">{title}</p>
          <h2>{market?.symbol ?? "—"}</h2>
        </div>
        <span className="market-badge">{market?.latestPrice?.source ?? "—"}</span>
      </div>

      {market?.latestPrice ? (
        <div className="chart-container" ref={containerRef} />
      ) : (
        <p className="empty-state">{emptyText}</p>
      )}
    </section>
  );
};
