import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

// Members only ever have @rmc-cmr.ca accounts (see Register), so on sign in
// we quietly fill in the domain for anyone who just types their username.
const EMAIL_DOMAIN = '@rmc-cmr.ca'

function withRmcDomain(value) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (trimmed.toLowerCase().endsWith(EMAIL_DOMAIN)) return trimmed
  const localPart = trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed
  return `${localPart}${EMAIL_DOMAIN}`
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Fill in the domain as soon as the user leaves the field, so they can
  // see what will actually be submitted before they hit sign in.
  function handleEmailBlur() {
    setForm((f) => ({ ...f, email: withRmcDomain(f.email) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResendMessage('')
    setNeedsVerification(false)
    setSubmitting(true)
    const email = withRmcDomain(form.email)
    setForm((f) => ({ ...f, email }))
    try {
      await login({ ...form, email })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setNeedsVerification(err.code === 'EMAIL_NOT_VERIFIED')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResendMessage('')
    try {
      const data = await api.resendVerification(form.email)
      setResendMessage(data.message)
    } catch (err) {
      setResendMessage(err.message)
    }
  }

  return (
    <div className="container-page py-16 max-w-sm">
      <h1 className="text-4xl mb-1">Member sign in</h1>
      <p className="text-steel mb-8">Sign in to file or edit a dispatch.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleEmailBlur}
          placeholder="you@rmc-cmr.ca"
        />
        <div>
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <Link to="/forgot-password" className="inline-block text-sm text-cardinal-600 font-semibold mt-2">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-cardinal-600">{error}</p>}
        {needsVerification && (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-cardinal-600 font-semibold underline"
          >
            Resend verification email
          </button>
        )}
        {resendMessage && <p className="text-sm text-steel">{resendMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cardinal-600 text-paper font-semibold py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-steel mt-6">
        New to the society?{' '}
        <Link to="/register" className="text-cardinal-600 font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  inputMode,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      <input
        required
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
      />
    </label>
  )
}
