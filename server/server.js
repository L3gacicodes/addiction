import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()
const app = express()
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-goog-api-key'],
  })
)
app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const SYSTEM_PROMPT =
  'You are a compassionate addiction recovery therapist. You help users overcome porn, betting, and drug addictions. You use motivational, supportive, and CBT-style advice. Never provide medical prescriptions. Always remain empathetic and positive.'

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})
app.post('/ai-response', async (req, res) => {
  try {
    const userText = (req.body?.text || '').trim()
    if (!userText) {
      return res.status(400).json({ error: 'Missing text' })
    }
    const body = {
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
    }
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      }
    )
    const data = await response.json()
    const aiMessage =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      'Sorry, AI did not respond.'
    res.json({ message: aiMessage })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Gemini' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
