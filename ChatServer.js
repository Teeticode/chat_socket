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

const connectedClients = new Map(); // Map to track connected clients and their conversation IDs

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Handle client messages
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "SUBSCRIBE_CONVERSATION") {
      const { conversationId } = data;
      connectedClients.set(ws, conversationId); // Track the conversation ID the client is interested in
    }
  });

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

  // Notify client of initial conversations
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

  // Modify chatStream to notify only about specific conversations
  const chatStream = Chat.watch();
  chatStream.on("change", async (change) => {
    try {
      // Get the conversation ID from the change document
      const conversationId = change.documentKey._id;
      console.log(conversationId);
      // Notify clients only if they are interested in the specific conversation ID
      for (const [client, clientConversationId] of connectedClients.entries()) {
        if (clientConversationId === conversationId) {
          // Find the chat messages related to the specific conversation ID
          const chat = await Chat.findOne({ conversationId });

          // Send the chat data to the client
          client.send(
            JSON.stringify({
              type: "UPDATE_DATA",
              dataType: "CHAT",
              data: chat,
            })
          );
        }
      }
    } catch (err) {
      console.log("Error in chatStream:", err);
    }
  });

  // Handle Conversation collection changes
  const conversationStream = Conversation.watch();
  conversationStream.on("change", async () => {
    // Notify clients when data changes
    const conversations = await Conversation.find();
    for (const [client, interest] of connectedClients.entries()) {
      if (interest.dataType === "CONVERSATION") {
        client.send(
          JSON.stringify({
            type: "UPDATE_DATA",
            dataType: "CONVERSATION",
            data: conversations,
          })
        );
      }
    }
  });

  // Cleanup when client disconnects
  ws.on("close", () => {
    connectedClients.delete(ws); // Remove the client from the map when they disconnect
    console.log("Client disconnected");
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
    const chats = await Chat.find({ conversationId: conversationId }).populate(
      "sender"
    );
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Other routes and middleware

module.exports = { appChat, server }; // Export Express app and HTTP server
