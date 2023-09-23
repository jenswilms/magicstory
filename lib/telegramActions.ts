//start by asking some keywords
import Anthropic from "@anthropic-ai/sdk";

//on response
// generate image
// start beginning of story

// conversation
// generate key themes & store key themes

interface ChatMessage {
  user_id: string;
  sender: string;
  text: string;
}

import { createCompletions } from "./anthropic";

export async function createStoryIntro(keywords: string) {
  const prompt = `Write a small introduction about ${keywords}! 
  Be short and prompt the user back with a question on how to continue the story`;

  const completion = await createCompletions(prompt);
  return completion;
}

export async function continueStory(userChatHistory: ChatMessage[]) {
  // console.log(userChatHistory);
  let chatString = `Please continue the following story:\n`;

  if (userChatHistory.length > 0) {
    for (let i = 0; i < userChatHistory.length; i++) {
      let chat = userChatHistory[i];
      let prompt =
        chat.sender === "bot" ? Anthropic.AI_PROMPT : Anthropic.HUMAN_PROMPT;
      chatString += `${prompt} ${chat.text} `;
    }

    // Remove trailing space
    chatString = chatString.trim();
  }

  chatString += `\nBe short and prompt the user back with a question on how to continue the story`;

  const completion = await createCompletions(chatString);
  return completion;
}
