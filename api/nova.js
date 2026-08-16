// api/nova.js
// Vercel Serverless Function endpoint for Nova AI recovery companion.
// Expected: POST /api/nova with JSON { message, conversation?, userContext? }
// Diagnostic (dev only): GET/POST /api/nova/diagnose
// Returns: { success: boolean, message?: string, error?: string, code?: string, debug?: object }

import { GoogleGenAI } from '@google/genai'

const MAX_HISTORY_TURNS = 12
const MAX_USER_CONTEXT_LEN = 400
const GEMINI_TIMEOUT_MS = 25000
const DEFAULT_MODEL = 'gemini-2.0-flash'
const FALLBACK_MODELS = ['gemini-2.0-flash-lite', 'gemini-1.5-flash-002', 'gemini-1.5-flash']

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

const IS_DEV = (process.env.VERCEL_ENV !== 'production') && (process.env.NODE_ENV !== 'production')

function withTimeout(promise, ms) {
  let timer
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Gemini request timed out')
      err.code = 'TIMEOUT'
      reject(err)
    }, ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

async function getAuthenticatedUserId(req) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

  const authHeader = req.headers.authorization || (req.headers.Authorization ? String(req.headers.Authorization) : '')
  const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!bearer) return null

  if (SUPABASE_URL && SERVICE_ROLE) {
    try {
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
    } catch (_) { /* ignore */ }
  }

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

// Exponential backoff helper. Only retries for 429/5xx.
// Returns { result, lastModel, attempts, finalError }.
async function callGeminiWithBackoff({ apiKey, primaryModel, buildRequest, systemInstruction }) {
  const modelsToTry = new Set([primaryModel, ...FALLBACK_MODELS])
  const modelList = Array.from(modelsToTry)

  let lastError = null
  let attempt = 0
  for (const model of modelList) {
    const maxRetries = attempt === 0 ? 2 : 1
    for (let retry = 0; retry < maxRetries; retry++) {
      attempt++
      try {
        // Dynamic import: the SDK supports both HTTPError types thrown from GoogleGenAI.models.generateContent
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model,
          contents: buildRequest(),
          systemInstruction,
          config: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 700,
          },
        })
        const text = response && typeof response.text === 'function' ? response.text() : (response?.text || '')
        if (typeof text === 'string' && text.trim()) {
          return { ok: true, text: text.trim(), model, attempts: attempt }
        }
        lastError = {
          kind: 'EMPTY',
          httpStatus: 200,
          code: 'GEMINI_EMPTY_RESPONSE',
          message: 'Gemini returned empty candidates/text.',
          model,
        }
        // Empty response might be a model-specific safety issue — try next model.
        break
      } catch (err) {
        // Parse Gemini SDK error. Google SDK throws GoogleGenAIError with: message, code (Google code), httpStatusCode, details?
        const httpStatus = Number(err.httpStatusCode || err.http_status || err.status || (err.code && err.code >= 400 ? err.code : 0)) || 0
        const geminiCode = err.code && typeof err.code === 'string' ? err.code : (err.errorDetails && err.errorDetails[0]?.reason || err.status || 'UNKNOWN')
        const message = err && err.message ? String(err.message) : 'Unknown Gemini error'

        const isAuth = httpStatus === 401 || httpStatus === 403 || /API key|auth|permission|quota billing not enabled|project has not enabled the API/i.test(message)
        const isRate = httpStatus === 429 || /quota|rate limit|resource exhausted|RESOURCE_EXHAUSTED/i.test(message)
        const isModel = httpStatus === 404 || /model|not found|Model not supported/i.test(message)
        const isServer = httpStatus >= 500 || httpStatus === 0 || /fetch|network|ECONNRESET|ECONNREFUSED|ENOTFOUND|timeout|TIMEOUT|unavailable/i.test(message)
        const isTimeout = err && err.code === 'TIMEOUT'

        const mapped = {
          kind: isAuth ? 'AUTH' : isRate ? 'RATE' : isModel ? 'MODEL' : (isServer || isTimeout) ? 'SERVER' : 'BAD',
          httpStatus: isTimeout ? 504 : (httpStatus || 500),
          code:
            isAuth ? 'GEMINI_AUTH_ERROR' :
            isRate ? 'GEMINI_RATE_LIMITED' :
            isModel ? 'GEMINI_MODEL_NOT_FOUND' :
            isTimeout ? 'GEMINI_TIMEOUT' :
            isServer ? 'GEMINI_UNAVAILABLE' :
            'GEMINI_API_ERROR',
          message,
          geminiCode: typeof geminiCode === 'string' ? geminiCode : String(geminiCode || ''),
          model,
        }
        lastError = mapped

        // Strategy:
        // AUTH: do NOT retry, do NOT change model — key is broken or region-restricted.
        if (isAuth) return { ok: false, error: lastError, model, attempts: attempt }
        // MODEL: try next model (do not retry same model).
        if (isModel) break
        // RATE: backoff on the same model (next retry with sleep). If retries exhausted, try next model.
        if (isRate) {
          if (retry + 1 < maxRetries) {
            const ms = 1000 * Math.pow(2, retry) + Math.floor(Math.random() * 500)
            await new Promise(r => setTimeout(r, ms))
            continue
          }
          break
        }
        // TIMEOUT/SERVER: backoff retry same model. If retries exhausted, try next model.
        if (isServer || isTimeout) {
          if (retry + 1 < maxRetries) {
            const ms = 800 * Math.pow(2, retry) + Math.floor(Math.random() * 300)
            await new Promise(r => setTimeout(r, ms))
            continue
          }
          break
        }
        // BAD (400 / malformed): do NOT retry same model, but still try next model (rare — request might be malformed, not model-specific).
        break
      }
    }
  }

  return { ok: false, error: lastError, model: lastError?.model || primaryModel, attempts: attempt }
}

