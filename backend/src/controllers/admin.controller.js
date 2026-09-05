import { db } from '../config/firebase.js'

const users = db.collection('users')

function serializeMember(doc) {
  const data = doc.data()
  return { uid: doc.id, name: data.name, email: data.email, role: data.role || 'member' }
}

// GET /api/admin/members — every registered member, for the promote picker
export async function listMembers(_req, res) {
  try {
    const snapshot = await users.orderBy('name', 'asc').get()
    res.json({ members: snapshot.docs.map(serializeMember) })
  } catch (err) {
    console.error('listMembers error:', err)
    res.status(500).json({ message: 'Could not load members right now.' })
  }
}

// POST /api/admin/members/:uid/promote — grant admin access
export async function promote(req, res) {
  try {
    const ref = users.doc(req.params.uid)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That member could not be found.' })
    }

    await ref.update({ role: 'admin' })
    const updated = await ref.get()
    res.json({ member: serializeMember(updated) })
  } catch (err) {
    console.error('promote error:', err)
    res.status(500).json({ message: 'Could not grant admin access right now.' })
  }
}

// POST /api/admin/members/:uid/demote — revoke admin access
export async function demote(req, res) {
  try {
    if (req.params.uid === req.user.uid) {
      return res.status(400).json({ message: 'You can\u2019t change your own admin access.' })
    }

    const ref = users.doc(req.params.uid)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ message: 'That member could not be found.' })
    }

    if (doc.data().role === 'admin') {
      const admins = await users.where('role', '==', 'admin').get()
      if (admins.size <= 1) {
        return res.status(400).json({ message: 'At least one admin must remain.' })
      }
    }

    await ref.update({ role: 'member' })
    const updated = await ref.get()
    res.json({ member: serializeMember(updated) })
  } catch (err) {
    console.error('demote error:', err)
    res.status(500).json({ message: 'Could not remove admin access right now.' })
  }
}
