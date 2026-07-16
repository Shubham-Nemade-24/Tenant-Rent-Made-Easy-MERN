require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

const authMiddleware = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const monthsRoutes = require("./routes/months");
const roomsRoutes = require("./routes/rooms");

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ───────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

// Serve the React build in production
app.use(express.static(path.join(__dirname, "public")));

/* ── Routes ──────────────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);                     // public
app.use("/api/months", authMiddleware, monthsRoutes);  // protected
app.use("/api/rooms", authMiddleware, roomsRoutes);    // protected

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// SPA fallback — serve index.html for any non-API route
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ── Start ───────────────────────────────────────────────────────────── */
async function start() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI environment variable is not set.");
    process.exit(1);
  }

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    const dbName = process.env.MONGO_DB || "rental_rooms";
    app.locals.db = client.db(dbName);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
