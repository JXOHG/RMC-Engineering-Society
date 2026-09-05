import { randomUUID } from 'crypto'
import { db, bucket, FieldValue } from '../config/firebase.js'
import { extensionFor } from '../utils/imageUpload.js'

const events = db.collection('events')

function serialize(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name,
    location: data.location,
    // Stored as a Firestore Timestamp; serialized to ISO for the client.
    time: data.time ? data.time.toDate().toISOString() : null,
    photoURL: data.photoURL || null,
  }
}

function parseTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Uploads a multer in-memory file to Storage and makes it publicly
// readable — event photos are shown on a public page anyway.
async function uploadPhoto(file) {
  const path = `event-photos/${randomUUID()}.${extensionFor(file.mimetype)}`
  const blob = bucket.file(path)

  await blob.save(file.buffer, { contentType: file.mimetype })
  await blob.makePublic()

  return { photoPath: path, photoURL: `https://storage.googleapis.com/${bucket.name}/${path}` }
}

async function deletePhoto(path) {
  if (!path) return
  await bucket.file(path).delete().catch(() => {})
}

// GET /api/events — public, soonest event first
export async function list(_req, res) {
  try {
    const snapshot = await events.orderBy('time', 'asc').get()
    res.json({ events: snapshot.docs.map(serialize) })
  } catch (err) {
    console.error('events list error:', err)
    res.status(500).json({ message: 'Could not load events right now.' })
  }
}

// POST /api/events — admin only. Photo is optional.
export async function create(req, res) {
  try {
    const { name, location, time } = req.body

    if (!name || !location || !time) {
      return res.status(400).json({ message: 'Name, location, and time are required.' })
    }

    const parsedTime = parseTime(time)
    if (!parsedTime) {
      return res.status(400).json({ message: 'That date/time is not valid.' })
    }

    const data = {
      name: name.trim(),
      location: location.trim(),
      time: parsedTime,
      createdAt: FieldValue.serverTimestamp(),
    }

    if (req.file) {
      const { photoPath, photoURL } = await uploadPhoto(req.file)
      data.photoPath = photoPath
      data.photoURL = photoURL
    }

    const docRef = await events.add(data)

    const doc = await docRef.get()
    res.status(201).json({ event: serialize(doc) })
  } catch (err) {
    console.error('events create error:', err)
    res.status(500).json({ message: 'Could not add that event right now.' })
  }
}

// PUT /api/events/:id — admin only. Photo is optional; omit it to keep
// the current one (or add one for the first time).
export async function update(req, res) {
  try {
    const ref = events.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That event could not be found.' })
    }

    const { name, location, time } = req.body
    const updates = {}

    if (name !== undefined) updates.name = name.trim()
    if (location !== undefined) updates.location = location.trim()

    if (time !== undefined) {
      const parsedTime = parseTime(time)
      if (!parsedTime) {
        return res.status(400).json({ message: 'That date/time is not valid.' })
      }
      updates.time = parsedTime
    }

    if (req.file) {
      const { photoPath, photoURL } = await uploadPhoto(req.file)
      await deletePhoto(doc.data().photoPath)
      updates.photoPath = photoPath
      updates.photoURL = photoURL
    }

    await ref.update(updates)
    const updated = await ref.get()
    res.json({ event: serialize(updated) })
  } catch (err) {
    console.error('events update error:', err)
    res.status(500).json({ message: 'Could not save those changes right now.' })
  }
}

// DELETE /api/events/:id — admin only
export async function remove(req, res) {
  try {
    const ref = events.doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That event could not be found.' })
    }

    await deletePhoto(doc.data().photoPath)
    await ref.delete()
    res.status(204).end()
  } catch (err) {
    console.error('events remove error:', err)
    res.status(500).json({ message: 'Could not remove that event right now.' })
  }
}
