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

app.use(cors());
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

app.get("/", async (req, res) => {
  try {
    // Ping Supabase over HTTPS to confirm connection
    const { error } = await supabase.from('weddings').select('id').limit(1);
    if (error) throw new Error(error.message);

    res.json({
      message: "Database connected successfully via Supabase REST API",
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed", details: error.message });
  }
});


const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

