import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await api.forgotPassword(email)
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page py-16 max-w-sm">
      <h1 className="text-4xl mb-1">Reset your password</h1>
      <p className="text-steel mb-8">
        Enter the email on your account and we&rsquo;ll send you a link to choose a new password.
      </p>

      {message ? (
        <p className="text-ink">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          {error && <p className="text-sm text-cardinal-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cardinal-600 text-paper font-semibold py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-sm text-steel mt-6">
        <Link to="/login" className="text-cardinal-600 font-semibold">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
