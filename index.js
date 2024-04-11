const { server, appChat } = require("./ChatServer");
const cors = require("cors");
const connectToDb = require("./config/db");
const dotenv = require("dotenv");
const express = require("express");
dotenv.config();
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://teeticolab.eu.org",
    "https://jubilant-waffle-5pqj9wgwpp6hvwx9-3000.app.github.dev",
  ],
};
const PORTCHAT = process.env.PORTCHAT || 5000;
appChat.use(express.json());
appChat.use(express.urlencoded({ extended: true }));
appChat.use(cors(corsOptions));

// Connect to the database
connectToDb();
server.listen(PORTCHAT, () => {
  console.log(`Server started on port ${PORTCHAT}`);
});
