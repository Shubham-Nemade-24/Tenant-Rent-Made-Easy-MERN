import { useState, useEffect } from "react";
import { updateRoom } from "../api";
import MonthNav from "../components/MonthNav";
import Toast from "../components/Toast";
import { monthLabel } from "../helpers";

const ROOMS = ["11", "12", "13", "14", "15", "21", "22", "23", "24", "25"];

export default function TenantDetails({ monthKey, data, onPrev, onNext, onRefresh }) {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  const [form, setForm] = useState({
    tenant_name: "",
    phone: "",
    monthly_rent: 0,
    deposit: 0,
    opening_balance: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const rooms = data?.rooms || [];

  // Load form when room selection or data changes
  useEffect(() => {
    const room = rooms.find((r) => r.room_no === selectedRoom);
    if (room) {
      setForm({
        tenant_name: room.tenant_name || "",
        phone: room.phone || "",
        monthly_rent: room.monthly_rent || 0,
        deposit: room.deposit || 0,
        opening_balance: room.previous_balance || 0,
        notes: room.notes || "",
      });
    }
  }, [selectedRoom, data]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateRoom(selectedRoom, {
        ...form,
        monthly_rent: parseFloat(form.monthly_rent) || 0,
        deposit: parseFloat(form.deposit) || 0,
        opening_balance: parseFloat(form.opening_balance) || 0,
        current_month: monthKey,
      });
      setToast({ message: res.message, type: "success" });
      onRefresh();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const roomLabels = {};
  for (const r of rooms) {
    roomLabels[r.room_no] = `Room ${r.room_no} — ${r.tenant_name || "No tenant"}`;
  }

  return (
    <div className="page-content">
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <h1 className="page-title">👤 Tenant Details</h1>
      <p className="page-subtitle">
        These details apply from this month onward. The ten room numbers always remain available.
      </p>

      <MonthNav
        label={monthLabel(monthKey)}
        onPrev={onPrev}
        onNext={onNext}
      />

      <form onSubmit={handleSubmit} style={{ marginTop: "var(--space-lg)" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="tenant-room">Choose room</label>
          <select
            id="tenant-room"
            className="form-select"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {ROOMS.map((r) => (
              <option key={r} value={r}>{roomLabels[r] || `Room ${r}`}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-name">Tenant name</label>
          <input
            id="tenant-name"
            className="form-input"
            type="text"
            value={form.tenant_name}
            onChange={(e) => handleChange("tenant_name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-phone">Phone number</label>
          <input
            id="tenant-phone"
            className="form-input"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            inputMode="tel"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-rent">Monthly rent (₹)</label>
          <input
            id="tenant-rent"
            className="form-input"
            type="number"
            min="0"
            step="100"
            value={form.monthly_rent}
            onChange={(e) => handleChange("monthly_rent", e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-deposit">Deposit amount (₹)</label>
          <input
            id="tenant-deposit"
            className="form-input"
            type="number"
            min="0"
            step="100"
            value={form.deposit}
            onChange={(e) => handleChange("deposit", e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-opening">Opening / previous balance (₹)</label>
          <input
            id="tenant-opening"
            className="form-input"
            type="number"
            min="0"
            step="100"
            value={form.opening_balance}
            onChange={(e) => handleChange("opening_balance", e.target.value)}
            inputMode="decimal"
          />
          <div className="form-help">
            Use this only for an already-existing balance when you first set up the ledger.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tenant-notes">Notes</label>
          <textarea
            id="tenant-notes"
            className="form-textarea"
            placeholder="Any useful tenant or room note"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save tenant details"}
        </button>
      </form>
    </div>
  );
}
