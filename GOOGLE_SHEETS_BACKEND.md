# Al-Andalos Rijschool Platform — Google Sheets Database & Apps Script ERP Backend

This document details the complete database blueprint, Google Spreadsheet ERP layout, formulas, and Google Apps Script backend code designed to act as the professional control center for **Al-Andalos Rijschool**.

---

## 1. Google Sheets Database Architecture (16 Sheets)

To establish the enterprise resource planning (ERP) system, create a new Google Spreadsheet named **"Al-Andalos Rijschool Database"** containing the following 16 sheets. Ensure that sheet names match *exactly* (case-sensitive) and contain the following column structures in Row 1.

### Sheet 1: `Dashboard`
An interactive dashboard displaying live statistics computed via spreadsheet formulas and a panel describing how to execute custom administrative macros directly. No standard headers; custom formatted inside the initializer.

### Sheet 2: `Students`
Tracks driving school students, contact information, packages, and digital wallet balances.
* **Columns (Row 1):**
  * `A: Student ID` *(e.g., ST-101)*
  * `B: Full Name`
  * `C: Email`
  * `D: Phone`
  * `E: Date of Birth`
  * `F: City`
  * `G: Current Package`
  * `H: Balance` *(Calculated dynamically by summing wallet ledger entries)*
  * `I: Exam Readiness Score` *(0% - 100% based on simulator exams and trainer score evaluations)*
  * `J: Joined Date`
  * `K: Password`
  * `L: Status` *(active | inactive)*

### Sheet 3: `Trainers`
Maintains trainer profiles, license certifications, rates, and vehicles.
* **Columns (Row 1):**
  * `A: Trainer ID` *(e.g., TR-201)*
  * `B: Full Name`
  * `C: Email`
  * `D: Phone`
  * `E: License Category` *(e.g., B Klasse - Manual/Auto)*
  * `F: Vehicle Type` *(e.g., Tesla Model 3)*
  * `G: Rate Per Hour` *(e.g., €65)*
  * `H: Status` *(active | inactive)*

### Sheet 4: `Bookings`
Saves all practical driving lessons booked either through the web application or Sheets UI.
* **Columns (Row 1):**
  * `A: Booking ID`
  * `B: Student ID`
  * `C: Student Name`
  * `D: Trainer ID`
  * `E: Trainer Name`
  * `F: Date` *(YYYY-MM-DD)*
  * `G: Time` *(HH:MM)*
  * `H: Duration (Hours)`
  * `I: Price`
  * `J: Pickup Location`
  * `K: Status` *(upcoming | completed | cancelled)*
  * `L: Calendar Event ID` *(Used to update/delete synched Google Calendar events)*

### Sheet 5: `CompletedLessons`
Logs feedback, evaluations, scores, and route info for all concluded lessons.
* **Columns (Row 1):**
  * `A: Record ID`
  * `B: Booking ID`
  * `C: Student Name`
  * `D: Trainer Name`
  * `E: Date`
  * `F: Duration`
  * `G: Price`
  * `H: Score (1-10)`
  * `I: Trainer Feedback`
  * `J: Route Points Logged` *(TRUE | FALSE)*
  * `K: Invoice Status` *(generated | pending)*

### Sheet 6: `WalletTransactions`
Double-entry accounting ledger of all customer deposits, lesson payments, refunds, and adjustments.
* **Columns (Row 1):**
  * `A: Transaction ID`
  * `B: Student ID`
  * `C: Student Name`
  * `D: Date`
  * `E: Timestamp`
  * `F: Type` *(deposit | payment | refund | adjustment)*
  * `G: Amount`
  * `H: Description`
  * `I: Operator` *(App API | Sheets UI)*

### Sheet 7: `Invoices`
Contains official invoice records itemized with BTW tax breakouts.
* **Columns (Row 1):**
  * `A: Invoice ID`
  * `B: Student ID`
  * `C: Student Name`
  * `D: Trainer ID`
  * `E: Trainer Name`
  * `F: Date Issued`
  * `G: Lesson List` *(Comma-separated Booking IDs)*
  * `H: Subtotal` *(Gross sum divided by 1.21)*
  * `I: VAT Rate` *(21% standard)*
  * `J: VAT Amount` *(Grand Total - Subtotal)*
  * `K: Grand Total`
  * `L: PDF URL`
  * `M: Status` *(unpaid | paid | refunded)*

### Sheet 8: `CalendarSettings`
Links driving instructors to their designated Google Calendars.
* **Columns (Row 1):**
  * `A: Trainer ID`
  * `B: Trainer Name`
  * `C: Calendar ID`
  * `D: Sync Enabled` *(TRUE | FALSE)*

### Sheet 9: `TrainerSchedule`
Stores weekly shifts and hourly parameters for reservation filters.
* **Columns (Row 1):**
  * `A: Trainer ID`
  * `B: Trainer Name`
  * `C: Day of Week`
  * `D: Start Time`
  * `E: End Time`
  * `F: Is Available` *(TRUE | FALSE)*

### Sheet 10: `RouteTracking`
Compiles coordinate points logged by trainers during real-time sessions for replay screens.
* **Columns (Row 1):**
  * `A: Route ID`
  * `B: Booking ID`
  * `C: Student Name`
  * `D: Trainer Name`
  * `E: Latitude`
  * `F: Longitude`
  * `G: Timestamp`

