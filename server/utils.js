/**
 * Business logic helpers — direct port of the Python functions in app.py.
 * Uses identical formulas and data shapes so the existing MongoDB documents
 * continue to work without any migration.
 */

const ROOMS = ["11", "12", "13", "14", "15", "21", "22", "23", "24", "25"];
const UNIT_RATE = 15.0;

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2025-07" */
function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Shift a "YYYY-MM" key by +/- months */
function shiftMonth(key, amount) {
  const [year, month] = key.split("-").map(Number);
  const idx = year * 12 + (month - 1) + amount;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
}

/** "July 2025" */
function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month]} ${year}`;
}

function money(value) {
  return Math.round((parseFloat(value) || 0) * 100) / 100;
}

function blankRoom(roomNo) {
  return {
    room_no: roomNo,
    tenant_name: "",
    phone: "",
    monthly_rent: 0.0,
    deposit: 0.0,
    opening_balance: 0.0,
    notes: "",
  };
}

/** Compute derived totals for a single room doc (within a month) */
function roomTotals(room) {
  const rent = money(room.monthly_rent);
  const light = money(room.light_bill);
  const previous = money(room.previous_balance);
  const payments = room.payments || [];
  const paid = Math.round(payments.reduce((s, p) => s + money(p.amount), 0) * 100) / 100;
  const total = Math.round((rent + light + previous) * 100) / 100;
  const balance = Math.round(Math.max(total - paid, 0) * 100) / 100;

  let status;
  if (!room.tenant_name) status = "No tenant";
  else if (paid === 0) status = "Not paid";
  else if (balance === 0) status = "Paid";
  else status = "Part paid";

  return { rent, light, previous, paid, total, balance, status };
}

/** Recalculate electricity bills from readings */
function rebuildBills(document) {
  for (const room of document.rooms) {
    const prev = room.previous_reading;
    const curr = room.current_reading;
    if (prev != null && curr != null) {
      const units = Math.max(money(curr) - money(prev), 0);
      room.units = units;
      room.light_bill = Math.round(units * UNIT_RATE * 100) / 100;
    } else {
      room.units = 0.0;
      room.light_bill = 0.0;
    }
  }
  return document;
}

module.exports = {
  ROOMS,
  UNIT_RATE,
  monthKey,
  shiftMonth,
  monthLabel,
  money,
  blankRoom,
  roomTotals,
  rebuildBills,
};
