import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

const emptyForm = { name: '', title: '' }

// Shown whenever a team member has no uploaded photo -- adding one is
// optional, so this fills the gap instead of a broken image.
const PHOTO_PLACEHOLDER = '/team-photo-placeholder.svg'

export default function AdminPanel() {
  const { user } = useAuth()

  // --- Team page management ---
  const [team, setTeam] = useState([])
  const [teamStatus, setTeamStatus] = useState('loading')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [teamError, setTeamError] = useState('')

  // --- Admin access management ---
  const [members, setMembers] = useState([])
  const [membersStatus, setMembersStatus] = useState('loading')
  const [membersError, setMembersError] = useState('')
  const [busyUid, setBusyUid] = useState(null)

  useEffect(() => {
    loadTeam()
    loadMembers()
  }, [])

  function loadTeam() {
    setTeamStatus('loading')
    api
      .getTeam()
      .then((data) => {
        setTeam(data.team || [])
        setTeamStatus('ready')
      })
      .catch(() => setTeamStatus('error'))
  }

  function loadMembers() {
    setMembersStatus('loading')
    api
      .getMembers()
      .then((data) => {
        setMembers(data.members || [])
        setMembersStatus('ready')
      })
      .catch(() => setMembersStatus('error'))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  function startEdit(member) {
    setEditingId(member.id)
    setForm({ name: member.name, title: member.title })
    setPhotoFile(null)
    setPreview(member.photoURL)
    setTeamError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPreview(null)
    setTeamError('')
  }

  async function handleTeamSubmit(e) {
    e.preventDefault()
    setTeamError('')

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('title', form.title)
    if (photoFile) formData.append('photo', photoFile)

    setSaving(true)
    try {
      if (editingId) {
        await api.updateTeamMember(editingId, formData)
      } else {
        await api.createTeamMember(formData)
      }
      cancelEdit()
      loadTeam()
    } catch (err) {
      setTeamError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this team member from the page?')) return
    await api.deleteTeamMember(id)
    setTeam((t) => t.filter((m) => m.id !== id))
  }

  async function handlePromote(uid) {
    setMembersError('')
    setBusyUid(uid)
    try {
      const data = await api.promoteMember(uid)
      setMembers((list) => list.map((m) => (m.uid === uid ? data.member : m)))
    } catch (err) {
      setMembersError(err.message)
    } finally {
      setBusyUid(null)
    }
  }

  async function handleDemote(uid) {
    if (!window.confirm('Remove admin access for this member?')) return
    setMembersError('')
    setBusyUid(uid)
    try {
      const data = await api.demoteMember(uid)
      setMembers((list) => list.map((m) => (m.uid === uid ? data.member : m)))
    } catch (err) {
      setMembersError(err.message)
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="container-page py-14 space-y-16">
      <div>
        <h1 className="text-4xl">Admin</h1>
        <p className="text-steel mt-1">Signed in as {user?.name}</p>
      </div>

      {/* ---------- Event archive ---------- */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 border border-ink/10 p-6">
          <div>
            <h2 className="text-2xl mb-1">Event archive</h2>
            <p className="text-steel text-sm max-w-md">
              Store and organize links to past events&rsquo; photos and files in a folder structure.
            </p>
          </div>
          <Link
            to="/admin/archive"
            className="bg-cardinal-600 text-paper text-sm font-semibold px-5 py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] shrink-0"
          >
            Open archive
          </Link>
        </div>
      </section>

      {/* ---------- Team page ---------- */}
      <section>
        <h2 className="text-3xl mb-6">Team page</h2>

        <form onSubmit={handleTeamSubmit} className="space-y-5 max-w-md mb-10">
          <div className="flex gap-5 items-start">
            <img
              src={preview || PHOTO_PLACEHOLDER}
              alt=""
              className="h-20 w-20 object-cover border border-ink/10 shrink-0"
            />
            <label className="block flex-1">
              <span className="block text-sm font-semibold text-ink mb-1.5">
                Photo{' '}
                <span className="font-normal text-steel">
                  {editingId ? '(leave blank to keep current)' : '(optional — a placeholder is used if skipped)'}
                </span>
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
            <span className="block text-sm font-semibold text-ink mb-1.5">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. President, VP Communications"
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          {teamError && <p className="text-sm text-cardinal-600">{teamError}</p>}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-cardinal-600 text-paper text-sm font-semibold px-5 py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to team page'}
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

        {teamStatus === 'loading' && <p className="text-steel py-6">Loading team members&hellip;</p>}
        {teamStatus === 'error' && <p className="text-steel py-6">Couldn&rsquo;t load the team list.</p>}

        {teamStatus === 'ready' &&
          team.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 border-t border-ink/10 first:border-t-0"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={member.photoURL || PHOTO_PLACEHOLDER}
                  alt=""
                  className="h-12 w-12 object-cover border border-ink/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{member.name}</p>
                  <p className="text-sm text-steel truncate">{member.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <button
                  onClick={() => startEdit(member)}
                  className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
      </section>

      {/* ---------- Admin access ---------- */}
      <section>
        <h2 className="text-3xl mb-2">Admin access</h2>
        <p className="text-steel mb-6">
          Grant or remove admin access for registered members. Admins can edit the team page and
          manage other admins.
        </p>

        {membersError && <p className="text-sm text-cardinal-600 mb-4">{membersError}</p>}
        {membersStatus === 'loading' && <p className="text-steel py-6">Loading members&hellip;</p>}
        {membersStatus === 'error' && <p className="text-steel py-6">Couldn&rsquo;t load members.</p>}

        {membersStatus === 'ready' &&
          members.map((member) => (
            <div
              key={member.uid}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 border-t border-ink/10 first:border-t-0"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {member.name}{' '}
                  {member.uid === user?.uid && <span className="text-steel font-normal">(you)</span>}
                </p>
                <p className="text-sm text-steel truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 ${
                    member.role === 'admin' ? 'bg-cardinal-50 text-cardinal-700' : 'bg-ink/5 text-steel'
                  }`}
                >
                  {member.role}
                </span>
                {member.role === 'admin' ? (
                  <button
                    disabled={member.uid === user?.uid || busyUid === member.uid}
                    onClick={() => handleDemote(member.uid)}
                    className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors disabled:opacity-40 disabled:hover:text-steel"
                  >
                    Remove admin
                  </button>
                ) : (
                  <button
                    disabled={busyUid === member.uid}
                    onClick={() => handlePromote(member.uid)}
                    className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors disabled:opacity-40"
                  >
                    Make admin
                  </button>
                )}
              </div>
            </div>
          ))}
      </section>
    </div>
  )
}
