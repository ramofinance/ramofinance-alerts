type Props = {
  copy: any;
  src: string;
  onBack: () => void;
};

export function CryptoFlowPanel({ copy, src, onBack }: Props) {
  return (
    <section className="cryptoflow-frame-screen" dir="ltr">
      <header className="cryptoflow-frame-header">
        <button type="button" onClick={onBack} aria-label={copy.backToServices}>
          <span aria-hidden="true">←</span>
          <span>{copy.backToServices}</span>
        </button>
        <strong>CryptoFlow</strong>
      </header>

      <iframe
        className="cryptoflow-frame"
        src={src}
        title="CryptoFlow"
        allow="clipboard-read; clipboard-write"
      />
    </section>
  );
}
