/** Shared helpers */

/** Format a number as ₹1,234.00 */
export function fmt(value) {
  const n = parseFloat(value) || 0;
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Get current month key "YYYY-MM" */
export function currentMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Shift a "YYYY-MM" key by amount months */
export function shiftMonth(key, amount) {
  const [year, month] = key.split("-").map(Number);
  const idx = year * 12 + (month - 1) + amount;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "July 2025" */
export function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month]} ${year}`;
}
