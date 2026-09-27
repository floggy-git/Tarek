# TAREK RIJSCHOOL: sheet and application integration

The **Students** sheet is the source of record. Firebase Authentication checks
passwords and holds the login account. A row in the sheet alone does not create
a Firebase account; the installed sheet form provisions both. The application
stores the student's name and profile in the sheet; it never writes the password
into a student row or sends a new password through email. The existing forgot
password screen emails a one-time Firebase reset link, where the student chooses
their new password. The old local reset endpoints are retired.
The application
reads an authenticated student's row, lessons, and wallet from its own server
every 10 seconds and checks the sheet again at login. Admin student edits use
targeted row writes. Old browser state is never published over the entire
Students sheet.

## Before enabling the new login path

### Apps Script gateway (no Cloud Run)

The sheet remains the data store. Deploy `deliverables/StudentGateway.gs`
in a **different standalone Apps Script project**, with no administration
functions from the bound spreadsheet project. Otherwise an anonymously
accessible web app would expose the bound project's spreadsheet functions.
Deploy the gateway web app as **execute as owner**, **anyone**, so Firebase
students can reach it. Every gateway student request verifies a Firebase ID
token; sheet administration uses a timestamped HMAC signature. The account
password stays in Firebase Authentication and never appears in the sheet.

Set gateway Script Properties `SHEET_ID`, `FIREBASE_API_KEY`,
`FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `APP_ORIGIN` (the
browser application's HTTPS origin), and `ADMIN_SECRET`. Give the service
account permission to manage Firebase Authentication users. Configure the
bound sheet project's Script Properties `GATEWAY_URL` (the gateway web app URL)
and `WEBHOOK_SECRET` (the same value as `ADMIN_SECRET`). Set GitHub repository
variable `STUDENT_GATEWAY_URL` to the gateway URL before building Pages. This
removes the need to host the Node server for student records. Other existing
application API features may still need that server until migrated separately.

Do not deploy or replace the bound administration script until a disposable
student can register, sign in, read only their own dossier, receive a Firebase
password reset email, and lose access immediately after deletion. The iframe
gateway transport requires a browser smoke test against the actual deployed
Apps Script URL; local unit tests cannot prove browser sandbox behavior.

### Existing Node server option

1. Set the server secrets `FIREBASE_SERVICE_ACCOUNT_JSON`,
   `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `GOOGLE_SPREADSHEET_ID`, and
   `SHEETS_WEBHOOK_SECRET`. Store JSON in a server secret store; never place a
   private key in frontend variables or in the Apps Script source. The service
   account must have Firebase Authentication user management permissions and
   editor access to the specific spreadsheet.
2. Set Apps Script **Script Properties** `BACKEND_URL` (the deployed app URL)
   and `WEBHOOK_SECRET` (the exact same value as `SHEETS_WEBHOOK_SECRET`).
   If the browser app runs on GitHub Pages, set repository variable
   `API_BASE_URL` to the HTTPS API server origin and set its matching
   `FRONTEND_URL` to the Pages origin. The Pages workflow builds only the
   frontend; the server must be deployed separately before these endpoints
   work. The student API refuses to run from Pages without this configuration.
3. Install the single, standalone control center `.gs` file in the spreadsheet's
   bound Apps Script project, replacing the earlier standalone version. Save,
   reload the sheet, and run `installLiveSyncTrigger` once to pick up manual
   cell edits. Existing sheet button handler names remain in place.
4. Test a disposable student end to end: creation in the sheet, Firebase login,
   profile and wallet refresh, edit, and deletion. Never use a real student's
   account for the deletion test.

Student deletion requires entering `DELETE ST-000000` with the **actual** ID.
The script calls the authenticated server to delete the Firebase account
first. If that call fails, no student rows are removed. It then removes rows
associated with the student in the listed sheet tabs and emits a signed
invalidation event. Deleted users cannot log back in: login checks both
Firebase credentials and an active Students row. Open sessions are blocked
while their sheet status is unverified and are signed out after an inactive
account response. The server records an HMAC digest of the deleted email in
a hidden `DeletedStudents` tab and rejects later registration with the same
email. The email itself is not stored in that registry.

Keep your original sheet and code backups until the disposable account test
passes. The current deletion flow removes linked spreadsheet rows; it does
not purge PDFs or other Google Drive files referenced by those rows.
