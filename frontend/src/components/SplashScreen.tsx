import splashLogo from "../assets/ramofinance-splash.png";

type Props = {
  visible: boolean;
};

export function SplashScreen({ visible }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <section className="splash-screen" aria-hidden="true">
      <img
        className="splash-screen__logo"
        src={splashLogo}
        alt=""
      />

      <p className="splash-screen__tagline">
        Your Edge Starts Here.
      </p>
    </section>
  );
}
