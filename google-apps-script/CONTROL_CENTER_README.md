# Master Control Center

The master panel is implemented in `ControlCenter.gs` and `ControlCenter.html`.

Open it from the spreadsheet menu **Control Center → Open Master Panel**.

For the deployed Apps Script web app, the existing `API.gs` can route an empty `action` to `controlCenterHtml()` while preserving all existing API actions.
