import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function StoryCard({ story, index }) {
  const refNumber = String(index + 1).padStart(3, '0')
  const dateLabel = story.createdAt ? format(new Date(story.createdAt), 'd MMM yyyy') : ''

  return (
    <Link
      to={`/stories/${story.id}`}
      className="group block py-6 px-3 -mx-3 border-t border-ink/10 first:border-t-0 transition-colors hover:bg-ink/[0.025]"
    >
      <div className="flex gap-4 sm:gap-5">
        {story.coverImageURL && (
          <img
            src={story.coverImageURL}
            alt=""
            className="hidden sm:block h-24 w-24 object-cover border border-ink/10 shrink-0 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <span className="font-stamp text-[11px] text-cardinal-600 tracking-wide">
              DISPATCH NO. {refNumber}
            </span>
            {dateLabel && <span className="text-xs text-steel/70 shrink-0">{dateLabel}</span>}
          </div>

          <h3 className="text-xl sm:text-3xl leading-tight sm:leading-none group-hover:text-cardinal-600 transition-colors">
            {story.title}
          </h3>

          {story.excerpt && (
            <p className="mt-2 text-steel max-w-2xl leading-relaxed">{story.excerpt}</p>
          )}

          <p className="mt-3 text-xs text-steel/70">
            Filed by {story.authorName || 'a society member'}
          </p>
        </div>
      </div>
    </Link>
  )
}
