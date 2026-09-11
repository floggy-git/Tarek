# Tarek Rijschool

Tarek Rijschool is a full-stack driving school platform for student management, trainer management, lessons, payments, reporting, Google Sheets integration, and the AI driving coach.

## Run locally

Prerequisites: Node.js 22+

1. Install dependencies:
   `npm install`
2. Configure the required environment variables from `.env.example`.
3. Start the application:
   `npm run dev`

## Production

The application is maintained in the `main` branch of this repository. Google Sheets remains the master data/control system, while the Node/Express server provides the application API and services.

GitHub Pages is used for the static frontend deployment only; server-side API functionality requires the configured application backend.

<!-- quality-gate-auth-repair-trigger -->
