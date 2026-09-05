import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { db, FieldValue } from '../config/firebase.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer.js'

const users = db.collection('users')

// Only accounts with this email domain may register. RMC and CMR share
// this one bilingual domain.
const ALLOWED_EMAIL_DOMAIN = 'rmc-cmr.ca'
const EMAIL_PATTERN = new RegExp(`^[^\\s@]+@${ALLOWED_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i')

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

// Comma-separated emails in .env that should always hold admin access,
// e.g. ADMIN_EMAILS=chair@rmc.ca,vicechair@rmc.ca — this is how the very
// first admin gets created, before anyone can promote anyone from the UI.
function isBootstrapAdmin(email) {
  const bootstrapAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return bootstrapAdmins.includes(email)
}

function isAllowedEmail(email) {
  return EMAIL_PATTERN.test(email)
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Only the hash is stored, the same way we store a password hash — so a
// database read/leak can't be used to mint valid verification/reset links.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function signToken(user) {
  return jwt.sign(
    { uid: user.uid, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  )
}

function publicUser(uid, data) {
  return {
    uid,
    name: data.name,
    email: data.email,
    role: data.role || 'member',
    emailVerified: !!data.emailVerified,
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, inviteCode } = req.body

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'All fields, including the invite code, are required.' })
    }

    if (inviteCode !== process.env.SOCIETY_INVITE_CODE) {
      return res.status(403).json({ message: 'That invite code is not valid.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!isAllowedEmail(normalizedEmail)) {
      return res
        .status(400)
        .json({ message: `You must sign up with an @${ALLOWED_EMAIL_DOMAIN} email address.` })
    }

    const existing = await users.where('email', '==', normalizedEmail).limit(1).get()

    if (!existing.empty) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const role = isBootstrapAdmin(normalizedEmail) ? 'admin' : 'member'
    const trimmedName = name.trim()

    const verificationToken = generateToken()

    await users.add({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role,
      emailVerified: false,
      verificationTokenHash: hashToken(verificationToken),
      verificationTokenExpires: Date.now() + VERIFICATION_TOKEN_TTL_MS,
      createdAt: FieldValue.serverTimestamp(),
    })

    try {
      await sendVerificationEmail({ name: trimmedName, email: normalizedEmail, token: verificationToken })
    } catch (mailErr) {
      // The account was already created — don't fail the request just
      // because the email didn't go out. They can use "resend
      // verification email" on the sign-in page to try again.
      console.error('sendVerificationEmail error:', mailErr)
    }

    res.status(201).json({
      message: `Account created! We sent a verification link to ${normalizedEmail} — click it before signing in.`,
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ message: 'Could not create your account right now.' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const snapshot = await users.where('email', '==', normalizedEmail).limit(1).get()

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    const valid = await bcrypt.compare(password, data.passwordHash)

    if (!valid) {
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }

    if (!data.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in. Check your inbox, or request a new link.',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    // Auto-promote on login if this email is on the bootstrap admin list
    // and Firestore doesn't already reflect that.
    let role = data.role || 'member'
    if (isBootstrapAdmin(normalizedEmail) && role !== 'admin') {
      role = 'admin'
      await doc.ref.update({ role })
    }

    const user = publicUser(doc.id, { ...data, role })
    const token = signToken(user)

    res.json({ token, user })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ message: 'Could not sign you in right now.' })
  }
}

export async function me(req, res) {
  try {
    const doc = await users.doc(req.user.uid).get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'Account not found.' })
    }

    res.json({ user: publicUser(doc.id, doc.data()) })
  } catch (err) {
    console.error('me error:', err)
    res.status(500).json({ message: 'Could not load your account right now.' })
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' })
    }

    const snapshot = await users.where('verificationTokenHash', '==', hashToken(token)).limit(1).get()

    if (snapshot.empty) {
      return res.status(400).json({ message: 'That verification link is invalid or has already been used.' })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    if (!data.verificationTokenExpires || data.verificationTokenExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: 'That verification link has expired. Request a new one from the sign-in page.' })
    }

    await doc.ref.update({
      emailVerified: true,
      verificationTokenHash: FieldValue.delete(),
      verificationTokenExpires: FieldValue.delete(),
    })

    // Log them straight in now that they're verified.
    const user = publicUser(doc.id, { ...data, emailVerified: true })
    const jwtToken = signToken(user)

    res.json({ token: jwtToken, user })
  } catch (err) {
    console.error('verifyEmail error:', err)
    res.status(500).json({ message: 'Could not verify your email right now.' })
  }
}

export async function resendVerification(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Always send back the same response whether or not the account
    // exists or is already verified, so this endpoint can't be used to
    // find out which emails have accounts.
    const genericResponse = { message: 'If that account needs verifying, a new link is on its way.' }

    const snapshot = await users.where('email', '==', normalizedEmail).limit(1).get()

    if (snapshot.empty) {
      return res.json(genericResponse)
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    if (data.emailVerified) {
      return res.json(genericResponse)
    }

    const verificationToken = generateToken()

    await doc.ref.update({
      verificationTokenHash: hashToken(verificationToken),
      verificationTokenExpires: Date.now() + VERIFICATION_TOKEN_TTL_MS,
    })

    try {
      await sendVerificationEmail({ name: data.name, email: normalizedEmail, token: verificationToken })
    } catch (mailErr) {
      console.error('sendVerificationEmail (resend) error:', mailErr)
    }

    res.json(genericResponse)
  } catch (err) {
    console.error('resendVerification error:', err)
    res.status(500).json({ message: 'Could not resend the verification email right now.' })
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Same email either way — don't reveal whether an account exists.
    const genericResponse = {
      message: 'If that email has an account, a password reset link is on its way.',
    }

    const snapshot = await users.where('email', '==', normalizedEmail).limit(1).get()

    if (snapshot.empty) {
      return res.json(genericResponse)
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    const resetToken = generateToken()

    await doc.ref.update({
      resetTokenHash: hashToken(resetToken),
      resetTokenExpires: Date.now() + RESET_TOKEN_TTL_MS,
    })

    try {
      await sendPasswordResetEmail({ name: data.name, email: normalizedEmail, token: resetToken })
    } catch (mailErr) {
      console.error('sendPasswordResetEmail error:', mailErr)
    }

    res.json(genericResponse)
  } catch (err) {
    console.error('forgotPassword error:', err)
    res.status(500).json({ message: 'Could not process that request right now.' })
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const snapshot = await users.where('resetTokenHash', '==', hashToken(token)).limit(1).get()

    if (snapshot.empty) {
      return res.status(400).json({ message: 'That reset link is invalid or has already been used.' })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    if (!data.resetTokenExpires || data.resetTokenExpires < Date.now()) {
      return res.status(400).json({ message: 'That reset link has expired. Request a new one.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await doc.ref.update({
      passwordHash,
      resetTokenHash: FieldValue.delete(),
      resetTokenExpires: FieldValue.delete(),
    })

    res.json({ message: 'Your password has been reset. You can sign in now.' })
  } catch (err) {
    console.error('resetPassword error:', err)
    res.status(500).json({ message: 'Could not reset your password right now.' })
  }
}
