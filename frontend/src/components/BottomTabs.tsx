type TabKey = "HOME" | "CHART" | "ALERTS" | "SETTINGS";

type Props = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  copy: {
    tabs: {
      home: string;
      chart: string;
      alerts: string;
      settings: string;
    };
  };
};

export function BottomTabs({ activeTab, setActiveTab, copy }: Props) {
  const tabs: [TabKey, string, string][] = [
    ["HOME", "🏠", copy.tabs.home],
    ["CHART", "📈", copy.tabs.chart],
    ["ALERTS", "🔔", copy.tabs.alerts],
    ["SETTINGS", "⚙️", copy.tabs.settings]
  ];

  return (
    <nav className="tab-bar">
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
