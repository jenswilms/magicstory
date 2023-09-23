import TelegramBot, { Message } from "node-telegram-bot-api";
const express = require("express");
require("dotenv").config();

const port = process.env.PORT || 3000;

const TOKEN = process.env.TELEGRAM_BOT_API || "";
// Create a new bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Listen for incoming messages from the Telegram Bot API
bot.on("message", async (message: Message) => {
  const { handleIncomingMessage } = require("./lib/telegram");
  await handleIncomingMessage(bot, message);
});

const app = express();

// Start the Express.js server
app.listen(port, () => {
  console.log("Express server started on port 3000");
});
