import { useState } from "react";
import { recordPayment } from "../api";
import MonthNav from "../components/MonthNav";
import Toast from "../components/Toast";
import { monthLabel, fmt } from "../helpers";

const ROOMS = ["11", "12", "13", "14", "15", "21", "22", "23", "24", "25"];

export default function RecordPayment({ monthKey, data, onPrev, onNext, onRefresh }) {
  const [roomNo, setRoomNo] = useState(ROOMS[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const rooms = data?.rooms || [];
  const roomLabels = {};
  for (const r of rooms) {
    roomLabels[r.room_no] = `Room ${r.room_no} — ${r.tenant_name || "No tenant"}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setToast({ message: "Enter an amount greater than zero.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await recordPayment(monthKey, {
        room_no: roomNo,
        amount: amt,
        date,
        note: note.trim(),
      });
      setToast({ message: res.message, type: "success" });
      setAmount("");
      setNote("");
      onRefresh();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <h1 className="page-title">💰 Record Payment</h1>
      <p className="page-subtitle">
        Record every payment separately. The app adds them together for the selected month.
      </p>

      <MonthNav
        label={monthLabel(monthKey)}
        onPrev={onPrev}
        onNext={onNext}
      />

      <form onSubmit={handleSubmit} style={{ marginTop: "var(--space-lg)" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="pay-room">Room</label>
          <select
            id="pay-room"
            className="form-select"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
          >
            {ROOMS.map((r) => (
              <option key={r} value={r}>{roomLabels[r] || `Room ${r}`}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pay-amount">Amount received (₹)</label>
          <input
            id="pay-amount"
            className="form-input"
            type="number"
            min="0"
            step="100"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pay-date">Payment date</label>
          <input
            id="pay-date"
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pay-note">Note (optional)</label>
          <input
            id="pay-note"
            className="form-input"
            type="text"
            placeholder="e.g. UPI, cash…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button className="btn btn-success" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save payment"}
        </button>
      </form>
    </div>
  );
}
