# Production Repair Plan — Al-Andalos-Rijschool-V2

## Non-negotiable constraints
- Preserve the existing application architecture and code structure.
- Do not redesign, restyle, or alter the existing UI/UX.
- Do not create V3 or a replacement application.
- Complete missing production behavior in-place.
- Remove demo/fallback behavior from production execution paths where real data is required.
- Server-side authorization is authoritative; never trust browser-provided roles or sync permissions.

## Required completion gates
1. Authentication and authorization are real and fail closed.
2. Sync endpoints enforce authenticated role/ownership checks server-side.
3. Google Sheets is the authoritative source for configured business data; local demo data cannot silently override it.
4. Google Calendar create/update/cancel operations persist and use Calendar Event IDs.
5. Exactly three supported packages are enforced by canonical IDs and server-side validation.
6. Lessons, notifications, invoices and wallet use one consistent authoritative data flow without conflicting local-only state.
7. Admin operational statuses are derived from verified health checks, never hard-coded.
8. Native Google Sheets dashboard reads/writes through authorized server-side operations.
9. Real-time synchronization has a verified event path and reconnect behavior.
10. TypeScript, build, data-integrity and security checks pass before production release.

## Implementation rule
Every repair must be minimal and localized. Existing component contracts, routes, types, styling, navigation, and visual behavior must remain intact unless a security fix absolutely requires a backend contract change.
