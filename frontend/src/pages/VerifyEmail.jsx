import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }

    api
      .verifyEmail(token)
      .then((data) => {
        setSession(data.token, data.user)
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 1500)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
    // Only ever needs to run once, against the token in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="container-page py-16 max-w-sm text-center">
      {status === 'verifying' && <p className="text-steel">Verifying your email&hellip;</p>}

      {status === 'success' && (
        <>
          <h1 className="text-3xl mb-2">Email verified!</h1>
          <p className="text-steel">Taking you to your dashboard&hellip;</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-3xl mb-2">Couldn&rsquo;t verify that link</h1>
          <p className="text-cardinal-600 mb-6">{message}</p>
          <Link to="/login" className="text-cardinal-600 font-semibold">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  )
}
