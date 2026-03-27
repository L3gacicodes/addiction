// api/ai-response.js
export default async function handler(req, res) {
  // 1. Handle only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'This endpoint only accepts POST requests' 
    });
  }

  try {
    const { message } = req.body;

    // 2. Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Missing "message" in request body' 
      });
    }

    // 3. Forward to Gemini (using existing server logic as template)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const SYSTEM_PROMPT = 'You are a compassionate addiction recovery therapist. You help users overcome addictions using CBT-style advice. Always remain empathetic and positive.';

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured in Vercel');
      return res.status(500).json({ 
        error: 'Configuration Error',
        reply: "I'm having trouble thinking right now. Please ensure my brain (API Key) is connected."
      });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'AI Provider Error',
        reply: "I'm feeling a bit overwhelmed. Could you repeat that in a moment?"
      });
    }

    const data = await response.json();
    const aiMessage = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || "I'm listening. Tell me more.";

    // 4. Return valid JSON response
    return res.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Vercel API Handler Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      reply: "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you."
    });
  }
}
