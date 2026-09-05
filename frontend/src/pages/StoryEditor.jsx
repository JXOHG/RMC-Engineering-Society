import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'

const empty = { title: '', excerpt: '', content: '', published: true, coverImageURL: null }

export default function StoryEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cover image is optional. `preview` drives what's shown above the file
  // input: the existing image when editing, a local object URL once the
  // person picks a new file, or nothing once they remove it.
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [removeCoverImage, setRemoveCoverImage] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    api
      .getStory(id)
      .then((data) => {
        setForm({ ...empty, ...data.story })
        setPreview(data.story.coverImageURL || null)
      })
      .catch(() => setError('Could not load this dispatch.'))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleCoverImageChange(e) {
    const file = e.target.files?.[0] || null
    setCoverImageFile(file)
    setRemoveCoverImage(false)
    setPreview(file ? URL.createObjectURL(file) : form.coverImageURL || null)
  }

  function handleRemoveCoverImage() {
    setCoverImageFile(null)
    setRemoveCoverImage(true)
    setPreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('excerpt', form.excerpt)
    formData.append('content', form.content)
    formData.append('published', form.published)
    if (coverImageFile) {
      formData.append('coverImage', coverImageFile)
    } else if (isEditing && removeCoverImage) {
      formData.append('removeCoverImage', 'true')
    }

    try {
      if (isEditing) {
        await api.updateStory(id, formData)
      } else {
        await api.createStory(formData)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container-page py-16 text-steel">Loading&hellip;</div>
  }

  return (
    <div className="container-page py-14 max-w-2xl">
      <h1 className="text-4xl mb-8">{isEditing ? 'Edit dispatch' : 'File a new dispatch'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-5 items-start">
          {preview && (
            <img
              src={preview}
              alt=""
              className="h-24 w-24 object-cover border border-ink/10 shrink-0"
            />
          )}
          <div className="flex-1">
            <span className="block text-sm font-semibold text-ink mb-1.5">
              Cover image <span className="font-normal text-steel">(optional)</span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleCoverImageChange}
              className="w-full text-sm text-steel file:mr-3 file:border-0 file:bg-cardinal-600 file:text-paper file:px-3 file:py-2 file:text-sm file:font-semibold file:cursor-pointer"
            />
            {preview && (
              <button
                type="button"
                onClick={handleRemoveCoverImage}
                className="mt-2 text-xs font-semibold text-steel hover:text-cardinal-600 transition-colors"
              >
                Remove image
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Title</span>
          <input
            required
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">
            Excerpt <span className="font-normal text-steel">(shown on the dispatch feed)</span>
          </span>
          <input
            name="excerpt"
            value={form.excerpt}
            onChange={handleChange}
            maxLength={200}
            className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Full story</span>
          <textarea
            required
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={12}
            className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors leading-relaxed"
          />
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="published"
            checked={form.published}
            onChange={handleChange}
            className="h-4 w-4 accent-cardinal-600"
          />
          <span className="text-sm text-ink">Publish immediately</span>
        </label>

        {error && <p className="text-sm text-cardinal-600">{error}</p>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-cardinal-600 text-paper text-sm font-semibold px-5 py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'File dispatch'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
