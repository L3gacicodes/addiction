// api/nova.js
// =============================================================================
// Vercel Serverless Function — POST /api/nova (GET /api/nova also works as a
// healthcheck).
//
// ZERO external dependencies. Uses only Node built-ins: fetch, setTimeout.
// Never imports @google/genai so Vercel function init can never fail on SDK.
//
// Expected input:  POST /api/nova
//   {
//     message: "I'm having a craving",
//     conversation?: [{ role: 'user'|'assistant', content: string }, ...],
//     userContext?: string
//   }
//
// Output:
//   { success: true,  message: string[, debug: object] }
//   { success: false, error: string, code: string[, debug: object] }
//
// Healthcheck (no body needed):
//   GET  /api/nova                -> { success: true, endpoint: 'nova', gemini_api_key_exists: boolean }
//   GET  /api/nova/diagnose       -> dev-only detailed test (disabled in prod)
//   POST /api/nova {diagnose:true} -> same as /diagnose
// =============================================================================

const MAX_HISTORY_TURNS = 12
const MAX_USER_CONTEXT_LEN = 400
const GEMINI_TIMEOUT_MS = 25000

// CURRENT PROVEN MODELS (confirmed working with the user's Gemini key, 2026-08-16):
//   gemini-3.5-flash        ✅ (conversational, fast, new — used as primary)
//   gemini-3-flash-preview  ✅ (slightly older, backup)
// All gemini-1.x / gemini-2.0 / gemini-2.5 / "gemini-pro" models returned
// 404 NOT_FOUND for this user's key type, so they are NOT used as fallbacks.
const DEFAULT_MODEL = 'gemini-3.5-flash'
const FALLBACK_MODELS = ['gemini-3-flash-preview']

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

const IS_PROD =
  (process.env.VERCEL_ENV === 'production') ||
  (process.env.NODE_ENV === 'production')
const IS_DEV = !IS_PROD

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function withTimeout(promise, ms) {
  let timer
  const tp = new Promise((_, rj) => {
    timer = setTimeout(() => {
      const e = new Error('Gemini request timed out')
      e.code = 'TIMEOUT'
      rj(e)
    }, ms)
  })
  return Promise.race([promise, tp]).finally(() => clearTimeout(timer))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body)
    let data = ''
    req.on('data', (chunk) => { data += chunk.toString() })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Supabase auth — server-side validation (NEVER trust client-provided userId)
// ---------------------------------------------------------------------------
async function getAuthenticatedUserId(req) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ANON = process.env.VITE_SUPABASE_ANON_KEY

  const authHeader = req.headers.authorization || (req.headers.Authorization ? String(req.headers.Authorization) : '')
  const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!bearer) return null

  async function validateViaREST(apiKeyHeader) {
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': apiKeyHeader,
          'Authorization': `Bearer ${bearer}`,
        },
      })
      if (r.ok) {
        const d = await r.json()
        return d?.id || d?.user?.id || null
      }
    } catch (_) { /* ignore */ }
    return null
  }

  if (SUPABASE_URL && SERVICE_ROLE) {
    const id = await validateViaREST(SERVICE_ROLE)
    if (id) return id
  }
  if (SUPABASE_URL && ANON) {
    const id = await validateViaREST(ANON)
    if (id) return id
  }
  return null
}

async function fetchUserRecoveryContext(userId) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!userId || !SUPABASE_URL || !ANON) return null
  try {
    const [p, c] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=username,streak_count,last_checkin,best_streak&limit=1`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Accept: 'application/json' },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/checkins?select=relapse,created_at&order=created_at.desc&limit=10`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Accept: 'application/json' },
      }),
    ])
    const profiles = p.ok ? await p.json() : []
    const checkins = c.ok ? await c.json() : []
    const profile = Array.isArray(profiles) && profiles[0] ? profiles[0] : null
    if (!profile) return null
    const strong = checkins.filter(x => !x.relapse).length
    const total = checkins.length
    return `MINIMAL USER RECOVERY CONTEXT (do not repeat verbatim, only use to personalize):
- Username: ${profile.username || 'Anonymous'}
- Current streak (days): ${profile.streak_count || 0}
- Best streak (days): ${profile.best_streak || profile.streak_count || 0}
- Recent check-ins: ${strong}/${total} strong days in last 10
- This is NOT the user speaking. Only use context to personalize.`
  } catch (_) {
    return null
  }
}

