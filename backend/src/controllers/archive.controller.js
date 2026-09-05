import { db, FieldValue } from '../config/firebase.js'

// This is a link archive, not a file store: admins paste in Google
// Drive / OneDrive / etc links to point at the real files, organized
// into folders. Nothing large ever gets uploaded through here.
const folders = db.collection('archiveFolders')
const links = db.collection('archiveLinks')

function serializeFolder(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name,
    parentId: data.parentId ?? null,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
  }
}

function serializeLink(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    folderId: data.folderId ?? null,
    title: data.title,
    url: data.url,
    notes: data.notes || null,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
  }
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// GET /api/archive/folders — flat list; the client builds the tree.
export async function listFolders(_req, res) {
  try {
    const snapshot = await folders.orderBy('name', 'asc').get()
    res.json({ folders: snapshot.docs.map(serializeFolder) })
  } catch (err) {
    console.error('archive listFolders error:', err)
    res.status(500).json({ message: 'Could not load the archive right now.' })
  }
}

// POST /api/archive/folders — { name, parentId? }. parentId omitted or
// null means a top-level folder.
export async function createFolder(req, res) {
  try {
    const { name } = req.body
    const parentId = req.body.parentId || null

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'A folder name is required.' })
    }

    if (parentId) {
      const parent = await folders.doc(parentId).get()
      if (!parent.exists) {
        return res.status(400).json({ message: 'That parent folder could not be found.' })
      }
    }

    const docRef = await folders.add({
      name: name.trim(),
      parentId,
      createdAt: FieldValue.serverTimestamp(),
    })

    const doc = await docRef.get()
    res.status(201).json({ folder: serializeFolder(doc) })
  } catch (err) {
    console.error('archive createFolder error:', err)
    res.status(500).json({ message: 'Could not create that folder right now.' })
  }
}

// Walks parentId pointers from candidateParentId up toward the root,
// following the given id -> parentId map. True if targetId is on that
// path, which means using candidateParentId as the new parent of
// targetId would create a cycle (e.g. dragging a folder into its own
// subfolder).
function wouldCreateCycle(parentOf, targetId, candidateParentId) {
  let current = candidateParentId
  const seen = new Set()
  while (current) {
    if (current === targetId) return true
    if (seen.has(current)) break // guards against any pre-existing bad data
    seen.add(current)
    current = parentOf.get(current) || null
  }
  return false
}

// PUT /api/archive/folders/:id — rename and/or move: { name?, parentId? }
export async function updateFolder(req, res) {
  try {
    const ref = folders.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That folder could not be found.' })
    }

    const { name } = req.body
    const updates = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'A folder name is required.' })
      }
      updates.name = name.trim()
    }

    if (req.body.parentId !== undefined) {
      const newParentId = req.body.parentId || null

      if (newParentId === req.params.id) {
        return res.status(400).json({ message: 'A folder can\u2019t be moved into itself.' })
      }

      if (newParentId) {
        const parent = await folders.doc(newParentId).get()
        if (!parent.exists) {
          return res.status(400).json({ message: 'That parent folder could not be found.' })
        }

        const allFolders = await folders.get()
        const parentOf = new Map(allFolders.docs.map((d) => [d.id, d.data().parentId || null]))
        if (wouldCreateCycle(parentOf, req.params.id, newParentId)) {
          return res
            .status(400)
            .json({ message: 'Can\u2019t move a folder into one of its own subfolders.' })
        }
      }

      updates.parentId = newParentId
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ folder: serializeFolder(updated) })
  } catch (err) {
    console.error('archive updateFolder error:', err)
    res.status(500).json({ message: 'Could not save those changes right now.' })
  }
}

