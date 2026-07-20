import type { PreferredLanguage } from "../types/api";

type Props = {
  copy: any;
  lastMessage: unknown;
  appLanguage: PreferredLanguage;
  languageSaving: boolean;
  languageError: string | null;
  onLanguageChange: (language: PreferredLanguage) => void;
};

export function SettingsPanel({
  copy,
  lastMessage,
  appLanguage,
  languageSaving,
  languageError,
  onLanguageChange
}: Props) {
  const hasRealtimeMessage = Boolean(lastMessage);

  return (
    <section className="settings-panel">
      <section className="card settings-header-card">
        <div className="section-title-group">
          <span className="section-icon" aria-hidden="true">
            ⚙
          </span>

          <div>
            <h2>{copy.tabs.settings}</h2>
          </div>
        </div>

        <span
          className={
            hasRealtimeMessage
              ? "settings-status settings-status--active"
              : "settings-status"
          }
        >
          <i />
          {hasRealtimeMessage ? copy.realtimeActive : copy.waiting}
        </span>
      </section>

      <section className="card settings-language-card">
        <div className="settings-language-copy">
          <span className="settings-language-icon" aria-hidden="true">
            Aa
          </span>

          <span>
            <strong>{copy.appLanguage}</strong>
            <small>{copy.languageHint}</small>
          </span>
        </div>

        <div
          className="settings-language-toggle"
          role="group"
          aria-label={copy.appLanguage}
        >
          <button
            type="button"
            className={appLanguage === "FA" ? "is-active" : ""}
            aria-pressed={appLanguage === "FA"}
            disabled={languageSaving}
            onClick={() => onLanguageChange("FA")}
          >
            {copy.persianLanguage}
          </button>

          <button
            type="button"
            className={appLanguage === "EN" ? "is-active" : ""}
            aria-pressed={appLanguage === "EN"}
            disabled={languageSaving}
            onClick={() => onLanguageChange("EN")}
          >
            {copy.englishLanguage}
          </button>
        </div>

        {languageError ? (
          <p className="settings-language-error">{languageError}</p>
        ) : null}
      </section>
    </section>
  );
}
