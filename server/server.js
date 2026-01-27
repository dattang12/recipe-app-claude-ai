import "dotenv/config"
import express from "express"
import cors from "cors"
import Anthropic from "@anthropic-ai/sdk"
import { HfInference } from "@huggingface/inference"

const app = express()
app.use(express.json())

app.use(
  cors({
    origin: ["http://localhost:5173"], // Vite dev server
  })
)

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients.
Format your response in markdown to make it easier to render to a web page.
`.trim()

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const hf = new HfInference(process.env.HF_ACCESS_TOKEN)

app.get("/health", (req, res) => res.json({ ok: true }))

app.post("/api/recipe", async (req, res) => {
  try {
    const { ingredients, provider = "claude" } = req.body

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "ingredients must be a non-empty array" })
    }

    const ingredientsString = ingredients.map(String).map(s => s.trim()).filter(Boolean).join(", ")
    const userPrompt = `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`

    let recipe = ""

    if (provider === "mistral") {
      const r = await hf.chatCompletion({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      })
      recipe = r.choices?.[0]?.message?.content ?? ""
    } else {
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      })
      recipe = msg.content?.[0]?.text ?? ""
    }

    res.json({ recipe })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to generate recipe" })
  }
})

app.listen(process.env.PORT || 5174, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT || 5174}`)
})
