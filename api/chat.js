import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NEW_MODELS = ['gpt-5-nano', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o1-preview'];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 1000, model = "gpt-4o-mini" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages harus berupa array" });
    }

    const isNewModel = NEW_MODELS.some(m => model.includes(m));

    const requestParams = {
      model,
      messages,
      temperature
    };

    if (isNewModel) {
      requestParams.max_completion_tokens = max_tokens;
    } else {
      requestParams.max_tokens = max_tokens;
    }

    const completion = await client.chat.completions.create(requestParams);

    return res.status(200).json(completion);
  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      message: err.message
    });
  }
}
