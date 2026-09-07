# Production Repair Plan

This branch repairs the existing application in-place without changing UI/UX or introducing a V3 architecture.

## Required production gates
- Firebase authentication is authoritative; no demo credentials or password hashes in the client.
- Google Sheets is the canonical data source; no hard-coded spreadsheet IDs or fabricated production records.
- Exactly the three canonical package records are accepted from the Packages source.
- Google Calendar lesson lifecycle supports create, durable event-ID persistence, edit, and cancellation.
- `/api/sync/*` is protected by server-side Firebase-token validation and authenticated student scope.
- Notifications, invoices, wallet, lessons, dashboard and realtime sync preserve existing architecture.
- TypeScript/lint, production build, source-of-truth and static-security gates pass.

## Non-goals
- No UI redesign.
- No UX flow rewrite.
- No V3/replacement application.
- No migration away from the existing Google Sheets / Calendar / Drive integration architecture.

## Repair method
Large existing source files are repaired through the repository's deterministic production-repair step so the same changes are applied before lint/build/dev, while keeping the original UI and application architecture intact.

