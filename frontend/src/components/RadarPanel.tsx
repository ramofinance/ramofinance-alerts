import { useEffect, useState } from "react";
import { getRadarSignals, runRadarScan, sendRadarTestNotification, updateRadarSettings, type RadarSettingsInput } from "../api/radar";
import type { RadarSignal, User } from "../types/api";

type Props = { copy: any; user: User; initData: string; onBack: () => void; onUserUpdated: (user: User) => void };

const money = (value: string | null) => {
  if (!value) return "—";
  const number = Number(value);
  if (number >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
  if (number >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const reasonText = (reason: string, copy: any) => {
  const [code, value] = reason.split(":");
  if (code === "TURNOVER") return copy.radarReasonTurnover.replace("{value}", value ?? "—");
  if (code === "ACCELERATION") return copy.radarReasonAcceleration.replace("{value}", value ?? "—");
  if (code === "PRICE") return copy.radarReasonPrice.replace("{value}", value ?? "—");
  if (code === "HIGH_TRADES") return copy.radarReasonTrades;
  if (code === "SMALL_CAP") return copy.radarReasonSmallCap;
  return reason;
};

export function RadarPanel({ copy, user, initData, onBack, onUserUpdated }: Props) {
  const [signals, setSignals] = useState<RadarSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    minimumScore: user.radarMinimumScore,
    minMarketCapM: user.radarMinMarketCap / 1_000_000,
    maxMarketCapM: user.radarMaxMarketCap == null ? "" : String(user.radarMaxMarketCap / 1_000_000),
    minTurnoverPercent: user.radarMinTurnoverPercent,
    minVolumeAcceleration: user.radarMinVolumeAcceleration == null ? "" : String(user.radarMinVolumeAcceleration),
    minPriceChange24h: user.radarMinPriceChange24h == null ? "" : String(user.radarMinPriceChange24h),
    minTradeCount24h: user.radarMinTradeCount24h == null ? "" : String(user.radarMinTradeCount24h)
  });

  const load = async () => {
    try { setLoading(true); setSignals(await getRadarSignals(initData)); }
    catch { setMessage(copy.radarLoadFailed); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60000); return () => window.clearInterval(timer); }, []);

  const settingsPayload = (enabled = user.radarNotificationsEnabled): RadarSettingsInput => ({
    enabled,
    minimumScore: Number(draft.minimumScore),
    minMarketCap: Math.max(0, Number(draft.minMarketCapM) || 0) * 1_000_000,
    maxMarketCap: draft.maxMarketCapM === "" ? null : Math.max(0, Number(draft.maxMarketCapM) || 0) * 1_000_000,
    minTurnoverPercent: Math.max(0, Number(draft.minTurnoverPercent) || 0),
    minVolumeAcceleration: draft.minVolumeAcceleration === "" ? null : Math.max(0, Number(draft.minVolumeAcceleration) || 0),
    minPriceChange24h: draft.minPriceChange24h === "" ? null : Number(draft.minPriceChange24h),
    minTradeCount24h: draft.minTradeCount24h === "" ? null : Math.max(0, Math.trunc(Number(draft.minTradeCount24h) || 0))
  });

  const saveSettings = async (enabled = user.radarNotificationsEnabled) => {
    try {
      setBusy(true); setMessage(null);
      const updated = await updateRadarSettings(settingsPayload(enabled), initData);
      onUserUpdated(updated);
      setDraft({
        minimumScore: updated.radarMinimumScore,
        minMarketCapM: updated.radarMinMarketCap / 1_000_000,
        maxMarketCapM: updated.radarMaxMarketCap == null ? "" : String(updated.radarMaxMarketCap / 1_000_000),
        minTurnoverPercent: updated.radarMinTurnoverPercent,
        minVolumeAcceleration: updated.radarMinVolumeAcceleration == null ? "" : String(updated.radarMinVolumeAcceleration),
        minPriceChange24h: updated.radarMinPriceChange24h == null ? "" : String(updated.radarMinPriceChange24h),
        minTradeCount24h: updated.radarMinTradeCount24h == null ? "" : String(updated.radarMinTradeCount24h)
      });
      setMessage(copy.radarSettingsSaved);
    } catch { setMessage(copy.radarActionFailed); }
    finally { setBusy(false); }
  };

  const resetFilters = () => {
    setDraft({ minimumScore: 75, minMarketCapM: 3, maxMarketCapM: "", minTurnoverPercent: 15, minVolumeAcceleration: "", minPriceChange24h: "", minTradeCount24h: "" });
  };

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
        <div className="radar-filter-grid">
          <label>{copy.radarMinimumScore}
            <select value={draft.minimumScore} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minimumScore: Number(event.target.value) }))}>
              {[70, 75, 80, 85, 90, 95].map((score) => <option key={score} value={score}>{score}/100</option>)}
            </select>
          </label>
          <label>{copy.radarMinMarketCap}
            <div className="radar-input-with-unit"><input type="number" min="0" step="1" value={draft.minMarketCapM} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minMarketCapM: Number(event.target.value) }))} /><span>$M</span></div>
          </label>
          <label>{copy.radarMaxMarketCap}
            <div className="radar-input-with-unit"><input type="number" min="0" step="1" placeholder={copy.radarNoLimit} value={draft.maxMarketCapM} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, maxMarketCapM: event.target.value }))} /><span>$M</span></div>
          </label>
          <label>{copy.radarMinTurnover}
            <div className="radar-input-with-unit"><input type="number" min="0" step="0.5" value={draft.minTurnoverPercent} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minTurnoverPercent: Number(event.target.value) }))} /><span>%</span></div>
          </label>
          <label>{copy.radarMinAcceleration}
            <div className="radar-input-with-unit"><input type="number" min="0" step="0.1" placeholder={copy.radarNoLimit} value={draft.minVolumeAcceleration} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minVolumeAcceleration: event.target.value }))} /><span>x</span></div>
          </label>
          <label>{copy.radarMinPriceChange}
            <div className="radar-input-with-unit"><input type="number" step="0.5" placeholder={copy.radarNoLimit} value={draft.minPriceChange24h} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minPriceChange24h: event.target.value }))} /><span>%</span></div>
          </label>
          <label>{copy.radarMinTrades}
            <input type="number" min="0" step="1000" placeholder={copy.radarNoLimit} value={draft.minTradeCount24h} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minTradeCount24h: event.target.value }))} />
          </label>
        </div>
        <p className="radar-filter-note">{copy.radarFilterHint}</p>
        <div className="radar-actions">
          <button type="button" disabled={busy} onClick={() => void saveSettings()}>{copy.radarSaveFilters}</button>
          <button type="button" disabled={busy} onClick={resetFilters}>{copy.radarResetFilters}</button>
          <button type="button" disabled={busy} onClick={() => void testNotification()}>{copy.radarTestButton}</button>
          {user.role === "ADMIN" ? <button type="button" disabled={busy} onClick={() => void scanNow()}>{copy.radarScanButton}</button> : null}
        </div>
        {message ? <p className="radar-message">{message}</p> : null}
      </article>

      <div className="radar-section-title"><div><strong>{copy.radarCandidates}</strong><small>{copy.radarSources}</small></div><button type="button" onClick={() => void load()} disabled={loading}>↻</button></div>
      {loading && !signals.length ? <div className="radar-empty">{copy.loading}</div> : null}
      {!loading && !signals.length ? <div className="radar-empty">{copy.radarNoSignals}</div> : null}
      <div className="radar-list">
        {signals.map((signal) => (
          <article className="radar-signal-card" key={signal.id}>
            <div className="radar-signal-head">
              <div><strong>{signal.symbol.replace("USDT", "/USDT")}</strong><span>{new Date(signal.detectedAt).toLocaleString()}</span></div>
              <b className={`radar-score ${signal.score >= 85 ? "is-hot" : ""}`}>{signal.score}<small>/100</small></b>
            </div>
            <div className="radar-metrics">
              <span><small>{copy.radarPrice}</small><b>{Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b></span>
              <span><small>{copy.radarChange}</small><b className={(signal.priceChange24h ?? 0) >= 0 ? "positive" : "negative"}>{(signal.priceChange24h ?? 0) >= 0 ? "+" : ""}{signal.priceChange24h?.toFixed(2) ?? "—"}%</b></span>
              <span><small>{copy.radarTurnover}</small><b>{signal.turnover24h == null ? "—" : `${(signal.turnover24h * 100).toFixed(1)}%`}</b></span>
              <span><small>{copy.radarAcceleration}</small><b>{signal.volumeAcceleration == null ? "—" : `${signal.volumeAcceleration.toFixed(1)}x`}</b></span>
              <span><small>{copy.radarMarketCap}</small><b>{money(signal.marketCap)}</b></span>
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
