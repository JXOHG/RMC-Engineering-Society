import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    loadStories()
  }, [])

  function loadStories() {
    setStatus('loading')
    api
      .getMyStories()
      .then((data) => {
        setStories(data.stories || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this dispatch? This cannot be undone.')) return
    await api.deleteStory(id)
    setStories((s) => s.filter((story) => story.id !== id))
  }

  return (
    <div className="container-page py-14">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl">My dashboard</h1>
          <p className="text-steel mt-1">Signed in as {user?.name}</p>
        </div>
        <Link
          to="/dashboard/new"
          className="bg-cardinal-600 text-paper text-sm font-semibold px-4 py-2.5 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          File a new dispatch
        </Link>
      </div>

      <div className="mt-8">
        {status === 'loading' && <p className="text-steel py-10">Loading your dispatches&hellip;</p>}

        {status === 'error' && (
          <p className="text-steel py-10">Couldn&rsquo;t load your dispatches right now.</p>
        )}

        {status === 'ready' && stories.length === 0 && (
          <p className="text-steel py-10">
            You haven&rsquo;t filed anything yet. Start with your first dispatch above.
          </p>
        )}

        {status === 'ready' &&
          stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 border-t border-ink/10 first:border-t-0"
            >
              <div className="min-w-0">
                <p className="text-xl truncate">{story.title}</p>
                <p className="text-xs text-steel/70 mt-1">
                  {story.published ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <Link
                  to={`/dashboard/edit/${story.id}`}
                  className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(story.id)}
                  className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
