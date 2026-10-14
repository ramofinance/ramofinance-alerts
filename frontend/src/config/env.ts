const getBackendPublicBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  if (hostname.includes("-5173.app.github.dev")) {
    return `${protocol}//${hostname.replace("-5173.app.github.dev", "-3000.app.github.dev")}`;
  }

  return `${protocol}//${hostname}:3000`;
};

const getDefaultWebSocketUrl = () => {
  const backendBaseUrl = getBackendPublicBaseUrl();
  const wsBaseUrl = backendBaseUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

  return `${wsBaseUrl}/ws`;
};

// The gift card site is embedded in an iframe. It must be https and must NOT be served from this app's own origin,
// otherwise whatever it saves in the browser (the gift wallet words while a payment is in progress) could be read by this app.
// Empty or invalid = the Gift Cards service stays hidden.
const parseGiftCardUrl = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "";
    if (url.origin === window.location.origin) return "";
    return url.toString();
  } catch {
    return "";
  }
};

export const frontendEnv = {
  apiUrl: import.meta.env.VITE_API_URL || getBackendPublicBaseUrl(),
  websocketUrl: import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl(),
  cryptoFlowUrl:
    import.meta.env.VITE_CRYPTOFLOW_URL ||
    "https://cryptoflow.ramo-fin-group.workers.dev/",
  // Cloudflare Worker that serves live portfolio balances. Empty = sample data preview.
  portfolioApiUrl: (import.meta.env.VITE_PORTFOLIO_API_URL as string | undefined) || "",
  giftCardUrl: parseGiftCardUrl(import.meta.env.VITE_GIFTCARD_URL),
  upcomingServicesEnabled:
    import.meta.env.VITE_UPCOMING_SERVICES_ENABLED === "true"
};
