// api/nova.js
// Vercel Serverless Function endpoint for Nova AI recovery companion.
// Expected: POST /api/nova with JSON { message, conversation?, userContext? }
// Returns: { success: boolean, message?: string, error?: string, code?: string }

const MAX_HISTORY_TURNS = 12
const MAX_USER_CONTEXT_LEN = 400
const GEMINI_TIMEOUT_MS = 25000

const NOVA_SYSTEM_INSTRUCTION = `You are Nova — the AI recovery companion inside the No Shake app.

ROLE:
- You are a warm, calm, empathetic, direct, non-judgmental, human-sounding recovery support assistant.
- You are NOT a licensed therapist, doctor, psychiatrist, or emergency service. Do not diagnose or prescribe medication.
- If the user is in crisis, urges self-harm, or mentions immediate danger, encourage them to contact a local crisis/helpline, a trusted person, or emergency services.

PERSONALITY:
- Warm, calm, empathetic, concise. Talk like a trusted friend who understands recovery.
- Never shame. Never say "you failed", "you ruined your streak", "you have no self-control".
- Normalize setbacks: "One setback doesn't erase your progress."
- When the user is distressed or actively craving, prioritize:
  1. Short validation (1 sentence, no essays)
  2. Immediate practical coping step(s)
  3. A single short question
- Avoid excessive motivational speeches, lists, and overlong replies.
- Ask useful questions to understand triggers, cravings, emotions, habits, routines, setbacks.

FOR CRAVINGS EXAMPLE:
User: "I'm having a strong craving right now."
Good:
  "I hear you. Don't make the decision right now.
  For the next 5 minutes:
  • Leave the place you're in.
  • Put your phone somewhere you can't easily reach it.
  • Take 5 slow breaths.
  How strong is the urge from 1–10?"

SUPPORT TOPICS:
- Help with urges/cravings, triggers, loneliness, stress, boredom, guilt after a setback.
- Coping strategies, distraction, urge-surfing, habits, routines, recovery strategies.
- Help a user understand a trigger pattern when asked.

FORMAT:
- Keep responses concise, readable. Use short paragraphs, bullet points sparingly (max 3 bullets).
- Never end with a generic closing; end with a short question if it naturally fits.`

// Creates an AbortController-based timeout promise.
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error('Gemini request timed out')
      err.code = 'TIMEOUT'
      reject(err)
    }, ms)
    promise
      .then((v) => { clearTimeout(timer); resolve(v) })
      .catch((e) => { clearTimeout(timer); reject(e) })
  })
}

// In Vercel serverless, Supabase verification:
// Use the Supabase URL + service_role OR validate the JWT using auth header.
// We validate the access token from Authorization header.
async function getAuthenticatedUserId(req) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

  const authHeader = req.headers.authorization || (req.headers.Authorization ? String(req.headers.Authorization) : '')
  const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!bearer) return null

  // If we have service role, validate using Supabase admin client.
  if (SUPABASE_URL && SERVICE_ROLE) {
    try {
      // Dynamic import to avoid a hard package.json dep that the user might not have needed in serverless env.
      // @supabase/supabase-js is already in the project and gets bundled for serverless by Vercel from root node_modules if present.
      // But to avoid bundle bloat/failure, we use REST to validate the token against Supabase.
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SERVICE_ROLE,
          'Authorization': `Bearer ${bearer}`,
        },
      })
      if (resp.ok) {
        const data = await resp.json()
        return data?.id || data?.user?.id || null
      }
      return null
    } catch (_) {
      return null
    }
  }

  // Fallback: try to verify with anon key as the apikey (still need user bearer token)
  const ANON = process.env.VITE_SUPABASE_ANON_KEY
  if (SUPABASE_URL && ANON) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': ANON,
          'Authorization': `Bearer ${bearer}`,
        },
      })
      if (resp.ok) {
        const data = await resp.json()
        return data?.id || data?.user?.id || null
      }
    } catch (_) { /* ignore */ }
  }

  return null
}

async function fetchUserRecoveryContext(userId) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!userId || !SUPABASE_URL || !ANON) return null
  try {
    const [profilesResp, checkinsResp] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=username,streak_count,last_checkin,best_streak&limit=1`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Accept': 'application/json' },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/checkins?select=relapse,created_at&order=created_at.desc&limit=10`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Accept': 'application/json' },
      }),
    ])
    const profileList = profilesResp.ok ? await profilesResp.json() : []
    const checkins = checkinsResp.ok ? await checkinsResp.json() : []
    const profile = Array.isArray(profileList) ? profileList[0] : null
    if (!profile) return null

    const recentStrong = checkins.filter(c => !c.relapse).length
    const recent = checkins.length

    return `MINIMAL USER RECOVERY CONTEXT (do not repeat verbatim, only use to personalize):
- Username: ${profile.username || 'Anonymous'}
- Current streak (days): ${profile.streak_count || 0}
- Best streak (days): ${profile.best_streak || profile.streak_count || 0}
- Recent check-ins: ${recentStrong}/${recent} strong days in last 10
- This is NOT the user speaking. Only use context to personalize.`
  } catch (e) {
    return null
  }
}

