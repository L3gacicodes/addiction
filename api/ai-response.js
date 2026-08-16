// api/ai-response.js (LEGACY BACKWARDS-COMPATIBLE ALIAS)
//
// This endpoint is OBSOLETE. The canonical Nova endpoint is POST /api/nova
// (implemented in api/nova.js). No frontend code calls this file anymore.
//
// Rationale for keeping this file (not deleting it):
//   • Legacy/beta deployments may still have cached clients or external scripts
//     that call POST /api/ai-response with { message }.
//   • Deleting it outright would break those cached clients with HTTP 404.
//   • Consolidating it to re-use api/nova.js means we never again maintain two
//     competing Nova implementations with different models, different keys, or
//     different error-handling behavior.
//
// Behavior:
//   • Passes the request through unchanged to the canonical nova.js handler.
//   • On success: returns nova's `{ success:true, message, code }` AND ALSO
//     includes legacy field `reply: message` for old code that reads it.
//   • On error: returns nova's `{ success:false, error, code }` AND ALSO
//     includes legacy field `reply: <fallback string>` for old code.
import novaHandler from './nova.js'

function _interopCompat(body) {
  // Accept old legacy { message: string } payload format. If it also has
  // conversation/userContext, nova.js already understands those.
  return body
}

export default async function handler(req, res) {
  const originalWrite = { json: res.json.bind(res), status: res.status.bind(res) }
  let intercepted = null
  res.json = (payload) => { intercepted = payload; return res }
  res.status = (code) => { intercepted = { ...intercepted, _status: code }; return originalWrite.status(code) }

  try {
    if (req.body && typeof req.body === 'object') req.body = _interopCompat(req.body)
    await novaHandler(req, res)

    // If interception never fired (e.g. new api/nova.js is still using native
    // res.status().json() chain in order that our proxies aren't triggered),
    // return directly — nothing else for us to do.
    if (intercepted && typeof intercepted === 'object') {
      if (intercepted.success === true && typeof intercepted.message === 'string') {
        intercepted.reply = intercepted.message
      } else if (typeof intercepted.error === 'string') {
        intercepted.reply = intercepted.reply ||
          "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you."
      }
      // Strip our internal _status marker before sending
      delete intercepted._status
    }
  } catch (err) {
    console.error('[ai-response] forwarding error:', err && err.stack ? err.stack : err)
    if (!intercepted || !intercepted.success) {
      intercepted = {
        success: false,
        error: 'Internal Server Error',
        code: 'NOVA_HANDLER_ERROR',
        reply: "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you.",
      }
      originalWrite.status(500)
    }
  } finally {
    // Ensure reply always written as JSON. Re-attach res.json for the final send.
    res.json = originalWrite.json
    if (intercepted !== null) {
      res.status = originalWrite.status
      return res.json(intercepted)
    }
  }
}
