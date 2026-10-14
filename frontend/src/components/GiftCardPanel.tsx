import { useEffect, useRef } from "react";

type Props = {
  copy: any;
  title: string;
  src: string;
  initData?: string;
  language: string;
  onBack: () => void;
};

// The gift card site lives on its own origin (like CryptoFlow), so its saved data can never be read by this app.
// It cannot see our Telegram session, so once it says it is ready we hand it the login data, to that exact origin only.
export function GiftCardPanel({ copy, title, src, initData, language, onBack }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let frameOrigin = "";
    try {
      frameOrigin = new URL(src).origin;
    } catch {
      return undefined;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== frameOrigin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== "ramo-gift:ready") return;
      frameRef.current?.contentWindow?.postMessage(
        { type: "ramo-gift:init", initData: initData ?? "", language },
        frameOrigin
      );
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [src, initData, language]);

  return (
    <section className="cryptoflow-frame-screen" dir="ltr">
      <header className="cryptoflow-frame-header">
        <button type="button" onClick={onBack} aria-label={copy.backToServices}>
          <span aria-hidden="true">←</span>
          <span>{copy.backToServices}</span>
        </button>
        <strong>{title}</strong>
      </header>

      <iframe
        ref={frameRef}
        className="cryptoflow-frame"
        src={src}
        title={title}
        allow="clipboard-write"
      />
    </section>
  );
}
