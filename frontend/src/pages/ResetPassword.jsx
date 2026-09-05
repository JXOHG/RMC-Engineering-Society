import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.resetPassword({ token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="container-page py-16 max-w-sm text-center">
        <h1 className="text-3xl mb-2">Invalid link</h1>
        <p className="text-steel mb-6">This password reset link is missing its token.</p>
        <Link to="/forgot-password" className="text-cardinal-600 font-semibold">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="container-page py-16 max-w-sm">
      <h1 className="text-4xl mb-1">Choose a new password</h1>

      {done ? (
        <p className="text-steel mt-4">Password updated. Taking you to sign in&hellip;</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">New password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Confirm password</span>
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          {error && <p className="text-sm text-cardinal-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cardinal-600 text-paper font-semibold py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </div>
  )
}
