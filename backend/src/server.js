import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import storiesRoutes from './routes/stories.routes.js'
import teamRoutes from './routes/team.routes.js'
import eventsRoutes from './routes/events.routes.js'
import adminRoutes from './routes/admin.routes.js'
import archiveRoutes from './routes/archive.routes.js'
import { globalLimiter } from './middleware/rateLimit.js'
import { IMAGE_FILTER_ERROR_MESSAGE } from './utils/imageUpload.js'

dotenv.config()

const requiredEnvVars = [
  'JWT_SECRET',
  'SOCIETY_INVITE_CODE',
  'FIREBASE_STORAGE_BUCKET',
  // Used to build the links inside verification/password-reset emails.
  'FRONTEND_URL',
  // Outgoing mail for those same emails.
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_FROM',
]

if (!process.env.ADMIN_EMAILS) {
  console.warn(
    'Warning: ADMIN_EMAILS is not set. No account will be auto-promoted to admin — ' +
      'set it in .env to a comma-separated list of emails to bootstrap your first admin.',
  )
}
const missing = requiredEnvVars.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
  console.error('Copy .env.example to .env and fill in real values before starting the server.')
  process.exit(1)
}

const app = express()

// Only trust the X-Forwarded-For header when we're actually behind a
// reverse proxy/load balancer (Render, Railway, Nginx, etc). Without
// this, express-rate-limit and req.ip would see the proxy's IP for
// every visitor instead of each client's — meaning one user hitting a
// limit could lock out everyone else.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use(morgan('dev'))

// Baseline rate limit across the whole API; individual auth/email
// routes layer stricter limits on top (see auth.routes.js).
app.use('/api', globalLimiter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/stories', storiesRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/archive', archiveRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)

  // Friendlier messages for the two multer failure modes photo uploads
  // can hit, instead of a generic 500.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'That photo is too large (5MB max).' })
  }
  if (err.message === IMAGE_FILTER_ERROR_MESSAGE) {
    return res.status(400).json({ message: err.message })
  }

  res.status(500).json({ message: 'Something went wrong on the server.' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`RMC Engineering Society API listening on http://localhost:${PORT}`)
})