// DELETE /api/archive/folders/:id — cascades to every subfolder and to
// all links filed anywhere inside them.
export async function deleteFolder(req, res) {
  try {
    const ref = folders.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That folder could not be found.' })
    }

    const [allFolders, allLinks] = await Promise.all([folders.get(), links.get()])

    const childrenOf = new Map()
    allFolders.docs.forEach((d) => {
      const parentId = d.data().parentId || null
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, [])
      childrenOf.get(parentId).push(d.id)
    })

    // Breadth-first walk to collect the target folder plus every
    // descendant, however deep.
    const toDelete = new Set([req.params.id])
    const queue = [req.params.id]
    while (queue.length) {
      const current = queue.shift()
      for (const childId of childrenOf.get(current) || []) {
        if (!toDelete.has(childId)) {
          toDelete.add(childId)
          queue.push(childId)
        }
      }
    }

    const batch = db.batch()
    allLinks.docs.forEach((linkDoc) => {
      if (toDelete.has(linkDoc.data().folderId)) {
        batch.delete(linkDoc.ref)
      }
    })
    allFolders.docs.forEach((folderDoc) => {
      if (toDelete.has(folderDoc.id)) {
        batch.delete(folderDoc.ref)
      }
    })

    await batch.commit()
    res.status(204).end()
  } catch (err) {
    console.error('archive deleteFolder error:', err)
    res.status(500).json({ message: 'Could not remove that folder right now.' })
  }
}

// GET /api/archive/links — flat list; the client filters by folder.
export async function listLinks(_req, res) {
  try {
    const snapshot = await links.orderBy('createdAt', 'desc').get()
    res.json({ links: snapshot.docs.map(serializeLink) })
  } catch (err) {
    console.error('archive listLinks error:', err)
    res.status(500).json({ message: 'Could not load the archive right now.' })
  }
}

// POST /api/archive/links — { folderId?, title, url, notes? }. A null
// folderId files the link at the top level.
export async function createLink(req, res) {
  try {
    const { title, url, notes } = req.body
    const folderId = req.body.folderId || null

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'A title is required.' })
    }
    if (!url || !isValidUrl(url.trim())) {
      return res
        .status(400)
        .json({ message: 'Please paste a valid link (starting with http:// or https://).' })
    }

    if (folderId) {
      const folder = await folders.doc(folderId).get()
      if (!folder.exists) {
        return res.status(400).json({ message: 'That folder could not be found.' })
      }
    }

    const docRef = await links.add({
      folderId,
      title: title.trim(),
      url: url.trim(),
      notes: notes && notes.trim() ? notes.trim() : null,
      createdAt: FieldValue.serverTimestamp(),
    })

    const doc = await docRef.get()
    res.status(201).json({ link: serializeLink(doc) })
  } catch (err) {
    console.error('archive createLink error:', err)
    res.status(500).json({ message: 'Could not add that link right now.' })
  }
}

// PUT /api/archive/links/:id — { folderId?, title?, url?, notes? }
export async function updateLink(req, res) {
  try {
    const ref = links.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That link could not be found.' })
    }

    const { title, url, notes } = req.body
    const updates = {}

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'A title is required.' })
      }
      updates.title = title.trim()
    }

    if (url !== undefined) {
      if (!isValidUrl(url.trim())) {
        return res
          .status(400)
          .json({ message: 'Please paste a valid link (starting with http:// or https://).' })
      }
      updates.url = url.trim()
    }

    if (notes !== undefined) {
      updates.notes = notes && notes.trim() ? notes.trim() : null
    }

    if (req.body.folderId !== undefined) {
      const folderId = req.body.folderId || null
      if (folderId) {
        const folder = await folders.doc(folderId).get()
        if (!folder.exists) {
          return res.status(400).json({ message: 'That folder could not be found.' })
        }
      }
      updates.folderId = folderId
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ link: serializeLink(updated) })
  } catch (err) {
    console.error('archive updateLink error:', err)
    res.status(500).json({ message: 'Could not save those changes right now.' })
  }
}

// DELETE /api/archive/links/:id
export async function deleteLink(req, res) {
  try {
    const ref = links.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That link could not be found.' })
    }

    await ref.delete()
    res.status(204).end()
  } catch (err) {
    console.error('archive deleteLink error:', err)
    res.status(500).json({ message: 'Could not remove that link right now.' })
  }
}
