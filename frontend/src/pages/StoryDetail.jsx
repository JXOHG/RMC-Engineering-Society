import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { api } from '../api/client'

export default function StoryDetail() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    setStatus('loading')
    api
      .getStory(id)
      .then((data) => {
        setStory(data.story)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [id])

  if (status === 'loading') {
    return <div className="container-page py-20 text-steel">Loading&hellip;</div>
  }

  if (status === 'error' || !story) {
    return (
      <div className="container-page py-20">
        <p className="text-steel mb-4">
          That dispatch couldn&rsquo;t be found. It may have been removed.
        </p>
        <Link to="/" className="text-cardinal-600 font-semibold">
          Back to all dispatches
        </Link>
      </div>
    )
  }

  return (
    <article className="container-page py-14 max-w-2xl">
      <Link to="/" className="text-sm text-steel hover:text-cardinal-600 transition-colors">
        &larr; All dispatches
      </Link>

      {story.coverImageURL && (
        <img
          src={story.coverImageURL}
          alt=""
          className="w-full aspect-[16/9] object-cover border border-ink/10 mt-8"
        />
      )}

      <p className="font-stamp text-xs text-cardinal-600 tracking-wide mt-8 mb-3">
        {story.createdAt ? format(new Date(story.createdAt), 'd MMMM yyyy') : ''}
      </p>

      <h1 className="text-4xl sm:text-5xl leading-[1.05] mb-4">{story.title}</h1>

      <p className="text-sm text-steel mb-10">Filed by {story.authorName || 'a society member'}</p>

      <div className="prose-story whitespace-pre-wrap leading-relaxed text-ink">
        {story.content}
      </div>
    </article>
  )
}
