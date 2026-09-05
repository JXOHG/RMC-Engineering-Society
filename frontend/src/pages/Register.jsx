import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const { confirmPassword, ...payload } = form
      await register(payload)
      setSubmittedEmail(form.email)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedEmail) {
    return (
      <div className="container-page py-16 max-w-sm text-center">
        <h1 className="text-4xl mb-4">Check your email</h1>
        <p className="text-steel">
          We sent a verification link to <strong>{submittedEmail}</strong>. Click it to activate
          your account, then sign in.
        </p>
        <p className="text-sm text-steel mt-6">
          <Link to="/login" className="text-cardinal-600 font-semibold">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container-page py-16 max-w-sm">
      <h1 className="text-4xl mb-1">Join as a member</h1>
      <p className="text-steel mb-8">
        Ask the executive for the society invite code before signing up. You'll need an{' '}
        <strong>@rmc-cmr.ca</strong> email address.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Full name" name="name" value={form.name} onChange={handleChange} />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@rmc-cmr.ca"
          pattern="^[^\s@]+@rmc-cmr\.ca$"
          title="Must be an @rmc-cmr.ca email address"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
        />
        <Field
          label="Society invite code"
          name="inviteCode"
          value={form.inviteCode}
          onChange={handleChange}
        />

        {error && <p className="text-sm text-cardinal-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cardinal-600 text-paper font-semibold py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-steel mt-6">
        Already a member?{' '}
        <Link to="/login" className="text-cardinal-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder, pattern, title }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      <input
        required
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        pattern={pattern}
        title={title}
        className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
      />
    </label>
  )
}