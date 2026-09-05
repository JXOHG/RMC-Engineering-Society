import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const emptyLinkForm = { title: '', url: '', notes: '' }

function FolderIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 7a1 1 0 0 1 1-1h4.5l1.5 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
    </svg>
  )
}

function LinkIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.5 5A3.5 3.5 0 0 1 17.5 10L16 11.5" />
      <path d="M13 17.5 11.5 19A3.5 3.5 0 0 1 6.5 14L8 12.5" />
    </svg>
  )
}

// Renders a "select" with indentation baked into each option's label,
// so admins can see the folder hierarchy while picking a destination.
function FolderSelect({ options, value, onChange }) {
  return (
    <select
      autoFocus
      defaultValue={value || ''}
      onChange={onChange}
      className="text-sm border border-ink/20 px-2 py-1.5 bg-paper focus:border-cardinal-600 outline-none max-w-[14rem]"
    >
      {options.map((opt) => (
        <option key={opt.id || 'root'} value={opt.id || ''}>
          {'\u00A0\u00A0\u00A0\u00A0'.repeat(opt.depth)}
          {opt.name}
        </option>
      ))}
    </select>
  )
}

export default function Archive() {
  const [folders, setFolders] = useState([])
  const [links, setLinks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  const [currentFolderId, setCurrentFolderId] = useState(null) // null = top level

  // Folder create/rename/move
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [movingFolderId, setMovingFolderId] = useState(null)
  const [folderError, setFolderError] = useState('')
  const [savingFolder, setSavingFolder] = useState(false)

  // Link add/edit/move
  const [addingLink, setAddingLink] = useState(false)
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [linkForm, setLinkForm] = useState(emptyLinkForm)
  const [linkError, setLinkError] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [movingLinkId, setMovingLinkId] = useState(null)

  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    loadArchive()
  }, [])

  function loadArchive() {
    setStatus('loading')
    Promise.all([api.getArchiveFolders(), api.getArchiveLinks()])
      .then(([foldersData, linksData]) => {
        setFolders(foldersData.folders || [])
        setLinks(linksData.links || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])

  const childrenOf = useMemo(() => {
    const map = new Map()
    folders.forEach((f) => {
      const key = f.parentId || null
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(f)
    })
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name))
    return map
  }, [folders])

  const currentSubfolders = childrenOf.get(currentFolderId) || []
  const currentLinks = useMemo(
    () => links.filter((l) => (l.folderId || null) === currentFolderId),
    [links, currentFolderId],
  )

  const breadcrumbPath = useMemo(() => {
    const path = []
    let current = currentFolderId
    while (current) {
      const folder = folderMap.get(current)
      if (!folder) break
      path.unshift(folder)
      current = folder.parentId
    }
    return path
  }, [currentFolderId, folderMap])

  function getDescendantIds(folderId) {
    const result = new Set()
    const queue = [folderId]
    while (queue.length) {
      const current = queue.shift()
      for (const child of childrenOf.get(current) || []) {
        if (!result.has(child.id)) {
          result.add(child.id)
          queue.push(child.id)
        }
      }
    }
    return result
  }

  // Flattens the tree into an indented list of {id, name, depth} for a
  // move destination picker. excludeIds keeps a folder from being moved
  // into itself or one of its own subfolders.
  function buildFolderOptions(excludeIds = new Set()) {
    const options = [{ id: null, name: 'Archive (top level)', depth: 0 }]
    function walk(parentId, depth) {
      for (const folder of childrenOf.get(parentId) || []) {
        if (excludeIds.has(folder.id)) continue
        options.push({ id: folder.id, name: folder.name, depth })
        walk(folder.id, depth + 1)
      }
    }
    walk(null, 1)
    return options
  }

  // --- Folders ---

  async function handleCreateFolder(e) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setFolderError('')
    setSavingFolder(true)
    try {
      const data = await api.createArchiveFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId,
      })
      setFolders((list) => [...list, data.folder])
      setNewFolderName('')
      setCreatingFolder(false)
    } catch (err) {
      setFolderError(err.message)
    } finally {
      setSavingFolder(false)
    }
  }

  function startRenameFolder(folder) {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.name)
    setFolderError('')
  }

  async function handleRenameFolder(e) {
    e.preventDefault()
    if (!renameValue.trim()) return
    setSavingFolder(true)
    setFolderError('')
    try {
      const data = await api.updateArchiveFolder(renamingFolderId, { name: renameValue.trim() })
      setFolders((list) => list.map((f) => (f.id === renamingFolderId ? data.folder : f)))
      setRenamingFolderId(null)
    } catch (err) {
      setFolderError(err.message)
    } finally {
      setSavingFolder(false)
    }
  }

  async function handleMoveFolder(folderId, newParentId) {
    setBusyId(folderId)
    setFolderError('')
    try {
      const data = await api.updateArchiveFolder(folderId, { parentId: newParentId })
      setFolders((list) => list.map((f) => (f.id === folderId ? data.folder : f)))
      setMovingFolderId(null)
    } catch (err) {
      setFolderError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteFolder(folder) {
    const descendants = getDescendantIds(folder.id)
    const affectedIds = new Set([folder.id, ...descendants])
    const linkCount = links.filter((l) => affectedIds.has(l.folderId)).length

    const warning =
      descendants.size || linkCount
        ? `Delete "${folder.name}"? This also removes ${descendants.size} subfolder${
            descendants.size === 1 ? '' : 's'
          } and ${linkCount} link${linkCount === 1 ? '' : 's'} inside it. This can\u2019t be undone.`
        : `Delete the empty folder "${folder.name}"?`

    if (!window.confirm(warning)) return

    setBusyId(folder.id)
    setFolderError('')
    try {
      await api.deleteArchiveFolder(folder.id)
      setFolders((list) => list.filter((f) => !affectedIds.has(f.id)))
      setLinks((list) => list.filter((l) => !affectedIds.has(l.folderId)))
      if (affectedIds.has(currentFolderId)) {
        setCurrentFolderId(folder.parentId || null)
      }
    } catch (err) {
      setFolderError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  // --- Links ---

  function startAddLink() {
    setAddingLink(true)
    setEditingLinkId(null)
    setLinkForm(emptyLinkForm)
    setLinkError('')
  }

  function startEditLink(link) {
    setEditingLinkId(link.id)
    setAddingLink(false)
    setLinkForm({ title: link.title, url: link.url, notes: link.notes || '' })
    setLinkError('')
  }

  function cancelLinkForm() {
    setAddingLink(false)
    setEditingLinkId(null)
    setLinkForm(emptyLinkForm)
    setLinkError('')
  }

  async function handleLinkSubmit(e) {
    e.preventDefault()
    setLinkError('')
    setSavingLink(true)
    try {
      if (editingLinkId) {
        const data = await api.updateArchiveLink(editingLinkId, linkForm)
        setLinks((list) => list.map((l) => (l.id === editingLinkId ? data.link : l)))
      } else {
        const data = await api.createArchiveLink({ ...linkForm, folderId: currentFolderId })
        setLinks((list) => [data.link, ...list])
      }
      cancelLinkForm()
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setSavingLink(false)
    }
  }

  async function handleDeleteLink(link) {
    if (!window.confirm(`Remove "${link.title}" from the archive?`)) return
    setBusyId(link.id)
    try {
      await api.deleteArchiveLink(link.id)
      setLinks((list) => list.filter((l) => l.id !== link.id))
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMoveLink(linkId, newFolderId) {
    setBusyId(linkId)
    setLinkError('')
    try {
      const data = await api.updateArchiveLink(linkId, { folderId: newFolderId })
      setLinks((list) => list.map((l) => (l.id === linkId ? data.link : l)))
      setMovingLinkId(null)
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const isEmpty = currentSubfolders.length === 0 && currentLinks.length === 0

  return (
    <div className="container-page py-14">
      <Link to="/admin" className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors">
        &larr; Back to admin
      </Link>

      <h1 className="text-4xl mt-3 mb-2">Event archive</h1>
      <p className="text-steel mb-10">
        Organize links to past events into folders. This stores links only &mdash; keep the actual
        photos and files in Google Drive, OneDrive, or wherever they already live.
      </p>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm mb-8 flex-wrap" aria-label="Folder path">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`font-semibold transition-colors ${
            currentFolderId === null ? 'text-cardinal-600' : 'text-steel hover:text-cardinal-600'
          }`}
        >
          Archive
        </button>
        {breadcrumbPath.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1.5">
            <span className="text-steel/40">/</span>
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className={`font-semibold transition-colors ${
                folder.id === currentFolderId ? 'text-cardinal-600' : 'text-steel hover:text-cardinal-600'
              }`}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => {
            setCreatingFolder(true)
            setFolderError('')
          }}
          className="border border-ink/20 text-sm font-semibold px-4 py-2.5 hover:border-cardinal-600 hover:text-cardinal-600 transition-colors"
        >
          + New folder
        </button>
        <button
          onClick={startAddLink}
          className="bg-cardinal-600 text-paper text-sm font-semibold px-4 py-2.5 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          + Add link
        </button>
      </div>

      {creatingFolder && (
        <form onSubmit={handleCreateFolder} className="flex items-center gap-3 mb-8 max-w-md">
          <input
            autoFocus
            required
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 border border-ink/20 px-3 py-2 bg-paper focus:border-cardinal-600 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={savingFolder}
            className="bg-cardinal-600 text-paper text-sm font-semibold px-4 py-2 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingFolder(false)
              setNewFolderName('')
            }}
            className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {(addingLink || editingLinkId) && (
        <form onSubmit={handleLinkSubmit} className="space-y-5 max-w-md mb-10 border border-ink/10 p-6">
          <h2 className="text-xl font-semibold">{editingLinkId ? 'Edit link' : 'Add link'}</h2>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Title</span>
            <input
              required
              value={linkForm.title}
              onChange={(e) => setLinkForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Winter Formal 2023 — photos"
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">Link</span>
            <input
              required
              type="url"
              value={linkForm.url}
              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">
              Notes <span className="font-normal text-steel">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={linkForm.notes}
              onChange={(e) => setLinkForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Who to ask, what's inside, access notes…"
              className="w-full border border-ink/20 px-3 py-2.5 bg-paper focus:border-cardinal-600 outline-none transition-colors resize-none"
            />
          </label>

          {linkError && <p className="text-sm text-cardinal-600">{linkError}</p>}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={savingLink}
              className="bg-cardinal-600 text-paper text-sm font-semibold px-5 py-3 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {savingLink ? 'Saving…' : editingLinkId ? 'Save changes' : 'Add link'}
            </button>
            <button
              type="button"
              onClick={cancelLinkForm}
              className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {folderError && <p className="text-sm text-cardinal-600 mb-6">{folderError}</p>}
      {!(addingLink || editingLinkId) && linkError && (
        <p className="text-sm text-cardinal-600 mb-6">{linkError}</p>
      )}

      {status === 'loading' && <p className="text-steel py-10">Loading the archive&hellip;</p>}
      {status === 'error' && (
        <p className="text-steel py-10">Couldn&rsquo;t load the archive right now.</p>
      )}

      {status === 'ready' && isEmpty && (
        <p className="text-steel py-10">
          {currentFolderId === null
            ? 'The archive is empty. Start a folder or add a link above.'
            : 'This folder is empty. Add a subfolder or a link above.'}
        </p>
      )}

      {status === 'ready' && !isEmpty && (
        <>
          {currentSubfolders.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-steel mb-1">Folders</h2>
              {currentSubfolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 border-t border-ink/10 first:border-t-0"
                >
                  {renamingFolderId === folder.id ? (
                    <form onSubmit={handleRenameFolder} className="flex items-center gap-3 flex-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 border border-ink/20 px-3 py-1.5 bg-paper focus:border-cardinal-600 outline-none transition-colors"
                      />
                      <button type="submit" className="text-sm font-semibold text-cardinal-600">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingFolderId(null)}
                        className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="flex items-center gap-3 min-w-0 text-left group"
                      >
                        <FolderIcon className="h-5 w-5 text-cardinal-600 shrink-0" />
                        <span className="font-semibold text-ink truncate group-hover:text-cardinal-600 transition-colors">
                          {folder.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {movingFolderId === folder.id ? (
                          <>
                            <FolderSelect
                              options={buildFolderOptions(
                                new Set([folder.id, ...getDescendantIds(folder.id)]),
                              )}
                              value={folder.parentId}
                              onChange={(e) => handleMoveFolder(folder.id, e.target.value || null)}
                            />
                            <button
                              type="button"
                              onClick={() => setMovingFolderId(null)}
                              className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startRenameFolder(folder)}
                              className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => setMovingFolderId(folder.id)}
                              className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                            >
                              Move
                            </button>
                            <button
                              disabled={busyId === folder.id}
                              onClick={() => handleDeleteFolder(folder)}
                              className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-steel mb-1">Links</h2>
            {currentLinks.length === 0 && (
              <p className="text-steel py-6">No links filed directly in this folder.</p>
            )}
            {currentLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4 border-t border-ink/10 first:border-t-0"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 min-w-0 group"
                >
                  <LinkIcon className="h-5 w-5 text-cardinal-600 shrink-0 mt-0.5" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink group-hover:text-cardinal-600 transition-colors truncate">
                      {link.title}
                    </span>
                    {link.notes && <span className="block text-sm text-steel mt-0.5">{link.notes}</span>}
                    <span className="block text-sm text-steel/70 truncate mt-0.5">{link.url}</span>
                  </span>
                </a>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {movingLinkId === link.id ? (
                    <>
                      <FolderSelect
                        options={buildFolderOptions()}
                        value={link.folderId}
                        onChange={(e) => handleMoveLink(link.id, e.target.value || null)}
                      />
                      <button
                        type="button"
                        onClick={() => setMovingLinkId(null)}
                        className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditLink(link)}
                        className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setMovingLinkId(link.id)}
                        className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
                      >
                        Move
                      </button>
                      <button
                        disabled={busyId === link.id}
                        onClick={() => handleDeleteLink(link)}
                        className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