// ---------------------------------------------------------------------------
// Gemini caller (HTTP REST, zero SDK deps).
// Exact v1beta JSON spec compatible with gemini-3.5-flash / gemini-3-flash-preview.
// ---------------------------------------------------------------------------
function buildGeminiEndpoint(model, apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
}

function classifyGeminiError(status, message) {
  const s = Number(status) || 0
  const m = String(message || '')
  const isAuth = s === 401 || s === 403 || /API key|auth|permission|PERMISSION_DENIED|billing not enabled|project has not enabled the API|restricted key/i.test(m)
  const isRate = s === 429 || /quota|rate limit|resource exhausted|RESOURCE_EXHAUSTED|Too Many Requests/i.test(m)
  const isModel = s === 404 || /model|not found|Model not supported|NOT_FOUND/i.test(m)
  const isServer = s >= 500 || s === 0 || /fetch|network|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|timeout|TIMEOUT|unavailable|UNAVAILABLE|INTERNAL/i.test(m)
  const kind =
    isAuth ? 'AUTH' :
    isRate ? 'RATE' :
    isModel ? 'MODEL' :
    isServer ? 'SERVER' : 'BAD'
  const code =
    kind === 'AUTH' ? 'GEMINI_AUTH_ERROR' :
    kind === 'RATE' ? 'GEMINI_RATE_LIMITED' :
    kind === 'MODEL' ? 'GEMINI_MODEL_NOT_FOUND' :
    kind === 'SERVER' ? 'GEMINI_UNAVAILABLE' :
    'GEMINI_API_ERROR'
  return { kind, code }
}

async function callGeminiWithBackoff({ apiKey, primaryModel, buildContents, systemInstruction }) {
  const models = Array.from(new Set([primaryModel, ...FALLBACK_MODELS]))

  let lastErr = null
  let attempt = 0
  for (const model of models) {
    const maxRetries = attempt === 0 ? 2 : 1
    for (let retry = 0; retry < maxRetries; retry++) {
      attempt++
      try {
        const url = buildGeminiEndpoint(model, apiKey)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-client': 'noshake-http/1.0' },
          body: JSON.stringify({
            systemInstruction,
            contents: buildContents(),
            generationConfig: {
              temperature: 0.4,
              topP: 0.9,
              maxOutputTokens: 700,
            },
          }),
        })

        if (!res.ok) {
          let err = null
          try { err = await res.json() } catch (_) { err = null }
          const message =
            (err && err.error && err.error.message) ||
            (err && typeof err.message === 'string' ? err.message : '') ||
            `HTTP ${res.status}`
          const geminiCode =
            (err && err.error && err.error.status) ||
            (err && err.error && err.error.code) ||
            ''
          const { kind, code } = classifyGeminiError(res.status, message)
          const mapped = {
            kind,
            httpStatus: res.status,
            code,
            geminiCode: String(geminiCode || ''),
            message,
            model,
          }
          lastErr = mapped

          if (kind === 'AUTH') {
            // Key broken, region-restricted, API not enabled — do NOT retry or switch model.
            return { ok: false, error: mapped, model, attempts: attempt }
          }
          if (kind === 'MODEL') break // next model (no retry same model)
          if (kind === 'RATE' || kind === 'SERVER') {
            if (retry + 1 < maxRetries) {
              const ms = (kind === 'RATE' ? 1000 : 800) * Math.pow(2, retry) + Math.floor(Math.random() * 500)
              await sleep(ms)
              continue
            }
            break
          }
          // BAD (400 / malformed): no retry same model, try next model once
          break
        }

        // Parse success response
        const data = await res.json()
        const text =
          (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || [])
            .map(p => (p && typeof p.text === 'string' ? p.text : '')).join('').trim()
            || ''
        if (!text) {
          lastErr = {
            kind: 'EMPTY',
            httpStatus: 200,
            code: 'GEMINI_EMPTY_RESPONSE',
            geminiCode: '',
            message: `Gemini candidates empty. finishReason: ${data?.candidates?.[0]?.finishReason || ''}`,
            model,
          }
          break
        }
        return { ok: true, text, model, attempts: attempt }
      } catch (rawErr) {
        const isTimeout = rawErr && rawErr.code === 'TIMEOUT'
        const message = rawErr && rawErr.message ? String(rawErr.message) : String(rawErr || 'Unknown fetch error')
        const { kind, code } = isTimeout
          ? { kind: 'SERVER', code: 'GEMINI_TIMEOUT' }
          : classifyGeminiError(0, message)
        const mapped = {
          kind,
          httpStatus: isTimeout ? 504 : 502,
          code,
          geminiCode: '',
          message,
          model,
        }
        lastErr = mapped
        if (kind === 'SERVER') {
          if (retry + 1 < maxRetries) {
            const ms = 800 * Math.pow(2, retry) + Math.floor(Math.random() * 400)
            await sleep(ms)
            continue
          }
          break
        }
        break
      }
    }
  }

  return { ok: false, error: lastErr, model: lastErr?.model || primaryModel, attempts: attempt }
}

