require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const aiRoutes = require("./routes/ai");
const taskRoutes = require("./routes/tasks");

const app = express();
const port = process.env.PORT || 5004;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Practical 13: AI API Integration API is running",
    endpoints: {
      aiDescription: "POST /api/ai/generate-description",
      tasks: "ALL /api/tasks"
    }
  });
});

app.use("/api/ai", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/tasks", taskRoutes);

// Centralized error handler
app.use((error, _req, res, _next) => {
  console.error("API error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/practical13_aidb";
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB for Practical 13:", MONGO_URI);
    app.listen(port, () => {
      console.log(`Practical 13 AI Integration Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
