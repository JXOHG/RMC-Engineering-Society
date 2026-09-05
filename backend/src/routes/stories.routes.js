import { Router } from 'express'
import multer from 'multer'
import { listPublished, listMine, getOne, create, update, remove } from '../controllers/stories.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { imageFileFilter } from '../utils/imageUpload.js'

// Cover images are optional on a dispatch, so this only ever handles the
// single "coverImage" field — same limits as the team-photo uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
})

const router = Router()

router.get('/', listPublished)
router.get('/mine/all', requireAuth, listMine)
router.get('/:id', optionalAuth, getOne)
router.post('/', requireAuth, upload.single('coverImage'), create)
router.put('/:id', requireAuth, upload.single('coverImage'), update)
router.delete('/:id', requireAuth, remove)

export default router
