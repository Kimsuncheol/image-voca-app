# Promotion Codes Administration Software Requirements Specification (As-Is)

## Purpose
This document specifies the current implementation of `app/admin/promotion-codes.tsx` as-is for archival and maintenance reference. It covers admin-side promotion code generation and management behavior currently implemented in the screen, component layer, and promotion code service.

## Actors and Permissions
- Actor: Authenticated admin user.
- Non-admin users are denied access and shown an access-denied UI.
- Permission check reads `users/{uid}.role` and treats role values containing `"admin"` as authorized.

## Screen Flows
1. Admin opens `/admin/promotion-codes`.
2. Screen validates admin permission (loading state shown during check).
3. If authorized, screen loads all promotion codes from Firestore.
4. Admin switches between two tabs (`generate` for creation, `active` for list/management).
5. On code generation success, screen refreshes active list.
6. On deactivation success, screen refreshes active list.

## Functional Requirements
- FR-1: The screen shall gate access to admin users only.
- FR-2: The screen shall present two tabs (`generate`, `active`) with independent UI concerns.
- FR-3: The generation form shall collect event period, plan, duration mode, usage limits, description, and batch count (`1-100`).
- FR-4: The generation flow shall validate non-empty description and code count range `1-100` before submit.
- FR-5: The generation flow shall call `generatePromotionCodes(request, userId)` and display generated codes.
- FR-6: Generated codes shall be tappable and copied to clipboard.
- FR-7: The active list shall render code cards with status, description, plan, usage, and expiration.
- FR-8: The active list shall support manual refresh.
- FR-9: Active codes shall support deactivation via confirm dialog.
- FR-10: Deactivation shall update backend status and refresh list state.

## Data Contracts
- `PlanType`: `voca_unlimited | voca_speaking`.
- `PromotionCodeStatus`: `active | inactive | expired`.
- `PromotionBenefit`: `type`, `planId`, `isPermanent`, `durationDays?`.
- `EventPeriod`: `startDate`, `endDate` (ISO strings).
- `PromotionCode`: `code`, `codeHash`, `eventPeriod`, `benefit`, `maxUses`, `maxUsesPerUser`, `currentUses`, `createdAt`, `createdBy`, `status`, `description`.
- `CodeGenerationRequest`: `eventPeriod`, `benefit`, `maxUses`, `maxUsesPerUser`, `description`, `count`.
- `CodeGenerationResponse`: `codes`, `codeIds`.

## Firestore and Storage Dependencies
- Firestore collection: `promotionCodes`.
- Firestore read operations: list admin codes (`getAllPromotionCodes`) and query specific codes in validation/redeem paths.
- Firestore write operations: create code docs (`setDoc`), deactivate via status update, and update usage/subscription/redeem fields during redemption.
- Firestore user dependency: permission check reads `users/{uid}` role; redemption writes to `users/{uid}` subscription/redeem fields.
- Storage dependency: none in this admin screen path.

## External Service Dependencies
- `promotionCodeService` admin operations: `generatePromotionCodes`, `getAllPromotionCodes`, `deactivateCode`.
- `expo-crypto` for secure random code generation and hashing inputs.
- HMAC utilities (`createHMAC`, `verifyHMAC`, `getHMACSecret`) for code integrity.
- `@react-native-async-storage/async-storage` in rate-limit paths (validation/redeem service path).
- Clipboard usage in UI components for copy actions.

## Error Handling
- Permission check failure: logged to console; loading ends and unauthorized view is rendered.
- Code load failure: shows `Alert("Error", "Failed to load promotion codes")`.
- Generation validation failure: missing description or invalid count shows blocking alert.
- Generation API failure: shows error alert with service message fallback.
- Deactivation failure: shows error alert with service message fallback.
- Active list copy action: shows confirmation alert after copy.

## Non-Functional Requirements
- Theme-aware rendering for dark/light mode across screen and subcomponents.
- Responsive loading states for permission check, active list fetch, and code generation.
- Immediate operator feedback via alerts and refreshed list.
- Sequential UI-driven admin operations (no explicit parallel mutation in UI).

## Known Limitations
- UI strings are hardcoded English in this screen/component set (not localized via translation keys).
- Date validity constraints are minimal; there is no explicit guard that `endDate >= startDate`.
- Numeric fields (`maxUses`, `maxUsesPerUser`, temporary `durationDays`) rely on `parseInt` and are not fully validated for NaN/negative values in UI.
- The active list expiration display uses event end date and does not add dedicated expired-state filtering in UI.
- Deactivation is soft status change only; no archival workflow.

## Out of Scope
- Student-facing code entry UX and redemption flow UI.
- Campaign analytics/reporting dashboards.
- Bulk edit/import of existing promotion codes.
- Automatic cleanup of expired/inactive code documents.

## Removal Notes
- Not applicable. This feature is active in the current codebase and documented here as implemented.