function sendSafeError(res, { httpStatus, code, userMessage, debug }) {
  const body = { success: false, error: userMessage, code }
  if (IS_DEV && debug) body.debug = debug
  return res.status(httpStatus).json(body)
}

export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // DIAGNOSTIC ENDPOINT (DEVELOPMENT / PREVIEW ONLY)
  // POST or GET /api/nova/diagnose — NEVER expose API keys, only existence.
  // ---------------------------------------------------------------------------
  const pathname = (req.url && new URL(req.url, 'http://localhost').pathname) || '/api/nova'
  if (pathname.endsWith('/diagnose') || (req.body && typeof req.body === 'object' && req.body.diagnose)) {
    if (!IS_DEV) {
      return res.status(404).json({ success: false, error: 'Not found', code: 'NOT_FOUND' })
    }
    const apiKeyExists = !!process.env.GEMINI_API_KEY
    const primaryModel = process.env.GEMINI_MODEL || DEFAULT_MODEL
    let geminiTest = null
    if (apiKeyExists) {
      try {
        const result = await withTimeout(callGeminiWithBackoff({
          apiKey: process.env.GEMINI_API_KEY,
          primaryModel,
          buildRequest: () => ([{ role: 'user', parts: [{ text: 'Say hello in one sentence.' }] }]),
          systemInstruction: { role: 'system', parts: [{ text: 'You are a helpful assistant.' }] },
        }), 30000)
        if (result.ok) {
          geminiTest = {
            ok: true,
            message: result.text,
            model: result.model,
            attempts: result.attempts,
          }
        } else {
          const e = result.error || {}
          geminiTest = {
            ok: false,
            httpStatus: e.httpStatus || 0,
            geminiCode: e.geminiCode || '',
            message: e.message || '',
            model: e.model || result.model,
            code: e.code || 'GEMINI_API_ERROR',
            attempts: result.attempts,
          }
        }
      } catch (testErr) {
        geminiTest = {
          ok: false,
          message: testErr && testErr.message ? String(testErr.message) : 'Unknown test error',
          code: testErr && testErr.code ? String(testErr.code) : 'GEMINI_NETWORK_ERROR',
        }
      }
    }
    return res.status(200).json({
      success: true,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      gemini_api_key_exists: apiKeyExists,
      gemini_model: primaryModel,
      fallback_models: FALLBACK_MODELS,
      node_version: process.version,
      gemini_test: geminiTest,
    })
  }

  // ---------------------------------------------------------------------------
  // MAIN ENDPOINT: POST /api/nova
  // ---------------------------------------------------------------------------
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      code: 'METHOD_NOT_ALLOWED',
    })
  }

  // 1. Input validation
  let body = {}
  try {
    body = req.body && typeof req.body === 'object' ? req.body : (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : {})
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

  // 2. Authentication (non-blocking — context only; but auth JWT issues = explicit category)
  const userId = await getAuthenticatedUserId(req)

  // 3. Gemini key + model
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL
  if (!GEMINI_API_KEY) {
    console.error('[NOVA] GEMINI_API_KEY environment variable missing')
    return sendSafeError(res, {
      httpStatus: 500,
      code: 'MISSING_GEMINI_KEY',
      userMessage: 'Nova is not configured yet. Please set GEMINI_API_KEY.',
      debug: { model: GEMINI_MODEL, env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown' },
    })
  }

  // 4. Build conversation history for Gemini
  const trimmedConvo = conversation.slice(-MAX_HISTORY_TURNS)
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

  const buildContents = () => ([
    ...historyContents,
    { role: 'user', parts: [{ text: userTextForGemini }] },
  ])

  // 5. Call Gemini with timeout, retries (429/5xx), and model fallback
  const startedAt = Date.now()
  try {
    const result = await withTimeout(
      callGeminiWithBackoff({
        apiKey: GEMINI_API_KEY,
        primaryModel: GEMINI_MODEL,
        buildRequest: buildContents,
        systemInstruction,
      }),
      GEMINI_TIMEOUT_MS,
    )

    const durationMs = Date.now() - startedAt

    if (result.ok) {
      console.log(`[NOVA] success in ${durationMs}ms model=${result.model} attempts=${result.attempts}`)
      return res.status(200).json({
        success: true,
        message: result.text,
        debug: IS_DEV ? { model: result.model, attempts: result.attempts, durationMs } : undefined,
      })
    }

    // Result failed. Map to safe user response; in DEV, attach debug with real error.
    const e = result.error || {}
    const code = e.code || 'GEMINI_API_ERROR'
    const httpStatus = e.httpStatus && e.httpStatus >= 400 ? e.httpStatus : 500

    console.error(`[NOVA] failed after ${durationMs}ms code=${code} http=${httpStatus} attempts=${result.attempts} geminiCode=${e.geminiCode || ''} message=${e.message || ''}`)

    const debug = IS_DEV ? {
      status: e.httpStatus || 0,
      code: e.code || '',
      geminiCode: e.geminiCode || '',
      message: e.message || '',
      model: e.model || result.model || GEMINI_MODEL,
      attempts: result.attempts || 1,
      durationMs,
    } : undefined

    if (code === 'MISSING_GEMINI_KEY') {
      return sendSafeError(res, { httpStatus: 500, code, userMessage: 'Nova is not configured yet. Please set GEMINI_API_KEY.', debug })
    }
    if (code === 'GEMINI_AUTH_ERROR') {
      return sendSafeError(res, {
        httpStatus: 500,
        code,
        userMessage: 'Nova is temporarily unavailable. Please try again later.',
        debug,
      })
    }
    if (code === 'GEMINI_MODEL_NOT_FOUND') {
      return sendSafeError(res, {
        httpStatus: 500,
        code,
        userMessage: 'Nova is configured with an unavailable model. Try changing GEMINI_MODEL.',
        debug,
      })
    }
    if (code === 'GEMINI_RATE_LIMITED') {
      return sendSafeError(res, {
        httpStatus: 429,
        code,
        userMessage: 'Nova is receiving too many requests right now. Please try again in a moment.',
        debug,
      })
    }
    if (code === 'GEMINI_TIMEOUT') {
      return sendSafeError(res, {
        httpStatus: 504,
        code,
        userMessage: 'Nova is taking too long to respond. Please try again.',
        debug,
      })
    }
    if (code === 'GEMINI_UNAVAILABLE') {
      return sendSafeError(res, {
        httpStatus: 502,
        code,
        userMessage: 'Nova is offline right now. Check your connection and try again.',
        debug,
      })
    }
    // GEMINI_API_ERROR (400 / malformed) + catch-all
    return sendSafeError(res, {
      httpStatus,
      code,
      userMessage: 'Nova couldn\'t respond right now.',
      debug,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const isTimeout = err && err.code === 'TIMEOUT'
    const isNetwork = err && (/fetch|network|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(err.message || '') || err.type === 'system')
    const message = err && err.message ? String(err.message) : 'Unknown error'
    console.error(`[NOVA] top-level catch after ${durationMs}ms timeout=${isTimeout} network=${isNetwork} message=${message}`)

    const debug = IS_DEV ? {
      status: isTimeout ? 504 : (isNetwork ? 502 : 500),
      code: isTimeout ? 'GEMINI_TIMEOUT' : (isNetwork ? 'GEMINI_NETWORK_ERROR' : 'GEMINI_API_ERROR'),
      geminiCode: '',
      message,
      model: GEMINI_MODEL,
      durationMs,
    } : undefined

    if (isTimeout) {
      return sendSafeError(res, { httpStatus: 504, code: 'GEMINI_TIMEOUT', userMessage: 'Nova is taking too long to respond. Please try again.', debug })
    }
    if (isNetwork) {
      return sendSafeError(res, { httpStatus: 502, code: 'GEMINI_NETWORK_ERROR', userMessage: 'Nova couldn\'t connect. Check your connection and try again.', debug })
    }
    return sendSafeError(res, { httpStatus: 500, code: 'GEMINI_API_ERROR', userMessage: 'Nova couldn\'t respond right now.', debug })
  }
}
