require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectToDatabase = require("./config/db.js");
const userRouter = require("./routes/userRoute.js");

connectToDatabase();
const app = express();
const server = http.createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: frontendUrl }));
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send({ message: "Hello, World!" });
});

const canvasRouter = require("./routes/canvasRoute.js");


io.on("connection", (socket) => {
  
  socket.on("join-canvas", (canvasId) => {
    socket.join(canvasId);
  });

  
  socket.on("canvas-update", ({ canvasId, elements, bgStyle }) => {
    socket.to(canvasId).emit("canvas-updated", { elements, bgStyle });
  });

  socket.on("disconnect", () => {
    
  });
});

app.use("/user", userRouter);
app.use("/canvas", canvasRouter);

server.listen(port, () => {
  console.log(`Server started on port ${port} with WebSockets`);
});
