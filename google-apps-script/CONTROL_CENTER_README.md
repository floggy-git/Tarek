# TAREK RIJSCHOOL — Google Apps Script

Canonical Master Control Center source:
- `ControlCenter.gs` — live CRUD, validation, relationships, audit logging and schema checks.
- `ControlCenter.html` — the Master Control Center user interface.
- `API.gs` — web-app routing for the existing application API.

Operational modules kept because they are used by the live API/workflows:
- `Students.gs`
- `Trainers.gs`
- `Bookings.gs`
- `Lessons.gs`
- `Wallet.gs`
- `Invoices.gs`
- `Notifications.gs`
- `Emails.gs`
- `Utils.gs`
- `Constants.gs`

The Control Center reads/writes the existing Google Sheets database. It does not create a second database.

The legacy standalone dialogs, duplicate single-file control center, Al-Andalos database initializer, legacy reports module and obsolete search console were removed after the Master Control Center replaced them.

Important: this repository currently contains no `.clasp.json` or GitHub workflow that pushes these files into a deployed Google Apps Script project. Updating `main` therefore does not by itself change an already deployed Apps Script project in Google.
