import { useEffect, useState } from 'react'
import HeroFacets from '../components/HeroFacets'
import StoryCard from '../components/StoryCard'
import Reveal from '../components/Reveal'
import { api } from '../api/client'

export default function Home() {
  const [stories, setStories] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    api
      .getStories()
      .then((data) => {
        setStories(data.stories || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/10">
        <HeroFacets />
        <div className="container-page relative py-14 sm:py-20 md:py-28">
          {/* Right padding here keeps every line clear of HeroFacets on
              narrow screens -- below md the decoration would otherwise sit
              underneath (and, for the red eyebrow text below, behind
              same-colored red text, which is unreadable). */}
          <div className="pr-[46%] md:pr-0">
            <Reveal>
              <p className="font-stamp text-xs text-cardinal-600 tracking-wide mb-4">
                CADET WING &middot; FACULTY OF ENGINEERING
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl max-w-[16ch] sm:max-w-lg leading-[0.95]">
                What&rsquo;s building at RMC.
              </h1>
              <p className="mt-5 max-w-[26ch] sm:max-w-sm text-steel leading-relaxed">
                Competitions, labs, projects and people from the Royal Military
                College Engineering Society, written up by the cadets running them.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <Reveal className="flex items-baseline justify-between mb-2">
          <h2 className="text-2xl sm:text-3xl">Latest dispatches</h2>
        </Reveal>

        {status === 'loading' && <p className="text-steel py-10">Loading dispatches&hellip;</p>}

        {status === 'error' && (
          <p className="text-steel py-10">
            Couldn&rsquo;t reach the archive right now. Try refreshing in a moment.
          </p>
        )}

        {status === 'ready' && stories.length === 0 && (
          <p className="text-steel py-10">
            No dispatches filed yet. Members can sign in and post the first one.
          </p>
        )}

        {status === 'ready' &&
          stories.map((story, i) => <StoryCard key={story.id} story={story} index={i} />)}
      </section>
    </>
  )
}
