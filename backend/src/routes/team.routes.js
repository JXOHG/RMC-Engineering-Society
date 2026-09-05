import { Router } from 'express'
import multer from 'multer'
import { list, create, update, remove } from '../controllers/team.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { imageFileFilter } from '../utils/imageUpload.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
})

const router = Router()

router.get('/', list)
router.post('/', requireAuth, requireAdmin, upload.single('photo'), create)
router.put('/:id', requireAuth, requireAdmin, upload.single('photo'), update)
router.delete('/:id', requireAuth, requireAdmin, remove)

export default router
