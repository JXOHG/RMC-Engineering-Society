import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-stamp text-cardinal-600 text-sm mb-3">404</p>
      <h1 className="text-4xl mb-4">Page not found</h1>
      <Link to="/" className="text-cardinal-600 font-semibold">
        Back to dispatches
      </Link>
    </div>
  )
}