### Sheet 11: `LearningProgress`
Tracks specific progress milestones for theory topics and physical maneuvers.
* **Columns (Row 1):**
  * `A: Progress ID`
  * `B: Student ID`
  * `C: Student Name`
  * `D: Category` *(Theory | Practical)*
  * `E: Topic Name`
  * `F: Percent Complete`
  * `G: Videos Completed`
  * `H: Videos Total`
  * `I: Last Updated`

### Sheet 12: `TheoryResults`
Records CBR practice examination results.
* **Columns (Row 1):**
  * `A: Result ID`
  * `B: Student ID`
  * `C: Student Name`
  * `D: Test Date`
  * `E: Test Type`
  * `F: Correct Answers`
  * `G: Total Questions`
  * `H: Passing Score` *(TRUE | FALSE)*
  * `I: Time Taken`

### Sheet 13: `Notifications`
Maintains log records of automated alerts.
* **Columns (Row 1):**
  * `A: Notification ID`
  * `B: Recipient ID`
  * `C: Recipient Name`
  * `D: Recipient Email`
  * `E: Message`
  * `F: Type` *(SMS | Email)*
  * `G: Status` *(Sent | Failed)*
  * `H: Timestamp`

### Sheet 14: `Reports`
Logs business, financial, and CBR passing performance report exports.
* **Columns (Row 1):**
  * `A: Report ID`
  * `B: Title`
  * `C: Date Generated`
  * `D: Type`
  * `E: Metric Summary` *(JSON metadata string)*
  * `F: Operator`

### Sheet 15: `EmailQueue`
Holds delayed emails for bulk processing or scheduling.
* **Columns (Row 1):**
  * `A: Email ID`
  * `B: Recipient Email`
  * `C: Subject`
  * `D: Body (HTML)`
  * `E: Queue Date`
  * `F: Send Date`
  * `G: Status` *(pending | sent)*

### Sheet 16: `AdminLogs`
Internal system auditing ledger.
* **Columns (Row 1):**
  * `A: Log ID`
  * `B: Timestamp`
  * `C: Action`
  * `D: Operator`
  * `E: Details`
  * `F: Source` *(App API | Sheets UI)*

### Sheet 17: `Settings`
Holds core administrative multipliers.
* **Columns (Row 1):**
  * `A: Key`
  * `B: Value`
  * `C: Description`

---

## 2. Integrated Dashboard & Live Formula Calculations

The first sheet, `Dashboard`, is beautifully formatted and computes metrics in real time utilizing native Google Sheets formulas:

1. **Total Active Students**:
   `=COUNTA(Students!A2:A)`
2. **Total Instructors**:
   `=COUNTA(Trainers!A2:A)`
3. **Total Bookings Registered**:
   `=COUNTA(Bookings!A2:A)`
4. **Completed Practical Lessons**:
   `=COUNTIF(Bookings!K2:K, "completed")`
5. **Total Invoiced Gross Revenue**:
   `=SUM(Invoices!K2:K)`
6. **Global System Wallet Deposits**:
   `=SUMIF(WalletTransactions!F2:F, "deposit", WalletTransactions!G2:G)`
7. **Global Net Balance Deductions**:
   `=SUMIF(WalletTransactions!F2:F, "payment", WalletTransactions!G2:G)`

Administrators do not need to compile stats manually. Standard cell referencing ensures live calculation.

---

## 3. Deployment Guide: Establishing the Live Web App Connection

To deploy and link this backend to your React client:

1. Open your Spreadsheet.
2. Go to **Extensions** -> **Apps Script**.
3. Recreate the codebase in Google Apps Script by adding the files from the `/google-apps-script/` directory matching their names (e.g. `Code.gs`, `API.gs`, `Students.gs`, etc.).
4. Click **Save** for all files.
5. Click **Run** on the `initDatabase` dropdown function to auto-build all 16 Sheets, establish formatting, set default business multipliers, and seed mock profiles!
6. Click **Deploy** -> **New deployment**.
7. Choose **Web app** as the deployment type.
8. Set the configuration options:
   * **Description:** `Al-Andalos School ERP Backend Web API`
   * **Execute as:** `Me` *(your Google email account)*
   * **Who has access:** `Anyone` *(required for the client's fetch API calls to bypass CORS controls)*.
9. Click **Deploy** and authorize the requested permissions (GmailApp, CalendarApp, SpreadsheetApp, etc.).
10. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycby.../exec`).
11. Paste this URL into your frontend configuration, permitting seamless live read/writes!

---

## 4. Google Sheets Control Center ERP Actions

Administrative users can manage the entire system without opening any command-line tool. A custom menu named **`🚗 Al-Andalos Control Center`** is created automatically in the spreadsheet's top menu bar when opened:

* **Add Student Profile**: Prompts for details and saves a new student record.
* **Add Trainer Profile**: Registers a new driving instructor.
* **Create New Booking**: Schedules a lesson, updates calendars, and sends confirmations.
* **Complete Selected Lesson**: Evaluates student performance and auto-creates BTW tax invoices.
* **Add Wallet Deposit**: Top-up student balances with auto-receipt dispatches.
* **Generate Invoice Document / Send Invoice**: Generates and mails professional invoice structures.
* **Send Balance Reminder**: Sends friendly emails warning students of low balances.
* **Update Trainer Schedule**: Updates operational hours on the fly.
* **Export Reports**: Extracts detailed JSON telemetry metadata summaries into the `Reports` sheet.
