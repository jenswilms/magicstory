import Anthropic from "@anthropic-ai/sdk";

const generalContext = `
  You are a bedtime story teller for children, limit your answer to fewer than 5 sentences. 
  Always answer in the same language that the user use. Always put your story in <story></story> tags.
  Generate one sentence summary in English for an image illustration of the story, and put your description in <img></img> tags.`;

export async function createCompletions(query: string): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  });

  const prompt = `${Anthropic.HUMAN_PROMPT} ${generalContext} \n ${query} ${Anthropic.AI_PROMPT}`;

  try {
    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: prompt,
      max_tokens_to_sample: 500,
    });

    return completion.completion;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.log(err.status); // 400
      console.log(err.name); // BadRequestError
      console.log(err.headers); // {server: 'nginx', ...}
    } else {
      throw err;
    }
    return "";
  }
}
