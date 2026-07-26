import { useRef, useState } from "react";

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
  const overviewRef = useRef<HTMLDivElement>(null);
  const [activeOverviewCard, setActiveOverviewCard] = useState(0);

  const updateActiveOverviewCard = () => {
    const track = overviewRef.current;

    if (!track) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const slides = Array.from(
      track.querySelectorAll<HTMLElement>(".home-overview__slide")
    );

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(slideCenter - trackCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveOverviewCard(nearestIndex);
  };

  const scrollToOverviewCard = (index: number) => {
    const slide = overviewRef.current?.querySelectorAll<HTMLElement>(
      ".home-overview__slide"
    )[index];

    slide?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });

    setActiveOverviewCard(index);
  };

  return (
    <>
      <section className="home-overview">
        <div
          ref={overviewRef}
          className="home-overview__track"
          onScroll={updateActiveOverviewCard}
        >
          <article className="hero-card home-overview__slide">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="hero-text">{copy.subtitle}</p>
            </div>

            <div className="status-pill">
              <span className={`status-dot status-dot--${status}`} />
              {status}
            </div>
          </article>

          <article className="card home-overview__slide home-overview__user-card">
            <p className="card-label">{copy.telegramUser}</p>
            <h2>{telegramUserLabel}</h2>
            <p>
              {copy.mode}: {isTelegramMiniApp ? copy.telegram : copy.browser}
            </p>
            <p>
              {copy.language}: {telegramLanguageCode ?? copy.notAvailable}
            </p>
          </article>

          <article className="card home-overview__slide home-overview__user-card">
            <p className="card-label">{copy.backendUser}</p>
            <h2>{backendUserLabel}</h2>
            <p>
              {copy.appLanguage}: {appLanguage ?? copy.notConnected}
            </p>
            <p>
              {copy.alerts}: {alertsCount}
            </p>
          </article>
        </div>

        <div className="home-overview__dots" aria-label="Overview navigation">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={
                activeOverviewCard === index
                  ? "home-overview__dot is-active"
                  : "home-overview__dot"
              }
              aria-label={`Show overview card ${index + 1}`}
              aria-current={activeOverviewCard === index ? "true" : undefined}
              onClick={() => scrollToOverviewCard(index)}
            />
          ))}
        </div>
      </section>

      {error ? <div className="alert-box alert-box--error">{error}</div> : null}

      <section className="investment-card signal-card">
        <div className="investment-card__content">
          <span className="investment-card__badge signal-card__badge">
            {copy.signalsBadge}
          </span>
          <h2>{copy.signalsTitle}</h2>
          <p>{copy.signalsDescription}</p>
          <small>{copy.signalsDisclaimer}</small>
        </div>

        <a
          className="investment-card__button signal-card__button"
          href="https://t.me/ramofinance_signals"
          target="_blank"
          rel="noreferrer"
        >
          {copy.signalsButton}
        </a>
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
