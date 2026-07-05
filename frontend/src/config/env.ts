const getDefaultWebSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  return `${protocol}//${hostname}:3000/ws`;
};

export const frontendEnv = {
  websocketUrl: import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl()
};
