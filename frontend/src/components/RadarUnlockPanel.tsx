import { useCallback, useEffect, useRef, useState } from "react";
import { createRadarReferralLink, getRadarReferral, type RadarReferral } from "../api/radar";
import type { RadarReferralCopy } from "../radar/referral-copy";
import "../styles/radar-unlock.css";

type Props = {
  copy: any;
  referralCopy: RadarReferralCopy;
  initData?: string;
  dir: "rtl" | "ltr";
  onBack: () => void;
  onOpenRadar: () => void;
  onUnlocked: () => void;
};

const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((out, [key, value]) => out.split(`{${key}}`).join(String(value)), text);

export function RadarUnlockPanel({ copy, referralCopy, initData, dir, onBack, onOpenRadar, onUnlocked }: Props) {
  const [data, setData] = useState<RadarReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState<"" | "copied" | "failed">("");
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      let next = await getRadarReferral(initData);
      // The personal link is created only once the person actually opens this screen.
      if (!next.unlocked && !next.link) next = await createRadarReferralLink(initData);
      setData(next);
      if (next.unlocked) onUnlockedRef.current();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setNote("copied");
    } catch {
      setNote("failed");
    }
    window.setTimeout(() => setNote(""), 4000);
  };

  const shareLink = () => {
    if (!data?.link) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(data.link)}&text=${encodeURIComponent(referralCopy.shareText)}`;
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.openTelegramLink) webApp.openTelegramLink(url);
    else window.open(url, "_blank", "noopener");
  };

  const percent = data ? Math.min(100, Math.round((data.joined / Math.max(1, data.required)) * 100)) : 0;

  return (
    <section className="cryptoflow-frame-screen" dir={dir}>
      <header className="cryptoflow-frame-header" dir="ltr">
        <button type="button" onClick={onBack} aria-label={copy.backToServices}>
          <span aria-hidden="true">←</span>
          <span>{copy.backToServices}</span>
        </button>
        <strong>{referralCopy.title}</strong>
      </header>

      <div className="radar-unlock">
        {loading && !data ? <p>{referralCopy.loading}</p> : null}

        {failed && !data ? (
          <>
            <p className="radar-unlock__error" role="alert">{referralCopy.error}</p>
            <div className="radar-unlock__row">
              <button type="button" className="radar-unlock__btn" onClick={() => void load()}>{referralCopy.retry}</button>
            </div>
          </>
        ) : null}

        {data?.unlocked ? (
          <>
            <h2>{referralCopy.unlockedTitle}</h2>
            <p>{referralCopy.unlockedText}</p>
            <div className="radar-unlock__row">
              <button type="button" className="radar-unlock__btn radar-unlock__btn--primary" onClick={onOpenRadar}>
                {referralCopy.openRadar}
              </button>
            </div>
          </>
        ) : null}

        {data && !data.unlocked ? (
          <>
            <h2>{referralCopy.title}</h2>
            <p>{fill(referralCopy.intro, { required: data.required })}</p>

            <div>
              <div className="radar-unlock__count">
                {fill(referralCopy.progress, { joined: data.joined, required: data.required })}
              </div>
              <div className="radar-unlock__bar" role="progressbar" aria-valuemin={0} aria-valuemax={data.required} aria-valuenow={data.joined}>
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>

            {data.link ? (
              <>
                <div>
                  <div className="radar-unlock__label">{referralCopy.linkLabel}</div>
                  <input
                    className="radar-unlock__link"
                    readOnly
                    value={data.link}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
                <div className="radar-unlock__row">
                  <button type="button" className="radar-unlock__btn radar-unlock__btn--primary" onClick={shareLink}>
                    {referralCopy.share}
                  </button>
                  <button type="button" className="radar-unlock__btn" onClick={() => void copyLink()}>
                    {referralCopy.copyLink}
                  </button>
                </div>
                {note === "copied" ? <p className="radar-unlock__ok">{referralCopy.copied}</p> : null}
                {note === "failed" ? <p className="radar-unlock__error" role="alert">{referralCopy.copyFailed}</p> : null}
              </>
            ) : (
              <p className="radar-unlock__error" role="alert">{referralCopy.error}</p>
            )}

            <div className="radar-unlock__row">
              <button type="button" className="radar-unlock__btn" onClick={() => void load()} disabled={loading}>
                {referralCopy.refresh}
              </button>
            </div>
            <p className="radar-unlock__label">{fill(referralCopy.rules, { required: data.required })}</p>
          </>
        ) : null}
      </div>
    </section>
  );
}
