import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Two ways to authenticate to Firestore, tried in this order:
 *
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON — the full service account JSON pasted
 *    as a single-line env var. Handy for hosts (Render, Railway, etc.)
 *    where you can't easily ship a file.
 * 2. GOOGLE_APPLICATION_CREDENTIALS — the standard path-to-file approach,
 *    used for local development. Point it at the JSON key you downloaded
 *    from Firebase Console > Project settings > Service accounts.
 */
let app

if (!getApps().length) {
  // storageBucket must be set at init time for getStorage(app).bucket() to
  // know which bucket to use — see FIREBASE_STORAGE_BUCKET in .env.
  const appOptions = process.env.FIREBASE_STORAGE_BUCKET
    ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET }
    : {}

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    app = initializeApp({ ...appOptions, credential: cert(serviceAccount) })
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or the default
    // credential chain (e.g. when deployed on Google Cloud/Firebase).
    app = initializeApp({ ...appOptions, credential: applicationDefault() })
  }
} else {
  app = getApps()[0]
}

export const db = getFirestore(app)
export const bucket = getStorage(app).bucket()
export { FieldValue }
export default app
