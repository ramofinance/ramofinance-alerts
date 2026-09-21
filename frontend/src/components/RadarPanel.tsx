import { useEffect, useState } from "react";
import { getRadarSignals, runRadarScan, sendRadarTestNotification, updateRadarSettings, type RadarSettingsInput } from "../api/radar";
import type { RadarSignal, User } from "../types/api";
import { getRadarHelp, type RadarHelpKey } from "./radar-help";

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
  if (code === "LOW_CAP") return copy.radarReasonLowCap ?? "Low-cap gem range.";
  if (code === "MID_CAP") return copy.radarReasonMidCap ?? "Mid-cap gem range.";
  if (code === "HIGH_CAP") return copy.radarReasonHighCap ?? "Higher-cap range.";
  if (code === "DEX_UNIQUE_BUYERS") return (copy.radarReasonUniqueBuyers ?? "{value} unique DEX buyers in 24h.").replace("{value}", value ?? "—");
  if (code === "SQUEEZE_DEPTH") { const parts = reason.split(":"); return (copy.radarReasonSqueezeDepth ?? "Short-squeeze candle swept {value} prior candles on {timeframe}.").replace("{value}", parts[1] ?? "—").replace("{timeframe}", parts[2] ?? "—"); }
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
  includeLowCap: true,
  includeMidCap: true,
  includeHighCap: false,
  includeDex: true,
  includeCex: true,
  minTurnoverPercent: 15,
  minPriceChange24h: 0,
  minTradeCount24h: 0,
  minDexUniqueBuyers24h: 0,
  minBuyImbalancePercent: 0,
  minDexLiquidityK: 0,
  minDexVolumeK: 0,
  minShortLiquidationK: 0,
  minShortSqueezeDepth: 0
};

type Draft = typeof defaults;
type NumericDraftKey = Exclude<keyof Draft, "includeLowCap" | "includeMidCap" | "includeHighCap" | "includeDex" | "includeCex">;

const draftFromUser = (user: User): Draft => ({
  minimumScore: user.radarMinimumScore,
  includeLowCap: user.radarIncludeLowCap ?? true,
  includeMidCap: user.radarIncludeMidCap ?? true,
  includeHighCap: user.radarIncludeHighCap ?? false,
  includeDex: user.radarIncludeDex ?? true,
  includeCex: user.radarIncludeCex ?? true,
  minTurnoverPercent: user.radarMinTurnoverPercent,
  minPriceChange24h: user.radarMinPriceChange24h ?? 0,
  minTradeCount24h: user.radarMinTradeCount24h ?? 0,
  minDexUniqueBuyers24h: user.radarMinDexUniqueBuyers24h ?? 0,
  minBuyImbalancePercent: user.radarMinBuyImbalancePercent ?? 0,
  minDexLiquidityK: (user.radarMinDexLiquidityUsd ?? 0) / 1_000,
  minDexVolumeK: (user.radarMinDexVolumeUsd ?? 0) / 1_000,
  minShortLiquidationK: (user.radarMinShortLiquidationUsd ?? 0) / 1_000,
  minShortSqueezeDepth: user.radarMinShortSqueezeDepth ?? 0
});

