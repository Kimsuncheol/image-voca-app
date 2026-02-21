# Member Administration Software Requirements Specification (As-Is)

## Purpose
This document specifies the currently implemented Member Administration feature as-is for archival and future reference. It describes behavior present in the codebase before decommission.

## Actors and Permissions
- Actor: Authenticated admin user.
- Non-admin users are denied access and shown an access-denied UI.
- Unauthenticated users are not granted admin access.

## Screen Flows
1. Admin opens `/admin/members` from settings.
2. Screen checks admin permission from Firestore `users/{uid}.role`.
3. If authorized, screen loads members list and plan distribution stats.
4. Admin can:
- Search by name/email.
- Filter by subscription plan and role.
- Open member detail modal.
- Edit role.
- Edit subscription plan.
5. Updates are written to Firestore and reflected in local UI state.

## Functional Requirements
- FR-1: The system shall gate screen access to admin users only.
- FR-2: The system shall load all members from Firestore for list display.
- FR-3: The system shall support case-insensitive search by `displayName` and `email`.
- FR-4: The system shall filter by plan (`free`, `voca_unlimited`, `voca_speaking`) and role (`all`/`admin`).
- FR-5: The system shall display aggregate counters for total, unlimited, and speaking members.
- FR-6: The system shall open a detail modal per member.
- FR-7: The system shall allow role update (`student`/`admin`).
- FR-8: The system shall allow subscription update and refresh plan counters.
- FR-9: The system shall show loading, empty, and error states.

## Data Contracts
- `UserRole`: `student | admin`.
- `SubscriptionPlan`: `free | voca_unlimited | voca_speaking`.
- `MemberListItem`: `uid`, `email`, `displayName`, `photoURL?`, `role`, `planId`, `lastActiveDate`, `currentStreak`, `totalWordsLearned`.
- `Member`: `uid`, `email`, `displayName`, `photoURL?`, `role`, `subscription`, `stats`, `createdAt`, `lastLoginAt?`.
- `MemberSubscription`: `planId`, `isPermanent`, `expiresAt?`, `activatedAt?`, `activatedBy?`.
- `MemberStats`: `dailyGoal`, `currentStreak`, `longestStreak`, `lastActiveDate`, `targetScore`, `totalWordsLearned`, `totalQuizAnswers`, `totalCorrectAnswers`.

## Firestore Dependencies
- Collection: `users`.
- Reads: permission check from `users/{currentUid}`, member list from `users`, and member detail from `users/{memberUid}`.
- Writes: role update to `users/{memberUid}.role` and subscription update to `users/{memberUid}.subscription`.
- Derived values: `dailyStats` is reduced to aggregate learning/quiz totals, and `subscription.planId` defaults to `free` if missing.

## Error Handling
- Permission check failures are logged and end loading state.
- Member list load failures show localized alert (`admin.members.loadError`).
- Member detail failures show localized alert (`admin.members.detailsError`).
- Update failures show localized error alert and preserve prior state.

## Non-Functional Requirements
- Theme-aware rendering (dark/light).
- Localization via `react-i18next` keys under `admin.members`.
- Client-side memoized filtering via `useMemo` for list responsiveness.
- Immediate UI consistency after successful updates.

## Known Limitations
- `getAllMembers` fetches full `users` collection (no server-side pagination for active screen path).
- Plan counters are derived by loading all members.
- Role check uses `includes("admin")` semantics against stored role value.
- No dedicated audit log for admin updates.

## Out of Scope
- User self-service account management.
- Billing provider integration.
- Background sync or offline-first member admin workflow.

## Removal Notes
- This feature is archived and intentionally decommissioned in the same change set.
- Firestore data remains unchanged; only app code paths and UI access are removed.
