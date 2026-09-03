/**
 * Al-Andalos Driving Academy — Lessons Operations (Completion, Route Logs & Evaluations)
 */

/**
 * Handles completing a lesson, logging trainer reports, releasing payments, and issuing PDF tax invoices.
 */
function apiCompleteLesson(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName("Bookings");
  const completedSheet = ss.getSheetByName("CompletedLessons");

  const bookingId = params.bookingId;
  const score = Number(params.score || 8);
  const feedback = params.feedback || "Good progress, keep polishing mirror checks.";
  const examReady = params.examReady || false;

  // Search booking
  const bookings = bookingsSheet.getDataRange().getValues();
  let bookingRow = -1;
  let booking = null;

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId) {
      bookingRow = i + 1;
      booking = {
        id: bookings[i][0],
        studentId: bookings[i][1],
        studentName: bookings[i][2],
        trainerId: bookings[i][3],
        trainerName: bookings[i][4],
        date: bookings[i][5],
        duration: Number(bookings[i][7]),
        price: Number(bookings[i][8])
      };
      break;
    }
  }

  if (!booking) throw new Error("Booking record " + bookingId + " not found.");

  // Mark Booking as Completed
  bookingsSheet.getRange(bookingRow, 11).setValue("completed");

  // Save to CompletedLessons sheet
  const recordId = "CL-" + Date.now();
  completedSheet.appendRow([
    recordId,
    bookingId,
    booking.studentName,
    booking.trainerName,
    booking.date,
    booking.duration,
    booking.price,
    score,
    feedback,
    "FALSE", // Default route points logged false
    "pending"
  ]);

  // Auto-generate official invoice documentation
  const invDetails = apiCreateInvoice({
    studentId: booking.studentId,
    trainerId: booking.trainerId,
    bookingsList: bookingId
  });

  // If exam eligibility flagged, update CBR status
  if (examReady) {
    const studentSheet = ss.getSheetByName("Students");
    const students = studentSheet.getDataRange().getValues();
    for (let i = 1; i < students.length; i++) {
      if (students[i][0].toString() === booking.studentId) {
        studentSheet.getRange(i + 1, 9).setValue(95); // Readiness score
        break;
      }
    }
  }

  // Get student email to send confirmation
  const student = apiGetStudentDashboard(booking.studentId).student;
  
  // Dispatch completion email report with notes
  sendResponsiveEmail(student.email, student.name, "completion", {
    date: booking.date,
    duration: booking.duration,
    notes: feedback
  });

  writeAdminLog("Complete Lesson API", "App API", "Lesson " + bookingId + " finalized. Score: " + score);

  return { success: true, recordId, invoiceId: invDetails.invoiceId };
}

/**
 * ERP Admin Macro: Complete active lesson row inside the Spreadsheet.
 */
function menuCompleteLesson() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  const cell = sheet.getActiveCell();
  const row = cell.getRow();

  if (row === 1) {
    ui.alert("Error", "Please click on a valid booking row first.", ui.ButtonSet.OK);
    return;
  }

  const bookingId = sheet.getRange(row, 1).getValue();
  if (!bookingId || !bookingId.toString().startsWith("B-")) {
    ui.alert("Error", "Selected cell does not belong to a valid booking row.", ui.ButtonSet.OK);
    return;
  }

  const score = ui.prompt("Complete Lesson", "Trainer score evaluation (1 to 10):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const notes = ui.prompt("Complete Lesson", "Constructive training feedback notes:", ui.ButtonSet.OK_CANCEL).getResponseText();

  try {
    apiCompleteLesson({
      bookingId,
      score,
      feedback: notes,
      examReady: false
    });
    ui.alert("Lesson Finalized", "Deductions completed, student email sent, and PDF tax invoices generated!", ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Failed", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Saves real-time GPS coordinates during a practical session to RouteTracking sheet.
 */
function apiSaveRoute(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName("RouteTracking");

  const bookingId = params.bookingId;
  const studentName = params.studentName;
  const trainerName = params.trainerName;
  const points = params.points; // Array of {lat, lng}

  if (!points || !Array.isArray(points)) throw new Error("Points must be an array of GPS nodes.");

  points.forEach((pt, idx) => {
    const routeId = "RT-" + bookingId + "-" + Date.now() + "-" + idx;
    routeSheet.appendRow([
      routeId,
      bookingId,
      studentName,
      trainerName,
      pt.lat,
      pt.lng,
      new Date().toLocaleTimeString()
    ]);
  });

  return { success: true, loggedCount: points.length };
}

/**
 * Fetches the interactive GPS route logs associated with a Booking ID for map display.
 */
function apiGetRoute(bookingId) {
  if (!bookingId) throw new Error("Booking ID required.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeData = ss.getSheetByName("RouteTracking").getDataRange().getValues();
  const pts = [];

  for (let i = 1; i < routeData.length; i++) {
    if (routeData[i][1].toString() === bookingId) {
      pts.push({
        lat: Number(routeData[i][4]),
        lng: Number(routeData[i][5]),
        timestamp: routeData[i][6]
      });
    }
  }

  return { bookingId, points: pts };
}
