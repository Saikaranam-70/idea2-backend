require("dotenv").config();
const groq = require("./config/groqClient");

(async () => {
  try {
    console.log(process.env.GROQ_API_KEY);
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Reply with exactly this text: Groq working fine",
        },
      ],
      temperature: 0,
    });

    const output = response.choices[0].message.content;
    console.log("Groq response:", output);

    process.exit(0);
  } catch (err) {
    console.error("Groq test failed:");
    console.error(err.message || err);
    process.exit(1);
  }
})();
