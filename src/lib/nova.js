// lib/nova.js
// Shared Nova AI frontend integration.
// POSTs to /api/nova with proper conversation format, auth, and error codes.

export const NOVA_ENDPOINT = '/api/nova'

export const NOVA_QUICK_ACTIONS = [
  { key: 'craving', label: "I'm having a craving", emoji: '🔥' },
  { key: 'relapse', label: 'I relapsed', emoji: '💔' },
  { key: 'lonely', label: 'I feel lonely', emoji: '🫂' },
  { key: 'stressed', label: "I'm stressed", emoji: '😮‍💨' },
  { key: 'bored', label: "I'm bored", emoji: '😴' },
  { key: 'giving_up', label: 'I feel like giving up', emoji: '🌧️' },
  { key: 'distract', label: 'I need a distraction', emoji: '🎧' },
  { key: 'trigger', label: 'Help me understand my trigger', emoji: '🧭' },
]

// user-friendly error mapping
const SAFE_ERROR_BY_CODE = {
  METHOD_NOT_ALLOWED: 'Nova couldn\'t accept the request.',
  BAD_REQUEST: 'The message was empty. Please try again.',
  MISSING_MESSAGE: 'Type something so Nova can respond.',
  MISSING_GEMINI_KEY: 'Nova is not configured yet. Please add GEMINI_API_KEY on Vercel.',
  GEMINI_AUTH_ERROR: 'Nova credentials are invalid. Contact support.',
  GEMINI_MODEL_NOT_FOUND: 'Nova AI model is unavailable right now.',
  GEMINI_RATE_LIMITED: 'Nova is receiving too many requests right now. Please try again in a moment.',
  GEMINI_UNAVAILABLE: 'Nova is offline right now. Check your connection and try again.',
  GEMINI_API_ERROR: 'Nova couldn\'t respond right now.',
  GEMINI_EMPTY_RESPONSE: 'Nova didn\'t return a response. Please try again.',
  GEMINI_TIMEOUT: 'Nova is taking too long to respond. Please try again.',
  GEMINI_NETWORK_ERROR: 'Nova couldn\'t connect. Check your connection and try again.',
  AUTH_REQUIRED: 'You need to be signed in to talk to Nova.',
  NOT_FOUND: 'Nova endpoint not found.',
  NOVA_ENDPOINT_MISSING: 'The Nova backend is not running locally. Start it with: vercel dev',
}

export function errorMessageFromCode(code, fallback = 'Unable to contact Nova right now.') {
  if (code && SAFE_ERROR_BY_CODE[code]) return SAFE_ERROR_BY_CODE[code]
  return fallback
}

// Dev-only: always TRUE locally (Vite process.env.NODE_ENV = 'development');
// also true if user has Vercel Preview deploy (not Production).
const IS_DEV =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production')

function toPayload({ messages, latestMessage, userToken }) {
  // messages is array of { role: 'user'|'assistant', text: string } (or .content)
  const conversation = []
  for (const m of messages || []) {
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const content = typeof m.content === 'string' ? m.content : m.text
    if (!content) continue
    conversation.push({ role, content })
  }
  return {
    message: latestMessage,
    conversation,
  }
}

/**
 * Send a message to Nova and return parsed JSON.
 *
 * @param {Object} opts
 * @param {Array} opts.messages - current conversation history (excluding the new user message)
 * @param {string} opts.userMessage - new user message text
 * @param {string|null} [opts.userToken] - Supabase access token to forward in Authorization header
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ok: boolean, message?: string, code?: string, error?: string, status?: number, debug?: object}>}
 */
