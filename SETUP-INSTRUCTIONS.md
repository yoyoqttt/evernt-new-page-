# How to connect Firebase (free) and go live

## Current structure: kiosk page + separate dashboard page

The **kiosk flow** — "Click to Enter" fullscreen screen, the feedback
form, and a "Thank you" confirmation — lives inside **one file,
`index.html`**, switched between by `app.js`. Nothing in that flow
ever calls `window.location.href`, so fullscreen is never interrupted:

```
landing -> click "Click to Enter" -> requestFullscreen()
landing -> click the questionnaire button -> form (details + 5 questions)
form    -> submit -> saved to Firestore -> "Thank you" screen
"Thank you" -> auto-returns to the landing screen after a few seconds
               (so the next participant can start fresh)
```

**Why single-page for the kiosk:** the browser only lets Fullscreen
mode survive on the page that requested it. A real page navigation
(`location.href = 'form.html'`) silently kills fullscreen. So
"navigating" between the landing screen, the form, and the thank-you
message is just JavaScript hiding one `<section>` and showing
another — the browser tab never changes.

**The live-results dashboard is now a separate page**, `dashboard.html`
+ `dashboard.js`, meant to be opened only on the TV / results screen —
not on the kiosk device collecting responses, and not reachable from
the kiosk's QR code. It connects to the same Firestore project and
updates its pie/doughnut charts live via `onSnapshot`, with no
"Home" button and no link back to the kiosk — it's meant to just sit
open on the TV for the whole event.

You get **7 files** (plus images):
- `index.html` + `app.js` — the kiosk: landing → form → thank you
- `dashboard.html` + `dashboard.js` — the TV screen, live charts
- `styles.css`, `firebase-config.js`, `questions-config.js` — shared config, unchanged
- `background.png`, `dashbg.png`, `sponsor-strip.png` — images, unchanged

---

## Step 1 — Create a free Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it → keep defaults → **Create project**
3. Click the **web icon `</>`** on the project overview page to register a web app
4. Give it a nickname → **Register app**
5. Copy the `firebaseConfig` values Firebase shows you into **`firebase-config.js`**

(This project is already wired to Firebase project `event-41b5e` via `.firebaserc` and `firebase-config.js` — only redo this step if you're pointing it at a different Firebase project.)

---

## Step 2 — Turn on Firestore (the free database)

1. In Firebase Console: **Build → Firestore Database → Create database**
2. **Start in test mode** → pick a region close to your venue → **Enable**

The first submitted response automatically creates a `responses`
collection. `firestore.rules` in this folder already locks writes down
to only allow creating new responses (not reading/editing/deleting
from outside the dashboard) — publish it with:

```
firebase deploy --only firestore:rules
```

---

## Step 3 — Customize your event details and questions

Open **`questions-config.js`** — the only file you need to edit for
content: `EVENT` (name, tagline, dates, venue) and `QUESTIONS`. The
landing screen, form, and dashboard all read from this file
automatically.

---

## Step 4 — Run it locally, kiosk and dashboard on separate ports

Because the form uses ES module imports, don't open the HTML files with
a `file:///` URL — it will fail silently. Serve the same folder twice,
on two different ports, in two separate terminals:

**Terminal 1 — kiosk (form device):**
```
npx serve . -l 3000
```
Open `http://localhost:3000/index.html` on the kiosk device/tablet.

**Terminal 2 — dashboard (TV screen):**
```
npx serve . -l 4000
```
Open `http://localhost:4000/dashboard.html` on the TV's browser.

Both serve the exact same files from the same folder — they're just
running on two ports so you can open them on two different
screens/devices at once, and so you never hand out the dashboard
URL by accident. (On the TV machine itself, `http://localhost:4000/...`
works; from another device on the same network, use that machine's
local IP instead of `localhost`, e.g. `http://192.168.1.23:4000/dashboard.html`.)

---

## Step 5 — Host it for free (kiosk and dashboard both live)

```
npm install -g firebase-tools
firebase login
firebase use event-41b5e
firebase deploy
```

You'll get one live base URL, e.g. `https://event-41b5e.web.app`.
Both pages are on it — just use different paths, not different ports,
once it's hosted:
- Kiosk: `https://event-41b5e.web.app/index.html` → put this in your QR code
- Dashboard: `https://event-41b5e.web.app/dashboard.html` → open this only on the TV, never share it publicly

---

## Step 6 — On event day

1. Open the kiosk URL on the kiosk device → tap **Click to Enter**
   (this is the fullscreen prompt) → fill the form → see **Thank you**
   → it automatically returns to the landing screen a few seconds
   later, ready for the next participant — fullscreen never drops
2. Separately, open the dashboard URL on the TV's browser and leave
   it open for the whole event
3. Pie/doughnut charts on the TV update live within a second or two
   of each submission
