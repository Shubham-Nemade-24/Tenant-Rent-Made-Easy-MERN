export default function BottomNav({ active, onChange }) {
  const tabs = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "payment",   icon: "💰", label: "Payment" },
    { key: "electric",  icon: "⚡", label: "Electric" },
    { key: "tenant",    icon: "👤", label: "Tenant" },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`nav-item ${active === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
