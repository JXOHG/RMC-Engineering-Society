import jwt from 'jsonwebtoken'

/**
 * Reads "Authorization: Bearer <token>", verifies it, and attaches
 * { uid, name, email } to req.user. Rejects with 401 if missing/invalid.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Sign in to continue.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}
