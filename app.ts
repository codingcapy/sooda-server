
/*
Author: Paul, Jessie, Beanie
Date: February 14, 2024
Version: 0.0.1
Description: App for Sooda server
 */

import express from "express";
import cors from "cors"
import { Server as SocketServer } from "socket.io"
import http from "http"
import users from "./routes/users";

const app = express();
const port = 3333;

app.use(cors())
app.use(express.json())
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "https://localhost:5173",
  },
});
io.on("connection", (socket) => {
  socket.on("message", (body) => {
    socket.broadcast.emit("message", {
      body,
      from: socket.id.slice(6),
    });
  });
  socket.on("friend", (body) => {
    socket.broadcast.emit("friend", {
      body,
      from: socket.id.slice(6),
    });
  });
  socket.on("chat", (body) => {
    socket.broadcast.emit("chat", {
      body,
      from: socket.id.slice(6),
    });
  });
});

app.get("/", (req, res) => res.send("welcome"))
app.use("/api/v1/users", users);

server.listen(port, () => console.log(`Server listening on port: ${port}`))