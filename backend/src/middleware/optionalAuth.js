import jwt from 'jsonwebtoken'

/**
 * Like requireAuth, but a missing/invalid token just means req.user
 * stays undefined instead of the request being rejected. Used on
 * public routes that behave slightly differently for a signed-in author
 * (e.g. letting an author preview their own unpublished dispatch).
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      // Ignore invalid/expired tokens on optional routes.
    }
  }

  next()
}
