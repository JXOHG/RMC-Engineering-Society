import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="container-page py-24 text-center text-steel">Loading&hellip;</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
