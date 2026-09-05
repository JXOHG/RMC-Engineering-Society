import { Router } from 'express'
import {
  register,
  login,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter, emailLimiter, tokenLimiter } from '../middleware/rateLimit.js'

const router = Router()

// authLimiter: the endpoints someone would script to brute force a
// password or guess the invite code.
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', requireAuth, me)
// tokenLimiter: token-guessing endpoints (the tokens themselves are
// unguessable, this just caps the cost of anyone trying).
router.post('/verify-email', tokenLimiter, verifyEmail)
// emailLimiter: these send mail, so they're also capped to stop the
// site being used to spam someone else's inbox.
router.post('/resend-verification', emailLimiter, resendVerification)
router.post('/forgot-password', emailLimiter, forgotPassword)
router.post('/reset-password', tokenLimiter, resetPassword)

export default router
