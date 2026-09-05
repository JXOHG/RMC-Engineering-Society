import { Router } from 'express'
import {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  listLinks,
  createLink,
  updateLink,
  deleteLink,
} from '../controllers/archive.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

// This whole resource is internal — an admin-only archive of past-event
// links — so every route here requires admin access, unlike events/team
// which are public to read.
router.use(requireAuth, requireAdmin)

router.get('/folders', listFolders)
router.post('/folders', createFolder)
router.put('/folders/:id', updateFolder)
router.delete('/folders/:id', deleteFolder)

router.get('/links', listLinks)
router.post('/links', createLink)
router.put('/links/:id', updateLink)
router.delete('/links/:id', deleteLink)

export default router