// ---------------------------------------------------------------------------
// Shared: send a safe JSON response. In development, also attach debug info.
// ---------------------------------------------------------------------------
function sendJson(res, httpStatus, payload, debug) {
  if (IS_DEV && debug) payload.debug = debug
  res.status(httpStatus).json(payload)
}

// ---------------------------------------------------------------------------
// Diagnostic handler (dev / preview ONLY — always disabled in production)
// ---------------------------------------------------------------------------
async function handleDiagnose(req, res) {
  if (IS_PROD) {
    // NOTE: We intentionally do NOT return HTTP 404 here, even though the route
    // is disabled in production. Returning 404 confuses the frontend error
    // router (which maps HTTP 404 -> code NOT_FOUND -> "Nova endpoint not found.")
    // into falsely reporting the entire /api/nova endpoint is missing, when in
    // fact only the sub-route /diagnose is disabled.
    return sendJson(res, 405, {
      success: false,
      error: 'Diagnose endpoint is only available in preview or local development.',
      code: 'DIAGNOSE_DISABLED',
    })
  }
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const keyExists = !!apiKey
  let geminiTest = null
  if (keyExists) {
    try {
      const systemInstruction = { role: 'system', parts: [{ text: 'You are a helpful assistant.' }] }
      const buildContents = () => ([{ role: 'user', parts: [{ text: 'Say hello in one sentence.' }] }])
      const r = await withTimeout(callGeminiWithBackoff({
        apiKey, primaryModel: model, buildContents, systemInstruction,
      }), 30000)
      if (r.ok) {
        geminiTest = { ok: true, message: r.text, model: r.model, attempts: r.attempts }
      } else {
        const e = r.error || {}
        geminiTest = {
          ok: false,
          httpStatus: e.httpStatus || 0,
          geminiCode: e.geminiCode || '',
          message: e.message || '',
          model: e.model || r.model,
          code: e.code || 'GEMINI_API_ERROR',
          attempts: r.attempts,
        }
      }
    } catch (tErr) {
      geminiTest = {
        ok: false,
        code: tErr && tErr.code === 'TIMEOUT' ? 'GEMINI_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
        message: tErr && tErr.message ? tErr.message : String(tErr || 'Unknown'),
      }
    }
  }
  return sendJson(res, 200, {
    success: true,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    gemini_api_key_exists: keyExists,
    gemini_model: model,
    fallback_models: FALLBACK_MODELS,
    node_version: process.version,
    gemini_test: geminiTest,
  })
}

// ---------------------------------------------------------------------------
// Healthcheck — always available via GET /api/nova.
// ---------------------------------------------------------------------------
function handleHealthcheck(_req, res) {
  const keyExists = !!process.env.GEMINI_API_KEY
  return sendJson(res, 200, {
    success: true,
    endpoint: 'nova',
    status: 'ok',
    gemini_api_key_exists: keyExists,
    gemini_model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  })
}

