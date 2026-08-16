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
  GEMINI_RATE_LIMITED: 'Nova is getting a lot of requests right now. Give it a moment and try again.',
  GEMINI_UNAVAILABLE: 'Nova is currently unavailable. Please try again in a minute.',
  GEMINI_API_ERROR: 'Nova couldn\'t respond right now.',
  GEMINI_EMPTY_RESPONSE: 'Nova didn\'t return a response. Please try again.',
  GEMINI_TIMEOUT: 'Nova is taking too long to respond. Please try again.',
  GEMINI_NETWORK_ERROR: 'Nova is offline right now. Check your connection and try again.',
  AUTH_REQUIRED: 'You need to be signed in to talk to Nova.',
}

export function errorMessageFromCode(code, fallback = 'Unable to contact Nova right now.') {
  if (code && SAFE_ERROR_BY_CODE[code]) return SAFE_ERROR_BY_CODE[code]
  return fallback
}

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
 * @returns {Promise<{ok: boolean, message?: string, code?: string, error?: string, status?: number}>}
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

    let data = null
    try { data = await resp.json() } catch (_) { /* ignore */ }

    if (resp.ok && data && data.success) {
      return { ok: true, message: String(data.message || '').trim() || '...', status: resp.status }
    }

    const code = data?.code || (resp.status === 429 ? 'GEMINI_RATE_LIMITED' : (resp.status === 401 ? 'AUTH_REQUIRED' : 'GEMINI_API_ERROR'))
    return {
      ok: false,
      code,
      status: resp.status,
      error: data?.error || errorMessageFromCode(code),
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, code: 'GEMINI_TIMEOUT', error: errorMessageFromCode('GEMINI_TIMEOUT') }
    }
    return { ok: false, code: 'GEMINI_NETWORK_ERROR', error: errorMessageFromCode('GEMINI_NETWORK_ERROR') }
  }
}
