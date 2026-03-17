import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./config/db.js";
import weddingRoutes from "./routes/weddings.js";
import guestRoutes from "./routes/guests.js";
import authRoutes from "./routes/auth.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
}); 

// ─── Allowed origins ─────────────────────────────────────────────────────────
const CORS_ALLOWED_REGEX = [
  // Any localhost port (local dev)
  /^http:\/\/localhost:\d+$/,
  // Local network IPs on the same WiFi — 192.168.x.x, 172.x.x.x, 10.x.x.x
  /^http:\/\/(192\.168|172\.\d{1,3}|10)\.\d{1,3}\.\d{1,3}:\d+$/,
  // Production custom domain (with and without www)
  /^https:\/\/(www\.)?wedtrackss\.in$/,
  // Any Vercel preview deployments for this project
  /^https:\/\/wedtrack.*\.vercel\.app$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      CORS_ALLOWED_REGEX.some((pattern) => pattern.test(origin)) ||
      // Also allow whatever FRONTEND_URL is set to in the env (string comparison)
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.options("*", cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/weddings", weddingRoutes);
app.use("/api/guests", guestRoutes);
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "Healthy",
    message: "WedTrack Backend is running",
    time: new Date().toISOString(),
  });
});


const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

