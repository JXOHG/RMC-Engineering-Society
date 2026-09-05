import rateLimit from 'express-rate-limit'

// Same JSON error shape as the rest of the API, instead of
// express-rate-limit's plain-text default.
function limitHandler(_req, res) {
  res.status(429).json({ message: 'Too many requests. Please wait a bit and try again.' })
}

// Baseline defense against scripted abuse and accidental hammering
// (e.g. a runaway frontend retry loop). Generous on purpose — this is
// just a backstop, not the main defense for any one endpoint.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
})

// Login and register: the two endpoints someone would script to brute
// force a password or guess the society invite code.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
})

// Forgot-password / resend-verification: both send an email, so beyond
// brute-force concerns this also stops the site being used to spam
// someone else's inbox.
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
})

// Verify-email / reset-password: guessing a 32-byte random token is
// already infeasible, but this caps the cost of anyone trying anyway.
export const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
})
