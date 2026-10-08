import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/portfolio.css";
import {
  CHAINS,
  CHAIN_BY_ID,
  isSampleMode,
  MAX_WALLETS,
  assetColor,
  detectFamily,
  fetchPortfolio,
  normalizeAddress,
  summarize,
  walletTotal
} from "../portfolio/portfolio-data";
import type { PortfolioSnapshot, StoredWallet } from "../portfolio/portfolio-data";
import { loadSnapshot, loadWallets, saveSnapshot, saveWallets } from "../portfolio/portfolio-storage";
import type { PortfolioCopy } from "../portfolio/portfolio-copy";

type Props = {
  copy: any;
  pf: PortfolioCopy;
  onBack: () => void;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const shortAddress = (a: string) => (a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
const amountText = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : n < 1000 ? 4 : 2 });
const percent = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`;
const newId = () => `w${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;

export function PortfolioPanel({ copy, pf, onBack }: Props) {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const snapshotRef = useRef<PortfolioSnapshot | null>(null);
  const commit = useCallback((next: PortfolioSnapshot | null) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"wallet" | "network">("wallet");
  const [openId, setOpenId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(async (list: StoredWallet[]) => {
    if (!list.length) {
      commit(null);
      return;
    }
    setLoading(true);
    try {
      const fetched = await fetchPortfolio(list);
      // A failed lookup must not wipe balances we already have: keep the last good copy of that wallet.
      const previous = snapshotRef.current;
      const next: PortfolioSnapshot = {
        // If the whole request failed, do not pretend the saved data is fresh.
        updatedAt: fetched.error && previous ? previous.updatedAt : fetched.updatedAt,
        wallets: fetched.wallets.map((w) =>
          w.status === "error" ? previous?.wallets.find((p) => p.id === w.id && p.status === "ok") ?? w : w
        )
      };
      setRefreshError(fetched.error ?? (fetched.wallets.some((w) => w.status === "error") ? "wallet" : null));
      commit(next);
      void saveSnapshot(next);
    } catch {
      // keep showing the last snapshot
    } finally {
      setLoading(false);
    }
  }, [commit]);

  // Data is requested only when the user enters the service.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadWallets();
      if (cancelled) return;
      setWallets(list);
      setReady(true);
      const cached = await loadSnapshot();
      if (!cancelled && cached) commit(cached);
      if (!cancelled) await refresh(list);
    })();
    return () => { cancelled = true; };
  }, [refresh, commit]);

  const live = useMemo(
    () => (snapshot?.wallets ?? []).filter((s) => wallets.some((w) => w.id === s.id)),
    [snapshot, wallets]
  );
  const sum = useMemo(() => summarize(live), [live]);

  const allocation = useMemo(() => {
    const top = sum.byAsset.slice(0, 4).map(([symbol, value]) => ({ key: symbol, label: symbol, value, color: assetColor(symbol) }));
    const rest = sum.byAsset.slice(4).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push({ key: "other", label: pf.other, value: rest, color: "#64748b" });
    return top;
  }, [sum, pf.other]);

  const handleAdd = () => {
    const value = address.trim();
    if (!detectFamily(value)) return setFormError(pf.invalid);
    if (wallets.length >= MAX_WALLETS) return setFormError(pf.limit);
    if (wallets.some((w) => normalizeAddress(w.address) === normalizeAddress(value))) return setFormError(pf.duplicate);
    const next = [...wallets, { id: newId(), address: value, label: label.trim().slice(0, 24) }];
    setWallets(next);
    setAddress("");
    setLabel("");
    setFormError(null);
    void saveWallets(next);
    void refresh(next);
  };

  const handleRemove = (id: string) => {
    const next = wallets.filter((w) => w.id !== id);
    setWallets(next);
    setOpenId(null);
    void saveWallets(next);
    void refresh(next);
  };

  const updatedText = snapshot
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <section className="cryptoflow-frame-screen">
      <header className="cryptoflow-frame-header" dir="ltr">
        <button type="button" onClick={onBack} aria-label={copy.backToServices}>
          <span aria-hidden="true">←</span>
          <span>{copy.backToServices}</span>
        </button>
        <strong>{pf.title}</strong>
      </header>

      <div className="pf-scroll">
        {wallets.length > 0 ? (
          <div className="pf-hero">
            <p className="pf-hero__label">{pf.total}</p>
            <div className="pf-hero__value pf-num">{usd.format(sum.total)}</div>
            {sum.pct !== null ? (
              <div className={`pf-change pf-num ${sum.change >= 0 ? "up" : "down"}`}>
                <span>{percent(sum.pct)}</span>
                <span>{usd.format(Math.abs(sum.change))}</span>
                <small>{pf.h24}</small>
              </div>
            ) : null}
            {sum.total > 0 ? (
              <>
                <div className="pf-alloc" aria-hidden="true">
                  {allocation.map((a) => (
                    <i key={a.key} style={{ flexGrow: a.value, background: a.color }} />
                  ))}
                </div>
                <div className="pf-legend">
                  {allocation.map((a) => (
                    <span key={a.key}>
                      <b className="pf-dot" style={{ background: a.color }} />
                      {a.label} <span className="pf-num">{((a.value / sum.total) * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {ready && wallets.length === 0 ? (
          <div className="pf-empty">
            <h2 className="pf-h">{pf.emptyTitle}</h2>
            <p className="pf-note">{pf.emptyText}</p>
            <p className="pf-note">{pf.supported}</p>
            <div className="pf-chips">
              {CHAINS.map((c) => (
                <span key={c.id}><b className="pf-dot" style={{ background: c.color }} />{c.name}</span>
              ))}
            </div>
          </div>
        ) : null}

        {refreshError ? (
          <p className="pf-error" role="status">
            {refreshError === "401" ? pf.sessionExpired : pf.refreshFailed}
            {refreshError !== "401" && refreshError !== "wallet" ? ` (${refreshError})` : ""}
          </p>
        ) : null}

        {isSampleMode() && wallets.length > 0 ? <p className="pf-note pf-note--sample">{pf.sample}</p> : null}

        {wallets.length > 0 ? (
          <div className="pf-section">
            <div className="pf-seg" role="group">
              <button type="button" aria-pressed={view === "wallet"} onClick={() => setView("wallet")}>{pf.byWallet}</button>
              <button type="button" aria-pressed={view === "network"} onClick={() => setView("network")}>{pf.byNetwork}</button>
            </div>

            <div className="pf-bar">
              <span>{snapshot ? `${pf.updated} ${updatedText}` : ""}</span>
              <button type="button" className="pf-link" disabled={loading} onClick={() => void refresh(wallets)}>
                {loading ? pf.refreshing : pf.refresh}
              </button>
            </div>

            {view === "wallet" ? (
              <div className="pf-list">
                {wallets.map((w) => {
                  const snap = live.find((s) => s.id === w.id);
                  const total = snap ? walletTotal(snap) : null;
                  const chainIds = snap ? [...new Set(snap.holdings.map((h) => h.chain))] : [];
                  const isOpen = openId === w.id;
                  return (
                    <div className="pf-row" key={w.id}>
                      <button
                        type="button"
                        className="pf-row__main"
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : w.id)}
                      >
                        <span className="pf-row__body">
                          <span className="pf-row__title">{w.label || shortAddress(w.address)}</span>
                          <span className="pf-row__sub">
                            {chainIds.map((id) => (
                              <b key={id} className="pf-dot" style={{ background: CHAIN_BY_ID[id].color }} />
                            ))}
                            <span className="pf-num">{shortAddress(w.address)}</span>
                          </span>
                        </span>
                        <span className="pf-row__val">
                          {!snap ? "…" : snap.status === "ok" ? (
                            <>
                              <span className="pf-num">{usd.format(total ?? 0)}</span>
                              {sum.total > 0 ? <small className="pf-num">{(((total ?? 0) / sum.total) * 100).toFixed(1)}%</small> : null}
                            </>
                          ) : (
                            <small className="pf-soon">{snap.status === "soon" ? pf.soon : pf.unavailable}</small>
                          )}
                        </span>
                      </button>

                      {isOpen && snap ? (
                        <div className="pf-detail">
                          {chainIds.map((id) => (
                            <div className="pf-chain" key={id}>
                              <h4><b className="pf-dot" style={{ background: CHAIN_BY_ID[id].color }} />{CHAIN_BY_ID[id].name}</h4>
                              {snap.holdings
                                .filter((h) => h.chain === id)
                                .sort((a, b) => b.usd - a.usd)
                                .map((h) => (
                                  <div className="pf-hold" key={`${id}-${h.symbol}`}>
                                    <span className="pf-num">{amountText(h.amount)} {h.symbol}</span>
                                    <span className="pf-num">{usd.format(h.usd)}</span>
                                  </div>
                                ))}
                            </div>
                          ))}
                          <button type="button" className="pf-remove" onClick={() => handleRemove(w.id)}>{pf.remove}</button>
                        </div>
                      ) : null}
                      {isOpen && !snap ? (
                        <div className="pf-detail">
                          <button type="button" className="pf-remove" onClick={() => handleRemove(w.id)}>{pf.remove}</button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pf-list">
                {sum.byChain.map(([id, value]) => {
                  const share = sum.total > 0 ? (value / sum.total) * 100 : 0;
                  return (
                    <div className="pf-net" key={id}>
                      <b className="pf-dot" style={{ background: CHAIN_BY_ID[id].color }} />
                      <span className="pf-net__main">
                        <span className="pf-row__title">{CHAIN_BY_ID[id].name}</span>
                        <span className="pf-meter"><i style={{ width: `${share}%`, background: CHAIN_BY_ID[id].color }} /></span>
                      </span>
                      <span className="pf-row__val pf-num">
                        {usd.format(value)}
                        <small>{share.toFixed(1)}%</small>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="pf-add">
          <h3 className="pf-h">{pf.addTitle}</h3>
          <input
            className="pf-input pf-input--address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setFormError(null); }}
            placeholder={pf.addressPlaceholder}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={pf.addressPlaceholder}
          />
          <div className="pf-add__row">
            <input
              className="pf-input"
              value={label}
              maxLength={24}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={pf.labelPlaceholder}
              aria-label={pf.labelPlaceholder}
            />
            <button type="button" className="pf-btn" disabled={!address.trim()} onClick={handleAdd}>{pf.add}</button>
          </div>
          {formError ? <p className="pf-error" role="alert">{formError}</p> : null}
        </div>

        <p className="pf-note">{pf.privacy} {pf.seedWarning}</p>
      </div>
    </section>
  );
}
