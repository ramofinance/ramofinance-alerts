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

export const frontendEnv = {
  apiUrl: import.meta.env.VITE_API_URL || getBackendPublicBaseUrl(),
  websocketUrl: import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl()
};
