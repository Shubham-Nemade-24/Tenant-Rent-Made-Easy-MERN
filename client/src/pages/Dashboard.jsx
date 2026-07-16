import MonthNav from "../components/MonthNav";
import MetricCard from "../components/MetricCard";
import RoomCard from "../components/RoomCard";
import { fmt, monthLabel } from "../helpers";

export default function Dashboard({ monthKey, data, onPrev, onNext, loading }) {
  if (loading || !data) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="loading-text">Loading month data…</span>
      </div>
    );
  }

  const { rooms, summary } = data;

  return (
    <>
      <div className="top-header">
        <h1>🏠 Rental Rooms</h1>
        <p>Rent, electricity, payments & balances</p>
      </div>

      <MonthNav
        label={monthLabel(monthKey)}
        onPrev={onPrev}
        onNext={onNext}
      />

      <div className="metrics-row">
        <MetricCard label="Expected" value={fmt(summary.expected)} variant="expected" />
        <MetricCard label="Collected" value={fmt(summary.collected)} variant="collected" />
        <MetricCard label="Outstanding" value={fmt(summary.outstanding)} variant="outstanding" />
      </div>

      <div className="rooms-section">
        <div className="rooms-section-header">
          <h2>Monthly Dashboard</h2>
          <div className="rooms-legend">
            <span><span className="legend-dot" style={{ background: "var(--status-paid)" }} /> Paid</span>
            <span><span className="legend-dot" style={{ background: "var(--status-part)" }} /> Part</span>
            <span><span className="legend-dot" style={{ background: "var(--status-unpaid)" }} /> Due</span>
          </div>
        </div>
        <div className="rooms-list">
          {rooms.map((room) => (
            <RoomCard key={room.room_no} room={room} />
          ))}
        </div>
      </div>
    </>
  );
}
