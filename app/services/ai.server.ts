import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askAI(prompt: string, question: string) {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: question,
      },
    ],
    model: "llama3-8b-8192",
    max_tokens: 100,
  });

  return response.choices[0].message.content;
}
