/**
 * Al-Andalos Driving Academy — Trainer Operations (CRUD & Work Schedules)
 */

/**
 * Returns trainer calendar availability, invoices, and completed lessons.
 */
function apiGetTrainerDashboard(identifier) {
  if (!identifier) throw new Error("Trainer email or ID is required.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trainers = ss.getSheetByName("Trainers").getDataRange().getValues();
  let trainer = null;

  for (let i = 1; i < trainers.length; i++) {
    if (trainers[i][0].toString() === identifier || trainers[i][2].toString().toLowerCase() === identifier.toLowerCase()) {
      trainer = {
        id: trainers[i][0],
        name: trainers[i][1],
        email: trainers[i][2],
        phone: trainers[i][3],
        license: trainers[i][4],
        vehicle: trainers[i][5],
        rate: Number(trainers[i][6])
      };
      break;
    }
  }

  if (!trainer) throw new Error("Trainer profile not found.");

  // Fetch associated bookings
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  const trainerBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][3].toString() === trainer.id) {
      trainerBookings.push({
        bookingId: bookings[i][0],
        studentId: bookings[i][1],
        studentName: bookings[i][2],
        date: bookings[i][5],
        time: bookings[i][6],
        duration: Number(bookings[i][7]),
        price: Number(bookings[i][8]),
        pickup: bookings[i][9],
        status: bookings[i][10]
      });
    }
  }

  return {
    trainer,
    bookings: trainerBookings
  };
}

/**
 * Programmatic helper to hire and register a new Trainer.
 */
function createTrainer(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trainersSheet = ss.getSheetByName("Trainers");
  const id = "TR-" + (trainersSheet.getLastRow() + 200);
  const name = params.name || "Unnamed Trainer";
  const email = params.email || "";
  const phone = params.phone || "+31 6 00000000";
  const license = params.license || "B Klasse";
  const vehicle = params.vehicle || "Standard Hatchback";
  const rate = Number(params.rate || 65);
  
  trainersSheet.appendRow([
    id, name, email, phone, license, vehicle, rate, "active"
  ]);
  
  writeAdminLog("Create Trainer", "System", "Successfully hired trainer " + name + " (" + id + ")");
  return { success: true, trainerId: id, name: name };
}

/**
 * ERP Admin Macro: Hire & register new trainer from Google Sheets UI inputs.
 */
function menuAddTrainer() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt("Hire Instructor", "Enter trainer name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!name) return;
  const email = ui.prompt("Hire Instructor", "Enter trainer email:", ui.ButtonSet.OK_CANCEL).getResponseText();
  const license = ui.prompt("Hire Instructor", "License classification (e.g. B Klasse):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const vehicle = ui.prompt("Hire Instructor", "Assigned vehicle model:", ui.ButtonSet.OK_CANCEL).getResponseText();

  const id = "TR-" + (SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Trainers").getLastRow() + 200);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Trainers").appendRow([
    id, name, email, "+31 6 00000000", license, vehicle, 65, "active"
  ]);

  ui.alert("Success", "Trainer registered under ID " + id, ui.ButtonSet.OK);
}

/**
 * Programmatic helper to update or set a trainer's shift schedule.
 */
function updateTrainerSchedule(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduleSheet = ss.getSheetByName("TrainerSchedule");
  const trainerId = params.trainerId || "TR-201";
  const trainerName = params.trainerName || "Instructeur Samir";
  const day = params.dayOfWeek || "Monday";
  const startTime = params.startTime || "09:00";
  const endTime = params.endTime || "18:00";
  const isAvailable = params.isAvailable !== undefined ? params.isAvailable.toString().toUpperCase() : "TRUE";

  const data = scheduleSheet.getDataRange().getValues();
  let rowUpdated = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === trainerId && data[i][2].toString().toLowerCase() === day.toLowerCase()) {
      rowUpdated = i + 1;
      break;
    }
  }

  if (rowUpdated !== -1) {
    scheduleSheet.getRange(rowUpdated, 4).setValue(startTime);
    scheduleSheet.getRange(rowUpdated, 5).setValue(endTime);
    scheduleSheet.getRange(rowUpdated, 6).setValue(isAvailable);
  } else {
    scheduleSheet.appendRow([trainerId, trainerName, day, startTime, endTime, isAvailable]);
  }

  writeAdminLog("Update Schedule", "System", "Schedule updated for trainer " + trainerName + " on " + day);
  return { success: true };
}

/**
 * ERP Admin Macro: Interactive Trainer Schedule updates.
 */
function menuUpdateSchedule() {
  const ui = SpreadsheetApp.getUi();
  const tName = ui.prompt("Update Trainer Schedule", "Trainer Full Name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!tName) return;

  const days = ui.prompt("Update Trainer Schedule", "Working Days (comma-separated, e.g. Monday, Tuesday):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const start = ui.prompt("Update Trainer Schedule", "Start Hour (HH:MM):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const end = ui.prompt("Update Trainer Schedule", "End Hour (HH:MM):", ui.ButtonSet.OK_CANCEL).getResponseText();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduleSheet = ss.getSheetByName("TrainerSchedule");
  const data = scheduleSheet.getDataRange().getValues();
  let updated = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toLowerCase() === tName.toLowerCase()) {
      scheduleSheet.getRange(i + 1, 3).setValue(days);
      scheduleSheet.getRange(i + 1, 4).setValue(start);
      scheduleSheet.getRange(i + 1, 5).setValue(end);
      updated = true;
    }
  }

  if (!updated) {
    scheduleSheet.appendRow(["TR-" + Date.now(), tName, days, start, end, "TRUE"]);
  }

  ui.alert("Success", "Trainer schedule settings successfully synchronized!", ui.ButtonSet.OK);
}
