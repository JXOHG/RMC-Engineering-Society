import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import Reveal from '../components/Reveal'
import HeroFacets from '../components/HeroFacets'

const emptyForm = { name: '', location: '', time: '' }

// Formats an ISO string into the "YYYY-MM-DDTHH:mm" shape a
// datetime-local input expects, in the browser's local time.
function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function formatEventTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Events() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  function loadEvents() {
    setStatus('loading')
    api
      .getEvents()
      .then((data) => {
        setEvents(data.events || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  function startEdit(event) {
    setEditingId(event.id)
    setForm({ name: event.name, location: event.location, time: toDatetimeLocal(event.time) })
    setPhotoFile(null)
    setPreview(event.photoURL || null)
    setFormError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPreview(null)
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('location', form.location)
    formData.append('time', form.time)
    if (photoFile) formData.append('photo', photoFile)

    setSaving(true)
    try {
      if (editingId) {
        await api.updateEvent(editingId, formData)
      } else {
        await api.createEvent(formData)
      }
      cancelEdit()
      loadEvents()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this event?')) return
    await api.deleteEvent(id)
    setEvents((list) => list.filter((e) => e.id !== id))
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/10">
        <HeroFacets />
        <div className="container-page relative py-10 sm:py-14">
          {/* Right padding here keeps the heading clear of HeroFacets on
              narrow screens, same as the homepage hero. */}
          <div className="pr-[46%] md:pr-0">
            <h1 className="text-4xl mb-2">Events</h1>
            <p className="text-steel">Upcoming events from the RMC Engineering Society.</p>
          </div>
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">
      {/* Only admins ever see the add/edit form — everyone else just
          gets the read-only list below. The server enforces this too
          (requireAuth + requireAdmin on write routes), so this is a
          convenience for admins, not the actual access control. */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md mb-12 border border-ink/10 p-6">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit event' : 'Add event'}</h2>

          <div className="flex gap-5 items-start">
            {preview && (
              <img src={preview} alt="" className="h-20 w-20 object-cover border border-ink/10 shrink-0" />
            )}
            <label className="block flex-1">
              <span className="block text-sm font-semibold text-ink mb-1.5">
                Photo <span className="font-normal text-steel">(optional)</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                className="w-full text-sm text-steel file:mr-3 file:border-0 file:bg-cardinal-600 file:text-paper file:px-3 file:py-2 file:text-sm file:font-semibold file:cursor-pointer"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Event name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Location</span>
            <input
              required
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Date &amp; time</span>
            <input
              required
              type="datetime-local"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          {formError && <p className="text-sm text-cardinal-600">{formError}</p>}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-cardinal-600 text-paper text-sm font-semibold px-5 py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add event'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {status === 'loading' && <p className="text-steel py-10">Loading events&hellip;</p>}
      {status === 'error' && <p className="text-steel py-10">Couldn&rsquo;t load events right now.</p>}
      {status === 'ready' && events.length === 0 && (
        <p className="text-steel py-10">No events have been posted yet.</p>
      )}

      {status === 'ready' && events.length > 0 && (
        <div>
          {events.map((event, i) => (
            <Reveal
              key={event.id}
              as="div"
              delay={Math.min(i, 8) * 50}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 border-t border-ink/10 first:border-t-0"
            >
              <div className="flex items-center gap-4 min-w-0">
                {event.photoURL && (
                  <img
                    src={event.photoURL}
                    alt=""
                    className="h-16 w-16 object-cover border border-ink/10 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-display font-bold text-lg text-ink leading-tight">{event.name}</p>
                  <p className="text-sm text-steel">{formatEventTime(event.time)}</p>
                  <p className="text-sm text-steel">{event.location}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <button
                    onClick={() => startEdit(event)}
                    className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </Reveal>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
