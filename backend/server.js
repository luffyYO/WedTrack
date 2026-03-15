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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // Local dev
      /^http:\/\/localhost:\d+$/,
      // Local network IPs (same WiFi) — covers 192.168.x.x, 172.x.x.x, 10.x.x.x
      /^http:\/\/(192\.168|172\.\d{1,3}|10)\.\d{1,3}\.\d{1,3}:\d+$/,
      // Vercel deployment
      /^https:\/\/wedtracks\.vercel\.app$/,
      /^https:\/\/wedtrack.*\.vercel\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some((pattern) => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy blocked: ${origin}`));
    }
  },
  credentials: true
}));
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

