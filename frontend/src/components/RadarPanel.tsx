import { useEffect, useState } from "react";
import { getRadarSignals, runRadarScan, sendRadarTestNotification, updateRadarSettings, type RadarSettingsInput } from "../api/radar";
import type { RadarSignal, User } from "../types/api";

type Props = { copy: any; user: User; initData: string; onBack: () => void; onUserUpdated: (user: User) => void };

const money = (value: string | null) => {
  if (!value) return "—";
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  if (number >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
  if (number >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
  if (number >= 1e3) return `$${(number / 1e3).toFixed(1)}K`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const pct = (value: number | null, digits = 1) => value == null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;

const reasonText = (reason: string, copy: any) => {
  const [code, value] = reason.split(":");
  if (code === "TURNOVER") return copy.radarReasonTurnover.replace("{value}", value ?? "—");
  if (code === "TURNOVER72") return copy.radarReasonTurnover72.replace("{value}", value ?? "—");
  if (code === "ACCELERATION") return copy.radarReasonAcceleration.replace("{value}", value ?? "—");
  if (code === "PRICE") return copy.radarReasonPrice.replace("{value}", value ?? "—");
  if (code === "HIGH_TRADES") return copy.radarReasonTrades;
  if (code === "SMALL_CAP") return copy.radarReasonSmallCap;
  if (code === "BUY_IMBALANCE") return copy.radarReasonBuyImbalance.replace("{value}", value ?? "—");
  if (code === "WHALE_BUY") return copy.radarReasonWhaleBuy.replace("{value}", money(value ?? null));
  if (code === "BID_WALL") return copy.radarReasonBidWall.replace("{value}", value ?? "—");
  if (code === "OI") return copy.radarReasonOi.replace("{value}", value ?? "—");
  if (code === "SHORT_LIQ") return copy.radarReasonShortLiq.replace("{value}", money(value ?? null));
  if (code === "DEX_TURNOVER") return copy.radarReasonDexTurnover.replace("{value}", value ?? "—");
  if (code === "DEX_BUY") return copy.radarReasonDexBuy.replace("{value}", value ?? "—");
  if (code === "DEX_LIQUIDITY") return copy.radarReasonDexLiquidity.replace("{value}", money(value ?? null));
  if (code === "DEX_VOLUME") return copy.radarReasonDexVolume.replace("{value}", money(value ?? null));
  if (code === "CEX_CONFIRM") return copy.radarReasonCexConfirm.replace("{value}", value ?? "—");
  if (code === "CHANNELS") return copy.radarReasonChannels.replace("{value}", value ?? "—");
  if (code === "OUTFLOW") return copy.radarReasonOutflow.replace("{value}", money(value ?? null));
  if (code === "ONCHAIN") return copy.radarReasonOnchain.replace("{value}", money(value ?? null));
  return reason;
};

const defaults = {
  minimumScore: 75,
  minMarketCapM: 3,
  maxMarketCapM: 0,
  minTurnoverPercent: 15,
  minVolumeAcceleration: 0,
  minPriceChange24h: 0,
  minTradeCount24h: 0,
  minTurnover72hPercent: 0,
  minBuyImbalancePercent: 0,
  minWhaleBuyVolumeK: 0,
  minBidWallImbalancePercent: 0,
  minOpenInterestChangePercent: 0,
  minDexTurnoverPercent: 0,
  minDexLiquidityK: 0,
  minDexBuyImbalancePercent: 0,
  minShortLiquidationK: 0,
  maxFundingRatePercent: 0,
  minOnchainWhaleM: 0,
  minExchangeOutflowM: 0,
  minCexConfirmations: 0,
  minChannelConfirmations: 0
};

type Draft = typeof defaults;

const draftFromUser = (user: User): Draft => ({
  minimumScore: user.radarMinimumScore,
  minMarketCapM: user.radarMinMarketCap / 1_000_000,
  maxMarketCapM: (user.radarMaxMarketCap ?? 0) / 1_000_000,
  minTurnoverPercent: user.radarMinTurnoverPercent,
  minVolumeAcceleration: user.radarMinVolumeAcceleration ?? 0,
  minPriceChange24h: user.radarMinPriceChange24h ?? 0,
  minTradeCount24h: user.radarMinTradeCount24h ?? 0,
  minTurnover72hPercent: user.radarMinTurnover72hPercent ?? 0,
  minBuyImbalancePercent: user.radarMinBuyImbalancePercent ?? 0,
  minWhaleBuyVolumeK: (user.radarMinWhaleBuyVolumeUsd ?? 0) / 1_000,
  minBidWallImbalancePercent: user.radarMinBidWallImbalancePercent ?? 0,
  minOpenInterestChangePercent: user.radarMinOpenInterestChangePercent ?? 0,
  minDexTurnoverPercent: user.radarMinDexTurnoverPercent ?? 0,
  minDexLiquidityK: (user.radarMinDexLiquidityUsd ?? 0) / 1_000,
  minDexBuyImbalancePercent: user.radarMinDexBuyImbalancePercent ?? 0,
  minShortLiquidationK: (user.radarMinShortLiquidationUsd ?? 0) / 1_000,
  maxFundingRatePercent: user.radarMaxFundingRatePercent ?? 0,
  minOnchainWhaleM: (user.radarMinOnchainWhaleUsd ?? 0) / 1_000_000,
  minExchangeOutflowM: (user.radarMinExchangeOutflowUsd ?? 0) / 1_000_000,
  minCexConfirmations: user.radarMinCexConfirmations ?? 0,
  minChannelConfirmations: user.radarMinChannelConfirmations ?? 0
});

export function RadarPanel({ copy, user, initData, onBack, onUserUpdated }: Props) {
  const [signals, setSignals] = useState<RadarSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => draftFromUser(user));

  const load = async () => {
    try { setLoading(true); setSignals(await getRadarSignals(initData)); }
    catch { setMessage(copy.radarLoadFailed); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 300_000);
    return () => window.clearInterval(timer);
  }, []);

  const n = (value: number) => Number.isFinite(value) ? value : 0;
  const settingsPayload = (enabled = user.radarNotificationsEnabled): RadarSettingsInput => ({
    enabled,
    minimumScore: Math.trunc(n(draft.minimumScore)),
    minMarketCap: Math.max(0, n(draft.minMarketCapM)) * 1_000_000,
    maxMarketCap: Math.max(0, n(draft.maxMarketCapM)) * 1_000_000,
    minTurnoverPercent: Math.max(0, n(draft.minTurnoverPercent)),
    minVolumeAcceleration: Math.max(0, n(draft.minVolumeAcceleration)),
    minPriceChange24h: n(draft.minPriceChange24h),
    minTradeCount24h: Math.max(0, Math.trunc(n(draft.minTradeCount24h))),
    minTurnover72hPercent: Math.max(0, n(draft.minTurnover72hPercent)),
    minBuyImbalancePercent: Math.max(0, n(draft.minBuyImbalancePercent)),
    minWhaleBuyVolumeUsd: Math.max(0, n(draft.minWhaleBuyVolumeK)) * 1_000,
    minBidWallImbalancePercent: Math.max(0, n(draft.minBidWallImbalancePercent)),
    minOpenInterestChangePercent: Math.max(0, n(draft.minOpenInterestChangePercent)),
    minDexTurnoverPercent: Math.max(0, n(draft.minDexTurnoverPercent)),
    minDexLiquidityUsd: Math.max(0, n(draft.minDexLiquidityK)) * 1_000,
    minDexBuyImbalancePercent: Math.max(0, n(draft.minDexBuyImbalancePercent)),
    minShortLiquidationUsd: Math.max(0, n(draft.minShortLiquidationK)) * 1_000,
    maxFundingRatePercent: Math.max(0, n(draft.maxFundingRatePercent)),
    minOnchainWhaleUsd: Math.max(0, n(draft.minOnchainWhaleM)) * 1_000_000,
    minExchangeOutflowUsd: Math.max(0, n(draft.minExchangeOutflowM)) * 1_000_000,
    minCexConfirmations: Math.min(3, Math.max(0, Math.trunc(n(draft.minCexConfirmations)))),
    minChannelConfirmations: Math.min(10, Math.max(0, Math.trunc(n(draft.minChannelConfirmations))))
  });

  const saveSettings = async (enabled = user.radarNotificationsEnabled) => {
    try {
      setBusy(true); setMessage(null);
      const updated = await updateRadarSettings(settingsPayload(enabled), initData);
      onUserUpdated(updated);
      setDraft(draftFromUser(updated));
      setMessage(copy.radarSettingsSaved);
    } catch { setMessage(copy.radarActionFailed); }
    finally { setBusy(false); }
  };

  const resetFilters = () => setDraft({ ...defaults });

  const testNotification = async () => {
    try { setBusy(true); setMessage(null); await sendRadarTestNotification(initData); setMessage(copy.radarTestSent); }
    catch { setMessage(copy.radarActionFailed); }
    finally { setBusy(false); }
  };

  const scanNow = async () => {
    try { setBusy(true); setMessage(copy.radarScanning); await runRadarScan(initData); await load(); setMessage(copy.radarScanDone); }
    catch { setMessage(copy.radarActionFailed); }
    finally { setBusy(false); }
  };

  const numberField = (key: keyof Draft, label: string, unit: string, step = 1, min?: number, max?: number) => (
    <label>{label}
      <div className="radar-input-with-unit">
        <input type="number" step={step} min={min} max={max} value={draft[key]} disabled={busy}
          onChange={(event) => setDraft((value) => ({ ...value, [key]: Number(event.target.value) }))} />
        <span>{unit}</span>
      </div>
    </label>
  );

  return (
    <section className="radar-screen">
      <header className="radar-header">
        <button type="button" className="radar-back" onClick={onBack}>← {copy.backToServices}</button>
        <span className="radar-live">● {copy.radarLive}</span>
        <h1>🔎 {copy.radarTitle}</h1>
        <p>{copy.radarSubtitle}</p>
      </header>

      <article className="radar-settings-card radar-settings-card--advanced">
        <div className="radar-settings-heading"><strong>🔔 {copy.radarTelegramTitle}</strong><p>{copy.radarTelegramHint}</p></div>
        <label className="radar-switch">
          <input type="checkbox" checked={user.radarNotificationsEnabled} disabled={busy} onChange={(event) => void saveSettings(event.target.checked)} />
          <span>{user.radarNotificationsEnabled ? copy.radarEnabled : copy.radarDisabled}</span>
        </label>

        <h3 className="radar-filter-group-title">{copy.radarGroupCore}</h3>
        <div className="radar-filter-grid">
          <label>{copy.radarMinimumScore}
            <select value={draft.minimumScore} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minimumScore: Number(event.target.value) }))}>
              {[60, 65, 70, 75, 80, 85, 90, 95].map((score) => <option key={score} value={score}>{score}/100</option>)}
            </select>
          </label>
          {numberField("minMarketCapM", copy.radarMinMarketCap, "$M", 1, 0)}
          {numberField("maxMarketCapM", copy.radarMaxMarketCap, "$M", 1, 0)}
          {numberField("minTurnoverPercent", copy.radarMinTurnover, "%", 0.5, 0)}
          {numberField("minTurnover72hPercent", copy.radarMinTurnover72h, "%", 1, 0)}
          {numberField("minVolumeAcceleration", copy.radarMinAcceleration, "x", 0.1, 0)}
          {numberField("minPriceChange24h", copy.radarMinPriceChange, "%", 0.5)}
          {numberField("minTradeCount24h", copy.radarMinTrades, "#", 1000, 0)}
        </div>

        <h3 className="radar-filter-group-title">{copy.radarGroupFlow}</h3>
        <div className="radar-filter-grid">
          {numberField("minBuyImbalancePercent", copy.radarMinBuyImbalance, "%", 1, 0, 100)}
          {numberField("minWhaleBuyVolumeK", copy.radarMinWhaleBuy, "$K", 10, 0)}
          {numberField("minBidWallImbalancePercent", copy.radarMinBidWall, "%", 1, 0, 100)}
          {numberField("minCexConfirmations", copy.radarMinCexConfirmations, "CEX", 1, 0, 3)}
          {numberField("minChannelConfirmations", copy.radarMinChannelConfirmations, "ch", 1, 0, 10)}
        </div>

        <h3 className="radar-filter-group-title">{copy.radarGroupDerivatives}</h3>
        <div className="radar-filter-grid">
          {numberField("minOpenInterestChangePercent", copy.radarMinOiChange, "%", 0.1, 0)}
          {numberField("minShortLiquidationK", copy.radarMinShortLiq, "$K", 10, 0)}
          {numberField("maxFundingRatePercent", copy.radarMaxFunding, "%", 0.001, 0)}
        </div>

        <h3 className="radar-filter-group-title">{copy.radarGroupDexOnchain}</h3>
        <div className="radar-filter-grid">
          {numberField("minDexTurnoverPercent", copy.radarMinDexTurnover, "%", 1, 0)}
          {numberField("minDexLiquidityK", copy.radarMinDexLiquidity, "$K", 10, 0)}
          {numberField("minDexBuyImbalancePercent", copy.radarMinDexBuyImbalance, "%", 1, 0, 100)}
          {numberField("minOnchainWhaleM", copy.radarMinOnchainWhale, "$M", 0.1, 0)}
          {numberField("minExchangeOutflowM", copy.radarMinExchangeOutflow, "$M", 0.1, 0)}
        </div>

        <p className="radar-filter-note">{copy.radarFilterHintV33}</p>
        <div className="radar-actions">
          <button type="button" disabled={busy} onClick={() => void saveSettings()}>{copy.radarSaveFilters}</button>
          <button type="button" disabled={busy} onClick={resetFilters}>{copy.radarResetFilters}</button>
          <button type="button" disabled={busy} onClick={() => void testNotification()}>{copy.radarTestButton}</button>
          {user.role === "ADMIN" ? <button type="button" disabled={busy} onClick={() => void scanNow()}>{copy.radarScanButton}</button> : null}
        </div>
        {message ? <p className="radar-message">{message}</p> : null}
      </article>

      <div className="radar-section-title"><div><strong>{copy.radarCandidates}</strong><small>{copy.radarSourcesV33}</small></div><button type="button" onClick={() => void load()} disabled={loading}>↻</button></div>
      {loading && !signals.length ? <div className="radar-empty">{copy.loading}</div> : null}
      {!loading && !signals.length ? <div className="radar-empty">{copy.radarNoSignals}</div> : null}
      <div className="radar-list">
        {signals.map((signal) => (
          <article className="radar-signal-card" key={signal.id}>
            <div className="radar-signal-head">
              <div><strong>{signal.symbol.endsWith("USDT") ? signal.symbol.replace(/USDT$/, "/USDT") : signal.symbol}</strong><span>{new Date(signal.detectedAt).toLocaleString()}</span></div>
              <b className={`radar-score ${signal.score >= 85 ? "is-hot" : ""}`}>{signal.score}<small>/100</small></b>
            </div>
            <div className="radar-metrics">
              <span><small>{copy.radarPrice}</small><b>{Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b></span>
              <span><small>{copy.radarChange}</small><b className={(signal.priceChange24h ?? 0) >= 0 ? "positive" : "negative"}>{pct(signal.priceChange24h, 2)}</b></span>
              <span><small>{copy.radarTurnover}</small><b>{signal.turnover24h == null ? "—" : `${(signal.turnover24h * 100).toFixed(1)}%`}</b></span>
              <span><small>{copy.radarTurnover72}</small><b>{signal.turnover72h == null || signal.turnover72h === 0 ? "—" : `${(signal.turnover72h * 100).toFixed(1)}%`}</b></span>
              <span><small>{copy.radarAcceleration}</small><b>{signal.volumeAcceleration == null ? "—" : `${signal.volumeAcceleration.toFixed(1)}x`}</b></span>
              <span><small>{copy.radarBuyPressure}</small><b>{pct(signal.buySellImbalance)}</b></span>
              <span><small>{copy.radarMarketCap}</small><b>{money(signal.marketCap)}</b></span>
              <span><small>{copy.radarCexConfirmations}</small><b>{signal.cexConfirmations}/3</b></span>
              {signal.chainId ? <span><small>{copy.radarChain}</small><b>{signal.chainId}</b></span> : null}
              {Number(signal.whaleBuyVolumeUsd ?? 0) > 0 ? <span><small>{copy.radarWhaleBuys}</small><b>{money(signal.whaleBuyVolumeUsd)}</b></span> : null}
              {Math.abs(signal.bidWallImbalance ?? 0) > 0.1 ? <span><small>{copy.radarBidWall}</small><b>{pct(signal.bidWallImbalance)}</b></span> : null}
              {Math.abs(signal.openInterestChange ?? 0) > 0.01 ? <span><small>{copy.radarOiChange}</small><b>{pct(signal.openInterestChange)}</b></span> : null}
              {Math.abs(signal.fundingRate ?? 0) > 0.0001 ? <span><small>{copy.radarFunding}</small><b>{pct(signal.fundingRate, 3)}</b></span> : null}
              {Number(signal.shortLiquidationUsd ?? 0) > 0 ? <span><small>{copy.radarShortLiq}</small><b>{money(signal.shortLiquidationUsd)}</b></span> : null}
              {signal.dexTurnover24h != null && signal.dexTurnover24h > 0 ? <span><small>{copy.radarDexTurnover}</small><b>{(signal.dexTurnover24h * 100).toFixed(1)}%</b></span> : null}
              {Number(signal.dexLiquidityUsd ?? 0) > 0 ? <span><small>{copy.radarDexLiquidity}</small><b>{money(signal.dexLiquidityUsd)}</b></span> : null}
              {signal.channelConfirmations > 0 ? <span><small>{copy.radarChannelConfirmations}</small><b>{signal.channelConfirmations}</b></span> : null}
              {Number(signal.onchainWhaleUsd ?? 0) > 0 ? <span><small>{copy.radarOnchainWhale}</small><b>{money(signal.onchainWhaleUsd)}</b></span> : null}
              {Number(signal.exchangeOutflowUsd ?? 0) > 0 ? <span><small>{copy.radarExchangeOutflow}</small><b>{money(signal.exchangeOutflowUsd)}</b></span> : null}
              <span><small>{copy.radarSource}</small><b>{signal.sourceSummary}</b></span>
            </div>
            <ul>{signal.reasons.map((reason) => <li key={reason}>{reasonText(reason, copy)}</li>)}</ul>
          </article>
        ))}
      </div>
      <p className="radar-disclaimer">⚠️ {copy.radarDisclaimer}</p>
    </section>
  );
}
