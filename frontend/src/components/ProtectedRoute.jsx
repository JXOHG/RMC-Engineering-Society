import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="container-page py-24 text-center text-steel">Loading&hellip;</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
