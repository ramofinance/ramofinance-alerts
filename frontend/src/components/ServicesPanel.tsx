type Props = {
  copy: any;
  cryptoFlowUrl: string;
  openAlerts: () => void;
};

export function ServicesPanel({ copy, cryptoFlowUrl, openAlerts }: Props) {
  return (
    <section className="services-screen">
      <header className="services-hero">
        <span className="services-eyebrow">RAMO FINANCE</span>
        <h1>{copy.servicesTitle}</h1>
        <p>{copy.servicesSubtitle}</p>
      </header>

      <div className="services-grid">
        <a className="service-card service-card--flow" href={cryptoFlowUrl}>
          <span className="service-card__icon" aria-hidden="true">📊</span>
          <div>
            <strong>CryptoFlow</strong>
            <p>{copy.cryptoFlowDescription}</p>
          </div>
          <span className="service-card__action">{copy.openService}</span>
        </a>

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
