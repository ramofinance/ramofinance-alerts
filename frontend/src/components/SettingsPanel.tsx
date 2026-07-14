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
  return (
    <details className="debug-box">
      <summary>{copy.debug}</summary>

      <p>
        {copy.apiUrl}: {apiUrl}
      </p>

      <p>
        {copy.websocketUrl}: {websocketUrl}
      </p>

      <pre>
        {lastMessage ? JSON.stringify(lastMessage, null, 2) : copy.noMessage}
      </pre>
    </details>
  );
}
