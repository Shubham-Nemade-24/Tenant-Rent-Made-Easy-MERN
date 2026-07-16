import { useState, useEffect } from "react";
import { saveElectricity } from "../api";
import MonthNav from "../components/MonthNav";
import Toast from "../components/Toast";
import { monthLabel, fmt } from "../helpers";

const UNIT_RATE = 15;

export default function Electricity({ monthKey, data, onPrev, onNext, onRefresh }) {
  const [readings, setReadings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const rooms = data?.rooms || [];

  // Sync local state when data changes
  useEffect(() => {
    setReadings(
      rooms.map((r) => ({
        room_no: r.room_no,
        tenant_name: r.tenant_name,
        previous_reading: r.previous_reading,
        current_reading: r.current_reading ?? "",
      }))
    );
  }, [data]);

  function updateReading(roomNo, value) {
    setReadings((prev) =>
      prev.map((r) =>
        r.room_no === roomNo ? { ...r, current_reading: value } : r
      )
    );
  }

  function computeUnits(prev, curr) {
    const p = parseFloat(prev) || 0;
    const c = parseFloat(curr) || 0;
    if (!curr && curr !== 0) return { units: 0, bill: 0 };
    const units = Math.max(c - p, 0);
    return { units, bill: Math.round(units * UNIT_RATE * 100) / 100 };
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = readings.map((r) => ({
        room_no: r.room_no,
        current_reading: r.current_reading === "" ? null : parseFloat(r.current_reading),
      }));
      const res = await saveElectricity(monthKey, payload);
      setToast({ message: res.message, type: "success" });
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

      <h1 className="page-title">⚡ Electricity</h1>
      <p className="page-subtitle">
        Enter current meter readings. Bills are calculated automatically.
      </p>

      <MonthNav
        label={monthLabel(monthKey)}
        onPrev={onPrev}
        onNext={onNext}
      />

      <div className="info-banner" style={{ marginTop: "var(--space-lg)" }}>
        ⚡ Rate: ₹{UNIT_RATE} per unit
      </div>

      {readings.map((r) => {
        const { units, bill } = computeUnits(r.previous_reading, r.current_reading);
        return (
          <div className="elec-card" key={r.room_no}>
            <div className="elec-card-header">
              <strong>Room {r.room_no}</strong>
              <span>{r.tenant_name || "No tenant"}</span>
            </div>
            <div className="elec-grid">
              <div className="elec-field">
                <label>Previous</label>
                <div className="elec-readonly">
                  {r.previous_reading != null ? Number(r.previous_reading).toFixed(2) : "—"}
                </div>
              </div>
              <div className="elec-field">
                <label>Current</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="—"
                  value={r.current_reading}
                  onChange={(e) => updateReading(r.room_no, e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="elec-summary">
              <span>Units: <strong>{units.toFixed(2)}</strong></span>
              <span>Bill: <strong>{fmt(bill)}</strong></span>
            </div>
          </div>
        );
      })}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: "var(--space-lg)" }}
      >
        {saving ? "Saving…" : "Save electricity readings"}
      </button>
    </div>
  );
}
