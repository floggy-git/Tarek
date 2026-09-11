/**
 * Al-Andalos Driving Academy — HTTP REST API Routing Engine
 */

/**
 * REST Web API - doGet handles all Read endpoints.
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;

    // Empty action opens the Master Control Center while preserving every API route below.
    if (!action) {
      return controlCenterHtml();
    }

    let payload = null;

    if (action === "getStudentDashboard") {
      payload = apiGetStudentDashboard(e.parameter.studentEmail || e.parameter.studentId);
    } else if (action === "getTrainerDashboard") {
      payload = apiGetTrainerDashboard(e.parameter.trainerEmail || e.parameter.trainerId);
    } else if (action === "getRoute") {
      payload = apiGetRoute(e.parameter.bookingId);
    } else if (action === "getLearningProgress") {
      payload = apiGetLearningProgress(e.parameter.studentId);
    } else {
      throw new Error("Action '" + action + "' is not supported by doGet Router.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * REST Web API - doPost handles all Write endpoints.
 * Authentication is handled by the application's Firebase authentication boundary;
 * the legacy Google Sheets password-login endpoint is intentionally not exposed here.
 */
function doPost(e) {
  try {
    const postBody = JSON.parse(e.postData.contents);
    const action = postBody.action;
    let payload = null;

    if (!action) {
      throw new Error("Missing action parameter in request payload.");
    }

    if (action === "createBooking") {
      payload = apiCreateBooking(postBody);
    } else if (action === "completeLesson") {
      payload = apiCompleteLesson(postBody);
    } else if (action === "addDeposit") {
      payload = apiAddDeposit(postBody);
    } else if (action === "createInvoice") {
      payload = apiCreateInvoice(postBody);
    } else if (action === "sendInvoice") {
      payload = apiSendInvoice(postBody);
    } else if (action === "saveRoute") {
      payload = apiSaveRoute(postBody);
    } else {
      throw new Error("Action '" + action + "' is not supported by doPost Router.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
