import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const connectedUsers = new Set();

let drawingHistory = [];
let currentPath = {
  points: [],
};

app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Drawing Server</h1>");
});

io.on("connection", (socket) => {
  connectedUsers.add(socket.id);

  if (drawingHistory.length > 0) {
    setTimeout(() => socket.emit("drawing-history", drawingHistory), 500);
  }

  socket.on("draw", (drawData) => {
    console.log('cur: ', currentPath, drawData)
    socket.broadcast.emit("draw", { ...drawData, userId: socket.id });
    if (drawData.isLastPoint) {
      drawingHistory.push(currentPath);
      currentPath = {
        points: [],
      };
    } else {
      currentPath = {
        points: [...currentPath?.points, { x: drawData.x, y: drawData.y }],
        ...drawData,
      };
    }
  });

  socket.on("clear-canvas", () => {
    drawingHistory = [];
    socket.broadcast.emit("clear-canvas");
  });

  socket.on("mouse-move", (mouseData) => {
    socket.broadcast.emit("mouse-move", mouseData);
  });

  socket.on("mouse-leave", (mouseData) => {
    socket.broadcast.emit("mouse-leave", mouseData);
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
