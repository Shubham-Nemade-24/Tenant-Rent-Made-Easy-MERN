const { Router } = require("express");
const {
  ROOMS, money, blankRoom, roomTotals, rebuildBills, shiftMonth,
} = require("../utils");

const router = Router();

/* ── helpers ─────────────────────────────────────────────────────────── */

async function initialise(db) {
  const roomsCol = db.collection("rooms");
  const monthsCol = db.collection("months");

  for (const roomNo of ROOMS) {
    await roomsCol.updateOne(
      { room_no: roomNo },
      { $setOnInsert: blankRoom(roomNo) },
      { upsert: true },
    );
  }
  await roomsCol.createIndex({ room_no: 1 }, { unique: true });
  await monthsCol.createIndex({ month: 1 }, { unique: true });
}

async function getMonth(db, key) {
  const monthsCol = db.collection("months");
  const roomsCol = db.collection("rooms");

  let existing = await monthsCol.findOne({ month: key }, { projection: { _id: 0 } });
  if (existing) return existing;

  // Build a new month from previous month + master rooms
  const previousDoc = await monthsCol.findOne(
    { month: shiftMonth(key, -1) },
    { projection: { _id: 0 } },
  );
  const masterList = await roomsCol.find({}, { projection: { _id: 0 } }).toArray();
  const masters = {};
  for (const m of masterList) masters[m.room_no] = m;

  const newRooms = [];
  for (const roomNo of ROOMS) {
    const master = masters[roomNo] || blankRoom(roomNo);
    const source = previousDoc
      ? previousDoc.rooms.find((r) => r.room_no === roomNo) || null
      : null;

    const copied = {};
    for (const f of ["room_no", "tenant_name", "phone", "monthly_rent", "deposit", "notes"]) {
      copied[f] = master[f] !== undefined ? master[f] : "";
    }
    copied.monthly_rent = money(copied.monthly_rent);
    copied.deposit = money(copied.deposit);
    copied.previous_balance = source ? roomTotals(source).balance : money(master.opening_balance);
    copied.previous_reading = source ? (source.current_reading ?? null) : null;
    copied.current_reading = null;
    copied.units = 0.0;
    copied.light_bill = 0.0;
    copied.payments = [];
    newRooms.push(copied);
  }

  const document = { month: key, rooms: newRooms, created_at: new Date() };
  await monthsCol.insertOne(document);
  delete document._id;
  return document;
}

async function saveMonth(db, document) {
  const rebuilt = rebuildBills(document);
  await db.collection("months").replaceOne(
    { month: rebuilt.month },
    rebuilt,
    { upsert: true },
  );
}

async function syncExistingFutureMonths(db, fromMonth) {
  const monthsCol = db.collection("months");
  const futureDocs = await monthsCol
    .find({ month: { $gt: fromMonth } }, { projection: { _id: 0 } })
    .sort({ month: 1 })
    .toArray();

  let prior = await monthsCol.findOne({ month: fromMonth }, { projection: { _id: 0 } });
  if (!prior) return;
  let priorKey = fromMonth;

  for (const document of futureDocs) {
    if (document.month !== shiftMonth(priorKey, 1)) {
      prior = document;
      priorKey = document.month;
      continue;
    }
    const priorRooms = {};
    for (const r of prior.rooms) priorRooms[r.room_no] = r;

    for (const room of document.rooms) {
      const old = priorRooms[room.room_no];
      room.previous_balance = roomTotals(old).balance;
      room.previous_reading = old.current_reading ?? null;
    }
    await saveMonth(db, document);
    prior = document;
    priorKey = document.month;
  }
}

/* ── routes ──────────────────────────────────────────────────────────── */

/**
 * GET /api/months/:key
 * Returns the month document (auto-creates if it doesn't exist).
 * Also runs initialise + rebuild + sync so the response is always fresh.
 */
