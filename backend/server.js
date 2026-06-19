require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// ────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/causalfunnel";
const PORT = parseInt(process.env.PORT || "3001", 10);

// ────────────────────────────────────────────────────────────
// Mongoose Schema
// ────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    type: { type: String, enum: ["page_view", "click"], required: true },
    pageUrl: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    x: { type: Number }, // click only
    y: { type: Number }, // click only
  },
  { collection: "events" }
);

const Event = mongoose.model("Event", eventSchema);

// ────────────────────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: "*", // Allow all origins so the demo page and dev dashboard work
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(express.json());

// Serve static files (tracker.js, demo index.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ────────────────────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────────────────────

/**
 * POST /api/events
 * Accept and store a single event from the tracking script.
 * Body: { session_id, type, pageUrl, timestamp, x?, y? }
 */
app.post("/api/events", async (req, res) => {
  try {
    const { session_id, type, pageUrl, timestamp, x, y } = req.body;

    if (!session_id || !type || !pageUrl || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["page_view", "click"].includes(type)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    const event = new Event({
      session_id,
      type,
      pageUrl,
      timestamp: new Date(timestamp),
      ...(type === "click" && x !== undefined && y !== undefined
        ? { x: Number(x), y: Number(y) }
        : {}),
    });

    await event.save();
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sessions
 * Return a list of all sessions with total event count,
 * latest timestamp, and latest page URL.
 */
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$session_id",
          eventCount: { $sum: 1 },
          latestTimestamp: { $max: "$timestamp" },
          pageUrl: { $last: "$pageUrl" },
        },
      },
      { $sort: { latestTimestamp: -1 } },
      {
        $project: {
          _id: 0,
          id: "$_id",
          eventCount: 1,
          latestTimestamp: 1,
          pageUrl: 1,
        },
      },
    ]);

    return res.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sessions/:id
 * Return all events for a given session ordered by timestamp ascending.
 */
app.get("/api/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const events = await Event.find({ session_id: id })
      .sort({ timestamp: 1 })
      .lean();

    const formatted = events.map((e) => ({
      id: e._id.toString(),
      type: e.type,
      timestamp: e.timestamp.toISOString(),
      pageUrl: e.pageUrl,
      ...(e.type === "click" && e.x !== undefined ? { x: e.x, y: e.y } : {}),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("[GET /api/sessions/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/pages
 * Return a distinct list of all tracked page URLs.
 */
app.get("/api/pages", async (req, res) => {
  try {
    const pages = await Event.distinct("pageUrl");
    return res.json(pages.sort());
  } catch (err) {
    console.error("[GET /api/pages]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/heatmap?page=<url>
 * Return all click events (x, y, timestamp) for a given page URL.
 */
app.get("/api/heatmap", async (req, res) => {
  try {
    const { page } = req.query;
    if (!page) {
      return res.status(400).json({ error: "Missing ?page= query parameter" });
    }

    const clicks = await Event.find({ type: "click", pageUrl: page })
      .select("x y timestamp -_id")
      .lean();

    const formatted = clicks.map((c) => ({
      x: c.x,
      y: c.y,
      timestamp: c.timestamp.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("[GET /api/heatmap]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ────────────────────────────────────────────────────────────
// Connect to MongoDB then start server
// ────────────────────────────────────────────────────────────
async function start() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI} …`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅  MongoDB connected");

    app.listen(PORT, () => {
      console.log(`✅  Backend listening at http://localhost:${PORT}`);
      console.log(`    Demo page  → http://localhost:${PORT}/`);
      console.log(`    Sessions   → http://localhost:${PORT}/api/sessions`);
      console.log(`    Heatmap    → http://localhost:${PORT}/api/heatmap?page=/`);
    });
  } catch (err) {
    console.error("❌  Failed to start:", err.message);
    process.exit(1);
  }
}

start();
