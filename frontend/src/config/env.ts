const getDefaultBackendBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  return `${protocol}//${hostname}:3000`;
};

const getDefaultWebSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  return `${protocol}//${hostname}:3000/ws`;
};

export const frontendEnv = {
  apiUrl: import.meta.env.VITE_API_URL || getDefaultBackendBaseUrl(),
  websocketUrl: import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl()
};
