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
  const intro_prompt = `Write a small introduction about ${keywords}! 
  Be short and prompt the user back with a question on how to continue the story. 
  Then, generate one sentence summary in English for an image illustration of the story, and put your description in <img></img> tags.`;
  const prompt = `${Anthropic.HUMAN_PROMPT} ${intro_prompt}${Anthropic.AI_PROMPT}`;
 
  const completion = await createCompletions(prompt);
  return completion;
}

export async function continueStory(userChatHistory: ChatMessage[]) {
  // console.log(userChatHistory);
  let chatString = `Please continue the story:\n`;

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

  chatString += `\n First, return the next 3 sentences that continue the story. Don't return the whole story, just the next 3 sentences.
  Then, prompt the user back with a question on how to continue the story. 
  Please put your question in <question></question> tags.
  Then, generate one sentence summary in English for an image illustration of the continuation, and put your description in <img></img> tags.`;

  const completion = await createCompletions(chatString);
  return completion;
}
