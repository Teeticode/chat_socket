const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const User = require("./models/User");

const appChat = express();
const server = http.createServer(appChat); // Create HTTP server

const wss = new WebSocket.Server({ server }); // Create WebSocket server

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send initial data to client when connected
  User.find()
    .then((users) => {
      ws.send(JSON.stringify({ type: "INITIAL_DATA", data: users }));
    })
    .catch((err) => {
      console.log(err);
    });

  // Subscribe to changes in Post collection
  const changeStream = User.watch();
  changeStream.on("change", () => {
    // Notify client when data changes
    User.find()
      .then((posts) => {
        ws.send(JSON.stringify({ type: "UPDATE_DATA", data: posts }));
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

appChat.get("/users", async (req, res) => {
  try {
    const posts = await User.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Other routes and middleware

module.exports = { appChat, server }; // Export Express app and HTTP server
