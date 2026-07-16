import { useState } from "react";
import { fmt } from "../helpers";

export default function RoomCard({ room }) {
  const [expanded, setExpanded] = useState(false);

  const statusClass = {
    "Paid": "paid",
    "Part paid": "part-paid",
    "Not paid": "not-paid",
    "No tenant": "no-tenant",
  }[room.status] || "no-tenant";

  return (
    <div
      className={`room-card ${statusClass}`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="room-card-header">
        <div className="room-number">
          Room {room.room_no}
          <span className="room-tenant">{room.tenant_name || "—"}</span>
        </div>
        <span className={`room-status-badge ${statusClass}`}>
          {room.status}
        </span>
      </div>

      <div className="room-card-grid">
        <div className="room-detail">
          <span className="room-detail-label">Rent</span>
          <span className="room-detail-value">{fmt(room.rent)}</span>
        </div>
        <div className="room-detail">
          <span className="room-detail-label">Light</span>
          <span className="room-detail-value">{fmt(room.light)}</span>
        </div>
        <div className="room-detail">
          <span className="room-detail-label">Previous</span>
          <span className="room-detail-value">{fmt(room.previous)}</span>
        </div>
        <div className="room-detail">
          <span className="room-detail-label">Total</span>
          <span className="room-detail-value">{fmt(room.total)}</span>
        </div>
        <div className="room-detail">
          <span className="room-detail-label">Paid</span>
          <span className="room-detail-value" style={{ color: "var(--status-paid)" }}>
            {fmt(room.paid)}
          </span>
        </div>
        <div className="room-detail">
          <span className="room-detail-label">Balance</span>
          <span
            className="room-detail-value"
            style={{ color: room.balance > 0 ? "var(--status-unpaid)" : "var(--status-paid)" }}
          >
            {fmt(room.balance)}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="room-expanded">
          <span className="room-detail-label" style={{ marginBottom: 4 }}>
            Payments this month
          </span>
          {room.payments && room.payments.length > 0 ? (
            <div className="room-payments-list">
              {room.payments.map((p, i) => (
                <div className="payment-item" key={i}>
                  <div className="payment-item-info">
                    <span className="payment-item-amount">{fmt(p.amount)}</span>
                    <span className="payment-item-meta">
                      {p.date}{p.note ? ` · ${p.note}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-payments">No payments recorded</div>
          )}
        </div>
      )}
    </div>
  );
}
