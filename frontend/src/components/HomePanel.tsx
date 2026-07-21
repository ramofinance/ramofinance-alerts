type Props = {
  copy: any;
  status: string;
  error: string | null;
  telegramUserLabel: string;
  backendUserLabel: string;
  isTelegramMiniApp: boolean;
  telegramLanguageCode?: string;
  appLanguage: string | null;
  alertsCount: number;
};

export function HomePanel({
  copy,
  status,
  error,
  telegramUserLabel,
  backendUserLabel,
  isTelegramMiniApp,
  telegramLanguageCode,
  appLanguage,
  alertsCount
}: Props) {
  return (
    <>
      <section className="hero-card">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="hero-text">{copy.subtitle}</p>
        </div>

        <div className="status-pill">
          <span className={`status-dot status-dot--${status}`} />
          {status}
        </div>
      </section>

      {error ? <div className="alert-box alert-box--error">{error}</div> : null}

      <section className="grid">
        <article className="card">
          <p className="card-label">{copy.telegramUser}</p>
          <h2>{telegramUserLabel}</h2>
          <p>
            {copy.mode}: {isTelegramMiniApp ? copy.telegram : copy.browser}
          </p>
          <p>
            {copy.language}: {telegramLanguageCode ?? copy.notAvailable}
          </p>
        </article>

        <article className="card">
          <p className="card-label">{copy.backendUser}</p>
          <h2>{backendUserLabel}</h2>
          <p>
            {copy.appLanguage}: {appLanguage ?? copy.notConnected}
          </p>
          <p>
            {copy.alerts}: {alertsCount}
          </p>
        </article>
      </section>

      <section className="investment-card">
        <div className="investment-card__content">
          <span className="investment-card__badge">{copy.investmentBadge}</span>
          <h2>{copy.investmentTitle}</h2>
          <p>{copy.investmentDescription}</p>
          <small>{copy.investmentDisclaimer}</small>
        </div>

        <a
          className="investment-card__button"
          href="https://t.me/ramofinancebot"
          target="_blank"
          rel="noreferrer"
        >
          {copy.investmentButton}
        </a>
      </section>
    </>
  );
}
