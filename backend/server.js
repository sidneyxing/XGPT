import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
})

app.post("/chat", async (req, res) => {

  console.log("REQ BODY:", req.body)

  let { messages, model, temperature, max_tokens } = req.body

  // ✅ safety default
  const selectedModel = model || "llama-3.1-8b-instant"
  const safeMessages = messages?.length
    ? messages
    : [{ role: "user", content: "Hello" }]

  const safeTemp = temperature ?? 0.7
  const safeMaxTokens = max_tokens ?? 512

  try {

    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: safeMessages,
      temperature: safeTemp,
      max_tokens: safeMaxTokens
    })

    console.log("AI RAW RESPONSE:", response)

    const text =
      response?.choices?.[0]?.message?.content ||
      "⚠️ Empty response from AI"

    return res.json({
      reply: text
    })

  } catch (err) {

    console.error(
      "Main model error:",
      err.response?.data || err.message
    )

    console.log("Trying fallback model...")

    try {

      const fallbackResponse = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: safeMessages,
        temperature: safeTemp,
        max_tokens: safeMaxTokens
      })

      const text =
        fallbackResponse?.choices?.[0]?.message?.content ||
        "⚠️ Empty fallback response"

      return res.json({
        reply: text
      })

    } catch (fallbackErr) {

      console.error(
        "Fallback error:",
        fallbackErr.response?.data || fallbackErr.message
      )

      return res.status(500).json({
        error: "All models failed"
      })

    }
  }
})

app.listen(3001, () => {
  console.log("Backend running on port 3001")
})