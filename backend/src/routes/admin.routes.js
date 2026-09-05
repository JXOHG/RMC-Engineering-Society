import { Router } from 'express'
import { listMembers, promote, demote } from '../controllers/admin.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/members', listMembers)
router.post('/members/:uid/promote', promote)
router.post('/members/:uid/demote', demote)

export default router
