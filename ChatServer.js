const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Chat = require("./models/Chat");

const appChat = express();
const server = http.createServer(appChat); // Create HTTP server

const wss = new WebSocket.Server({ server }); // Create WebSocket server

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send initial data to client when connected
  User.find()
    .then((users) => {
      ws.send(
        JSON.stringify({ type: "INITIAL_DATA", dataType: "USER", data: users })
      );
    })
    .catch((err) => {
      console.log(err);
    });
  Chat.find()
    .then((chats) => {
      ws.send(
        JSON.stringify({ type: "INITIAL_DATA", dataType: "CHAT", data: chats })
      );
    })
    .catch((err) => {
      console.log(err);
    });
  Conversation.find()
    .then((conversations) => {
      ws.send(
        JSON.stringify({
          type: "INITIAL_DATA",
          dataType: "CONVERSATION",
          data: conversations,
        })
      );
    })
    .catch((err) => {
      console.log(err);
    });

  // Subscribe to changes in Post collection
  const changeStream = User.watch();
  changeStream.on("change", () => {
    // Notify client when data changes
    User.find()
      .then((users) => {
        ws.send(
          JSON.stringify({
            type: "UPDATE_DATA",
            dataType: "USER",
            data: users,
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
  const chatStream = Chat.watch();
  chatStream.on("change", () => {
    // Notify client when data changes
    Chat.find()
      .then((chats) => {
        ws.send(
          JSON.stringify({
            type: "UPDATE_DATA",
            dataType: "CHAT",
            data: chats,
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
  const conversationStream = Conversation.watch();
  conversationStream.on("change", () => {
    // Notify client when data changes
    Conversation.find()
      .then((conversations) => {
        ws.send(
          JSON.stringify({
            type: "UPDATE_DATA",
            dataType: "CONVERSATION",
            data: conversations,
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

appChat.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
appChat.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

appChat.get("/chats/:id", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const chats = await Chat.find({ conversationId: conversationId });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Other routes and middleware

module.exports = { appChat, server }; // Export Express app and HTTP server
