type TabKey = "SERVICES" | "HOME" | "CHART" | "ALERTS" | "SETTINGS" | "CRYPTOFLOW";

type Props = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  mode: "hub" | "alerts";
  copy: {
    tabs: {
      services: string;
      home: string;
      chart: string;
      alerts: string;
      settings: string;
    };
  };
};

export function BottomTabs({ activeTab, setActiveTab, mode, copy }: Props) {
  const tabs: [TabKey, string, string][] = mode === "hub"
    ? [
        ["SERVICES", "▦", copy.tabs.services],
        ["SETTINGS", "⚙️", copy.tabs.settings]
      ]
    : [
        ["SERVICES", "↩", copy.tabs.services],
        ["HOME", "🏠", copy.tabs.home],
        ["CHART", "📈", copy.tabs.chart],
        ["ALERTS", "🔔", copy.tabs.alerts],
        ["SETTINGS", "⚙️", copy.tabs.settings]
      ];

  return (
    <nav className={`tab-bar tab-bar--${mode}`}>
      {tabs.map(([key, icon, label]) => (
        <button
          key={key}
          type="button"
          className={activeTab === key ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab(key)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
