# Company driving categories

Each installation represents one school/company. B is included. A, AM, C, D and T are optional company modules; these are not student subscriptions. Existing blank categories resolve to B without rewriting old data.

## Files

- `autoB.ts`: passenger car / Auto B.
- `motorA.ts`: motorcycle / Motor A.
- `bromfietsAM.ts`: moped / Bromfiets AM.
- `vrachtautoC.ts`: truck / Vrachtauto C.
- `busD.ts`: bus D.
- `tractorT.ts`: tractor T.
- `types.ts` and `index.ts`: shared category schema/registry.
- `companyCategorySheets.ts`: read-only company activation feed.
- `CategorySelect.tsx`: multilingual selector and category badge.
- `../utils/companyCategoryAccess.ts`: activation, expiry and pricing rules.
- `../../google-apps-script/CompanyCategories.gs`: server checks and a public, non-personal category response.

Keep shared lessons, maps, wallets and PDF engines shared; add category-specific settings in its named module. Do not duplicate whole dashboards per category.

## Operator control in Google Sheets

`CompanyCategories!A1:H7` contains:
`Category | Name | Status | Starts At | Ends At | Hourly Rate | Plan | Notes`.

After payment is confirmed externally, the application owner changes Status to `active` for the purchased category and sets the lesson hourly rate. Dates are optional YYYY-MM-DD; the end date is inclusive in Europe/Amsterdam. Blank dates mean no time limit. Valid states are `active`, `inactive`, `pending`, `expired`. B stays available. Duplicate or invalid rows do not unlock add-ons.

Activation columns A:E in the existing workbook are owner-protected. Do not give a customer edit access to the vendor's subscription controls. This is manual activation: there is no checkout or payment verification in this change.

`Packages!N` is `category`, `Lessons!Q` is `Category`. Existing records retain their original columns, and blank categories remain B. Add-on lessons use their category's hourly rate; missing rates prevent booking. Existing lessons remain visible after expiry. PDF invoice lines retain the lesson category. Both Sheets adapters preserve the category on read/write.

## Deployment

The web app reads CompanyCategories through the existing authenticated Sheets connection. It refreshes on focus and each minute; failure leaves B only. The app cannot write the category register through settings forms. Subscription values are never trusted from a previous local-storage session.

For clients without a Sheets OAuth token/API key, deploy `CompanyCategories.gs` with the updated API.gs, Bookings.gs, ControlCenter.gs, Students.gs and Trainers.gs in the appropriate Apps Script project, and configure `VITE_GOOGLE_SHEETS_WEB_APP_URL`. The new GET action `getCompanyCategories` returns no student data or private operator notes. The booking API validates add-on status server-side and uses the configured rate.

The live spreadsheet in this task uses an older combined Apps Script file. Do not replace it blindly with this repository's split scripts: first inspect the live project, add the category helpers, merge the equivalent dispatch/create/read changes, then redeploy. Repository deployment does not deploy Apps Script.

This is a per-school category feature foundation, not a tamper-proof SaaS license service. Client-only visibility is not authorization. Before selling broadly, route every protected write through a vendor-controlled authenticated backend and keep entitlement ownership separate from customer-owned sheets. A customer with spreadsheet ownership can otherwise change its copy.

## Verification

`npm run test:categories` verifies B defaults, add-on activation, expiry/date boundaries, malformed/duplicate rows, multilingual selectors, both persistence adapters and Apps Script checks. `npm run lint` and the standard CI quality gates/build also run.
