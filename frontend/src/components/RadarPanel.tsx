import { useEffect, useState } from "react";
import { getRadarSignals, runRadarScan, sendRadarTestNotification, updateRadarSettings } from "../api/radar";
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

  const load = async () => {
    try { setLoading(true); setSignals(await getRadarSignals(initData)); }
    catch { setMessage(copy.radarLoadFailed); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60000); return () => window.clearInterval(timer); }, []);

  const saveSettings = async (enabled: boolean, minimumScore = user.radarMinimumScore) => {
    try {
      setBusy(true); setMessage(null);
      onUserUpdated(await updateRadarSettings(enabled, minimumScore, initData));
      setMessage(copy.radarSettingsSaved);
    } catch { setMessage(copy.radarActionFailed); }
    finally { setBusy(false); }
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

      <article className="radar-settings-card">
        <div><strong>🔔 {copy.radarTelegramTitle}</strong><p>{copy.radarTelegramHint}</p></div>
        <label className="radar-switch">
          <input type="checkbox" checked={user.radarNotificationsEnabled} disabled={busy} onChange={(event) => void saveSettings(event.target.checked)} />
          <span>{user.radarNotificationsEnabled ? copy.radarEnabled : copy.radarDisabled}</span>
        </label>
        <label>{copy.radarMinimumScore}
          <select value={user.radarMinimumScore} disabled={busy} onChange={(event) => void saveSettings(user.radarNotificationsEnabled, Number(event.target.value))}>
            {[70, 75, 80, 85, 90].map((score) => <option key={score} value={score}>{score}/100</option>)}
          </select>
        </label>
        <div className="radar-actions">
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
