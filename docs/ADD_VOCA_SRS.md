# Add Vocabulary Software Requirements Specification (As-Is)

## Purpose
This document specifies the current implementation of `app/admin/add-voca.tsx` as-is for archival and maintenance reference. It covers how vocabulary import currently works through CSV and Google Sheets workflows.

## Actors and Permissions
- Actor: Admin user operating content import tools.
- Access control assumption: Entry is provided from admin navigation flows.
- The screen itself focuses on import operations and does not perform role-gating logic directly.

## Screen Flows
1. Admin opens `/admin/add-voca`.
2. Admin selects a course target (CSAT, IELTS, TOEFL, TOEIC, COLLOCATION).
3. Admin chooses import mode via tab (`csv` for local CSV files, `link` for Google Sheets link/range).
4. Admin adds one or more items via `/admin/upload-item` and can edit/delete items.
5. Admin starts batch upload/import from footer CTA.
6. System checks existing data per day in Storage/Firestore and prompts overwrite confirmation.
7. System processes each item, uploads records, and shows progress/status.
8. System displays completion summary and keeps failed/skipped items for retry.

## Functional Requirements
- FR-1: The screen shall support two import modes: CSV and Google Sheets.
- FR-2: The screen shall maintain independent item lists for CSV and Sheets inputs.
- FR-3: The screen shall support add/edit/delete for each queued item.
- FR-4: The system shall detect pre-existing day data in Firebase Storage and Firestore.
- FR-5: The system shall require user confirmation before overwriting existing day data.
- FR-6: CSV flow shall upload source file to Storage and parse file content with PapaParse.
- FR-7: Sheets flow shall fetch row data from Google Sheets API with OAuth token.
- FR-8: Before writing new records, the system shall clear Firestore day documents to prevent duplicates.
- FR-9: The system shall normalize row fields via `extractVocaFields`.
- FR-10: For non-collocation courses, the system shall attempt IPA lookup when pronunciation is missing (single-word only).
- FR-11: For non-collocation courses, the system shall attempt linguistic enrichment generation.
- FR-12: The system shall write parsed/enriched records to Firestore day collection.
- FR-13: On successful records for a day, the system shall update course metadata (day availability).
- FR-14: The system shall present progress text and final counts for success/failure/skip.

## Data Contracts
- `TabType`: `csv | link`.
- `CsvUploadItem`: CSV import item containing at least `day` and local file descriptor/URI.
- `SheetUploadItem`: Sheets import item containing at least `day`, `sheetId`, and `range`.
- `COURSES` runtime config:
`CSAT` -> `EXPO_PUBLIC_COURSE_PATH_CSAT`, `IELTS` -> `EXPO_PUBLIC_COURSE_PATH_IELTS`, `TOEFL` -> `EXPO_PUBLIC_COURSE_PATH_TOEFL`, `TOEIC` -> `EXPO_PUBLIC_COURSE_PATH_TOEIC`, `COLLOCATION` -> `EXPO_PUBLIC_COURSE_PATH_COLLOCATION`.

## Firestore and Storage Dependencies
- Firestore write target: `${selectedCourse.path}/Day{day}` collection.
- Storage backup target (CSV): `csv/{CourseName}/Day{day}.csv`.
- Firestore operations: `getDocs` (existence checks), `deleteDoc` (day reset), `addDoc` (row insertion).
- Storage operations: `getMetadata` (existence checks), `uploadBytes` (CSV backup upload).

## External Service Dependencies
- Google Sheets API (values endpoint) using Bearer token from `useGoogleSheetsAuth`.
- `parseSheetValues` to map rows to object records.
- `extractVocaFields` to normalize course-specific row schema.
- `getIpaUSUK` for IPA fallback lookup.
- `generateLinguisticData` for AI linguistic enrichment.
- `updateCourseMetadata` to reflect latest uploaded day.

## Error Handling
- Validation: Empty item list blocks upload/import and shows alert.
- Auth/token: Missing token triggers OAuth prompt; auth failures surface via alert.
- Existing data: Overwrite prompt is shown; cancellation marks item as skipped.
- Per-item processing: Failures are counted and retained in queue for retry.
- Storage upload failure: Logged; Firestore upload can continue.
- Firestore day-clear failure: Throws and fails that item/day operation.
- Metadata update failure: Logged only; does not fail completed upload.

## Non-Functional Requirements
- Theme-aware rendering via `useTheme`.
- Progress transparency via `UploadProgressModal` and live status messages.
- Batch processing is sequential by queued item.
- Partial completion behavior preserves failed/skipped items for iterative retry.

## Known Limitations
- Day replacement is clear-then-insert and not transactional.
- No deduplication beyond full-day overwrite workflow.
- Large uploads may be slow due to per-word IPA/AI calls.
- AI enrichment may partially fail per row without aborting whole batch.
- Role authorization is assumed upstream in navigation, not enforced in-screen.

## Out of Scope
- Automatic rollback/versioning of imported days.
- Conflict resolution for concurrent multi-admin uploads.
- Fine-grained row-level edit/review before commit.
- Data migration for older historical schema variants.

## Removal Notes
- Not applicable. This feature is active in the current codebase and documented here as implemented.
