# CareBridge

CareBridge is a web app I'm building for ITO5032 Assessment 3. It's for a
fictional charity called Enable Collective, and the idea is to help people
with disabilities (and their families/carers/support workers) find health
services, community resources and book appointments, all in one place.

Aiming for the HD+ grade band.

**Student:** Muhib — 34717706
**Unit:** ITO5032 Web Applications Development

---

## Tech stack

- Vue 3 (Composition API) + Vite
- Vue Router
- Pinia for state
- Bootstrap 5 for styling
- Firebase (Auth, Firestore, Cloud Functions, Hosting)
- SendGrid for emails
- Mapbox for the services map
- Chart.js for the admin dashboard charts
- FullCalendar for appointment booking
- PapaParse / jsPDF for CSV and PDF export

## Running it locally

```bash
npm install
npm run dev
```

You'll need a `.env.local` file with the Firebase config — see
`.env.local.example` for what keys it needs. Don't commit this file.

```bash
npm run build     # production build
firebase deploy --only hosting   # deploy to hosting
```

## Live link

https://carebridge-a3.web.app


## Design

All the screens follow the Figma design from Assessment 1 — colours, fonts,
layout etc. are all pulled from there rather than just using default
Bootstrap styling.
