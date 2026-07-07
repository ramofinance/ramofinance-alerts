export type TelegramMiniAppUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramMiniAppUser;
  };
  ready?: () => void;
  expand?: () => void;
  colorScheme?: "light" | "dark";
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const initializeTelegramMiniApp = () => {
  const webApp = window.Telegram?.WebApp;

  webApp?.ready?.();
  webApp?.expand?.();

  return {
    isTelegramMiniApp: Boolean(webApp),
    initData: webApp?.initData ?? "",
    user: webApp?.initDataUnsafe?.user,
    colorScheme: webApp?.colorScheme ?? "light"
  };
};