export async function sendNovaMessage({ messages, userMessage, userToken, signal }) {
  const message = typeof userMessage === 'string' ? userMessage.trim() : ''
  if (!message) {
    return { ok: false, code: 'MISSING_MESSAGE', error: errorMessageFromCode('MISSING_MESSAGE') }
  }

  const headers = { 'Content-Type': 'application/json' }
  if (userToken) headers['Authorization'] = `Bearer ${userToken}`

  const body = toPayload({ messages, latestMessage: message })

  try {
    const resp = await fetch(NOVA_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: signal || undefined,
    })

    const contentType = resp.headers && resp.headers.get ? (resp.headers.get('content-type') || '') : ''
    const isHtml = /text\/html/i.test(contentType)

    let data = null
    try { data = await resp.json() } catch (_) { /* ignore */ }

    // Special detection: plain `npm run dev` (Vite alone) cannot run Vercel serverless
    // functions. Vite SPA fallback returns index.html (200 OK) for unknown routes.
    // Surface this clearly instead of the generic "Gemini API error".
    if (resp.status === 200 && isHtml) {
      return {
        ok: false,
        code: 'NOVA_ENDPOINT_MISSING',
        status: 200,
        error: errorMessageFromCode('NOVA_ENDPOINT_MISSING'),
        debug: IS_DEV ? {
          status: 200,
          code: 'NOVA_ENDPOINT_MISSING',
          geminiCode: '',
          message: 'Backend returned HTML (Vite SPA fallback) instead of JSON. /api/nova is not handled by Vite — run `vercel dev`.',
          model: 'N/A',
        } : undefined,
      }
    }

    if (resp.ok && data && data.success) {
      return {
        ok: true,
        message: String(data.message || '').trim() || '...',
        status: resp.status,
        debug: IS_DEV ? (data.debug || undefined) : undefined,
      }
    }

    // Prefer the explicit code from the backend over any inference.
    const backendCode = data && data.code ? String(data.code) : null
    const status = resp.status

    let code = backendCode
    if (!code) {
      if (status === 405) code = 'METHOD_NOT_ALLOWED'
      else if (status === 400) code = 'BAD_REQUEST'
      else if (status === 401) code = 'AUTH_REQUIRED'
      else if (status === 404) code = 'NOT_FOUND'
      else if (status === 429) code = 'GEMINI_RATE_LIMITED'
      else if (status === 502) code = 'GEMINI_UNAVAILABLE'
      else if (status === 504) code = 'GEMINI_TIMEOUT'
      else code = 'GEMINI_API_ERROR'
    }

    return {
      ok: false,
      code,
      status,
      error: (data && typeof data.error === 'string') ? data.error : errorMessageFromCode(code),
      // IMPORTANT: only forward debug in DEV (backend already gates it, but be safe here too)
      debug: IS_DEV ? (data && data.debug ? data.debug : undefined) : undefined,
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, code: 'GEMINI_TIMEOUT', error: errorMessageFromCode('GEMINI_TIMEOUT') }
    }
    return { ok: false, code: 'GEMINI_NETWORK_ERROR', error: errorMessageFromCode('GEMINI_NETWORK_ERROR') }
  }
}

// Diagnostic helper (dev-only): returns information about Nova configuration
// NEVER exposes API keys. Always safe: only reports existence + actual error details
// from backend without leaking secrets.
export async function diagnoseNova({ userToken } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (userToken) headers['Authorization'] = `Bearer ${userToken}`
  try {
    // Note: Vercel auto-dispatches api/nova.js for the exact path /api/nova.
    // There is no api/nova/diagnose.js file, so calling /api/nova/diagnose would
    // fall through to the SPA catch-all (GET returns HTML, POST returns 405).
    // Instead, the handler inside api/nova.js accepts diagnose as a body field:
    // POST /api/nova with body = { diagnose: true }
    const resp = await fetch(NOVA_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ diagnose: true }),
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => null)
      return { ok: false, status: resp.status, code: data?.code, error: data?.error }
    }
    const data = await resp.json()
    return { ok: true, status: resp.status, data }
  } catch (err) {
    return { ok: false, code: 'GEMINI_NETWORK_ERROR', error: String(err && err.message || err) }
  }
}
