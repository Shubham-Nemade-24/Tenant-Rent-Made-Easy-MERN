const { Router } = require("express");
const {
  money, roomTotals, rebuildBills, shiftMonth,
} = require("../utils");

const router = Router();

/**
 * PUT /api/rooms/:roomNo
 * Body: { tenant_name, phone, monthly_rent, deposit, opening_balance, notes, current_month }
 *
 * Updates the master room document AND propagates changes to the current month
 * and all future months that already exist (same behaviour as the Streamlit app).
 */
router.put("/:roomNo", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const roomNo = req.params.roomNo;
    const {
      tenant_name = "",
      phone = "",
      monthly_rent = 0,
      deposit = 0,
      opening_balance = 0,
      notes = "",
      current_month,
    } = req.body;

    if (!current_month) {
      return res.status(400).json({ error: "current_month is required." });
    }

    const updates = {
      tenant_name: tenant_name.trim(),
      phone: phone.trim(),
      monthly_rent: money(monthly_rent),
      deposit: money(deposit),
      notes: notes.trim(),
    };

    // 1. Update master rooms collection
    await db.collection("rooms").updateOne(
      { room_no: roomNo },
      { $set: { ...updates, opening_balance: money(opening_balance) } },
    );

    // 2. Update the current month document
    const monthDoc = await db.collection("months").findOne(
      { month: current_month },
      { projection: { _id: 0 } },
    );

    if (monthDoc) {
      const room = monthDoc.rooms.find((r) => r.room_no === roomNo);
      if (room) {
        Object.assign(room, updates);
        room.previous_balance = money(opening_balance);
        rebuildBills(monthDoc);
        await db.collection("months").replaceOne(
          { month: current_month },
          monthDoc,
          { upsert: true },
        );
      }
    }

    // 3. Propagate to future months (same logic as Streamlit tab_rooms)
    const futureDocs = await db.collection("months")
      .find({ month: { $gt: current_month } }, { projection: { _id: 0 } })
      .sort({ month: 1 })
      .toArray();

    for (const future of futureDocs) {
      const target = future.rooms.find((r) => r.room_no === roomNo);
      if (target) {
        Object.assign(target, updates);
        rebuildBills(future);
        await db.collection("months").replaceOne(
          { month: future.month },
          future,
          { upsert: true },
        );
      }
    }

    // 4. Sync balances through the chain
    await syncFutureBalances(db, current_month);

    res.json({ success: true, message: `Room ${roomNo} details saved.` });
  } catch (err) {
    console.error("PUT /api/rooms/:roomNo", err);
    res.status(500).json({ error: "Failed to save room details." });
  }
});

/** Same sync logic used in months.js, duplicated here for independence */
async function syncFutureBalances(db, fromMonth) {
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
    rebuildBills(document);
    await monthsCol.replaceOne({ month: document.month }, document, { upsert: true });
    prior = document;
    priorKey = document.month;
  }
}

module.exports = router;
