import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rmc_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('rmc_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const data = await api.login(credentials)
    localStorage.setItem('rmc_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    // No token comes back here — the account exists but isn't signed in
    // yet, since the email still needs to be verified.
    return api.register(payload)
  }

  // Used by the verify-email page: the server returns a token/user pair
  // once the email is confirmed, so this signs the user straight in
  // without going through login().
  function setSession(token, sessionUser) {
    localStorage.setItem('rmc_token', token)
    setUser(sessionUser)
  }

  function logout() {
    localStorage.removeItem('rmc_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
