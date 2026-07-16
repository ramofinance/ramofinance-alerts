type Props = {
  copy: any;
  apiUrl: string;
  websocketUrl: string;
  lastMessage: unknown;
};

export function SettingsPanel({
  copy,
  apiUrl,
  websocketUrl,
  lastMessage
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
            <p className="card-label">{copy.tabs.settings}</p>
            <h2>{copy.debug}</h2>
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
          {hasRealtimeMessage ? "Realtime active" : "Waiting"}
        </span>
      </section>

      <section className="settings-grid">
        <article className="card settings-endpoint-card">
          <div className="settings-endpoint-icon" aria-hidden="true">
            API
          </div>

          <div className="settings-endpoint-content">
            <span>{copy.apiUrl}</span>
            <code>{apiUrl}</code>
          </div>

          <span className="settings-check" aria-hidden="true">
            ✓
          </span>
        </article>

        <article className="card settings-endpoint-card">
          <div className="settings-endpoint-icon" aria-hidden="true">
            WS
          </div>

          <div className="settings-endpoint-content">
            <span>{copy.websocketUrl}</span>
            <code>{websocketUrl}</code>
          </div>

          <span
            className={
              hasRealtimeMessage
                ? "settings-check settings-check--active"
                : "settings-check"
            }
            aria-hidden="true"
          >
            {hasRealtimeMessage ? "✓" : "…"}
          </span>
        </article>
      </section>

      <details className="debug-box settings-debug-box">
        <summary>
          <span className="settings-debug-summary">
            <span className="settings-debug-icon" aria-hidden="true">
              {"{ }"}
            </span>

            <span>
              <strong>{copy.debug}</strong>
              <small>{hasRealtimeMessage ? "Latest WebSocket event" : copy.noMessage}</small>
            </span>
          </span>

          <span className="settings-chevron" aria-hidden="true">
            ⌄
          </span>
        </summary>

        <div className="settings-debug-content">
          <pre>
            {lastMessage
              ? JSON.stringify(lastMessage, null, 2)
              : copy.noMessage}
          </pre>
        </div>
      </details>
    </section>
  );
}
