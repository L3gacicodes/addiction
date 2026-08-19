// api/ai-response.js (LEGACY BACKWARDS-COMPATIBLE ALIAS)
//
// Canonical Nova endpoint: POST /api/nova  (see api/nova.js)
//
// This file is an alias for old/external clients that still call POST /api/ai-response.
// Frontend code (src/lib/nova.js / AITherapistPage / Modals.jsx AIChatModal) never
// calls this. It is preserved solely for backwards compatibility.
//
// Why not delete? -> Any cached old clients / external integrations could still POST
// /api/ai-response would break if we 404'd this.
//
// Design: directly import & invoke nova.js handler, intercept its json output (no monkey-patching
// real Vercel res object — that caused double-send errors), then add the legacy
// `reply` field for clients that still expect it.
import novaHandler from './nova.js'

/**
 * Capture everything api/nova.js writes json output safely, capture-write) → write to the real Vercel res
 * after adding the legacy reply field to keep compatibility.
 *
 * @param {import('http').IncomingMessage} req Vercel req
 * @param {{status:function,json:function,setHeader:function} res real Vercel res
 */
export default async function handler(req, res) {
  let capturedStatus = 200
  let capturedBody = null
  let headers = {}
  // Fake capture "fakefake capture everything api/nova.js makes against a plain
  const fakeRes = {
    status(code) { capturedStatus = code; return fakeRes },
    setHeader(k, v) { headers[k.toLowerCase()] = v; return fakeRes },
    getHeader(k) { return headers[k.toLowerCase()] },
    json(payload) { capturedBody = payload; return fakeRes },
  }
  try {
    // 1. Run against api/nova.js → capture output
    await novaHandler(req, fakeRes)

    if (!capturedBody || typeof capturedBody !== 'object') {
      // Should not happen; nova handler always produces JSON via res.status().json()
      const code = capturedStatus || 500
      return res.status(code).json({
        success: false,
        error: 'Nova handler produced no output.',
        code: 'NOVA_HANDLER_ERROR',
        reply: "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you.",
      })
    }

    // 2. Ensure backwards-compat: legacy old clients expect `reply` field
    if (capturedBody.success === true && typeof capturedBody.message === 'string') {
      capturedBody.reply = capturedBody.message
    } else if (typeof capturedBody.error === 'string') {
      capturedBody.reply = capturedBody.reply ||
        "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you."
    }

    // 3. Set status (all captured headers write → real
    Object.keys(headers).forEach(k => res.setHeader(k, headers[k]))
    res.status(capturedStatus).json(capturedBody)
  } catch (err) {
    console.error('[ai-response] forwarder error:', err && err.stack ? err.stack : String(err))
    res.status(500).json({
      success: false, error: 'Internal Server Error', code: 'NOVA_HANDLER_ERROR',
      reply: "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you.",
    })
  }
}
