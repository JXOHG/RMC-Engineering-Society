// Shared image-upload validation, used by every multer instance in the
// app (stories, events, team photos).
//
// Two things used to be trusted from the client and shouldn't be:
//   1. The file extension was taken from the uploaded filename, which
//      the client fully controls.
//   2. The fileFilter accepted anything whose mimetype *started with*
//      "image/", including "image/svg+xml" — SVGs can carry a <script>
//      that runs if someone opens the file directly.
//
// Fixing both: the extension is now looked up from this fixed map
// instead of the filename, and only mimetypes in the map are accepted
// at all, so an attacker can't get an arbitrary extension appended to
// their upload path or sneak an SVG past the filter.
export const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export const IMAGE_FILTER_ERROR_MESSAGE = 'Only JPG, PNG, GIF, or WEBP images are allowed.'

export function imageFileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
    return cb(new Error(IMAGE_FILTER_ERROR_MESSAGE))
  }
  cb(null, true)
}

// Always call this with a mimetype that has already passed
// imageFileFilter — the fallback is just a safety net, not a path for
// unvalidated types to sneak through.
export function extensionFor(mimetype) {
  return ALLOWED_IMAGE_TYPES[mimetype] || 'jpg'
}
