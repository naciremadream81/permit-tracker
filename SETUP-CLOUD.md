# Cloud setup (Firebase / Google Cloud)

One-time setup, ~15 minutes. Until you finish it, the app keeps running in
local mode (data stays in this browser).

## Cost

- **Firestore, Auth, Hosting:** free tier covers a 2-person team many times over.
- **Cloud Storage (your permit documents):** Google requires the **Blaze
  (pay-as-you-go)** plan to enable Storage on new projects. At your volume
  expect **cents per month** (storage is ~$0.026/GB/month; a few GB of PDFs
  rounds to pocket change). Set a budget alert (step 6) so nothing surprises you.

## Steps

1. **Create the project** — go to [console.firebase.google.com](https://console.firebase.google.com),
   *Add project*, name it (e.g. `meridian-permits`). Google Analytics: off, not needed.

2. **Add a web app** — Project overview → the `</>` (Web) icon → register app
   (no hosting checkbox needed). You'll be shown a `firebaseConfig` block.
   Copy `.env.local.example` to `.env.local` and fill in the five values from
   that block, then restart the dev server.

3. **Enable Google sign-in** — Build → Authentication → Get started →
   Sign-in method → Google → Enable. Set the support email. Save.

4. **Create the Firestore database** — Build → Firestore Database → Create
   database → Start in **production mode** → location `nam5 (us-central)` (or
   the closest US multi-region). Then open the **Rules** tab and paste the
   contents of [firestore.rules](firestore.rules) — **edit the email list
   first** (your Google account email and your teammate's). Publish.

5. **Enable Storage** — Build → Storage → Get started. This prompts the
   upgrade to the Blaze plan (card required; usage at your scale is cents).
   Then open the **Rules** tab and paste [storage.rules](storage.rules) with
   the same email list. Publish.

6. **Budget alert (recommended)** — in the
   [Google Cloud console](https://console.cloud.google.com/billing) →
   Budgets & alerts → create a $5/month budget on this project. You'll get an
   email long before anything costs real money.

7. **Sign in** — reload the app. You'll see the Google sign-in screen. The
   first sign-in automatically migrates whatever was in this browser's local
   storage (packages, contractors, checklists, and uploaded documents) into
   the cloud workspace. Your teammate signs in with their own Google account
   (already on the allowlist from steps 4–5) and sees the same data live.

## Adding or removing a team member later

Edit the email list in **both** `firestore.rules` and `storage.rules` and
publish them again (console Rules tab, or `firebase deploy --only
firestore:rules,storage` with the Firebase CLI). No code changes needed.

## How data is laid out

- `workspaces/main/packages/{id}` — one Firestore doc per permit package
- `workspaces/main/directory/{id}` — one doc per contractor
- `workspaces/main/meta/templates` — your edited checklist templates
- `workspaces/main/files/{attachmentId}` — document files in Cloud Storage

Everything is scoped under `workspaces/main`, so a second workspace (or
per-client workspaces) can be added later without restructuring.