export default async function handler(req, res) {
  // Restrict to POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      code: 'METHOD_NOT_ALLOWED',
    })
  }

  // ---- 1. Input validation ----
  let body = {}
  try {
    body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
  } catch (_) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON body.',
      code: 'BAD_REQUEST',
    })
  }

  const messageRaw = typeof body.message === 'string' ? body.message : ''
  const message = messageRaw.trim()
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Missing message.',
      code: 'MISSING_MESSAGE',
    })
  }

  const conversation = Array.isArray(body.conversation) ? body.conversation : []
  const userContextRaw = typeof body.userContext === 'string' ? body.userContext : ''

  // ---- 2. Authentication ----
  // NOTE: We do NOT block unauthenticated in development to enable testing.
  // In production, you can enforce auth by checking userId === null and returning 401.
  const userId = await getAuthenticatedUserId(req)

  // ---- 3. Gemini key + model ----
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    console.error('[NOVA] GEMINI_API_KEY environment variable missing')
    return res.status(500).json({
      success: false,
      error: 'Nova is not configured yet. Please set GEMINI_API_KEY.',
      code: 'MISSING_GEMINI_KEY',
    })
  }
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

  // ---- 4. Build conversation history for Gemini ----
  // Trim conversation to last MAX_HISTORY_TURNS turns (user + assistant pairs count as 2)
  const trimmedConvo = conversation.slice(-MAX_HISTORY_TURNS)

  // Sanitize each entry to expected shape
  const toGeminiContent = (entry) => {
    const role = entry && (entry.role === 'assistant' || entry.role === 'user') ? entry.role : null
    if (!role) return null
    const text = typeof entry.content === 'string' ? entry.content : (typeof entry.text === 'string' ? entry.text : '')
    if (!text) return null
    return { role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] }
  }

  const historyContents = []
  for (const entry of trimmedConvo) {
    const g = toGeminiContent(entry)
    if (g) historyContents.push(g)
  }

  // Attach user context (if any) to the latest user message as a lightweight prefix.
  let contextPrefix = ''
  if (userContextRaw) {
    contextPrefix = `[User notes for this message: ${userContextRaw.slice(0, MAX_USER_CONTEXT_LEN)}]\n\n`
  } else if (userId) {
    const ctx = await fetchUserRecoveryContext(userId)
    if (ctx) contextPrefix = `${ctx}\n\n`
  }

  const userTextForGemini = `${contextPrefix}${message}`

  const systemInstruction = {
    role: 'system',
    parts: [{ text: NOVA_SYSTEM_INSTRUCTION }],
  }

  const contents = [
    ...historyContents,
    { role: 'user', parts: [{ text: userTextForGemini }] },
  ]

  // ---- 5. Call Gemini with timeout ----
  const startedAt = Date.now()
  try {
    const requestPromise = fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents,
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
    })

    const response = await withTimeout(requestPromise, GEMINI_TIMEOUT_MS)
    const durationMs = Date.now() - startedAt

    if (!response.ok) {
      let rawErr = null
      try { rawErr = await response.json() } catch (_) { /* ignore */ }
      const status = response.status

      console.error(`[NOVA] Gemini HTTP ${status} (model=${GEMINI_MODEL}, duration=${durationMs}ms)`, rawErr ? JSON.stringify(rawErr).slice(0, 500) : '')

      if (status === 401 || status === 403) {
        return res.status(500).json({
          success: false,
          error: 'Nova is having trouble with its credentials. Ask an admin to verify the API key.',
          code: 'GEMINI_AUTH_ERROR',
        })
      }
      if (status === 404) {
        return res.status(500).json({
          success: false,
          error: 'Nova is configured with an unavailable model. Try changing GEMINI_MODEL.',
          code: 'GEMINI_MODEL_NOT_FOUND',
        })
      }
      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Nova is getting a lot of requests right now. Give it a moment and try again.',
          code: 'GEMINI_RATE_LIMITED',
        })
      }
      if (status >= 500) {
        return res.status(502).json({
          success: false,
          error: 'Nova is currently unavailable. Please try again in a minute.',
          code: 'GEMINI_UNAVAILABLE',
        })
      }
      return res.status(500).json({
        success: false,
        error: 'Nova couldn\'t respond right now.',
        code: 'GEMINI_API_ERROR',
      })
    }

    const data = await response.json()
    const aiText =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n').trim() || ''

    if (!aiText) {
      console.error('[NOVA] Gemini returned empty response. Finish reason:', data?.candidates?.[0]?.finishReason)
      return res.status(502).json({
        success: false,
        error: 'Nova didn\'t return a response. Please try again.',
        code: 'GEMINI_EMPTY_RESPONSE',
      })
    }

    return res.status(200).json({
      success: true,
      message: aiText,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    console.error(`[NOVA] Gemini error after ${durationMs}ms:`, err && err.message ? err.message : err)

    if (err && err.code === 'TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: 'Nova is taking too long to respond. Please try again.',
        code: 'GEMINI_TIMEOUT',
      })
    }
    if (err && (err.code === 'ECONNRESET' || err.type === 'system' || /fetch|network/i.test(err.message || ''))) {
      return res.status(502).json({
        success: false,
        error: 'Nova is offline right now. Check your connection and try again.',
        code: 'GEMINI_NETWORK_ERROR',
      })
    }
    return res.status(500).json({
      success: false,
      error: 'Unable to contact Nova right now.',
      code: 'GEMINI_API_ERROR',
    })
  }
}
