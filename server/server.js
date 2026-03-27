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
app.post('/api/ai-response', async (req, res) => {
  try {
    const userText = (req.body?.message || '').trim()
    if (!userText) {
      return res.status(400).json({ error: 'Missing message' })
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

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API Error:', errorData)
      return res.status(response.status).json({ 
        error: 'Gemini API failure', 
        reply: "I'm having a moment to think. Could you repeat that?" 
      })
    }

    const data = await response.json()
    const aiMessage =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      'I understand. Tell me more about that.'
    
    res.json({ reply: aiMessage })
  } catch (error) {
    console.error('Server AI Error:', error)
    res.status(500).json({ 
      error: 'Failed to process AI response',
      reply: "I'm having trouble connecting right now. Take a deep breath."
    })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
