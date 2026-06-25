// Минимальная типизация Telegram WebApp + удобные хелперы.
// Полная дока: https://core.telegram.org/bots/webapps

export interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (t: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (p: Record<string, unknown>) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TgWebApp };
  }
}

export function getTg(): TgWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

// Вызвать один раз при старте приложения.
export function initTelegram(): TgWebApp | null {
  const tg = getTg();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  return tg;
}

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  getTg()?.HapticFeedback.impactOccurred(type);
}

export function getInitData(): string {
  return getTg()?.initData ?? "";
}
