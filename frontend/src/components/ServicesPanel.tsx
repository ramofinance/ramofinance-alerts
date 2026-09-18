type Props = {
  copy: any;
  openCryptoFlow: () => void;
  openAlerts: () => void;
  openRadar: () => void;
  radarEnabled: boolean;
};

export function ServicesPanel({ copy, openCryptoFlow, openAlerts, openRadar, radarEnabled }: Props) {
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
          <span className="service-card__icon" aria-hidden="true">📊</span>
          <div>
            <strong>CryptoFlow</strong>
            <p>{copy.cryptoFlowDescription}</p>
          </div>
          <span className="service-card__action">{copy.openService}</span>
        </button>

        {radarEnabled ? <button className="service-card service-card--radar" type="button" onClick={openRadar}>
          <span className="service-card__icon" aria-hidden="true">🔎</span>
          <div><strong>{copy.radarTitle}</strong><p>{copy.radarServiceDescription}</p></div>
          <span className="service-card__action">{copy.openService}</span>
        </button> : null}

        <button
          className="service-card service-card--alerts"
          type="button"
          onClick={openAlerts}
        >
          <span className="service-card__icon" aria-hidden="true">🔔</span>
          <div>
            <strong>{copy.priceAlertsTitle}</strong>
            <p>{copy.priceAlertsDescription}</p>
          </div>
          <span className="service-card__action">{copy.openService}</span>
        </button>
      </div>

      <p className="services-note">{copy.servicesFreeNote}</p>
    </section>
  );
}
