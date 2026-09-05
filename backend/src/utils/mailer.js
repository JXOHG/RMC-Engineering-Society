import nodemailer from 'nodemailer'

let transporter = null

/**
 * Lazily creates (and caches) the SMTP transporter. Works with any
 * standard SMTP provider — Gmail (with an app password), SendGrid,
 * Mailgun, Postmark, AWS SES, or a local dev catcher like Mailhog.
 */
function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // true for port 465 (implicit TLS), false for 587/25 (STARTTLS).
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })

  return transporter
}

function frontendUrl(path) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
  return `${base}${path}`
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || '"RMC Engineering Society" <no-reply@rmc-cmr.ca>'
  await getTransporter().sendMail({ from, to, subject, html, text })
}

export async function sendVerificationEmail({ name, email, token }) {
  const link = frontendUrl(`/verify-email?token=${token}`)
  const safeName = escapeHtml(name)

  await sendMail({
    to: email,
    subject: 'Verify your email — RMC Engineering Society',
    text: `Hi ${name},

Welcome to the RMC Engineering Society site. Confirm your email address by opening this link:
${link}

This link expires in 24 hours. If you didn't create this account, you can ignore this email.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Welcome to the RMC Engineering Society site. Confirm your email address to finish creating your account:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>Or paste this link into your browser:<br>${link}</p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  })
}

export async function sendPasswordResetEmail({ name, email, token }) {
  const link = frontendUrl(`/reset-password?token=${token}`)
  const safeName = escapeHtml(name)

  await sendMail({
    to: email,
    subject: 'Reset your password — RMC Engineering Society',
    text: `Hi ${name},

Someone requested a password reset for this account. Open this link to choose a new password:
${link}

This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Someone requested a password reset for this account. Choose a new password:</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>Or paste this link into your browser:<br>${link}</p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
    `,
  })
}
