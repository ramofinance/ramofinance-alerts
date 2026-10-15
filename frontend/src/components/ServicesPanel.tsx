import { useEffect, useState } from "react";
import { getRadarSignals } from "../api/radar";
import cryptoFlowLogo from "../assets/cryptoflow-logo.png";
import "../styles/giftcard.css";
import "../styles/radar-lock.css";

type Props = {
  copy: any;
  openCryptoFlow: () => void;
  openAlerts: () => void;
  openRadar: () => void;
  openPortfolio: () => void;
  portfolioCopy: { cardTitle: string; cardDescription: string };
  openGiftCard: () => void;
  giftCardCopy: { cardTitle: string; cardDescription: string };
  giftCardEnabled: boolean;
  radarEnabled: boolean;
  radarAccessKnown: boolean;
  openRadarUnlock: () => void;
  radarUnlockHint: string;
  initData?: string;
};

const cleanSymbol = (symbol: string) => symbol.endsWith("USDT") ? symbol.replace(/USDT$/, "") : symbol;

// Price Alerts is switched off on the server (PRICE_POLLING_ENABLED=false), so alerts created
// here would never fire. Flip this to true to show the card again once polling is back on.
const SHOW_PRICE_ALERTS = false;

export function ServicesPanel({ copy, openCryptoFlow, openAlerts, openRadar, openPortfolio, portfolioCopy, openGiftCard, giftCardCopy, giftCardEnabled, radarEnabled, radarAccessKnown, openRadarUnlock, radarUnlockHint, initData }: Props) {
  const [radarPreview, setRadarPreview] = useState<string[]>([]);

  useEffect(() => {
    if (!radarEnabled) { setRadarPreview([]); return; }
    let cancelled = false;
    getRadarSignals(initData)
      .then((signals) => {
        if (cancelled) return;
        const uniqueSymbols: string[] = [];
        for (const signal of signals) {
          const symbol = cleanSymbol(signal.symbol);
          if (!uniqueSymbols.includes(symbol)) uniqueSymbols.push(symbol);
          if (uniqueSymbols.length === 5) break;
        }
        setRadarPreview(uniqueSymbols);
      })
      .catch(() => { if (!cancelled) setRadarPreview([]); });
    return () => { cancelled = true; };
  }, [radarEnabled, initData]);

  return (
    <section className="services-screen">
      <header className="services-hero">
        <span className="services-eyebrow">RAMO FINANCE</span>
        <h1>{copy.servicesTitle}</h1>
        <p>{copy.servicesSubtitle}</p>
      </header>

      <div className="services-grid">
        <button
          className="service-card service-card--flow"
          type="button"
          onClick={openCryptoFlow}
        >
          <div className="service-card__header">
            <span className="service-card__icon-sm service-card__icon-sm--logo" aria-hidden="true"><img src={cryptoFlowLogo} alt="" /></span>
            <strong>CryptoFlow</strong>
            <span className="service-card__action">{copy.openService}</span>
          </div>
          <div className="service-card__preview service-card__preview--muted">
            <span>{copy.cryptoFlowDescription}</span>
          </div>
        </button>

        {radarEnabled ? (
          <button className="service-card service-card--radar" type="button" onClick={openRadar}>
            <div className="service-card__header">
              <span className="service-card__icon-sm" aria-hidden="true">🔎</span>
              <strong>{copy.radarTitle}</strong>
              <span className="service-card__lock" aria-hidden="true">🔓</span>
              <span className="service-card__action">{copy.openService}</span>
            </div>
            <div className="service-card__preview">
              {radarPreview.length ? (
                radarPreview.map((symbol) => <span key={symbol} className="service-card__chip">{symbol}</span>)
              ) : (
                <span className="service-card__preview-empty">{copy.radarNoSignals ?? copy.radarServiceDescription}</span>
              )}
            </div>
          </button>
        ) : (
          <button
            className="service-card service-card--radar service-card--locked"
            type="button"
            onClick={() => { if (radarAccessKnown) openRadarUnlock(); }}
          >
            <div className="service-card__header">
              <span className="service-card__icon-sm" aria-hidden="true">🔎</span>
              <strong>{copy.radarTitle}</strong>
              {radarAccessKnown ? <span className="service-card__lock" aria-hidden="true">🔒</span> : null}
            </div>
            <div className="service-card__preview service-card__preview--muted">
              <span>{radarAccessKnown ? radarUnlockHint : copy.radarServiceDescription}</span>
            </div>
          </button>
        )}

        <button className="service-card service-card--portfolio" type="button" onClick={openPortfolio}>
          <div className="service-card__header">
            <span className="service-card__icon-sm" aria-hidden="true">💼</span>
            <strong>{portfolioCopy.cardTitle}</strong>
            <span className="service-card__action">{copy.openService}</span>
          </div>
          <div className="service-card__preview service-card__preview--muted">
            <span>{portfolioCopy.cardDescription}</span>
          </div>
        </button>

        {giftCardEnabled ? (
          <button className="service-card service-card--giftcard" type="button" onClick={openGiftCard}>
            <div className="service-card__header">
              <span className="service-card__icon-sm" aria-hidden="true">🎁</span>
              <strong>{giftCardCopy.cardTitle}</strong>
              <span className="service-card__action">{copy.openService}</span>
            </div>
            <div className="service-card__preview service-card__preview--muted">
              <span>{giftCardCopy.cardDescription}</span>
            </div>
          </button>
        ) : null}

        {SHOW_PRICE_ALERTS ? (
          <button
            className="service-card service-card--alerts"
            type="button"
            onClick={openAlerts}
          >
            <div className="service-card__header">
              <span className="service-card__icon-sm" aria-hidden="true">🔔</span>
              <strong>{copy.priceAlertsTitle}</strong>
              <span className="service-card__action">{copy.openService}</span>
            </div>
            <div className="service-card__preview service-card__preview--muted">
              <span>{copy.priceAlertsDescription}</span>
            </div>
          </button>
        ) : null}
      </div>

      <p className="services-note">{copy.servicesFreeNote}</p>
    </section>
  );
}
