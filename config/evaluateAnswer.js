const groq = require("./groqClient");

module.exports = async function evaluateAnswer(question, answerText) {
  const prompt = `
You are an interview evaluator.

Question:
"${question}"

Candidate Answer:
"${answerText}"

Give a confidence score from 1 to 20 based on:
- clarity
- correctness
- structure
- confidence

Return ONLY valid JSON:
{
  "confidenceScore": number
}
`;

  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  return JSON.parse(raw);
};
