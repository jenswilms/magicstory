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

  if (message.text === "/startover" || message.text === "/restart") {
    await reset(supabase, user_id);
    // bot.sendMessage(message.chat.id, "Reset successfully");
  }

  let currentMessage;
  //transcribe
  if (message.voice) {
    // transcribe voice message
    const openai = await createOpenAIConnection();
    const fileId = message.voice.file_id;
    const transcription = await transcribe(openai, bot, fileId);
    console.log("whisper:" + transcription);
    currentMessage = transcription;
  } else {
    currentMessage = message.text;
  }

  const story = await getStoryStart(supabase, user_id);

  let storeUserMessage = true;
  let response;
  // Check if user id exists in story
  if (story.length === 0) {
    //start with the prompt
    response = "It's storytime! What should we talk about?";
    storeUserMessage = false;
    bot.sendMessage(message.chat.id, response);
    await createStoryStart(supabase, user_id);
  } else {
      if (story[0].firstmessagesent === false)  {
        console.log("Send story intro");
        //get the intro and send to user
        response = await createStoryIntro(currentMessage || "");
        await updateStoryStart(supabase, user_id);
      } else {
        console.log("continue");
        const chatHistory = await getChatHistory(supabase, user_id);
        chatHistory.push({
          user_id: user_id,
          sender: "bot",
          text: currentMessage || "",
        });
        response = await continueStory(chatHistory);
      };
        // parse results
      const imgRegex = /<img>(.*?)<\/img>/s;
      const storyRegex = /<story>(.*?)<\/story>/s;
      const questionRegex = /<question>(.*?)<\/question>/s;
      
      const storyMatch = response.match(storyRegex);
      const questionMatch = response.match(questionRegex);
      const imgMatch = response.match(imgRegex);

      let responseText = "";
      if (storyMatch) {
        responseText += storyMatch[1];
      }
      responseText += "\n";
      if (questionMatch) {
        responseText += questionMatch[1];
      };

      bot.sendMessage(message.chat.id, responseText);

      //render image
      const { generateImage } = require("./imgGen");
      const imgText = imgMatch ? imgMatch[1] : "";
      console.log( 'imgText:'+ imgText);
      const img = await generateImage(imgText);
      bot.sendPhoto(message.chat.id, img[0]); 

      // Create a Telegram button for user to request image
      // let imgText: string = "";
      // imgText = enMatch ? enMatch[1] : (storyMatch ? storyMatch[1] : "");
      // const opts = {
      //   reply_markup: {
      //     inline_keyboard: [
      //       [
      //         {
      //           text: 'Generate Image',
      //           callback_data: 'generate_image'
      //         }
      //       ]
      //     ]
      //   }
      // };
      // bot.sendMessage(message.chat.id, 'Show me 🎨', opts)

      // // Listen for button click event
      // bot.on('callback_query', async (callbackQuery: any) => {
      //   const { generateImage } = require("./imgGen");
      //   console.log( 'imgText:'+ imgText);
      //   const img = await generateImage(imgText);
      //   bot.sendPhoto(callbackQuery.message.chat.id, img[0]);
      // });
  };

  

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
