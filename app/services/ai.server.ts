import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askAI(question: string) {
  const response = await openai.completions.create({
    model: "gpt-3.5-turbo",
    prompt: question,
    max_tokens: 100,
  });

  return response.choices[0].text;
}
