# RMC Engineering Society — website

A full-stack site for the RMC Engineering Society: a public feed of "dispatches"
(news/stories about what the society is up to), and a members area where
signed-in cadets can write, edit, and delete their own posts.

- **Frontend:** React 19 + Vite, React Router, Tailwind CSS
- **Backend:** Express.js REST API
- **Database:** Google Firestore (via `firebase-admin`)
- **Auth:** Email/password, JWT sessions, gated behind a society invite code

The red palette (`#B3212C`, `#8F1A23`, `#D6323E`, `#201F1D`) was sampled
directly from the Engineering Competition cover page you shared, and both
crests (the gear-and-maple-leaf mark and the RMC/CMR crest) are used in the
site header and footer.

```
rmc-eng-society/
├── backend/     Express API (Node, ESM)
└── frontend/    React + Vite app
```

## 1. Create the Firestore project

1. Go to the [Firebase console](https://console.firebase.google.com), create
   a project (or use an existing one).
2. Build → Firestore Database → **Create database** → start in
   **production mode** (the API talks to Firestore with admin credentials,
   so client-side rules aren't involved — see `backend/firestore.rules`).
3. Project settings (gear icon) → **Service accounts** → **Generate new
   private key**. This downloads a JSON file — keep it secret, it's a
   master key to your Firestore data.
4. Optional but recommended: deploy the two composite indexes this API
   needs (`backend/firestore.indexes.json`) with the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:indexes --project <your-project-id>
   ```
   If you skip this, Firestore will still work — the *first* time each
   query runs, the server console will log an error containing a link
   that creates the missing index for you in one click.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `JWT_SECRET` — any long random string (used to sign login sessions).
- `SOCIETY_INVITE_CODE` — a code you share privately with real members;
  anyone entering it on the "Create account" page becomes an author who
  can post and manage their own dispatches. There's no separate
  super-admin role — every member has equal author permissions over
  their own posts. Rotate this code, or add stricter invite handling,
  if that's not enough for how the society wants to manage membership.
- `FRONTEND_URL` — the frontend's origin (no trailing slash). Used to
  build the links sent in verification and password-reset emails.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
  `SMTP_FROM` — outgoing mail settings for those emails. Any SMTP
  provider works (Gmail with an app password, SendGrid, Mailgun,
  Postmark, AWS SES, a local dev catcher like Mailhog, etc).
- Place the service account JSON you downloaded above at
  `backend/serviceAccountKey.json` and leave
  `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json` as is — **or**,
  if your host doesn't support uploading files, paste the JSON's contents
  as one line into `FIREBASE_SERVICE_ACCOUNT_JSON` instead and remove the
  `GOOGLE_APPLICATION_CREDENTIALS` line.

Run it:
```bash
npm run dev      # http://localhost:5000, auto-restarts on changes
```

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults already point at http://localhost:5000/api
npm run dev             # http://localhost:5173
```

## 4. Try it out

1. Open `http://localhost:5173`, click **Member sign in → Create an
   account**, and register using the invite code you set in `.env`. Sign-up
   is restricted to `@rmc-cmr.ca` email addresses.
2. Check that inbox for a verification email and click the link — this
   signs you in and lands you on **My dashboard**.
3. Click **File a new dispatch** to write your first post, publish it,
   then go back to the homepage to see it in the public feed.

Forgot your password later? **Sign in → Forgot password?** sends a reset
link to your email; opening it lets you set a new one.

## API reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account (requires invite code + `@rmc-cmr.ca` email); sends a verification email instead of signing in immediately |
| POST | `/api/auth/login` | — | Sign in, returns a JWT (blocked with `403`/`EMAIL_NOT_VERIFIED` until the email is verified) |
| POST | `/api/auth/verify-email` | — | Verify an email with the token from the emailed link; returns a JWT, signing the user in |
| POST | `/api/auth/resend-verification` | — | Re-send the verification email |
| POST | `/api/auth/forgot-password` | — | Send a password-reset email |
| POST | `/api/auth/reset-password` | — | Set a new password using the token from the emailed link |
| GET | `/api/auth/me` | required | Current user's profile |
| GET | `/api/stories` | — | Published dispatches, newest first |
| GET | `/api/stories/:id` | optional | One dispatch (drafts are author-only) |
| GET | `/api/stories/mine/all` | required | All of the signed-in user's dispatches |
| POST | `/api/stories` | required | Create a dispatch (multipart; optional `coverImage` file) |
| PUT | `/api/stories/:id` | required, owner only | Edit a dispatch (multipart; optional `coverImage` file, or `removeCoverImage=true` to clear it) |
| DELETE | `/api/stories/:id` | required, owner only | Delete a dispatch |

## Deploying

Any Node host works for the backend (Render, Railway, Fly.io, a VM, etc.)
and any static host for the frontend (Vercel, Netlify, Firebase Hosting).
When you deploy:

- Set the backend's `CORS_ORIGIN` to your deployed frontend URL.
- Set the frontend's `VITE_API_URL` to your deployed backend's `/api` URL,
  then rebuild (`npm run build`) since Vite bakes env vars in at build time.
- Use the `FIREBASE_SERVICE_ACCOUNT_JSON` option for the backend if your
  host doesn't let you upload the key file directly.

## Notes 

- Every registered member can create, edit, and delete **their own**
  dispatches only — there's no moderation queue or separate admin role
  beyond that. Straightforward to add later (e.g. an `isAdmin` flag on
  the user document) if the society wants a moderator who can edit anyone's
  posts.
- Registration is gated by one shared invite code rather than open
  sign-up, so random visitors can't create posting accounts.
- Story content is stored and rendered as plain text (line breaks
  preserved) rather than rich text/markdown, to keep the editor simple.
  Swapping in a markdown editor (e.g. `react-markdown`) later is a
  contained change to `StoryEditor.jsx` and `StoryDetail.jsx`.
- Each dispatch can optionally have one cover/featured image, uploaded the
  same way team page photos are: to Firebase Storage, made public, and
  shown on the feed card and the full story page. It's stored under
  `dispatch-covers/` in the bucket, and the old file is deleted whenever
  it's replaced or the dispatch itself is deleted. There's no support for
  additional images inside the story body — that would mean swapping the
  plain-text editor for a rich text/markdown one, as noted above.
