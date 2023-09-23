import { Message } from "node-telegram-bot-api";
import { createStoryIntro, continueStory } from "./telegramActions";
import {
  createSupabaseConnection,
  storeMessage,
  getChatHistory,
  getStoryStart,
  updateStoryStart,
  createStoryStart,
  reset,
} from "./supabase";
import { createOpenAIConnection } from "./openai";
import { transcribe } from "./voice";

interface UserStory {
  id: string;
  firstMessageSent: boolean;
}

interface ChatMessage {
  user_id: string;
  sender: string;
  text: string;
}

async function handleIncomingMessage(bot: any, message: Message) {
  //check if user has an active story
  const user_id = String(message.chat.id);
  const supabase = await createSupabaseConnection();

  if (message.text === "/reset") {
    await reset(supabase, user_id);
    bot.sendMessage(message.chat.id, "Reset successfully");
    return;
  }

  let currentMessage;
  //transcribe
  if (message.voice) {
    // transcribe voice message
    const openai = await createOpenAIConnection();
    const fileId = message.voice.file_id;
    const transcription = await transcribe(openai, bot, fileId);
    console.log("whisper:" + transcription)
    currentMessage = transcription;
  } else {
    currentMessage = message.text;
  }
  console.log("return:" + currentMessage)

  const story = await getStoryStart(supabase, user_id);

  let storeUserMessage = true;
  let response;
  // Check if user id exists in user_stories.json
  if (story.length === 0) {
    console.log("User doesnt exist in stories");

    //start with the prompt
    response = "It's storytime! What should we talk about?";
    storeUserMessage = false;
    await createStoryStart(supabase, user_id);
  } else if (story.length > 0 && story[0].firstmessagesent === false) {
    console.log("Send story intro");
    //get the intro and send to user
    response = await createStoryIntro(currentMessage || "");
    await updateStoryStart(supabase, user_id);

    //render image
    const { generateImage } = require("./imgGen");
    const img = await generateImage(response);
    bot.sendPhoto(message.chat.id, img[0]);

  } else {
    console.log("continue");
    const chatHistory = await getChatHistory(supabase, user_id);
    chatHistory.push({
      user_id: user_id,
      sender: "bot",
      text: currentMessage || "",
    });
    response = await continueStory(chatHistory);

    //render image
    const { generateImage } = require("./imgGen");
    const img = await generateImage(response);
    bot.sendPhoto(message.chat.id, img[0]);
  }

  bot.sendMessage(message.chat.id, response);

  //store messages in DB
  if (storeUserMessage)
    await storeMessage(supabase, {
      user_id: user_id,
      sender: "user",
      text: currentMessage || "",
    });
  await storeMessage(supabase, {
    user_id: user_id,
    sender: "bot",
    text: response,
  });
}

module.exports = {
  handleIncomingMessage,
};
