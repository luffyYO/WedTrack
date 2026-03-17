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

// Validate required environment variables
const requiredEnvVars = ['FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these in your .env file before starting the server');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://wedtrackss.in"
    ],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://wedtrackss.in",
    "https://www.wedtrackss.in"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Parse incoming JSON requests
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
