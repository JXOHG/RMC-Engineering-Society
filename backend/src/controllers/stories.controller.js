import { randomUUID } from 'crypto'
import { db, bucket, FieldValue } from '../config/firebase.js'
import { extensionFor } from '../utils/imageUpload.js'

const stories = db.collection('stories')

function toIso(timestamp) {
  return timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate().toISOString() : null
}

// Multipart fields (title, excerpt, published, ...) always arrive as
// strings, so a plain Boolean(value) would treat the string "false" as
// truthy. This treats "true"/"1" (or an already-boolean true) as true,
// anything else as false, falling back to `fallback` when the field
// wasn't sent at all.
function parseBool(value, fallback = false) {
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  return value === 'true' || value === '1'
}

// Uploads a multer in-memory file to Storage and makes it publicly
// readable — dispatch cover images are shown on the public feed anyway.
async function uploadCoverImage(file) {
  const path = `dispatch-covers/${randomUUID()}.${extensionFor(file.mimetype)}`
  const blob = bucket.file(path)

  await blob.save(file.buffer, { contentType: file.mimetype })
  await blob.makePublic()

  return { coverImagePath: path, coverImageURL: `https://storage.googleapis.com/${bucket.name}/${path}` }
}

async function deleteCoverImage(path) {
  if (!path) return
  await bucket.file(path).delete().catch(() => {})
}

function serialize(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title,
    excerpt: data.excerpt || '',
    content: data.content,
    published: data.published !== false,
    authorId: data.authorId,
    authorName: data.authorName,
    coverImageURL: data.coverImageURL || null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  }
}

// GET /api/stories — public feed of published dispatches, newest first
export async function listPublished(_req, res) {
  try {
    const snapshot = await stories.where('published', '==', true).orderBy('createdAt', 'desc').get()
    res.json({ stories: snapshot.docs.map(serialize) })
  } catch (err) {
    console.error('listPublished error:', err)
    res.status(500).json({ message: 'Could not load dispatches right now.' })
  }
}

// GET /api/stories/mine/all — everything the signed-in author has written
export async function listMine(req, res) {
  try {
    const snapshot = await stories.where('authorId', '==', req.user.uid).orderBy('createdAt', 'desc').get()
    res.json({ stories: snapshot.docs.map(serialize) })
  } catch (err) {
    console.error('listMine error:', err)
    res.status(500).json({ message: 'Could not load your dispatches right now.' })
  }
}

// GET /api/stories/:id — a published story is public; an unpublished one
// is only visible to the author previewing it.
export async function getOne(req, res) {
  try {
    const doc = await stories.doc(req.params.id).get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That dispatch could not be found.' })
    }

    const data = doc.data()
    const isOwner = req.user && req.user.uid === data.authorId

    if (data.published === false && !isOwner) {
      return res.status(404).json({ message: 'That dispatch could not be found.' })
    }

    res.json({ story: serialize(doc) })
  } catch (err) {
    console.error('getOne error:', err)
    res.status(500).json({ message: 'Could not load that dispatch right now.' })
  }
}

// POST /api/stories — create a dispatch as the signed-in author. A cover
// image is optional; it arrives as multipart form data under the field
// name "coverImage" (see stories.routes.js), alongside the text fields.
export async function create(req, res) {
  try {
    const { title, excerpt = '', content, published } = req.body

    if (!title || !content) {
      return res.status(400).json({ message: 'A title and story content are required.' })
    }

    const newStory = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      published: parseBool(published, true),
      authorId: req.user.uid,
      authorName: req.user.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (req.file) {
      const { coverImagePath, coverImageURL } = await uploadCoverImage(req.file)
      newStory.coverImagePath = coverImagePath
      newStory.coverImageURL = coverImageURL
    }

    const docRef = await stories.add(newStory)

    const doc = await docRef.get()
    res.status(201).json({ story: serialize(doc) })
  } catch (err) {
    console.error('create error:', err)
    res.status(500).json({ message: 'Could not file that dispatch right now.' })
  }
}

// PUT /api/stories/:id — only the original author may edit. Sending a new
// "coverImage" file replaces the current one (and deletes the old file
// from Storage); sending removeCoverImage="true" with no file clears it.
export async function update(req, res) {
  try {
    const ref = stories.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That dispatch could not be found.' })
    }

    if (doc.data().authorId !== req.user.uid) {
      return res.status(403).json({ message: 'You can only edit your own dispatches.' })
    }

    const { title, excerpt, content, published, removeCoverImage } = req.body
    const updates = { updatedAt: FieldValue.serverTimestamp() }

    if (title !== undefined) updates.title = title.trim()
    if (excerpt !== undefined) updates.excerpt = excerpt.trim()
    if (content !== undefined) updates.content = content
    if (published !== undefined) updates.published = parseBool(published)

    if (req.file) {
      const { coverImagePath, coverImageURL } = await uploadCoverImage(req.file)
      await deleteCoverImage(doc.data().coverImagePath)
      updates.coverImagePath = coverImagePath
      updates.coverImageURL = coverImageURL
    } else if (parseBool(removeCoverImage, false)) {
      await deleteCoverImage(doc.data().coverImagePath)
      updates.coverImagePath = FieldValue.delete()
      updates.coverImageURL = FieldValue.delete()
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ story: serialize(updated) })
  } catch (err) {
    console.error('update error:', err)
    res.status(500).json({ message: 'Could not save your changes right now.' })
  }
}

// DELETE /api/stories/:id — only the original author may delete
export async function remove(req, res) {
  try {
    const ref = stories.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That dispatch could not be found.' })
    }

    if (doc.data().authorId !== req.user.uid) {
      return res.status(403).json({ message: 'You can only delete your own dispatches.' })
    }

    await deleteCoverImage(doc.data().coverImagePath)
    await ref.delete()
    res.status(204).end()
  } catch (err) {
    console.error('remove error:', err)
    res.status(500).json({ message: 'Could not delete that dispatch right now.' })
  }
}