router.get("/:key", async (req, res) => {
  try {
    const db = req.app.locals.db;
    await initialise(db);

    const key = req.params.key;
    let document = await getMonth(db, key);
    document = rebuildBills(document);
    await saveMonth(db, document);
    await syncExistingFutureMonths(db, key);

    // Re-read to get the synced version
    document = await db.collection("months").findOne(
      { month: key },
      { projection: { _id: 0 } },
    );

    // Compute totals for each room
    const rooms = document.rooms.map((room) => {
      const totals = roomTotals(room);
      return { ...room, ...totals };
    });

    const expected = rooms.reduce((s, r) => s + r.total, 0);
    const collected = rooms.reduce((s, r) => s + r.paid, 0);
    const outstanding = rooms.reduce((s, r) => s + r.balance, 0);

    res.json({
      month: document.month,
      rooms,
      summary: {
        expected: money(expected),
        collected: money(collected),
        outstanding: money(outstanding),
      },
    });
  } catch (err) {
    console.error("GET /api/months/:key", err);
    res.status(500).json({ error: "Failed to load month data." });
  }
});

/**
 * POST /api/months/:key/payment
 * Body: { room_no, amount, date, note }
 */
router.post("/:key/payment", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const key = req.params.key;
    const { room_no, amount, date, note } = req.body;

    if (!room_no || !amount || money(amount) <= 0) {
      return res.status(400).json({ error: "Room and a positive amount are required." });
    }

    const document = await getMonth(db, key);
    const room = document.rooms.find((r) => r.room_no === room_no);
    if (!room) return res.status(404).json({ error: "Room not found." });

    room.payments.push({
      amount: money(amount),
      date: date || new Date().toISOString().slice(0, 10),
      note: (note || "").trim(),
    });

    await saveMonth(db, document);
    await syncExistingFutureMonths(db, key);

    res.json({ success: true, message: `Saved ₹${money(amount).toFixed(2)} for room ${room_no}.` });
  } catch (err) {
    console.error("POST /api/months/:key/payment", err);
    res.status(500).json({ error: "Failed to save payment." });
  }
});

/**
 * DELETE /api/months/:key/payment
 * Body: { room_no, paymentIndex }
 * Removes a specific payment by index from a room's payments array.
 */
router.delete("/:key/payment", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const key = req.params.key;
    const { room_no, paymentIndex } = req.body;

    if (!room_no || paymentIndex == null) {
      return res.status(400).json({ error: "Room and payment index are required." });
    }

    const document = await getMonth(db, key);
    const room = document.rooms.find((r) => r.room_no === room_no);
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (paymentIndex < 0 || paymentIndex >= room.payments.length) {
      return res.status(400).json({ error: "Invalid payment index." });
    }

    room.payments.splice(paymentIndex, 1);
    await saveMonth(db, document);
    await syncExistingFutureMonths(db, key);

    res.json({ success: true, message: "Payment deleted." });
  } catch (err) {
    console.error("DELETE /api/months/:key/payment", err);
    res.status(500).json({ error: "Failed to delete payment." });
  }
});

/**
 * POST /api/months/:key/electricity
 * Body: { readings: [{ room_no, current_reading }, ...] }
 */
router.post("/:key/electricity", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const key = req.params.key;
    const { readings } = req.body;

    if (!Array.isArray(readings)) {
      return res.status(400).json({ error: "readings array is required." });
    }

    const document = await getMonth(db, key);
    for (const { room_no, current_reading } of readings) {
      const room = document.rooms.find((r) => r.room_no === room_no);
      if (room) {
        room.current_reading = current_reading == null || current_reading === ""
          ? null
          : money(current_reading);
      }
    }

    await saveMonth(db, document);
    await syncExistingFutureMonths(db, key);

    res.json({ success: true, message: "Electricity readings saved." });
  } catch (err) {
    console.error("POST /api/months/:key/electricity", err);
    res.status(500).json({ error: "Failed to save electricity readings." });
  }
});

module.exports = router;
