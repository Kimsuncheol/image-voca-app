# Advertisements Administration Software Requirements Specification (As-Is)

## Purpose
This document specifies the current implementation of `app/admin/advertisements.tsx` as-is for archival and maintenance reference. It covers admin-side advertisement creation and management behavior implemented in the screen, advertisement components, and advertisement service.

## Actors and Permissions
- Actor: Authenticated admin user.
- Non-admin users are denied access and shown an access-denied UI.
- Permission check reads `users/{uid}.role` and treats role values containing `"admin"` as authorized.

## Screen Flows
1. Admin opens `/admin/advertisements`.
2. Screen validates admin permission (loading state displayed during check).
3. Admin switches between two tabs (`add` for create flow, `manage` for list/operations).
4. In `add` tab, admin creates an image or video advertisement.
5. On create success, screen moves to `manage` and refreshes list.
6. In `manage` tab, admin can refresh, toggle active status, and delete ads.

## Functional Requirements
- FR-1: The screen shall gate access to admin users only.
- FR-2: The screen shall provide two tabs: `add` and `manage`.
- FR-3: The ad creation form shall support two ad types: `image` and `video`.
- FR-4: For image ads, form shall allow local image selection via image picker.
- FR-5: For video ads, form shall accept a URL input.
- FR-6: Form shall validate required fields before submission.
- FR-7: New advertisements shall be created as active by default.
- FR-8: Manage view shall display all advertisements (active and inactive), including count.
- FR-9: Manage view shall support manual refresh.
- FR-10: Manage view shall support status toggling (active/inactive).
- FR-11: Manage view shall support advertisement deletion with confirmation.
- FR-12: List state shall refresh after create, status toggle, and delete operations.

## Data Contracts
- `AdType`: `image | video`.
- `Advertisement`: `adId`, `type`, `imageUrl?`, `videoUrl?`, `title`, `description`, `active`, `createdAt`, `createdBy`.
- `AdFormData`: `type`, `imageFile?`, `videoUrl?`, `title`, `description`.

## Firestore and Storage Dependencies
- Firestore collection: `ads`.
- Firestore reads: `getAllAdvertisements` (admin all ads ordered by `createdAt desc`) and `getActiveAdvertisements` (consumer modal active ads).
- Firestore writes: `createAdvertisement` (insert metadata/media URLs), `toggleAdStatus` (update `active`), `deleteAdvertisement` (remove ad doc).
- Storage path for image ads: `ads/{adId}/image.jpg`.
- Storage operations: upload image blob on create; best-effort image object deletion on remove.

## External Service Dependencies
- `advertisementService` admin flow: `getAllAdvertisements`, `createAdvertisement`, `toggleAdStatus`, `deleteAdvertisement`.
- `advertisementService` consumer flow: `getActiveAdvertisements`, `selectRandomAd`.
- `expo-image-picker` for image selection in form flow.
- `expo-image` for rendering image previews in admin cards/form.

## Error Handling
- Permission check failure: logged; screen exits checking state and renders unauthorized view if not admin.
- Create validation failure: missing title/media or invalid video URL format shows blocking alert.
- Create API failure: logs and shows error alert (`Failed to create advertisement` fallback).
- Load list failure: logs and shows error alert (`Failed to load advertisements` fallback).
- Toggle status failure: logs and shows error alert (`Failed to update advertisement status` fallback).
- Delete failure: logs and shows error alert (`Failed to delete advertisement` fallback).
- Storage deletion failure during delete: non-critical warning for missing image object; Firestore deletion still proceeds.

## Non-Functional Requirements
- Theme-aware rendering for dark/light mode across screen and ad components.
- Responsive loading states for permission check, list fetch, and form submission.
- Immediate operator feedback via alerts for success/failure outcomes.
- UI refresh consistency after mutating operations.

## Known Limitations
- Screen/component strings are hardcoded English and are not localized via i18n keys.
- Video URL validation is basic (`startsWith("http")`) and does not validate provider/format details.
- `createAdvertisement` does not rollback Firestore doc if image upload later fails.
- Deletion is best-effort for Storage object cleanup and may leave orphaned files in non-standard paths.
- Role authorization is enforced in screen logic only; no additional role guard inside advertisement service.

## Out of Scope
- Ad scheduling windows, targeting rules, and campaign orchestration.
- Impression/click analytics and reporting dashboards.
- Ad media transcoding/optimization pipelines.
- Multi-step approval workflow for ad publishing.

## Removal Notes
- Not applicable. This feature is active in the current codebase and documented here as implemented.
