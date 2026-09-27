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


## Sheet sidebar form buttons

`SheetFormButtons.gs` installs 16 native image buttons over the existing left navigation in `Dashboard`. The assigned public functions open the existing Control Center as a modal dialog, directly on the requested new-record form. Dashboard and Audit Logs open read-only views; School Settings opens its existing editor. Data writes use the current `controlCenterSaveRecord` backend.

Installation in the **spreadsheet-bound** Apps Script project:
1. Update `ControlCenter.gs` and `ControlCenter.html` from this branch.
2. Add `SheetFormButtons.gs` (all existing operational modules must remain).
3. Save and reload the spreadsheet. Select **TAREK RIJSCHOOL → Install sidebar form buttons** and complete Google's authorization if requested.
4. Check **New Student**, **New Lesson**, **New Trainer**, and **Add Deposit**. No sample records are inserted by the installer.

The installer preserves the dashboard's cells, formulas, dimensions, colors, and charts. It only replaces images with the `TAREK_FORM_BUTTON:` prefix; unrelated images are left alone. A failed image insertion rolls back the new images and retains the prior buttons. `removeSheetFormButtons` removes these overlays to reveal the original navigation. Reinstall after changing navigation dimensions.

Current limitations, not yet claimed as parity: image labels are English; image-assigned scripts target desktop Google Sheets. Student password reset in the React app is not copied into the Sheet form because the existing Sheet schema/save path does not support password storage. Wallet balance continues to use the existing deposits workflow. Native installation and live saves still require verification in the bound Apps Script project; repository changes alone do not activate buttons in Google Sheets.

Validation: `node tests/sheet-form-buttons.cjs` covers all 16 routes, modal JavaScript parsing, repeated installation, failure rollback, removal, and one-time form initialization. These are local mocks, not a live Google authorization or persistence test.