// ---------------------------------------------------------------------------
// MAIN: Vercel serverless function handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  try {
    let pathname = '/api/nova'
    try { pathname = (req.url && new URL(req.url, 'http://localhost').pathname) || '/api/nova' } catch (_) {}

    const isDiagnose =
      pathname.endsWith('/diagnose') ||
      (pathname === '/api/nova' && req.method !== 'GET' && req.body && typeof req.body === 'object' && req.body.diagnose === true)

    if (isDiagnose) {
      let injected = false
      if (!(req.body && typeof req.body === 'object')) {
        try {
          req.body = await readJsonBody(req)
          injected = true
        } catch (_) { if (!injected) req.body = {} }
      }
      return await handleDiagnose(req, res)
    }

    if (req.method === 'GET') {
      return handleHealthcheck(req, res)
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, GET')
      return sendJson(res, 405, {
        success: false,
        error: 'Method Not Allowed',
        code: 'METHOD_NOT_ALLOWED',
      })
    }

    // ---------- Parse request body ----------
    let body = {}
    try {
      body = req.body && typeof req.body === 'object'
        ? req.body
        : await readJsonBody(req)
    } catch (_) {
      return sendJson(res, 400, { success: false, error: 'Invalid JSON body.', code: 'BAD_REQUEST' })
    }

    // ---------- Validate minimal fields ----------
    const messageRaw = typeof body.message === 'string' ? body.message : ''
    const message = messageRaw.trim()
    if (!message) {
      return sendJson(res, 400, {
        success: false,
        error: 'Missing message.',
        code: 'MISSING_MESSAGE',
      })
    }

    const conversation = Array.isArray(body.conversation) ? body.conversation : []
    const userContextRaw = typeof body.userContext === 'string' ? body.userContext : ''

    // ---------- Auth (non-blocking — used for context only) ----------
    const userId = await getAuthenticatedUserId(req)

    // ---------- Check GEMINI_API_KEY ----------
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL
    if (!GEMINI_API_KEY) {
      console.error('[NOVA] GEMINI_API_KEY environment variable missing')
      return sendJson(res, 500, {
        success: false,
        error: 'Nova is not configured yet. Please set GEMINI_API_KEY.',
        code: 'MISSING_GEMINI_KEY',
      }, { model: GEMINI_MODEL, env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown' })
    }

    // ---------- Build contents + system instruction ----------
    const trimmedConvo = conversation.slice(-MAX_HISTORY_TURNS)
    function toGeminiContent(entry) {
      const role = entry && (entry.role === 'assistant' || entry.role === 'user') ? entry.role : null
      if (!role) return null
      const text = typeof entry.content === 'string' ? entry.content : (typeof entry.text === 'string' ? entry.text : '')
      if (!text) return null
      return { role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] }
    }
    const history = []
    for (const e of trimmedConvo) {
      const g = toGeminiContent(e)
      if (g) history.push(g)
    }

    let contextPrefix = ''
    if (userContextRaw) {
      contextPrefix = `[User notes for this message: ${userContextRaw.slice(0, MAX_USER_CONTEXT_LEN)}]\n\n`
    } else if (userId) {
      const ctx = await fetchUserRecoveryContext(userId)
      if (ctx) contextPrefix = `${ctx}\n\n`
    }
    const userTextForGemini = `${contextPrefix}${message}`

    const systemInstruction = { role: 'system', parts: [{ text: NOVA_SYSTEM_INSTRUCTION }] }
    const buildContents = () => ([
      ...history,
      { role: 'user', parts: [{ text: userTextForGemini }] },
    ])

    // ---------- Call Gemini with timeout + backoff ----------
    const startedAt = Date.now()
    try {
      const r = await withTimeout(callGeminiWithBackoff({
        apiKey: GEMINI_API_KEY,
        primaryModel: GEMINI_MODEL,
        buildContents,
        systemInstruction,
      }), GEMINI_TIMEOUT_MS)
      const dur = Date.now() - startedAt

      if (r.ok) {
        console.log(`[NOVA] success in ${dur}ms model=${r.model} attempts=${r.attempts}`)
        return sendJson(res, 200, { success: true, message: r.text }, {
          model: r.model, attempts: r.attempts, durationMs: dur,
        })
      }

      const e = r.error || {}
      const code = e.code || 'GEMINI_API_ERROR'
      const httpStatus =
        code === 'MISSING_GEMINI_KEY' ? 500 :
        code === 'GEMINI_RATE_LIMITED' ? 429 :
        code === 'GEMINI_TIMEOUT' ? 504 :
        code === 'GEMINI_UNAVAILABLE' || code === 'GEMINI_NETWORK_ERROR' ? 502 :
        code === 'GEMINI_AUTH_ERROR' ? 500 :
        code === 'GEMINI_MODEL_NOT_FOUND' ? 500 :
        (e.httpStatus && e.httpStatus >= 400) ? e.httpStatus : 500

      const userMessage =
        code === 'MISSING_GEMINI_KEY' ? 'Nova is not configured yet. Please add GEMINI_API_KEY on Vercel.' :
        code === 'GEMINI_AUTH_ERROR' ? 'Nova is temporarily unavailable. Please try again later.' :
        code === 'GEMINI_MODEL_NOT_FOUND' ? 'Nova AI model is unavailable right now.' :
        code === 'GEMINI_RATE_LIMITED' ? 'Nova is receiving too many requests right now. Please try again in a moment.' :
        code === 'GEMINI_TIMEOUT' ? 'Nova is taking too long to respond. Please try again.' :
        code === 'GEMINI_UNAVAILABLE' || code === 'GEMINI_NETWORK_ERROR' ? 'Nova couldn\'t connect. Check your connection and try again.' :
        code === 'GEMINI_EMPTY_RESPONSE' ? 'Nova didn\'t return a response. Please try again.' :
        'Nova couldn\'t respond right now.'

      console.error(`[NOVA] failed after ${dur}ms code=${code} http=${httpStatus} attempts=${r.attempts} geminiCode=${e.geminiCode || ''} message=${e.message || ''}`)
      return sendJson(res, httpStatus, { success: false, error: userMessage, code }, {
        status: e.httpStatus || httpStatus,
        code,
        geminiCode: e.geminiCode || '',
        message: e.message || '',
        model: e.model || r.model || GEMINI_MODEL,
        attempts: r.attempts || 1,
        durationMs: dur,
      })
    } catch (topErr) {
      const dur = Date.now() - startedAt
      const isTimeout = topErr && topErr.code === 'TIMEOUT'
      const isNetwork = topErr && (/fetch|network|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(topErr.message || '') || topErr.type === 'system')
      const message = topErr && topErr.message ? String(topErr.message) : 'Unknown error'
      console.error(`[NOVA] top-level catch after ${dur}ms timeout=${isTimeout} network=${isNetwork} message=${message}`)
      const code = isTimeout ? 'GEMINI_TIMEOUT' : (isNetwork ? 'GEMINI_NETWORK_ERROR' : 'GEMINI_API_ERROR')
      const httpStatus = isTimeout ? 504 : (isNetwork ? 502 : 500)
      const userMessage =
        code === 'GEMINI_TIMEOUT' ? 'Nova is taking too long to respond. Please try again.' :
        code === 'GEMINI_NETWORK_ERROR' ? 'Nova couldn\'t connect. Check your connection and try again.' :
        'Nova couldn\'t respond right now.'
      return sendJson(res, httpStatus, { success: false, error: userMessage, code }, {
        status: httpStatus, code, geminiCode: '', message, model: GEMINI_MODEL, durationMs: dur,
      })
    }
  } catch (fatal) {
    const message = IS_DEV && fatal && fatal.message ? String(fatal.message) : 'Handler error'
    console.error('[NOVA] FATAL handler error:', fatal && fatal.stack ? fatal.stack : fatal)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    const body = { success: false, error: 'Nova couldn\'t respond right now.', code: 'NOVA_HANDLER_ERROR' }
    if (IS_DEV) body.debug = { status: 500, code: 'NOVA_HANDLER_ERROR', message }
    res.status(500).json(body)
  }
}
