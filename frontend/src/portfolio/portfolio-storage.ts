import type { PortfolioSnapshot, StoredWallet } from "./portfolio-data";

// Wallet list -> Telegram CloudStorage (synced across the user's devices).
// Last result  -> Telegram DeviceStorage (this device only).
// Both fall back to localStorage when the Telegram client is too old or storage fails.
// Nothing here is ever sent to our servers.

type Area = {
  getItem: (key: string, cb: (error: unknown, value?: string | null) => void) => void;
  setItem: (key: string, value: string, cb?: (error: unknown, stored?: boolean) => void) => void;
};
type Host = { CloudStorage?: Area; DeviceStorage?: Area; isVersionAtLeast?: (version: string) => boolean };

const WALLETS_KEY = "pf_wallets_v1";
const SNAPSHOT_KEY = "pf_snapshot_v1";

const area = (kind: "cloud" | "device"): Area | undefined => {
  const host = window.Telegram?.WebApp as unknown as Host | undefined;
  if (!host) return undefined;
  const minimum = kind === "cloud" ? "6.9" : "9.0";
  if (host.isVersionAtLeast && !host.isVersionAtLeast(minimum)) return undefined;
  return kind === "cloud" ? host.CloudStorage : host.DeviceStorage;
};

const withTimeout = <T>(promise: Promise<T>, fallback: T, ms = 2500) =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

const readArea = (target: Area | undefined, key: string) =>
  withTimeout(
    new Promise<string | null>((resolve) => {
      if (!target) return resolve(null);
      try {
        target.getItem(key, (error, value) => resolve(error ? null : value || null));
      } catch {
        resolve(null);
      }
    }),
    null
  );

const writeArea = (target: Area | undefined, key: string, value: string) =>
  withTimeout(
    new Promise<void>((resolve) => {
      if (!target) return resolve();
      try {
        target.setItem(key, value, () => resolve());
      } catch {
        resolve();
      }
    }),
    undefined
  );

const localGet = (key: string) => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};
const localSet = (key: string, value: string) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

const parseWallets = (raw: string | null): StoredWallet[] => {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((w) => w && typeof w.id === "string" && typeof w.address === "string")
      .map((w) => ({ id: w.id, address: w.address, label: typeof w.label === "string" ? w.label : "" }));
  } catch {
    return [];
  }
};

const parseSnapshot = (raw: string | null): PortfolioSnapshot | null => {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data.updatedAt === "number" && Array.isArray(data.wallets) ? data : null;
  } catch {
    return null;
  }
};

export const loadWallets = async () =>
  parseWallets((await readArea(area("cloud"), WALLETS_KEY)) || localGet(WALLETS_KEY));

export const saveWallets = async (list: StoredWallet[]) => {
  const raw = JSON.stringify(list);
  localSet(WALLETS_KEY, raw);
  await writeArea(area("cloud"), WALLETS_KEY, raw);
};

export const loadSnapshot = async () =>
  parseSnapshot((await readArea(area("device"), SNAPSHOT_KEY)) || localGet(SNAPSHOT_KEY));

export const saveSnapshot = async (snapshot: PortfolioSnapshot) => {
  const raw = JSON.stringify(snapshot);
  const device = area("device");
  if (device) await writeArea(device, SNAPSHOT_KEY, raw);
  else localSet(SNAPSHOT_KEY, raw);
};
