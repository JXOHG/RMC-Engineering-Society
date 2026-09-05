import { randomUUID } from 'crypto'
import { db, bucket, FieldValue } from '../config/firebase.js'
import { extensionFor } from '../utils/imageUpload.js'

const team = db.collection('teamMembers')

function serialize(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name,
    title: data.title,
    photoURL: data.photoURL,
    order: data.order ?? 0,
  }
}

// Uploads a multer in-memory file to Storage and makes it publicly
// readable — these are team page photos, meant to be public anyway.
async function uploadPhoto(file) {
  const path = `team-photos/${randomUUID()}.${extensionFor(file.mimetype)}`
  const blob = bucket.file(path)

  await blob.save(file.buffer, { contentType: file.mimetype })
  await blob.makePublic()

  return { photoPath: path, photoURL: `https://storage.googleapis.com/${bucket.name}/${path}` }
}

async function deletePhoto(path) {
  if (!path) return
  await bucket.file(path).delete().catch(() => {})
}

// GET /api/team — public, ordered for display on the team page
export async function list(_req, res) {
  try {
    const snapshot = await team.orderBy('order', 'asc').get()
    res.json({ team: snapshot.docs.map(serialize) })
  } catch (err) {
    console.error('team list error:', err)
    res.status(500).json({ message: 'Could not load the team page right now.' })
  }
}

// POST /api/team — admin only
export async function create(req, res) {
  try {
    const { name, title } = req.body

    if (!name || !title) {
      return res.status(400).json({ message: 'Name and title are required.' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'A photo is required.' })
    }

    const { photoPath, photoURL } = await uploadPhoto(req.file)

    // New members go to the end of the display order by default.
    const last = await team.orderBy('order', 'desc').limit(1).get()
    const nextOrder = last.empty ? 0 : (last.docs[0].data().order ?? 0) + 1

    const docRef = await team.add({
      name: name.trim(),
      title: title.trim(),
      photoURL,
      photoPath,
      order: nextOrder,
      createdAt: FieldValue.serverTimestamp(),
    })

    const doc = await docRef.get()
    res.status(201).json({ member: serialize(doc) })
  } catch (err) {
    console.error('team create error:', err)
    res.status(500).json({ message: 'Could not add that team member right now.' })
  }
}

// PUT /api/team/:id — admin only. Photo is optional; omit it to keep the
// current one.
export async function update(req, res) {
  try {
    const ref = team.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That team member could not be found.' })
    }

    const { name, title, order } = req.body
    const updates = {}

    if (name !== undefined) updates.name = name.trim()
    if (title !== undefined) updates.title = title.trim()
    if (order !== undefined) updates.order = Number(order)

    if (req.file) {
      const { photoPath, photoURL } = await uploadPhoto(req.file)
      await deletePhoto(doc.data().photoPath)
      updates.photoPath = photoPath
      updates.photoURL = photoURL
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ member: serialize(updated) })
  } catch (err) {
    console.error('team update error:', err)
    res.status(500).json({ message: 'Could not save those changes right now.' })
  }
}

// DELETE /api/team/:id — admin only
export async function remove(req, res) {
  try {
    const ref = team.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That team member could not be found.' })
    }

    await deletePhoto(doc.data().photoPath)
    await ref.delete()
    res.status(204).end()
  } catch (err) {
    console.error('team remove error:', err)
    res.status(500).json({ message: 'Could not remove that team member right now.' })
  }
}
