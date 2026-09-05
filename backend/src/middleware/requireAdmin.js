import { db } from '../config/firebase.js'

const users = db.collection('users')

/**
 * Must run after requireAuth. Rejects with 403 unless the signed-in
 * user's role is currently 'admin'.
 *
 * This re-reads the role from Firestore instead of trusting req.user.role
 * from the JWT on purpose: JWTs last 30 days, so if we trusted the token
 * a demoted admin would keep access until their token expired, and a
 * freshly promoted member would need to log out/in to get access. A
 * quick Firestore read keeps this correct at the cost of one extra read
 * per admin request — fine at this app's scale.
 */
export async function requireAdmin(req, res, next) {
  try {
    const doc = await users.doc(req.user.uid).get()

    if (!doc.exists || doc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Admins only.' })
    }

    next()
  } catch (err) {
    console.error('requireAdmin error:', err)
    res.status(500).json({ message: 'Could not verify admin access right now.' })
  }
}
