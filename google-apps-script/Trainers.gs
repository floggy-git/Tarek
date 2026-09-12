/**
 * TAREK RIJSCHOOL — Trainer Operations.
 */

function apiGetTrainerDashboard(identifier) {
  if (!identifier) throw new Error('Trainer email or ID is required.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trainerSheet = ss.getSheetByName('Trainers');
  const bookingsSheet = ss.getSheetByName('Bookings');
  if (!trainerSheet || !bookingsSheet) throw new Error('Required trainer sheets are missing.');

  const trainers = trainerSheet.getDataRange().getValues();
  let trainer = null;
  for (let i = 1; i < trainers.length; i++) {
    if (String(trainers[i][0] || '') === String(identifier) || String(trainers[i][2] || '').toLowerCase() === String(identifier).toLowerCase()) {
      trainer = {
        id: trainers[i][0], name: trainers[i][1], email: trainers[i][2], phone: trainers[i][3],
        license: trainers[i][4], vehicle: trainers[i][5], rate: Number(trainers[i][6]) || 0
      };
      break;
    }
  }
  if (!trainer) throw new Error('Trainer profile not found.');

  const bookings = bookingsSheet.getDataRange().getValues();
  const trainerBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (String(bookings[i][3] || '') === String(trainer.id)) {
      trainerBookings.push({
        bookingId: bookings[i][0], studentId: bookings[i][1], studentName: bookings[i][2], date: bookings[i][5],
        time: bookings[i][6], duration: Number(bookings[i][7]), price: Number(bookings[i][8]), pickup: bookings[i][9], status: bookings[i][10]
      });
    }
  }
  return { trainer, bookings: trainerBookings };
}

function createTrainer(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Trainers');
  if (!sheet) throw new Error('Trainers sheet is missing.');
  const name = String(params && params.name || '').trim();
  if (!name) throw new Error('Trainer name is required.');
  const email = String(params && params.email || '').trim();
  const phone = String(params && params.phone || '').trim();
  const license = String(params && params.license || '').trim();
  const vehicle = String(params && params.vehicle || '').trim();
  const rate = Number(params && params.rate);
  if (!(rate > 0)) throw new Error('Trainer hourly rate must be greater than zero.');
  const id = 'TR-' + Date.now();
  sheet.appendRow([id, name, email, phone, license, vehicle, rate, 'active']);
  writeAdminLog('Create Trainer', 'System', 'Successfully registered trainer ' + name + ' (' + id + ')');
  return { success: true, trainerId: id, name };
}

function menuAddTrainer() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt('Register Trainer', 'Enter trainer name:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!name) return;
  const email = ui.prompt('Register Trainer', 'Enter trainer email:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const license = ui.prompt('Register Trainer', 'License classification:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const vehicle = ui.prompt('Register Trainer', 'Assigned vehicle model:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const rate = ui.prompt('Register Trainer', 'Hourly rate in EUR:', ui.ButtonSet.OK_CANCEL).getResponseText();
  try {
    const result = createTrainer({ name, email, license, vehicle, rate });
    ui.alert('Success', 'Trainer registered under ID ' + result.trainerId, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Registration Failed', String(err), ui.ButtonSet.OK);
  }
}

function updateTrainerSchedule(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduleSheet = ss.getSheetByName('TrainerSchedule');
  if (!scheduleSheet) throw new Error('TrainerSchedule sheet is missing.');
  const trainerId = String(params && params.trainerId || '').trim();
  const trainerName = String(params && params.trainerName || '').trim();
  const day = String(params && params.dayOfWeek || '').trim();
  const startTime = String(params && params.startTime || '').trim();
  const endTime = String(params && params.endTime || '').trim();
  const isAvailable = params && params.isAvailable !== undefined ? String(params.isAvailable).toUpperCase() : 'TRUE';
  if (!trainerId || !trainerName || !day || !startTime || !endTime) throw new Error('Complete trainer schedule details are required.');

  const data = scheduleSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === trainerId && String(data[i][2] || '').toLowerCase() === day.toLowerCase()) {
      scheduleSheet.getRange(i + 1, 4).setValue(startTime);
      scheduleSheet.getRange(i + 1, 5).setValue(endTime);
      scheduleSheet.getRange(i + 1, 6).setValue(isAvailable);
      writeAdminLog('Update Schedule', 'System', 'Schedule updated for trainer ' + trainerName + ' on ' + day);
      return { success: true };
    }
  }
  scheduleSheet.appendRow([trainerId, trainerName, day, startTime, endTime, isAvailable]);
  writeAdminLog('Update Schedule', 'System', 'Schedule created for trainer ' + trainerName + ' on ' + day);
  return { success: true };
}

function menuUpdateSchedule() {
  const ui = SpreadsheetApp.getUi();
  const tName = ui.prompt('Update Trainer Schedule', 'Trainer Full Name:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!tName) return;
  const days = ui.prompt('Update Trainer Schedule', 'Working Day:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const start = ui.prompt('Update Trainer Schedule', 'Start Hour (HH:MM):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const end = ui.prompt('Update Trainer Schedule', 'End Hour (HH:MM):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Trainers');
  if (!sheet) throw new Error('Trainers sheet is missing.');
  const data = sheet.getDataRange().getValues();
  let trainerId = '';
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').toLowerCase() === tName.toLowerCase()) { trainerId = String(data[i][0] || ''); break; }
  }
  if (!trainerId) { ui.alert('Error', 'Trainer not found.', ui.ButtonSet.OK); return; }
  try {
    updateTrainerSchedule({ trainerId, trainerName: tName, dayOfWeek: days, startTime: start, endTime: end, isAvailable: true });
    ui.alert('Success', 'Trainer schedule synchronized.', ui.ButtonSet.OK);
  } catch (err) { ui.alert('Failed', String(err), ui.ButtonSet.OK); }
}
