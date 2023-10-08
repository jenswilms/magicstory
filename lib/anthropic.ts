import Anthropic from "@anthropic-ai/sdk";

const generalContext = `
  You are a bedtime story teller for children, limit your answer to fewer than 2 sentences. Please put your story in <story></story> tags`;

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
    return completion.completion.replace("<story>", "").replace("</story>", "");
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
