export async function createOpenAIConnection() {
  const { OpenAI } = require("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
  return openai;
}
