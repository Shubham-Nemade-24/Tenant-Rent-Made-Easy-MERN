export default function MetricCard({ label, value, variant }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${variant || ""}`}>{value}</div>
    </div>
  );
}
