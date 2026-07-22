import type {
  AlertNotificationSettings,
  MiniAppStats,
  PreferredLanguage
} from "../types/api";

type Props = {
  copy: any;
  lastMessage: unknown;
  appLanguage: PreferredLanguage;
  languageSaving: boolean;
  languageError: string | null;
  onLanguageChange: (language: PreferredLanguage) => void;
  notificationRepeatCount: number;
  notificationIntervalSeconds: number;
  notificationSettingsSaving: boolean;
  notificationSettingsError: string | null;
  notificationSettingsEnabled: boolean;
  onNotificationSettingsChange: (
    settings: AlertNotificationSettings
  ) => void;
  isAdmin: boolean;
  adminStats: MiniAppStats | null;
  adminStatsLoading: boolean;
  adminStatsError: string | null;
};

export function SettingsPanel({
  copy,
  lastMessage,
  appLanguage,
  languageSaving,
  languageError,
  onLanguageChange,
  notificationRepeatCount,
  notificationIntervalSeconds,
  notificationSettingsSaving,
  notificationSettingsError,
  notificationSettingsEnabled,
  onNotificationSettingsChange,
  isAdmin,
  adminStats,
  adminStatsLoading,
  adminStatsError
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

      <section className="card settings-notification-card">
        <div className="settings-language-copy">
          <span className="settings-language-icon" aria-hidden="true">
            🔔
          </span>

          <span>
            <strong>{copy.notificationSettings}</strong>
            <small>{copy.notificationSettingsHint}</small>
          </span>
        </div>

        <div className="settings-notification-controls">
          <label>
            <span>{copy.notificationRepeatCount}</span>
            <select
              value={notificationRepeatCount}
              disabled={
                !notificationSettingsEnabled ||
                notificationSettingsSaving
              }
              onChange={(event) =>
                onNotificationSettingsChange({
                  repeatCount: Number(event.target.value),
                  intervalSeconds:
                    notificationIntervalSeconds as
                      | 30
                      | 60
                      | 120
                      | 300
                      | 600
                })
              }
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option value={count} key={count}>
                  {copy.notificationCountOptions[count]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{copy.notificationInterval}</span>
            <select
              value={notificationIntervalSeconds}
              disabled={
                !notificationSettingsEnabled ||
                notificationSettingsSaving ||
                notificationRepeatCount === 1
              }
              onChange={(event) =>
                onNotificationSettingsChange({
                  repeatCount: notificationRepeatCount,
                  intervalSeconds: Number(
                    event.target.value
                  ) as 30 | 60 | 120 | 300 | 600
                })
              }
            >
              {[30, 60, 120, 300, 600].map((seconds) => (
                <option value={seconds} key={seconds}>
                  {copy.notificationIntervalOptions[seconds]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {notificationSettingsError ? (
          <p className="settings-language-error">
            {notificationSettingsError}
          </p>
        ) : null}

        {!notificationSettingsEnabled ? (
          <p className="settings-language-error">
            {copy.notificationSettingsNotConnected}
          </p>
        ) : null}
      </section>

      {isAdmin ? (
        <section className="card settings-language-card">
          <div className="settings-language-copy">
            <span className="settings-language-icon" aria-hidden="true">
              ◉
            </span>

            <span>
              <strong>{copy.adminStats}</strong>
              <small>
                {adminStatsLoading
                  ? copy.statsLoading
                  : adminStatsError ?? ""}
              </small>
            </span>
          </div>

          {adminStats ? (
            <div className="settings-grid">
              <article className="card settings-endpoint-card">
                <div className="settings-endpoint-content">
                  <span>{copy.totalUsers}</span>
                  <strong>{adminStats.totalUsers}</strong>
                </div>
              </article>

              <article className="card settings-endpoint-card">
                <div className="settings-endpoint-content">
                  <span>{copy.totalOpens}</span>
                  <strong>{adminStats.totalOpens}</strong>
                </div>
              </article>

              <article className="card settings-endpoint-card">
                <div className="settings-endpoint-content">
                  <span>{copy.activeNow}</span>
                  <strong>{adminStats.activeNow}</strong>
                </div>
              </article>
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
