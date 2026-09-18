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
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
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

export const useTelegramBackButton = (
  visible: boolean,
  onBack: () => void
) => {
  const backButton = window.Telegram?.WebApp?.BackButton;

  if (!backButton) {
    return () => undefined;
  }

  if (visible) {
    backButton.onClick(onBack);
    backButton.show();
  } else {
    backButton.hide();
  }

  return () => {
    backButton.offClick(onBack);
    backButton.hide();
  };
};