export function RadarPanel({ copy, user, initData, onBack, onUserUpdated }: Props) {
  const [signals, setSignals] = useState<RadarSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => draftFromUser(user));
  const [activeHelp, setActiveHelp] = useState<RadarHelpKey | null>(null);
  const help = getRadarHelp(user.preferredLanguage ?? user.languageCode);

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
    includeLowCap: draft.includeLowCap,
    includeMidCap: draft.includeMidCap,
    includeHighCap: draft.includeHighCap,
    includeDex: draft.includeDex,
    includeCex: draft.includeCex,
    minTurnoverPercent: Math.max(0, n(draft.minTurnoverPercent)),
    minPriceChange24h: n(draft.minPriceChange24h),
    minTradeCount24h: Math.max(0, Math.trunc(n(draft.minTradeCount24h))),
    minDexUniqueBuyers24h: Math.max(0, Math.trunc(n(draft.minDexUniqueBuyers24h))),
    minBuyImbalancePercent: Math.max(0, n(draft.minBuyImbalancePercent)),
    minDexLiquidityUsd: Math.max(0, n(draft.minDexLiquidityK)) * 1_000,
    minDexVolumeUsd: Math.max(0, n(draft.minDexVolumeK)) * 1_000,
    minShortLiquidationUsd: Math.max(0, n(draft.minShortLiquidationK)) * 1_000,
    minShortSqueezeDepth: Math.max(0, Math.trunc(n(draft.minShortSqueezeDepth)))
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

  const fieldTitle = (label: string, helpKey: RadarHelpKey) => (
    <span className="radar-field-title">
      <span>{label}</span>
      <button type="button" className="radar-info-button" aria-label={`Info: ${label}`} aria-expanded={activeHelp === helpKey}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveHelp((current) => current === helpKey ? null : helpKey); }}>!</button>
      {activeHelp === helpKey ? <span className="radar-help-popover" role="note">{help[helpKey]}</span> : null}
    </span>
  );

  const numberField = (key: NumericDraftKey, label: string, unit: string, helpKey: RadarHelpKey, step = 1, min?: number, max?: number, forceDisabled = false) => (
    <label>{fieldTitle(label, helpKey)}
      <div className="radar-input-with-unit">
        <input type="number" step={step} min={min} max={max} value={draft[key] as number} disabled={busy || forceDisabled}
          onChange={(event) => setDraft((value) => ({ ...value, [key]: Number(event.target.value) }))} />
        <span>{unit}</span>
      </div>
    </label>
  );

  const isFa = String(user.preferredLanguage ?? user.languageCode ?? "").toUpperCase().startsWith("FA");
  const settingsText = isFa ? {
    capTitle: "بازه Market Cap",
    sourceTitle: "منابع بازار",
    priorityTitle: "فاکتورهای اصلی امتیازدهی",
    low: "LOW CAP · $10K–$1M",
    mid: "MID CAP · $1M–$100M",
    high: "HIGH CAP · $100M–$500M",
    dex: "DEX",
    cex: "CEX",
    dexVolume: "حداقل حجم DEX در 24h",
    scoreNote: "فقط فاکتورهای این بخش روی Score اصلی اثر دارند. بقیه داده‌ها همچنان بررسی و در جزئیات سیگنال نمایش داده می‌شوند.",
    explanationsTitle: "توضیحات همه فاکتورهای Radar",
    explanationsHint: "همه داده‌هایی که برای هر کوین بررسی می‌شوند؛ چه فاکتورهای امتیازدهی و چه اطلاعات تکمیلی.",
    marketAge: "سابقه بازار",
    marketIdentity: "شبکه، جفت و Contract",
    uniqueSellers: "فروشندگان یکتای DEX"
  } : {
    capTitle: "Market-cap ranges",
    sourceTitle: "Market sources",
    priorityTitle: "Primary scoring factors",
    low: "LOW CAP · $10K–$1M",
    mid: "MID CAP · $1M–$100M",
    high: "HIGH CAP · $100M–$500M",
    dex: "DEX",
    cex: "CEX",
    dexVolume: "Minimum DEX volume (24h)",
    scoreNote: "Only the factors shown here affect the primary score. Other intelligence is still checked and shown as supplementary evidence.",
    explanationsTitle: "All Radar factor explanations",
    explanationsHint: "Every data point checked for a coin, including scored factors and supplementary intelligence.",
    marketAge: "Market history",
    marketIdentity: "Network, pair and contract",
    uniqueSellers: "Unique DEX sellers"
  };

  const guideItems = [
    { label: settingsText.marketAge, text: isFa ? "دارایی باید حداقل ۱۰ روز سابقه بازار قابل‌تأیید داشته باشد. توکن‌ها و Poolهای تازه‌ساخته‌شده قبل از ۱۰ روز اصلاً وارد Radar نمی‌شوند." : "The asset must have at least 10 days of verifiable market history. Newly created tokens/pools are excluded before they reach 10 days." },
    { label: settingsText.marketIdentity, text: isFa ? "برای DEX شبکه، جفت معاملاتی، DEX و آدرس Contract ثبت می‌شود تا توکن‌های هم‌نام با هم اشتباه نشوند." : "For DEX assets, Radar records network, pair, DEX and contract address so same-name tokens are not confused." },
    { label: settingsText.capTitle, text: help.capRanges },
    { label: settingsText.sourceTitle + " — DEX", text: help.sourceDex },
    { label: settingsText.sourceTitle + " — CEX", text: help.sourceCex },
    { label: copy.radarMinimumScore, text: help.minimumScore },
    { label: copy.radarMinTurnover, text: help.minTurnover24h },
    { label: copy.radarMinTrades, text: help.minTrades },
    { label: copy.radarMinUniqueBuyers ?? "Unique DEX buyers", text: help.minUniqueBuyers },
    { label: settingsText.uniqueSellers, text: isFa ? "تعداد Walletهای یکتایی که در ۲۴ ساعت روی DEX فروش داشته‌اند. این داده برای سنجش توزیع واقعی فعالیت و مقایسه با خریداران یکتا نمایش داده می‌شود و به‌تنهایی امتیاز جداگانه ندارد." : "Unique wallets that sold on the DEX in 24h. It helps show how broadly activity is distributed and is supplementary rather than a separate score item." },
    { label: copy.radarMinPriceChange, text: help.minPriceChange },
    { label: copy.radarMinBuyImbalance, text: help.minBuyPressure },
    { label: copy.radarMinDexLiquidity, text: help.minDexLiquidity },
    { label: settingsText.dexVolume, text: help.minDexVolume },
    { label: copy.radarMinShortLiq, text: help.minShortLiq },
    { label: copy.radarMinSqueezeDepth ?? "Short-squeeze depth", text: help.minSqueezeDepth },
    { label: copy.radarTurnover72, text: help.minTurnover72h },
    { label: copy.radarAcceleration, text: help.minAcceleration },
    { label: copy.radarWhaleBuys, text: help.minWhaleBuy },
    { label: copy.radarBidWall, text: help.minBidWall },
    { label: copy.radarOiChange, text: help.minOi },
    { label: copy.radarFunding, text: help.maxFunding },
    { label: copy.radarDexTurnover, text: help.minDexTurnover },
    { label: copy.radarDexBuyPressure ?? "DEX buy pressure", text: help.minDexBuyPressure },
    { label: copy.radarCexConfirmations, text: help.minCex },
    { label: copy.radarChannelConfirmations, text: help.minChannels },
    { label: copy.radarOnchainWhale, text: help.minOnchainWhale },
    { label: copy.radarExchangeOutflow, text: help.minExchangeOutflow }
  ];

  const toggleCap = (key: "includeLowCap" | "includeMidCap" | "includeHighCap") => {
    setDraft((current) => {
      if (current[key] && [current.includeLowCap, current.includeMidCap, current.includeHighCap].filter(Boolean).length === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  };

  const toggleSource = (key: "includeDex" | "includeCex") => {
    setDraft((current) => {
      const other = key === "includeDex" ? current.includeCex : current.includeDex;
      if (current[key] && !other) return current;
      return { ...current, [key]: !current[key] };
    });
  };
  const capTier = (raw: string | null) => {
    const cap = Number(raw ?? 0);
    if (cap >= 10_000 && cap < 1_000_000) return { key: "low", label: "LOW CAP" };
    if (cap >= 1_000_000 && cap < 100_000_000) return { key: "mid", label: "MID CAP" };
    if (cap >= 100_000_000 && cap <= 500_000_000) return { key: "high", label: "HIGH CAP" };
    return cap > 500_000_000 ? { key: "large", label: "LARGE CAP" } : null;
  };


  const signalMatchesSavedSettings = (signal: RadarSignal) => {
    // The Mini App discovery list is intentionally broader than Telegram alerts.
    // Any stored candidate scoring 60+ can be seen here; the user's minimumScore
    // remains an alert-delivery threshold in matchesUserFilters on the backend.
    if (signal.score < 60) return false;
    const cap = Number(signal.marketCap ?? 0);
    const tier = capTier(signal.marketCap);
    if (!tier || tier.key === "large") return false;
    if (tier.key === "low" && !user.radarIncludeLowCap) return false;
    if (tier.key === "mid" && !user.radarIncludeMidCap) return false;
    if (tier.key === "high" && !user.radarIncludeHighCap) return false;

    const hasCex = signal.cexConfirmations > 0;
    const hasDex = Boolean(signal.dexUrl || signal.chainId) || Number(signal.dexVolume24h ?? 0) > 0 || Number(signal.dexLiquidityUsd ?? 0) > 0;
    if (!((user.radarIncludeCex && hasCex) || (user.radarIncludeDex && hasDex))) return false;

    // Numeric thresholds below are Telegram-alert filters only. They intentionally
    // do not hide a 60+ discovery candidate from the Mini App. This lets users
    // inspect near-threshold scans while keeping alert delivery as strict as they want.
    return cap > 0;
  };

  const visibleSignals = signals.filter(signalMatchesSavedSettings);

  return (
    <section className="radar-screen">
      <header className="radar-header">
        <button type="button" className="radar-back" onClick={onBack}>← {copy.backToServices}</button>
        <span className="radar-live">● {copy.radarLive}</span>
        <h1>🔎 {copy.radarTitle}</h1>
        <p>{copy.radarSubtitle}</p>
      </header>

      <article className="radar-settings-card radar-settings-card--advanced">
        <div className="radar-settings-heading"><strong className="radar-heading-with-help">🔔 {copy.radarTelegramTitle}<button type="button" className="radar-info-button" aria-label="Telegram alert info" aria-expanded={activeHelp === "notifications"} onClick={() => setActiveHelp((current) => current === "notifications" ? null : "notifications")}>!</button>{activeHelp === "notifications" ? <span className="radar-help-popover radar-help-popover--heading" role="note">{help.notifications}</span> : null}</strong><p>{copy.radarTelegramHint}</p></div>
        <label className="radar-switch">
          <input type="checkbox" checked={user.radarNotificationsEnabled} disabled={busy} onChange={(event) => void saveSettings(event.target.checked)} />
          <span>{user.radarNotificationsEnabled ? copy.radarEnabled : copy.radarDisabled}</span>
        </label>

        <h3 className="radar-filter-group-title">{settingsText.capTitle} {fieldTitle("", "capRanges")}</h3>
        <div className="radar-choice-grid radar-choice-grid--caps">
          <label className={`radar-choice-chip ${draft.includeLowCap ? "is-active" : ""}`}>
            <input type="checkbox" checked={draft.includeLowCap} disabled={busy} onChange={() => toggleCap("includeLowCap")} />
            <span>✓</span><b>{settingsText.low}</b>
          </label>
          <label className={`radar-choice-chip ${draft.includeMidCap ? "is-active" : ""}`}>
            <input type="checkbox" checked={draft.includeMidCap} disabled={busy} onChange={() => toggleCap("includeMidCap")} />
            <span>✓</span><b>{settingsText.mid}</b>
          </label>
          <label className={`radar-choice-chip ${draft.includeHighCap ? "is-active" : ""}`}>
            <input type="checkbox" checked={draft.includeHighCap} disabled={busy} onChange={() => toggleCap("includeHighCap")} />
            <span>✓</span><b>{settingsText.high}</b>
          </label>
        </div>

        <h3 className="radar-filter-group-title">{settingsText.sourceTitle}</h3>
        <div className="radar-choice-grid radar-choice-grid--sources">
          <label className={`radar-choice-chip ${draft.includeDex ? "is-active" : ""}`}>
            <input type="checkbox" checked={draft.includeDex} disabled={busy} onChange={() => toggleSource("includeDex")} />
            <span>✓</span><b>{settingsText.dex}</b>
            <button type="button" className="radar-info-button" aria-label="DEX info" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveHelp((current) => current === "sourceDex" ? null : "sourceDex"); }}>!</button>
            {activeHelp === "sourceDex" ? <span className="radar-help-popover" role="note">{help.sourceDex}</span> : null}
          </label>
          <label className={`radar-choice-chip ${draft.includeCex ? "is-active" : ""}`}>
            <input type="checkbox" checked={draft.includeCex} disabled={busy} onChange={() => toggleSource("includeCex")} />
            <span>✓</span><b>{settingsText.cex}</b>
            <button type="button" className="radar-info-button" aria-label="CEX info" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActiveHelp((current) => current === "sourceCex" ? null : "sourceCex"); }}>!</button>
            {activeHelp === "sourceCex" ? <span className="radar-help-popover" role="note">{help.sourceCex}</span> : null}
          </label>
        </div>

        <details className="radar-accordion radar-accordion--settings">
          <summary><span>{settingsText.priorityTitle}</span><span className="radar-accordion-chevron">⌄</span></summary>
          <div className="radar-accordion-body">
            <div className="radar-filter-grid">
              <label>{fieldTitle(copy.radarMinimumScore, "minimumScore")}
                <select value={draft.minimumScore} disabled={busy} onChange={(event) => setDraft((value) => ({ ...value, minimumScore: Number(event.target.value) }))}>
                  {[60, 65, 70, 75, 80, 85, 90, 95].map((score) => <option key={score} value={score}>{score}/100</option>)}
                </select>
              </label>
              {numberField("minTurnoverPercent", copy.radarMinTurnover, "%", "minTurnover24h", 0.5, 0)}
              {numberField("minTradeCount24h", copy.radarMinTrades, "#", "minTrades", 1000, 0)}
              {numberField("minDexUniqueBuyers24h", copy.radarMinUniqueBuyers ?? "Unique DEX buyers (24h)", "wallets", "minUniqueBuyers", 10, 0, undefined, !draft.includeDex)}
              {numberField("minPriceChange24h", copy.radarMinPriceChange, "%", "minPriceChange", 0.5)}
              {numberField("minBuyImbalancePercent", copy.radarMinBuyImbalance, "%", "minBuyPressure", 1, 0, 100)}
              {numberField("minDexLiquidityK", copy.radarMinDexLiquidity, "$K", "minDexLiquidity", 10, 0, undefined, !draft.includeDex)}
              {numberField("minDexVolumeK", settingsText.dexVolume, "$K", "minDexVolume", 10, 0, undefined, !draft.includeDex)}
              {numberField("minShortLiquidationK", copy.radarMinShortLiq, "$K", "minShortLiq", 10, 0, undefined, !draft.includeCex)}
              {numberField("minShortSqueezeDepth", copy.radarMinSqueezeDepth ?? "Minimum squeeze depth", "candles", "minSqueezeDepth", 1, 0, 100, !draft.includeCex)}
            </div>
            <p className="radar-filter-note">{settingsText.scoreNote}</p>
          </div>
        </details>

        <details className="radar-accordion radar-accordion--guide">
          <summary><span>{settingsText.explanationsTitle}</span><span className="radar-accordion-chevron">⌄</span></summary>
          <div className="radar-accordion-body">
            <p className="radar-guide-intro">{settingsText.explanationsHint}</p>
            <div className="radar-guide-list">
              {guideItems.map((item) => <div className="radar-guide-item" key={item.label}><strong>{item.label}</strong><p>{item.text}</p></div>)}
            </div>
          </div>
        </details>

        <div className="radar-actions">
          <button type="button" disabled={busy} onClick={() => void saveSettings()}>{copy.radarSaveFilters}</button>
          <button type="button" disabled={busy} onClick={resetFilters}>{copy.radarResetFilters}</button>
          <button type="button" disabled={busy} onClick={() => void testNotification()}>{copy.radarTestButton}</button>
          {user.role === "ADMIN" ? <button type="button" disabled={busy} onClick={() => void scanNow()}>{copy.radarScanButton}</button> : null}
        </div>
        {message ? <p className="radar-message">{message}</p> : null}
      </article>

      <div className="radar-section-title"><div><strong>{copy.radarCandidates}</strong><small>{copy.radarSourcesV33}</small></div><button type="button" onClick={() => void load()} disabled={loading}>↻</button></div>
      {loading && !visibleSignals.length ? <div className="radar-empty">{copy.loading}</div> : null}
      {!loading && !visibleSignals.length ? <div className="radar-empty">{copy.radarNoSignals}</div> : null}
      <div className="radar-list">
        {visibleSignals.map((signal) => (
          <article className="radar-signal-card" key={signal.id}>
            <div className="radar-signal-head">
              <div><strong>{signal.symbol.endsWith("USDT") ? signal.symbol.replace(/USDT$/, "/USDT") : signal.symbol}</strong>{capTier(signal.marketCap) ? <em className={`radar-cap-badge is-${capTier(signal.marketCap)!.key}`}>{capTier(signal.marketCap)!.label}</em> : null}<span>{new Date(signal.detectedAt).toLocaleString()}</span></div>
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
              {signal.tradeCount24h != null && signal.tradeCount24h > 0 ? <span><small>{copy.radarTradeCount ?? "24h trades"}</small><b>{signal.tradeCount24h.toLocaleString("en-US")}</b></span> : null}
              {signal.dexUniqueBuyers24h != null && signal.dexUniqueBuyers24h > 0 ? <span><small>{copy.radarUniqueBuyers ?? "Unique DEX buyers"}</small><b>{signal.dexUniqueBuyers24h.toLocaleString("en-US")}</b></span> : null}
              {signal.dexUniqueSellers24h != null && signal.dexUniqueSellers24h > 0 ? <span><small>{copy.radarUniqueSellers ?? "Unique DEX sellers"}</small><b>{signal.dexUniqueSellers24h.toLocaleString("en-US")}</b></span> : null}
              {signal.shortSqueezeDepth != null && signal.shortSqueezeDepth > 0 ? <span><small>{copy.radarSqueezeDepth ?? "Squeeze depth"}</small><b>{signal.shortSqueezeDepth} × {signal.shortSqueezeTimeframe ?? "—"}</b></span> : null}
              <span><small>{copy.radarCexConfirmations}</small><b>{signal.cexConfirmations}/3</b></span>
              {signal.chainId ? <span><small>{copy.radarChain}</small><b>{signal.chainId}</b></span> : null}
              {Number(signal.whaleBuyVolumeUsd ?? 0) > 0 ? <span><small>{copy.radarWhaleBuys}</small><b>{money(signal.whaleBuyVolumeUsd)}</b></span> : null}
              {Math.abs(signal.bidWallImbalance ?? 0) > 0.1 ? <span><small>{copy.radarBidWall}</small><b>{pct(signal.bidWallImbalance)}</b></span> : null}
              {Math.abs(signal.openInterestChange ?? 0) > 0.01 ? <span><small>{copy.radarOiChange}</small><b>{pct(signal.openInterestChange)}</b></span> : null}
              {Math.abs(signal.fundingRate ?? 0) > 0.0001 ? <span><small>{copy.radarFunding}</small><b>{pct(signal.fundingRate, 3)}</b></span> : null}
              {Number(signal.shortLiquidationUsd ?? 0) > 0 ? <span><small>{copy.radarShortLiq}</small><b>{money(signal.shortLiquidationUsd)}</b></span> : null}
              {signal.dexTurnover24h != null && signal.dexTurnover24h > 0 ? <span><small>{copy.radarDexTurnover}</small><b>{(signal.dexTurnover24h * 100).toFixed(1)}%</b></span> : null}
              {Number(signal.dexVolume24h ?? 0) > 0 ? <span><small>{copy.radarDexVolume ?? "DEX volume (24h)"}</small><b>{money(signal.dexVolume24h)}</b></span> : null}
              {Math.abs(signal.dexBuySellImbalance ?? 0) > 0.1 ? <span><small>{copy.radarDexBuyPressure ?? "DEX buy pressure"}</small><b>{pct(signal.dexBuySellImbalance)}</b></span> : null}
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
